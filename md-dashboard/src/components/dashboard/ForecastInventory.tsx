'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip,
} from 'recharts';
import {
  getFilterOptions, getForecast,
  FilterOptions, ForecastData,
} from '@/services/dashboardApi';

export default function Forecast() {
  const [categoryLarge, setCategoryLarge] = useState('');
  const [categoryMiddle, setCategoryMiddle] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [weeks, setWeeks] = useState(4);

  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [loadingForecast, setLoadingForecast] = useState(false);
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
      .then(setForecast)
      .catch(() => setError('예측 데이터를 불러오지 못했습니다.'))
      .finally(() => setLoadingForecast(false));
  }, [selectedProductId, weeks]);

  useEffect(() => {
    fetchForecast();
  }, [fetchForecast]);

  const hasChartData = forecast && forecast.chart && forecast.chart.length > 0;

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

      {/* 3. 핵심 예측 지표 카드 (품절확률 보류로 3종) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white/40 backdrop-blur-md border border-white/60 p-4 sm:p-5 rounded-[28px] shadow-sm min-w-0">
          <span className="text-[11px] text-[#8A8D96] font-medium block truncate">예상 판매량</span>
          <div className="text-xl sm:text-2xl font-black text-[#3F4145] mt-1.5 truncate">
            {loadingForecast ? '-' : forecast?.has_forecast_data ? `${forecast.expected_sales} EA` : '준비 중'}
          </div>
          <span className="text-[10px] text-[#8A8D96] mt-1 block truncate">선택 기간 합계</span>
        </div>
        <div className="bg-white/40 backdrop-blur-md border border-white/60 p-4 sm:p-5 rounded-[28px] shadow-sm min-w-0">
          <span className="text-[11px] text-[#8A8D96] font-medium block truncate">예상 기말재고</span>
          <div className="text-xl sm:text-2xl font-black text-[#3F4145] mt-1.5 truncate">
            {loadingForecast ? '-' : forecast?.has_forecast_data ? `${forecast.ending_inventory} EA` : '준비 중'}
          </div>
          <span className="text-[10px] text-[#8A8D96] mt-1 block truncate">가용+입고-예상판매</span>
        </div>
        <div className="bg-white/40 backdrop-blur-md border border-white/60 p-4 sm:p-5 rounded-[28px] shadow-sm min-w-0">
          <span className="text-[11px] text-[#8A8D96] font-medium block truncate">권장 발주량</span>
          <div className="text-xl sm:text-2xl font-black text-[#3F4145] mt-1.5 truncate">
            {loadingForecast ? '-' : forecast?.has_forecast_data ? `${forecast.recommended_order} EA` : '준비 중'}
          </div>
          <span className="text-[10px] text-[#8A8D96] mt-1 block truncate">
            발주일 {forecast?.order_date ?? '-'}
          </span>
        </div>
      </div>

      {/* 4. 중단 차트 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 bg-white/40 backdrop-blur-md border border-white/60 p-5 sm:p-6 rounded-[28px] shadow-sm flex flex-col justify-between min-h-[280px]">
          <div className="flex justify-between items-start">
            <div className="min-w-0">
              <h3 className="text-base font-bold text-[#3F4145] truncate">실제·예측 판매 추이</h3>
              <p className="text-[11px] text-[#8A8D96] mt-0.5 truncate">주 단위 수요예측 결과</p>
            </div>
          </div>

          <div className="w-full h-48 my-2">
            {hasChartData ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={forecast!.chart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="week" tickLine={false} axisLine={false} tick={{ fill: '#8A8D96', fontSize: 10 }} />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ background: 'rgba(255,255,255,0.9)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                  />
                  <Line type="monotone" dataKey="actual" stroke="#3F4145" strokeWidth={2.5} dot={{ r: 3 }} connectNulls={false} />
                  <Line type="monotone" dataKey="predicted" stroke="#3F4145" strokeWidth={3} strokeDasharray="5 4" dot={{ r: 3 }} connectNulls={false} />
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
        </div>

        {/* 예상 기말재고 구성 */}
        <div className="lg:col-span-5 bg-white/40 backdrop-blur-md border border-white/60 p-5 sm:p-6 rounded-[28px] shadow-sm flex flex-col justify-between min-h-[280px]">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-[#3F4145] truncate">예상 기말재고 구성</h3>
            <p className="text-[11px] text-[#8A8D96] mt-0.5 truncate">현재 가용 → 입고 → 예상판매 → 기말</p>
          </div>

          <div className="grid grid-cols-4 gap-2 items-end h-36 pt-4 text-center">
            {[
              { label: '현재 가용', value: forecast?.current_available ?? 0, color: 'bg-[#3F4145]' },
              { label: '입고 예정', value: forecast?.incoming ?? 0, color: 'bg-[#5B6068]' },
              { label: '예상 판매', value: -(forecast?.expected_sales ?? 0), display: `-${forecast?.expected_sales ?? 0}`, color: 'bg-[#8A8D96]' },
              { label: '기말 재고', value: forecast?.ending_inventory ?? 0, color: 'bg-[#3F4145]' },
            ].map((bar) => {
              const maxRef = Math.max(
                forecast?.current_available ?? 1,
                forecast?.incoming ?? 1,
                forecast?.expected_sales ?? 1,
                forecast?.ending_inventory ?? 1,
                1
              );
              const height = Math.max(6, (Math.abs(bar.value) / maxRef) * 100);
              return (
                <div key={bar.label} className="flex flex-col items-center h-full justify-end">
                  <div style={{ height: `${height}px` }} className={`w-full max-w-[40px] ${bar.color} rounded-t-lg transition-all duration-300`}></div>
                  <span className="text-[11px] font-extrabold mt-2 text-[#3F4145] truncate">
                    {bar.display ?? bar.value}
                  </span>
                  <span className="text-[10px] text-[#8A8D96] mt-0.5 truncate">{bar.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. 하단: 예측 위험(과잉재고만) + 날씨 영향도 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 bg-white/40 backdrop-blur-md border border-white/60 p-5 sm:p-6 rounded-[28px] shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-[#3F4145]">예측 위험</h3>
            <p className="text-[11px] text-[#8A8D96] mt-0.5">과잉재고 여부 확인 (품절 확률은 추후 지원 예정)</p>
          </div>
          <div className="flex justify-between items-center pt-1">
            <span className="text-xs font-bold text-[#3F4145]">과잉 예상 수량</span>
            <span className="text-xs font-bold text-[#3F4145]">{forecast?.excess_qty ?? 0} EA</span>
          </div>
        </div>

        <div className="lg:col-span-5 bg-white/40 backdrop-blur-md border border-white/60 p-5 sm:p-6 rounded-[28px] shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start gap-2">
            <div className="min-w-0">
              <h3 className="text-base font-bold text-[#3F4145] truncate">날씨 영향도</h3>
              <p className="text-[11px] text-[#8A8D96] mt-0.5 leading-tight">
                현재 6개 clean 데이터베이스는 날씨 결합이 없습니다.
              </p>
            </div>
            <span className="text-[10px] bg-white/60 border border-white/80 px-2.5 py-1 rounded-lg text-[#8A8D96] font-medium shrink-0">
              비활성
            </span>
          </div>
          <p className="text-[11px] text-[#8A8D96] leading-relaxed mt-4">
            외부 날씨 데이터에 date, temperature, precipitation, weather_condition이 연결되면 기본 예측과 날씨 보정 예측의 차이를 표시합니다.
          </p>
        </div>
      </div>
    </div>
  );
}