# 26.08.09 AI고도화 작업에 따른 코드 수정


import json
from azure.core.credentials import AzureKeyCredential
from azure.search.documents import SearchClient
from openai import AzureOpenAI
from app.core.config import settings
from app.services.tools import get_kpi_and_efficiency, get_inventory_risk

openai_client = AzureOpenAI(
    azure_endpoint=settings.AZURE_OPENAI_ENDPOINT,
    api_key=settings.AZURE_OPENAI_KEY,
    api_version="2024-02-01"
)

search_client = SearchClient(
    endpoint=settings.AZURE_AI_SEARCH_ENDPOINT,
    index_name="policy-documents-index",
    credential=AzureKeyCredential(settings.AZURE_AI_SEARCH_API_KEY)
)

def retrieve_policy_docs(query: str) -> str:
    """Azure AI Search에서 검색어와 매칭되는 정책 문서 추출"""
    try:
        results = search_client.search(search_text=query, top=3)
        chunks = [f"[{doc['related_policy']} 정책 / 담당부서: {doc['department']}]\n{doc['content']}" for doc in results]
        return "\n\n".join(chunks) if chunks else "관련 정책 문서 없음"
    except Exception as e:
        print(f"RAG Retrieval Error: {e}")
        return "정책 문서 검색 불가능"

def classify_intent(user_prompt: str) -> str:
    """사용자의 질문 의도(Intent) 분류"""
    report_keywords = ["리포트", "보고서", "액션플랜", "분석", "현황", "추이", "실적", "재고", "매출", "지표", "작성"]
    if any(keyword in user_prompt for keyword in report_keywords):
        return "REPORT"
    return "CHAT"

def generate_sales_report(user_prompt: str) -> dict:
    intent = classify_intent(user_prompt)

    if intent == "CHAT":
        return {
            "type": "chat",
            "message": "안녕하세요! MD 대시보드 AI 보조입니다. '리포트 작성해줘'라고 입력하시면 시각화 대시보드를 생성해 드립니다."
        }

    kpi_efficiency = get_kpi_and_efficiency()
    inventory_summary = get_inventory_risk()
    policy_context = retrieve_policy_docs(user_prompt)

    trend_data = kpi_efficiency.get('monthly_trend', [])
    inv_data = inventory_summary.get('hub_inventory_summary', [])

    system_prompt = f"""
    당신은 커머스 데이터 분석 Senior MD 전문가입니다.
    제공된 [Azure SQL DB 데이터]만을 기반으로 분석하여 JSON 리포트를 작성하세요.

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
        response = openai_client.chat.completions.create(
            model=settings.AZURE_DEPLOYMENT_NAME,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.3,
            response_format={"type": "json_object"}
        )

        res_json = json.loads(response.choices[0].message.content)
        res_json["type"] = "report"
        return res_json

    except Exception as e:
        print(f"Report Generation Error: {e}")
        return {"type": "error", "error": f"리포트 생성 실패: {str(e)}"}