# 26.08.07 AI 챗봇 서비스 구축에 따른 파일 추가
# 26.08.10 USE_LOCAL 분기: Chroma(로컬) / Azure AI Search 인덱스 시딩을 함께 지원
# backend/ 디렉토리에서 `python init_index.py`로 실행

from app.core.config import settings

INDEX_NAME = "policy-documents-index"

# 정책 문서 데이터 (명세서 기반 청크 정의) - Azure/Chroma 공통
POLICY_DOCUMENTS = [
    {
        "id": "doc_policy_06",
        "content": "정책 06. 판매현황 정기 리포트: KPI 달성률과 판매효율(ASP/ATV/UPT) 중심 액션플랜 생성. 실적요약, 판매효율 지표, 카테고리 이슈, 재고 리스크 4개 섹션으로 구성.",
        "related_policy": "06",
        "department": "영업기획팀/MD팀"
    },
    {
        "id": "doc_policy_02",
        "content": "정책 02. 프로모션 대상 선정: 목표 미달 카테고리의 매출 회복을 위한 할인 프로모션 대상 SKU 선정.",
        "related_policy": "02",
        "department": "마케팅팀"
    },
    {
        "id": "doc_policy_04",
        "content": "정책 04. UPT 개선 액션: UPT 지표 하락 시 번들 판매 및 메인 페이지 노출 액션 제안.",
        "related_policy": "04",
        "department": "마케팅팀/웹운영팀"
    },
    {
        "id": "doc_policy_05",
        "content": "정책 05. 재고 현황 보고 집약: WOS(재고주수) 2주 미만 품절임박 SKU, 8주 초과 과잉/악성 재고 SKU 집계 및 리스크 요약.",
        "related_policy": "05",
        "department": "재고팀"
    }
]


def create_and_populate_azure_index():
    from azure.core.credentials import AzureKeyCredential
    from azure.search.documents import SearchClient
    from azure.search.documents.indexes import SearchIndexClient
    from azure.search.documents.indexes.models import (
        SearchIndex,
        SimpleField,
        SearchableField,
        SearchFieldDataType
    )

    credential = AzureKeyCredential(settings.AZURE_AI_SEARCH_API_KEY)

    index_client = SearchIndexClient(endpoint=settings.AZURE_AI_SEARCH_ENDPOINT, credential=credential)
    fields = [
        SimpleField(name="id", type=SearchFieldDataType.String, key=True),
        SearchableField(name="content", type=SearchFieldDataType.String),
        SimpleField(name="related_policy", type=SearchFieldDataType.String),
        SearchableField(name="department", type=SearchFieldDataType.String)
    ]
    index = SearchIndex(name=INDEX_NAME, fields=fields)
    print("Creating/Updating Azure AI Search Index...")
    index_client.create_or_update_index(index)

    search_client = SearchClient(endpoint=settings.AZURE_AI_SEARCH_ENDPOINT, index_name=INDEX_NAME, credential=credential)
    print("Uploading policy documents...")
    result = search_client.upload_documents(POLICY_DOCUMENTS)
    print(f"Successfully uploaded {len(result)} documents!")


def create_and_populate_local_index():
    import chromadb
    from openai import OpenAI

    embed_client = OpenAI(base_url=f"{settings.OLLAMA_BASE_URL}/v1", api_key="ollama")
    chroma_client = chromadb.HttpClient(host=settings.CHROMA_HOST, port=settings.CHROMA_PORT)
    collection = chroma_client.get_or_create_collection(settings.CHROMA_COLLECTION)

    print(f"Embedding policy documents via Ollama ({settings.OLLAMA_EMBED_MODEL})...")
    embeddings = [
        embed_client.embeddings.create(model=settings.OLLAMA_EMBED_MODEL, input=doc["content"]).data[0].embedding
        for doc in POLICY_DOCUMENTS
    ]

    collection.upsert(
        ids=[doc["id"] for doc in POLICY_DOCUMENTS],
        documents=[doc["content"] for doc in POLICY_DOCUMENTS],
        metadatas=[
            {"related_policy": doc["related_policy"], "department": doc["department"]}
            for doc in POLICY_DOCUMENTS
        ],
        embeddings=embeddings,
    )
    print(f"Successfully upserted {len(POLICY_DOCUMENTS)} documents into Chroma collection '{settings.CHROMA_COLLECTION}'!")


if __name__ == "__main__":
    if settings.USE_LOCAL:
        create_and_populate_local_index()
    else:
        create_and_populate_azure_index()
