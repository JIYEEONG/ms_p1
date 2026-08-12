# app/services/rag_service.py
# 26.08.09 AI고도화 작업에 따른 코드 수정
# 26.08.XX 기간 파싱 + 되묻기(모호/범위밖) + 상단 기간 명시 추가
#   -> charts/md_insights JSON 스키마는 원본과 100% 동일.

# app/services/rag_service.py
# 26.08.09 AI고도화 작업에 따른 코드 수정
# 26.08.XX 기간 파싱 + 되묻기(모호/범위밖) + 상단 기간 명시 추가

import json
from openai import AzureOpenAI, OpenAI
from app.core.config import settings
from app.services.tools import get_kpi_and_efficiency, get_inventory_risk, get_orders_date_range
from app.services.period_parser import parse_period, to_card_label, PERIOD_INPUT_HINT, PERIOD_EXAMPLES

# ============================================================
# USE_LOCAL 분기: true면 Ollama(LLM/임베딩) + Chroma(벡터검색),
#                 false면 기존 Azure OpenAI + Azure AI Search 사용.
# ============================================================
if settings.USE_LOCAL:
    import chromadb

    llm_client = OpenAI(base_url=f"{settings.OLLAMA_BASE_URL}/v1", api_key="ollama")
    CHAT_MODEL = settings.OLLAMA_MODEL

    chroma_client = chromadb.HttpClient(host=settings.CHROMA_HOST, port=settings.CHROMA_PORT)
    policy_collection = chroma_client.get_or_create_collection(settings.CHROMA_COLLECTION)
else:
    from azure.core.credentials import AzureKeyCredential
    from azure.search.documents import SearchClient

    llm_client = AzureOpenAI(
        azure_endpoint=settings.AZURE_OPENAI_ENDPOINT,
        api_key=settings.AZURE_OPENAI_KEY,
        api_version="2024-02-01"
    )
    CHAT_MODEL = settings.AZURE_DEPLOYMENT_NAME

    search_client = SearchClient(
        endpoint=settings.AZURE_AI_SEARCH_ENDPOINT,
        index_name="policy-documents-index",
        credential=AzureKeyCredential(settings.AZURE_AI_SEARCH_API_KEY)
    )


def _embed_query(query: str) -> list[float]:
    """Ollama 임베딩 모델로 쿼리 벡터 생성"""
    response = llm_client.embeddings.create(model=settings.OLLAMA_EMBED_MODEL, input=query)
    return response.data[0].embedding


def retrieve_policy_docs(query: str) -> str:
    """정책 문서 검색"""
    try:
        if settings.USE_LOCAL:
            results = policy_collection.query(query_embeddings=[_embed_query(query)], n_results=3)
            metadatas = results.get("metadatas", [[]])[0]
            documents = results.get("documents", [[]])[0]
            chunks = [
                f"[{meta.get('related_policy')} 정책 / 담당부서: {meta.get('department')}]\n{doc}"
                for meta, doc in zip(metadatas, documents)
            ]
        else:
            results = search_client.search(search_text=query, top=3)
            chunks = [f"[{doc['related_policy']} 정책 / 담당부서: {doc['department']}]\n{doc['content']}" for doc in results]
        return "\n\n".join(chunks) if chunks else "관련 정책 문서 없음"
    except Exception as e:
        print(f"RAG Retrieval Error: {e}")
        return "정책 문서 검색 불가능"


def classify_intent(user_prompt: str) -> str:
    """사용자의 질문 의도(Intent) 분류"""
    report_keywords = [
        "리포트", "보고서", "액션플랜", "분석", "현황", 
        "추이", "실적", "재고", "매출", "지표", "작성", "수치",
        "년", "월", "일", "분기", "주간", "월간"  # 기간 재입력 대응
    ]
    if any(keyword in user_prompt for keyword in report_keywords):
        return "REPORT"
    return "CHAT"


def _is_within_data_range(period) -> tuple[bool, dict]:
    """기간이 DB 실데이터 범위 안에 있는지 확인"""
    data_range = get_orders_date_range()
    min_date, max_date = data_range.get("min_date"), data_range.get("max_date")
    if not min_date or not max_date:
        return True, data_range
    in_range = (period.start_date >= min_date) and (period.end_date <= max_date)
    return in_range, data_range


def _clarify_response(message: str, extra: dict | None = None) -> dict:
    resp = {
        "type": "chat",  # 모달을 띄우지 않고 챗봇 영역에 메시지를 노출하기 위해 'chat' 타입 지정
        "message": message,
        "hint": PERIOD_INPUT_HINT,
        "examples": PERIOD_EXAMPLES,
    }
    if extra:
        resp.update(extra)
    return resp


