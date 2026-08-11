# MD Dashboard

패션 MD(상품 기획자)를 위한 재고/매출/AI 리포트 대시보드입니다. Next.js 프론트엔드와 FastAPI 백엔드(`backend/`)로 구성됩니다.

> 이 저장소의 최신 작업 폴더 구조(프론트/백엔드 분리, 워크스페이스 실행법)는 `md_dashboard` 워크스페이스 루트의 README를 함께 참고하세요.

## 주요 기능
- 상품별/HUB별 재고 현황 및 위험도(WOS, 무판매 기간 기준) 분석
- 매출/카테고리별 판매 현황 대시보드
- Azure OpenAI + Azure AI Search 기반 AI 리포트(RAG) 생성 및 액션플랜 제안
- AI 리포트 엑셀 다운로드 (`openpyxl` 기반)
- 날씨 기반 수요 예측(Forecast) 탭

## 폴더 구조
```
md-dashboard/
├── src/            Next.js 프론트엔드 소스
├── public/         정적 파일
└── backend/        FastAPI 백엔드 (app/api, app/models, app/services 등)
```

## 실행 방법

### 프론트엔드 (기본 포트 3000)
```bash
npm install
npm run dev
```

### 백엔드 (기본 포트 8001)
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8001
```

백엔드 실행에는 `.env` (Azure SQL DB, Azure OpenAI, Azure AI Search 접속 정보)가 필요합니다. API 문서는 `http://localhost:8001/docs`.

프론트엔드는 `.env.local`의 `NEXT_PUBLIC_API_URL`(기본값 `http://localhost:8001`)로 백엔드에 연결합니다.

## 빌드
```bash
npm run build
npm run lint
```

## 머지 전 체크리스트

새 기능 브랜치를 `main`에 머지하기 전에 아래를 확인합니다.

- [ ] `backend/requirements.txt`가 바뀌었다면 `pip install -r requirements.txt` 재실행 후 서버가 정상 기동되는지 확인
- [ ] `package.json`이 바뀌었다면 `npm install` 재실행 후 `npm run build` 통과 확인
- [ ] 새로운 환경변수가 추가됐다면 아래 환경변수 목록에도 반영
- [ ] `npm run lint` 통과 확인
- [ ] 머지 담당자 1명 지정 후 리뷰 — 위 항목 확인 완료 시 머지 진행

## 환경변수

민감한 값(비밀번호, API 키)은 이 README에 적지 않고 각자 `.env` / `.env.local`에만 보관합니다.

### 프론트엔드 (`.env.local`)
```
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_KRW_PER_USD=
```

### 백엔드 (`backend/.env`)
```
# Azure SQL DB
DB_SERVER=
DB_PORT=
DB_NAME=
DB_USER=
DB_PASSWORD=

# Azure OpenAI
AZURE_OPENAI_ENDPOINT=
AZURE_OPENAI_KEY=
AZURE_DEPLOYMENT_NAME=

# Azure AI Search
AZURE_AI_SEARCH_ENDPOINT=
AZURE_AI_SEARCH_API_KEY=

# 역할 분담 로그인
ROLE_CEO_PASSWORD=
ROLE_MD_PASSWORD=
ROLE_STOCK_PASSWORD=
```