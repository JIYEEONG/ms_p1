'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip,
} from 'recharts';
import {
  getFilterOptions, getForecast, getForecastRankings, getForecastStockoutRisks,
  FilterOptions, ForecastData, ForecastRankingData, ForecastStockoutRiskData, ForecastChartPoint,
} from '@/services/dashboardApi';

export default function Forecast() {
  const [categoryLarge, setCategoryLarge] = useState('');
  const [categoryMiddle, setCategoryMiddle] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [weeks, setWeeks] = useState(4);
  const [rankingTab, setRankingTab] = useState<'best' | 'slow'>('best');

  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [selectedChartPoint, setSelectedChartPoint] = useState<ForecastChartPoint | null>(null);
  const [rankings, setRankings] = useState<ForecastRankingData | null>(null);
  const [stockoutRisks, setStockoutRisks] = useState<ForecastStockoutRiskData | null>(null);
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [loadingForecast, setLoadingForecast] = useState(false);
  const [loadingRankings, setLoadingRankings] = useState(true);
  const [rankingError, setRankingError] = useState('');
  const [loadingStockoutRisks, setLoadingStockoutRisks] = useState(true);
  const [stockoutRiskError, setStockoutRiskError] = useState('');
  const [error, setError] = useState<string | null>(null);

  // 대분류/중분류 바뀔 때마다 필터 옵션 갱신 (계단식: 대분류 → 중분류 → 상품)
  useEffect(() => {
    setLoadingFilters(true);
    getFilterOptions(categoryLarge || undefined, categoryMiddle || undefined)
      .then((data) => {
        setFilterOptions(data);
        // 현재 선택된 상품이 새 목록에 없으면 첫 번째 상품으로 재설정
        if (data.products.length > 0) {
          const stillValid = data.products.some((p) => p.product_id === selectedProductId);
          if (!stillValid) setSelectedProductId(data.products[0].product_id);
        } else {
          setSelectedProductId('');
        }
      })
      .catch(() => setError('필터 옵션을 불러오지 못했습니다.'))
      .finally(() => setLoadingFilters(false));
  }, [categoryLarge, categoryMiddle]);

  // 대분류 바뀌면 중분류 선택 초기화 (하위 필터 리셋)
  const handleCategoryLargeChange = (value: string) => {
    setCategoryLarge(value);
    setCategoryMiddle('');
  };

  // 상품/기간 바뀔 때마다 예측 데이터 조회
  const fetchForecast = useCallback(() => {
    if (!selectedProductId) {
      setForecast(null);   // ← 상품 선택 안 됐으면 이전 데이터 지우기
      return;
    }
    setLoadingForecast(true);
    setError(null);
    getForecast(selectedProductId, weeks)
      .then((data) => {
        setForecast(data);
        setSelectedChartPoint(null);
      })
      .catch(() => setError('예측 데이터를 불러오지 못했습니다.'))
      .finally(() => setLoadingForecast(false));
  }, [selectedProductId, weeks]);

  useEffect(() => {
    fetchForecast();
  }, [fetchForecast]);

  useEffect(() => {
    setLoadingRankings(true);
    setRankingError('');
    getForecastRankings(weeks, 10)
      .then(setRankings)
      .catch(() => setRankingError('상품별 예측 순위를 불러오지 못했습니다.'))
      .finally(() => setLoadingRankings(false));
  }, [weeks]);

  useEffect(() => {
    setLoadingStockoutRisks(true);
    setStockoutRiskError('');
    getForecastStockoutRisks(weeks, 10)
      .then(setStockoutRisks)
      .catch(() => setStockoutRiskError('재고 부족 위험 순위를 불러오지 못했습니다.'))
      .finally(() => setLoadingStockoutRisks(false));
  }, [weeks]);

  const hasChartData = forecast && forecast.chart && forecast.chart.length > 0;
  const visibleRankings = rankingTab === 'best' ? rankings?.best_sellers : rankings?.slow_sellers;
  const selectedProductName = filterOptions?.products.find((product) => product.product_id === selectedProductId)?.product_name
    ?? rankings?.best_sellers.find((product) => product.product_id === selectedProductId)?.product_name
    ?? rankings?.slow_sellers.find((product) => product.product_id === selectedProductId)?.product_name
    ?? selectedProductId
    ?? '상품 미선택';
  const recommendedEndingInventory = forecast?.has_forecast_data
    ? Math.round((forecast.expected_sales / Math.max(weeks, 1)) * 2)
    : 0;
  const endingInventoryGap = (forecast?.ending_inventory ?? 0) - recommendedEndingInventory;
  const selectedPointSales = selectedChartPoint?.predicted ?? selectedChartPoint?.actual ?? null;
  const displayedExpectedSales = selectedPointSales ?? forecast?.expected_sales ?? 0;
  const isSelectedForecastWeek = selectedChartPoint?.predicted != null;
  const displayedRecommendedOrder = isSelectedForecastWeek && (forecast?.expected_sales ?? 0) > 0
    ? Math.round((forecast?.recommended_order ?? 0) * ((selectedChartPoint?.predicted ?? 0) / (forecast?.expected_sales ?? 1)))
    : forecast?.recommended_order ?? 0;

  return (
    <div className="space-y-5 text-[#3F4145] min-w-0">
      {/* 상단 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-2xl font-extrabold tracking-tight truncate">예측</h2>
          <p className="text-xs text-[#8A8D96] mt-1 truncate">
            향후 판매량, 예상 기말재고와 권장 발주량을 함께 검토합니다.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="bg-white/80 border border-white/90 px-3.5 py-2 rounded-2xl text-xs font-semibold shadow-sm text-[#3F4145]">
            기본 예측 활성
          </span>
          <span className="bg-white/50 border border-white/70 px-3.5 py-2 rounded-2xl text-xs font-semibold text-[#8A8D96]">
            날씨 보정 미연결
          </span>
        </div>
      </div>

      {/* 최상단 상품별 판매 예측 순위 */}
      <section className="overflow-hidden rounded-[28px] border border-white/70 bg-white/45 shadow-sm backdrop-blur-md">
        <div className="flex flex-col gap-3 border-b border-black/5 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <h3 className="text-base font-extrabold text-[#3F4145]">상품별 판매 예측 TOP 10</h3>
            <p className="mt-0.5 text-[11px] text-[#8A8D96]">선택한 예측 기간의 상품별 예상 판매량 순위입니다.</p>
          </div>
          <div className="flex rounded-2xl border border-white/80 bg-white/55 p-1" role="tablist" aria-label="판매 예측 순위">
            <button
              type="button"
              role="tab"
              aria-selected={rankingTab === 'best'}
              onClick={() => setRankingTab('best')}
              className={`rounded-xl px-3.5 py-2 text-[11px] font-extrabold transition ${rankingTab === 'best' ? 'bg-[#3F4145] text-white shadow-sm' : 'text-[#65676E] hover:bg-white/70'}`}
            >
              가장 잘 팔릴 상품
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={rankingTab === 'slow'}
              onClick={() => setRankingTab('slow')}
              className={`rounded-xl px-3.5 py-2 text-[11px] font-extrabold transition ${rankingTab === 'slow' ? 'bg-[#3F4145] text-white shadow-sm' : 'text-[#65676E] hover:bg-white/70'}`}
            >
              가장 안 팔릴 상품
            </button>
          </div>
        </div>

        <div className="p-3 sm:p-4">
          {loadingRankings ? (
            <div className="flex h-28 items-center justify-center text-xs font-semibold text-[#8A8D96]">순위를 계산하는 중...</div>
          ) : rankingError ? (
            <div className="rounded-2xl bg-red-50 px-4 py-3 text-xs font-semibold text-red-600">{rankingError}</div>
          ) : visibleRankings?.length ? (
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {visibleRankings.map((item) => (
                <button
                  key={`${rankingTab}-${item.product_id}`}
                  type="button"
                  onClick={() => setSelectedProductId(item.product_id)}
                  className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 hover:bg-white/80 ${selectedProductId === item.product_id ? 'border-[#3F4145]/30 bg-white/85 ring-2 ring-[#3F4145]/10' : 'border-white/80 bg-white/45'}`}
                >
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl text-xs font-black ${item.rank <= 3 ? 'bg-[#3F4145] text-white' : 'bg-white/80 text-[#65676E]'}`}>
                    {item.rank}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-extrabold text-[#3F4145]">{item.product_name}</span>
                    <span className="mt-0.5 block truncate text-[10px] text-[#8A8D96]">
                      {[item.category_large, item.category_middle].filter(Boolean).join(' · ') || item.product_id}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <strong className="block text-sm font-black text-[#3F4145]">{item.expected_sales.toLocaleString()}</strong>
                    <span className="block text-[9px] font-semibold text-[#8A8D96]">예상 EA</span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex h-28 items-center justify-center text-xs font-semibold text-[#8A8D96]">예측 순위 데이터가 없습니다.</div>
          )}
        </div>
      </section>

      {/* 1. 필터: 대분류 / 중분류 / 상품 */}
      <div className="bg-white/40 backdrop-blur-md border border-white/60 p-4 rounded-[28px] shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-[#8A8D96] mb-1 truncate">대분류</label>
            <select
              value={categoryLarge}
              onChange={(e) => handleCategoryLargeChange(e.target.value)}
              className="w-full bg-white/70 border border-white/80 rounded-2xl px-3.5 py-2 text-xs text-[#3F4145] outline-none shadow-inner cursor-pointer truncate"
            >
              <option value="">전체</option>
              {filterOptions?.category_large.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-[#8A8D96] mb-1 truncate">중분류</label>
            <select
              value={categoryMiddle}
              onChange={(e) => setCategoryMiddle(e.target.value)}
              className="w-full bg-white/70 border border-white/80 rounded-2xl px-3.5 py-2 text-xs text-[#3F4145] outline-none shadow-inner cursor-pointer truncate"
            >
              <option value="">전체</option>
              {filterOptions?.category_middle.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-[#8A8D96] mb-1 truncate">상품 선택</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              disabled={loadingFilters || !filterOptions?.products.length}
              className="w-full bg-white/70 border border-white/80 rounded-2xl px-3.5 py-2 text-xs text-[#3F4145] outline-none shadow-inner cursor-pointer truncate disabled:opacity-50"
            >
              {filterOptions?.products.length ? (
                filterOptions.products.map((p) => (
                  <option key={p.product_id} value={p.product_id}>{p.product_name}</option>
                ))
              ) : (
                <option value="">상품 없음</option>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* 2. 예측 기간 (주 단위) */}
      <div className="bg-white/40 backdrop-blur-md border border-white/60 p-4 sm:p-5 rounded-[28px] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-bold text-[#3F4145] truncate">예측 기간</h3>
          <p className="text-[11px] text-[#8A8D96] mt-0.5 truncate">기간을 변경하면 위험과 권장 발주가 동시에 갱신됩니다.</p>
        </div>
        <div className="flex items-center gap-1.5 bg-white/50 p-1.5 rounded-2xl border border-white/70 shrink-0 self-start sm:self-auto">
          {[1, 2, 3, 4].map((w) => (
            <button
              key={w}
              onClick={() => setWeeks(w)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                weeks === w ? 'bg-[#3F4145] text-white shadow-sm' : 'text-[#3F4145] hover:bg-white/60'
              }`}
            >
              {w}주
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-xs px-4 py-3 rounded-2xl">
          {error}
        </div>
      )}

      {/* 3. 판매 예측 및 발주 제안 통합 서비스 */}
      <div className="bg-white/40 backdrop-blur-md border border-white/60 p-5 sm:p-6 rounded-[28px] shadow-sm flex flex-col justify-between min-h-[280px]">
        <div className="flex justify-between items-start gap-3">
          <div className="min-w-0">
            <h3 className="text-base font-extrabold text-[#3F4145] truncate">판매 예측 및 발주 제안</h3>
            <p className="mt-0.5 truncate text-[11px] font-semibold text-[#65676E]">{selectedProductName}</p>
            <p className="mt-0.5 truncate text-[10px] text-[#8A8D96]">실제·예측 판매 추이와 실행 가능한 발주 수량을 함께 검토합니다.</p>
          </div>
          {selectedChartPoint && (
            <button
              type="button"
              onClick={() => setSelectedChartPoint(null)}
              className="shrink-0 rounded-xl border border-white/90 bg-white/70 px-3 py-2 text-[10px] font-bold text-[#65676E] transition hover:bg-white"
            >
              전체 기간 보기
            </button>
          )}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/80 bg-white/55 p-4">
            <span className="block text-[10px] font-bold text-[#8A8D96]">
              {selectedChartPoint ? `${selectedChartPoint.week} ${isSelectedForecastWeek ? '예상' : '실제'} 판매량` : '예상 판매량'}
            </span>
            <strong className="mt-1 block text-2xl font-black text-[#3F4145]">
              {loadingForecast ? '-' : forecast?.has_forecast_data ? `${Math.round(displayedExpectedSales).toLocaleString()} EA` : '준비 중'}
            </strong>
            <span className="mt-1 block text-[9px] text-[#8A8D96]">{selectedChartPoint ? '그래프에서 선택한 주차' : `선택한 ${weeks}주 예측 합계`}</span>
          </div>
          <div className="rounded-2xl border border-white/80 bg-white/75 p-4 ring-1 ring-[#3F4145]/5">
            <span className="block text-[10px] font-bold text-[#8A8D96]">
              {isSelectedForecastWeek ? `${selectedChartPoint?.week} 권장 발주량` : '권장 발주량'}
            </span>
            <strong className="mt-1 block text-2xl font-black text-[#1F2125]">
              {loadingForecast ? '-' : forecast?.has_forecast_data ? `${displayedRecommendedOrder.toLocaleString()} EA` : '준비 중'}
            </strong>
            <span className="mt-1 block text-[9px] text-[#8A8D96]">
              {isSelectedForecastWeek
                ? `전체 권장량을 해당 주 예상 판매 비중으로 배분 · 발주일 ${forecast?.order_date ?? '-'}`
                : `권장 발주일 ${forecast?.order_date ?? '-'}`}
            </span>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-black/5 pt-4">
          <h4 className="text-xs font-extrabold text-[#3F4145]">실제·예측 판매 추이</h4>
          <span className="text-[9px] font-semibold text-[#8A8D96]">주 단위</span>
        </div>

        <div className="w-full h-48 my-2">
          {hasChartData ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={forecast!.chart}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                onClick={(chartState) => {
                  const pointIndex = Number(chartState?.activeTooltipIndex);
                  const point = Number.isInteger(pointIndex) ? forecast?.chart[pointIndex] : undefined;
                  if (point) setSelectedChartPoint(point);
                }}
                className="cursor-pointer"
              >
                <XAxis dataKey="week" tickLine={false} axisLine={false} tick={{ fill: '#8A8D96', fontSize: 10 }} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ background: 'rgba(255,255,255,0.9)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                />
                <Line type="monotone" dataKey="actual" stroke="#3F4145" strokeWidth={2.5} dot={{ r: 3 }} connectNulls={false} />
                <Line type="monotone" dataKey="predicted" stroke="#3F4145" strokeWidth={3} strokeDasharray="5 4" dot={{ r: 4 }} activeDot={{ r: 7, fill: '#1F2125' }} connectNulls={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm font-medium text-[#8A8D96] bg-white/30 rounded-2xl border border-dashed border-gray-200">
              {loadingForecast
                ? '불러오는 중...'
                : forecast?.has_forecast_data === false
                  ? '미래 예측 데이터 준비 중입니다 (파이프라인 작업 예정)'
                  : '조회된 예측 데이터가 없습니다.'}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 text-[11px] text-[#8A8D96] pt-1 border-t border-black/5">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-[#3F4145] rounded-full inline-block"></span> 실제
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t-2 border-dashed border-[#3F4145] inline-block"></span> 예측
          </span>
        </div>
        <p className="mt-3 text-[9px] text-[#8A8D96]">
          본 결과는 참고용이며, 실제 발주·재고 결정은 담당자가 직접 판단하여 진행합니다.
        </p>
      </div>

      {/* 5. 예상 기말재고 구성 */}
      <div className="bg-white/40 backdrop-blur-md border border-white/60 p-5 sm:p-6 rounded-[28px] shadow-sm flex flex-col justify-between min-h-[280px]">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-[#3F4145] truncate">예상 기말재고 구성</h3>
            <p className="mt-0.5 truncate text-[11px] font-semibold text-[#65676E]">{selectedProductName}</p>
            <p className="mt-1.5 inline-flex rounded-full bg-white/65 px-2.5 py-1 text-[10px] font-bold text-[#65676E]">
              현재 기준 {weeks}주 후 예상 잔여재고
            </p>
          </div>

          <div className="flex h-40 items-end gap-1 pt-4 text-center">
            {[
              { label: '현재 가용', value: forecast?.current_available ?? 0, color: 'bg-[#A7ABB2]', highlight: false },
              { label: '입고 예정', value: forecast?.incoming ?? 0, color: 'bg-[#C1C4C9]', highlight: false },
              { label: '예상 판매', value: -(forecast?.expected_sales ?? 0), display: `${forecast?.expected_sales ?? 0}`, color: 'bg-[#858A92]', highlight: false },
              { label: '기말 재고', value: forecast?.ending_inventory ?? 0, color: 'bg-[#1F2125]', highlight: true },
            ].map((bar, index) => {
              const maxRef = Math.max(
                forecast?.current_available ?? 1,
                forecast?.incoming ?? 1,
                forecast?.expected_sales ?? 1,
                forecast?.ending_inventory ?? 1,
                1
              );
              const height = Math.max(6, (Math.abs(bar.value) / maxRef) * 100);
              return (
                <React.Fragment key={bar.label}>
                  <div className={`flex h-full min-w-0 flex-1 flex-col items-center justify-end rounded-2xl px-1 pt-2 ${bar.highlight ? 'bg-white/75 ring-2 ring-[#1F2125]/10' : ''}`}>
                    <div style={{ height: `${height}px` }} className={`w-full max-w-[40px] ${bar.color} rounded-t-lg transition-all duration-300`}></div>
                    <span className={`mt-2 truncate text-[11px] font-extrabold ${bar.highlight ? 'text-[#1F2125]' : 'text-[#65676E]'}`}>
                      {bar.display ?? bar.value}
                    </span>
                    <span className={`mb-2 mt-0.5 truncate text-[10px] ${bar.highlight ? 'font-extrabold text-[#1F2125]' : 'text-[#8A8D96]'}`}>{bar.label}</span>
                  </div>
                  {index < 3 && (
                    <span className={`mb-10 grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-black ${index === 2 ? 'bg-[#1F2125] text-white' : 'bg-white/75 text-[#65676E]'}`} aria-hidden="true">
                      {index === 0 ? '+' : index === 1 ? '−' : '='}
                    </span>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          <div className="mt-4 rounded-2xl border border-white/90 bg-white/65 p-3.5">
            <div>
              <div className="min-w-0">
                <p className="text-[12px] font-extrabold tracking-tight text-[#3F4145]">기말재고 최소화 추천 재고</p>
                <p className="mt-1 text-[9px] font-medium text-[#9A9DA4]">예상 주간 판매량 × 2주 안전재고</p>
              </div>
              <strong className="mt-3 block text-left text-2xl font-black leading-none text-[#1F2125]">
                {recommendedEndingInventory.toLocaleString()} <span className="text-sm">EA</span>
              </strong>
            </div>
            <p className={`mt-3 rounded-xl border px-3 py-2.5 text-[10px] font-extrabold ${endingInventoryGap > 0 ? 'border-[#F3D7AA] bg-[#FFF0D9] text-[#9A651F]' : endingInventoryGap < 0 ? 'border-[#F4CACA] bg-[#FDE7E7] text-[#A84C4C]' : 'border-[#C8E7D5] bg-[#E2F3E9] text-[#397255]'}`}>
              {endingInventoryGap > 0
                ? `예상 기말재고에서 ${endingInventoryGap.toLocaleString()} EA 감축 권장`
                : endingInventoryGap < 0
                  ? `안전재고까지 ${Math.abs(endingInventoryGap).toLocaleString()} EA 추가 확보 권장`
                  : '예상 기말재고가 추천 수준과 일치합니다.'}
            </p>
          </div>
        </div>

      {/* 5. 재고 부족 위험 TOP 10 */}
      <div className="bg-white/40 backdrop-blur-md border border-white/60 p-5 sm:p-6 rounded-[28px] shadow-sm">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-base font-bold text-[#3F4145]">재고 부족 예상 TOP 10</h3>
            <p className="mt-1 text-[11px] text-[#8A8D96]">가용재고와 입고 예정 재고를 주간 예측 판매 속도로 나눠, 가장 빨리 부족해질 상품부터 표시합니다.</p>
          </div>
          <span className="text-[10px] font-bold text-[#8A8D96]">향후 {weeks}주 예측 기준</span>
        </div>

        {loadingStockoutRisks ? (
          <div className="mt-4 rounded-2xl bg-white/60 px-4 py-8 text-center text-xs font-semibold text-[#8A8D96]">위험 순위를 계산하고 있습니다.</div>
        ) : stockoutRiskError ? (
          <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-xs font-semibold text-red-600">{stockoutRiskError}</div>
        ) : !stockoutRisks?.items.length ? (
          <div className="mt-4 rounded-2xl bg-white/60 px-4 py-8 text-center text-xs font-semibold text-[#8A8D96]">예측 가능한 상품이 없습니다.</div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-2xl border border-white/90 bg-white/65">
            <div className="hidden grid-cols-[42px_minmax(180px,1.6fr)_110px_110px_150px_74px] gap-3 border-b border-[#E9E9EC] px-4 py-3 text-[10px] font-extrabold text-[#8A8D96] md:grid">
              <span>순위</span><span>상품</span><span className="text-right">가용 + 입고</span><span className="text-right">주간 예상판매</span><span>예상 부족 시점</span><span className="text-center">위험도</span>
            </div>
            <div className="divide-y divide-[#ECECEF]">
              {stockoutRisks.items.map((item) => {
                const badgeClass = item.risk_level === '긴급' ? 'bg-[#FDE7E7] text-[#A84C4C]' : item.risk_level === '높음' ? 'bg-[#FFF0D9] text-[#9A651F]' : item.risk_level === '주의' ? 'bg-[#FFF7D6] text-[#89721F]' : 'bg-[#E8EEF6] text-[#52677D]';
                return (
                  <button type="button" key={item.product_id} onClick={() => setSelectedProductId(item.product_id)} className={`grid w-full grid-cols-[36px_1fr_auto] items-center gap-3 px-4 py-3.5 text-left transition hover:bg-white/80 md:grid-cols-[42px_minmax(180px,1.6fr)_110px_110px_150px_74px] ${selectedProductId === item.product_id ? 'bg-white ring-1 ring-inset ring-[#C9CBD0]' : ''}`}>
                    <strong className="text-sm font-black text-[#3F4145]">{item.rank}</strong>
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-extrabold text-[#3F4145]">{item.product_name}</span>
                      <span className="mt-0.5 block truncate text-[9px] font-semibold text-[#9A9DA4]">{item.product_id} · {[item.category_large, item.category_middle].filter(Boolean).join(' / ')}</span>
                    </span>
                    <span className={`rounded-full px-2.5 py-1 text-center text-[9px] font-black md:order-last ${badgeClass}`}>{item.risk_level}</span>
                    <span className="hidden text-right text-[11px] font-bold text-[#55585F] md:block">{item.available.toLocaleString()} + {item.incoming.toLocaleString()}</span>
                    <span className="hidden text-right text-[11px] font-bold text-[#55585F] md:block">{item.weekly_expected_sales.toLocaleString()} EA</span>
                    <span className="col-start-2 text-[10px] font-bold text-[#6D7078] md:col-auto">약 {item.weeks_to_stockout.toFixed(1)}주 후 · {item.estimated_stockout_date}{item.projected_shortage > 0 && <span className="ml-1 text-[#A84C4C]">(-{item.projected_shortage.toLocaleString()} EA)</span>}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        <p className="mt-3 text-[9px] font-medium text-[#9A9DA4]">상품을 선택하면 위 판매 예측·권장 발주량 영역이 해당 상품 기준으로 변경됩니다.</p>
      </div>
    </div>
  );
}
