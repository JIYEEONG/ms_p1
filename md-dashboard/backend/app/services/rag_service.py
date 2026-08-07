# 26.08.07 AI 챗봇 서비스 구축에 따른 파일 추가

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
    results = search_client.search(search_text=query, top=3)
    chunks = [f"[{doc['related_policy']} 정책 / 담당부서: {doc['department']}]\n{doc['content']}" for doc in results]
    return "\n\n".join(chunks)

def generate_sales_report(user_prompt: str) -> str:
    # 1. RAG Retrieval
    policy_context = retrieve_policy_docs(user_prompt)

    # 2. Tool-calling (Azure SQL 데이터 조회)
    kpi_efficiency = get_kpi_and_efficiency()
    inventory_summary = get_inventory_risk()

    # 3. GPT-4o 프롬프트 전송
    system_prompt = f"""
    당신은 커머스 데이터 분석 MD 전문가입니다.
    제공된 [Azure SQL DB 데이터]와 [정책 문서 Context]를 바탕으로 정해진 양식의 '판매현황 액션플랜 리포트'를 작성하세요.

    [작성 규칙]
    1. 아래 4개 섹션을 엄격히 준수하여 출력할 것:
       # 판매현황 액션플랜 리포트
       ## 1. 실적 요약 (목표/실적/달성률)
       ## 2. 판매효율 지표 (ASP/ATV/UPT) 및 전기간 대비 추이
       ## 3. 카테고리별 이슈 및 제안 액션 (연결: 02, 03, 04 정책)
       ## 4. 재고 리스크 요약 (연결: 05 정책)
    2. ATV 및 UPT 지표에는 반드시 "(※ 장바구니 단위(order_id) 데이터 부재로 order_item_id 단위 근사치입니다.)" 문구를 붙이세요.
    3. 각 액션 항목마다 담당부서 태그(예: [마케팅팀], [웹운영팀], [재고팀])를 적절히 포함시키세요.

    [정책 문서 Context]
    {policy_context}

    [DB 데이터]
    - 실적 및 판매효율: {kpi_efficiency}
    - HUB별 재고 리스크: {inventory_summary}
    """

    response = openai_client.chat.completions.create(
        model=settings.AZURE_DEPLOYMENT_NAME,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0.2
    )

    return response.choices[0].message.content