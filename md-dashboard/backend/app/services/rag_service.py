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
 
def generate_sales_report(user_prompt: str) -> str:
    # 1. RAG Retrieval (사용자 프롬프트 기반 검색)
    policy_context = retrieve_policy_docs(user_prompt)
 
    # 2. Tool-calling (Azure SQL 데이터 조회)
    kpi_efficiency = get_kpi_and_efficiency()
    inventory_summary = get_inventory_risk()
 
    # 3. GPT-4o 동적 프롬프트 구성
    system_prompt = f"""
    당신은 커머스 데이터 분석 MD 전문가입니다.
    제공된 [Azure SQL DB 데이터]와 [정책 문서 Context]를 활용하여 사용자의 질문[{user_prompt}]에 맞게 최적의 답변을 작성하세요.
 
    [작성 규칙]
    1. 사용자가 '리포트', '액션플랜', '보고서' 등의 생성을 요청한 경우 아래 4개 섹션 양식을 준수하여 작성하세요:
       # 판매현황 액션플랜 리포트
       ## 1. 실적 요약 (목표/실적/달성률)
       ## 2. 판매효율 지표 (ASP/ATV/UPT) 및 전기간 대비 추이
       ## 3. 카테고리별 이슈 및 제안 액션
       ## 4. 재고 리스크 요약
    2. 사용자가 특정 항목에 대해 질문하거나 일반 대화를 시도한 경우, 양식에 얽매이지 않고 질문의 의도에 맞게 유연하게 답변하세요.
    3. ATV 및 UPT 언급 시 필요하다면 "(※ 장바구니 단위(order_id) 데이터 부재로 order_item_id 단위 근사치입니다.)" 문구를 활용하세요.
    4. 액션 항목 제안 시 담당부서 태그(예: [마케팅팀], [웹운영팀], [재고팀])를 적절히 포함하세요.
 
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
        temperature=0.3
    )
 
    return response.choices[0].message.content