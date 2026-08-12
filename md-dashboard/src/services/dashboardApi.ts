// 26.08.04 백엔드 구축 KPI 및 차트 데이터 호출 함수 모음
// 26.08.05 UI 변경에 따른 파일 추가
// 26.08.06 예측 탭 API 연동 함수 추가

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// 책임성 때문에 추가된 항목으로 오류가 났을 때 오류임을 명확하게 표시
export class DashboardApiError extends Error {
  type: "NETWORK_ERROR" | "SERVER_ERROR";
  status?: number;
  constructor(type: "NETWORK_ERROR" | "SERVER_ERROR", message: string, status?: number) {
    super(message);
    this.type = type;
    this.status = status;
  }
}

export async function fetchJson<T>(
  url: string,
  failMessage: string,
  init?: RequestInit,
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") throw e; // 필터 변경으로 인한 취소는 그대로 전달
    throw new DashboardApiError("NETWORK_ERROR", "서버에 연결할 수 없습니다.");
  }
  if (!res.ok) {
    // 서버는 응답했지만 실패 (404, 500 등)
    throw new DashboardApiError("SERVER_ERROR", failMessage, res.status);
  }
  return res.json();
}

// --- 타입 정의 (백엔드 ForecastResponse와 동일하게 맞춤) ---
export interface ForecastChartPoint {
  week: string;
  actual?: number | null;
  predicted?: number | null;
  lower_bound?: number | null;
  upper_bound?: number | null;
}

export interface ForecastData {
  product_id: string;
  forecast_scope: string;
  has_forecast_data: boolean;
  expected_sales: number;
  out_of_stock_prob?: number | null;
  ending_inventory: number;
  recommended_order: number;
  order_date?: string | null;
  current_available: number;
  incoming: number;
  excess_qty: number;
  chart: ForecastChartPoint[];
}

export interface ProductOption {
  product_id: string;
  product_name: string;
}

export interface FilterOptions {
  category_large: string[];
  category_middle: string[];
  products: ProductOption[];
}

// --- API 호출 함수 ---
export async function getFilterOptions(
  categoryLarge?: string,
  categoryMiddle?: string
): Promise<FilterOptions> {
  const params = new URLSearchParams();
  if (categoryLarge) params.set("category_large", categoryLarge);
  if (categoryMiddle) params.set("category_middle", categoryMiddle);

  return fetchJson(`${API_BASE_URL}/api/v1/dashboard/filter-options?${params}`, "필터 옵션 조회 실패");
}

export async function getForecast(
  productId: string,
  weeks: number
): Promise<ForecastData> {
  const params = new URLSearchParams({ product_id: productId, weeks: String(weeks) });
  return fetchJson(`${API_BASE_URL}/api/v1/dashboard/forecast?${params}`, "예측 데이터 조회 실패");
}

// --- HUB별 재고 탭 ---
export interface HubCardData {
  hub_id: string;
  hub_name: string;
  available: number;
  reserved: number;
  in_transit: number;
  incoming: number;
  wos: number;
  speed_per_day: number;
}

export interface HubInventoryData {
  hubs: HubCardData[];
}

export async function getHubInventory(): Promise<HubInventoryData> {
  return fetchJson(`${API_BASE_URL}/api/v1/dashboard/hub-inventory`, "HUB별 재고 조회 실패");
}

// --- HUB 재고 균형 매트릭스 ---
export interface ProductHubCell {
  hub_id: string;
  available: number;
  wos: number;
}

export interface ProductHubRow {
  product_name: string;
  cells: ProductHubCell[];
}

export interface HubMatrixData {
  rows: ProductHubRow[];
}

export async function getHubInventoryMatrix(topN: number = 4): Promise<HubMatrixData> {
  return fetchJson(
    `${API_BASE_URL}/api/v1/dashboard/hub-inventory-matrix?top_n=${topN}`,
    "HUB 재고 매트릭스 조회 실패"
  );
}

// --- 상품별 재고 탭 ---
export interface ProductSkuRow {
  sku_id: string;
  product_id: string;
  product_name: string;
  category_large: string;
  category_middle: string;
  season_type: string;
  color_name: string;
  size_code: string;
  available: number;
  safety_stock: number;
  sales_90d: number;
  daily_avg: number;
  sell_through: number;
  wos: number;
  claim_rate: number;
  risk_status: string;
  lead_time: number;
  moq: number;
  incoming: number;
}

export interface ProductInventoryListData {
  products: ProductSkuRow[];
}

export interface SkuOption {
  sku_id: string;
  color_name?: string;
  size_code?: string;
}

export interface ProductFilterOptionsData {
  category_large: string[];
  category_middle: string[];
  products: ProductOption[];
  skus: SkuOption[];
}

export async function getProductFilterOptions(params?: {
  category_large?: string;
  category_middle?: string;
  product_id?: string;
}): Promise<ProductFilterOptionsData> {
  const query = new URLSearchParams();
  if (params?.category_large) query.set("category_large", params.category_large);
  if (params?.category_middle) query.set("category_middle", params.category_middle);
  if (params?.product_id) query.set("product_id", params.product_id);

  return fetchJson(
    `${API_BASE_URL}/api/v1/dashboard/product-filter-options?${query}`,
    "상품 필터 옵션 조회 실패"
  );
}

export async function getProductInventory(params?: {
  category_large?: string;
  category_middle?: string;
  product_id?: string;
  sku_id?: string;
  risk_status?: string;
  service_level?: number;
  leadtime_factor?: number;
}): Promise<ProductInventoryListData> {
  const query = new URLSearchParams();
  if (params?.category_large) query.set("category_large", params.category_large);
  if (params?.category_middle) query.set("category_middle", params.category_middle);
  if (params?.product_id) query.set("product_id", params.product_id);
  if (params?.sku_id) query.set("sku_id", params.sku_id);
  if (params?.risk_status) query.set("risk_status", params.risk_status);
  if (params?.service_level) query.set("service_level", String(params.service_level));
  if (params?.leadtime_factor) query.set("leadtime_factor", String(params.leadtime_factor));

  return fetchJson(
    `${API_BASE_URL}/api/v1/dashboard/product-inventory?${query}`,
    "상품별 재고 조회 실패"
  );
}

// --- HUB 간 권장 이동 및 진행 상태 ---
export interface TransferRecommendation {
  product_name: string;
  from_hub: string;
  to_hub: string;
  qty: number;
  before_from: number;
  after_from: number;
  before_to: number;
  after_to: number;
  status: string;
}

export interface TransferRecommendationData {
  transfers: TransferRecommendation[];
}

export async function getHubTransferRecommendation(
  resultLimit: number = 4
): Promise<TransferRecommendationData> {
  return fetchJson(
    `${API_BASE_URL}/api/v1/dashboard/hub-transfer-recommendation?result_limit=${resultLimit}`,
    "HUB 이동 권장 조회 실패"
  );
}