def generate_sales_report(user_prompt: str) -> dict:
    intent = classify_intent(user_prompt)

    if intent == "CHAT":
        return {
            "type": "chat",
            "message": "안녕하세요! MD 대시보드 AI 보조입니다. '26년 8월 매출 리포트'처럼 기간과 원하시는 리포트를 입력해 주세요."
        }

    # 1) 기간 파싱 - 모호하면 되묻기 프롬프트 전달
    period = parse_period(user_prompt)

    if period.was_ambiguous:
        return _clarify_response(
            "어떤 기간의 리포트를 원하시나요? 일/주/월/분기/년 단위로 정확한 기간을 알려주세요."
        )

    # 2) DB 데이터 범위 검증
    in_range, data_range = _is_within_data_range(period)
    if not in_range:
        return _clarify_response(
            f"요청하신 기간({period.display_label})에는 데이터가 없습니다. "
            f"현재 조회 가능한 데이터 범위는 {data_range.get('min_date')} ~ {data_range.get('max_date')} 입니다. "
            f"이 범위 안의 기간으로 다시 요청해주세요.",
            extra={"available_range": data_range},
        )

    # 3) DB 데이터 및 정책 조회
    kpi_efficiency = get_kpi_and_efficiency(period.start_datetime, period.end_datetime)
    inventory_summary = get_inventory_risk(period.start_datetime, period.end_datetime)
    policy_context = retrieve_policy_docs(user_prompt)

    trend_data = kpi_efficiency.get('monthly_trend', [])
    inv_data = inventory_summary.get('hub_inventory_summary', [])

    # 4) LLM 시스템 프롬프트 작성
    system_prompt = f"""
    당신은 커머스 데이터 분석 Senior MD 전문가입니다.
    제공된 [Azure SQL DB 데이터]만을 기반으로 분석하여 JSON 리포트를 작성하세요.

    [기간 규칙 - 반드시 준수]
    - 이번 리포트의 적용 기간은 "{period.display_label}" 입니다. 이 기간 외의 다른 날짜/기간을 언급하지 마세요.
    - `sales_analysis`, `inventory_risk` 서술에도 이 기간 기준으로만 이야기하세요.

    [엄격 규칙]
    1. `summary_kpi`의 수치(`total_sales`, `asp`, `atv`, `target_rate`)는 DB 집계 결과 데이터인 `kpi_efficiency` 값을 임의 변경 없이 정확히 매핑하세요.
    2. `sales_analysis` 및 `inventory_risk` 필드에는 실제 DB 수치를 언급하며 구체적인 진단 문장을 작성하세요.
    3. `action_plans` 배열에는 [재고팀, 마케팅팀, 영업기획팀] 부서별 실행 전략 문장을 세로 나열형으로 작성하세요.
    4. 반드시 유효한 순수 JSON 형태로 응답하세요.

    [JSON Schema]
    {{
      "type": "report",
      "summary_kpi": {{
        "target_rate": "{kpi_efficiency.get('target_rate', '0.0%')}",
        "total_sales": {kpi_efficiency.get('total_sales', 0)},
        "asp": {kpi_efficiency.get('asp', 0)},
        "atv": {kpi_efficiency.get('atv', 0)}
      }},
      "charts": [
        {{
          "id": "hub_inventory_chart",
          "type": "bar",
          "title": "HUB별 가용재고 및 위험수량 현황",
          "data": {json.dumps(inv_data, ensure_ascii=False)}
        }},
        {{
          "id": "sales_trend_chart",
          "type": "line",
          "title": "판매효율 지표 추이 (ASP/ATV)",
          "data": {json.dumps(trend_data, ensure_ascii=False)}
        }}
      ],
      "md_insights": {{
        "sales_analysis": "전체 총 매출액 및 ASP/ATV 평균 단가를 기반으로 한 상세 판매 분석 문장",
        "inventory_risk": "HUB별 가용재고 대비 품절 위험 수량 수치를 명시한 재고 진단 문장",
        "action_plans": [
          {{"team": "재고팀", "action": "HUB 간 재고 이동 계획 수립 문장"}},
          {{"team": "마케팅팀", "action": "ATV 객단가 상승을 위한 세부 전략 문장"}},
          {{"team": "영업기획팀", "action": "부진 카테고리 기획전 및 할인 프로모션 승인 계획 문장"}}
        ]
      }},
      "disclaimer": "※ ATV/UPT는 order_id 데이터 부재로 order_item_id 단위 근사치입니다."
    }}

    [DB 수집 데이터]
    - 실적 및 판매효율 지표: {kpi_efficiency}
    - HUB별 재고 위험 지표: {inventory_summary}

    [정책 문서 Context]
    {policy_context}
    """

    try:
        response = llm_client.chat.completions.create(
            model=CHAT_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.3,
            response_format={"type": "json_object"}
        )

        res_json = json.loads(response.choices[0].message.content)
        res_json["type"] = "report"
        res_json["display_label"] = period.display_label
        res_json["period_card_label"] = to_card_label(period)
        res_json["period_meta"] = period.to_dict()

        return res_json

    except Exception as e:
        print(f"Report Generation Error: {e}")
        return {"type": "error", "error": f"리포트 생성 실패: {str(e)}"}