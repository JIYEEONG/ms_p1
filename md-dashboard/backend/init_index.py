# 26.08.07 AI 챗봇 서비스 구축에 따른 파일 추가

import os
from pathlib import Path
from dotenv import load_dotenv
from azure.core.credentials import AzureKeyCredential
from azure.search.documents.indexes import SearchIndexClient
from azure.search.documents.indexes.models import (
    SearchIndex,
    SimpleField,
    SearchableField,
    SearchFieldDataType
)
from azure.search.documents import SearchClient

# 현재 파일 위치 기준으로 .env 절대 경로 탐색 및 로드
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

# .env 변수명과 동일하게 수정
AZURE_SEARCH_ENDPOINT = os.getenv("AZURE_AI_SEARCH_ENDPOINT")
AZURE_SEARCH_KEY = os.getenv("AZURE_AI_SEARCH_API_KEY")
INDEX_NAME = "policy-documents-index"

def create_and_populate_index():
    if not AZURE_SEARCH_KEY or not AZURE_SEARCH_ENDPOINT:
        raise ValueError(f".env 파일에서 Azure AI Search 정보를 읽어오지 못했습니다. 경로 확인: {env_path}")

    credential = AzureKeyCredential(AZURE_SEARCH_KEY)
    
    # 1. Search Index Client 생성
    index_client = SearchIndexClient(endpoint=AZURE_SEARCH_ENDPOINT, credential=credential)
    
    # 2. 인덱스 필드 스키마 정의
    fields = [
        SimpleField(name="id", type=SearchFieldDataType.String, key=True),
        SearchableField(name="content", type=SearchFieldDataType.String),
        SimpleField(name="related_policy", type=SearchFieldDataType.String),
        SearchableField(name="department", type=SearchFieldDataType.String)
    ]
    
    index = SearchIndex(name=INDEX_NAME, fields=fields)
    print("Creating/Updating Azure AI Search Index...")
    index_client.create_or_update_index(index)

    # 3. 정책 문서 데이터 준비 (명세서 기반 청크 정의)
    documents = [
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

    # 4. 문서 업로드
    search_client = SearchClient(endpoint=AZURE_SEARCH_ENDPOINT, index_name=INDEX_NAME, credential=credential)
    print("Uploading policy documents...")
    result = search_client.upload_documents(documents)
    print(f"Successfully uploaded {len(result)} documents!")

if __name__ == "__main__":
    create_and_populate_index()