//26.08.05 UI 변경으로 인한 파일 추가 예측 컴포넌트

'use client';

import React, { useState } from 'react';

// SKU별 예측 mock 데이터
const FORECAST_DATA: Record<string, any> = {
  '니트가디건': {
    sales: 49,
    outOfStockProb: 82,
    endingInventory: 1,
    recommendedOrder: 100,
    orderDate: '2025-12-08',
    currentAvailable: 0,
    incoming: 50,
    expectedSales: 49,
    excessQty: 0,
    realPath: 'M 20 80 Q 70 30 120 40 T 220 85',
    forecastPath: 'M 220 85 Q 300 35 380 50 T 480 35',
    confidenceArea: 'M 220 85 Q 300 20 380 35 T 480 20 L 480 60 Q 380 75 300 60 T 220 85 Z'
  },
  '트렌치코트': {
    sales: 32,
    outOfStockProb: 91,
    endingInventory: 0,
    recommendedOrder: 60,
    orderDate: '2025-12-10',
    currentAvailable: 0,
    incoming: 30,
    expectedSales: 32,
    excessQty: 0,
    realPath: 'M 20 90 Q 70 50 120 60 T 220 90',
    forecastPath: 'M 220 90 Q 300 40 380 60 T 480 40',
    confidenceArea: 'M 220 90 Q 300 25 380 45 T 480 25 L 480 70 Q 380 80 300 65 T 220 90 Z'
  },
  '와이드슬랙스': {
    sales: 15,
    outOfStockProb: 12,
    endingInventory: 16,
    recommendedOrder: 0,
    orderDate: '-',
    currentAvailable: 31,
    incoming: 0,
    expectedSales: 15,
    excessQty: 14,
    realPath: 'M 20 40 Q 70 50 120 60 T 220 70',
    forecastPath: 'M 220 70 Q 300 80 380 85 T 480 90',
    confidenceArea: 'M 220 70 Q 300 65 380 70 T 480 75 L 480 100 Q 380 95 300 90 T 220 70 Z'
  }
};

export default function Forecast() {
  const [categoryLarge, setCategoryLarge] = useState('전체');
  const [categoryMedium, setCategoryMedium] = useState('전체');
  const [selectedSku, setSelectedSku] = useState('니트가디건');
  const [selectedOption, setSelectedOption] = useState('전체 사이즈·색상');
  const [forecastDays, setForecastDays] = useState<number>(14);

  // 현재 선택된 SKU 데이터 (기본값 설정)
  const currentData = FORECAST_DATA[selectedSku] || FORECAST_DATA['니트가디건'];

  // 기간에 따른 배율 계산
  const multiplier = forecastDays / 14;
  const calculatedSales = Math.round(currentData.sales * multiplier);
  const calculatedEnding = Math.max(0, currentData.currentAvailable + currentData.incoming - calculatedSales);
  const calculatedOrder = calculatedEnding < 10 ? Math.round(currentData.recommendedOrder * multiplier) : 0;

  return (
    <div className="space-y-5 text-[#3F4145] min-w-0">
      {/* 상단 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-2xl font-extrabold tracking-tight truncate">예측</h2>
          <p className="text-xs text-[#8A8D96] mt-1 truncate">
            향후 판매량, 품절 확률, 예상 기말재고와 권장 발주량을 함께 검토합니다.
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

      {/* 1. 상단 4단계 필터 */}
      <div className="bg-white/40 backdrop-blur-md border border-white/60 p-4 rounded-[28px] shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-[#8A8D96] mb-1 truncate">대분류</label>
            <select
              value={categoryLarge}
              onChange={(e) => setCategoryLarge(e.target.value)}
              className="w-full bg-white/70 border border-white/80 rounded-2xl px-3.5 py-2 text-xs text-[#3F4145] outline-none shadow-inner cursor-pointer truncate"
            >
              <option>전체</option>
              <option>의류</option>
              <option>잡화</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-[#8A8D96] mb-1 truncate">중분류</label>
            <select
              value={categoryMedium}
              onChange={(e) => setCategoryMedium(e.target.value)}
              className="w-full bg-white/70 border border-white/80 rounded-2xl px-3.5 py-2 text-xs text-[#3F4145] outline-none shadow-inner cursor-pointer truncate"
            >
              <option>전체</option>
              <option>아우터</option>
              <option>상의</option>
              <option>하의</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-[#8A8D96] mb-1 truncate">SKU 1개 선택</label>
            <select
              value={selectedSku}
              onChange={(e) => setSelectedSku(e.target.value)}
              className="w-full bg-white/70 border border-white/80 rounded-2xl px-3.5 py-2 text-xs text-[#3F4145] outline-none shadow-inner cursor-pointer truncate"
            >
              <option>니트가디건</option>
              <option>트렌치코트</option>
              <option>와이드슬랙스</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-[#8A8D96] mb-1 truncate">옵션</label>
            <select
              value={selectedOption}
              onChange={(e) => setSelectedOption(e.target.value)}
              className="w-full bg-white/70 border border-white/80 rounded-2xl px-3.5 py-2 text-xs text-[#3F4145] outline-none shadow-inner cursor-pointer truncate"
            >
              <option>전체 사이즈·색상</option>
              <option>블랙 / M</option>
              <option>베이지 / S</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. 예측 기간 독립 카드 */}
      <div className="bg-white/40 backdrop-blur-md border border-white/60 p-4 sm:p-5 rounded-[28px] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-bold text-[#3F4145] truncate">예측 기간</h3>
          <p className="text-[11px] text-[#8A8D96] mt-0.5 truncate">기간을 변경하면 위험과 권장 발주가 동시에 갱신됩니다.</p>
        </div>
        <div className="flex items-center gap-1.5 bg-white/50 p-1.5 rounded-2xl border border-white/70 shrink-0 self-start sm:self-auto">
          {[7, 14, 30, 90].map((days) => (
            <button
              key={days}
              onClick={() => setForecastDays(days)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                forecastDays === days
                  ? 'bg-[#3F4145] text-white shadow-sm'
                  : 'text-[#3F4145] hover:bg-white/60'
              }`}
            >
              {days}일
            </button>
          ))}
        </div>
      </div>

      {/* 3. 핵심 예측 지표 4종 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white/40 backdrop-blur-md border border-white/60 p-4 sm:p-5 rounded-[28px] shadow-sm min-w-0">
          <span className="text-[11px] text-[#8A8D96] font-medium block truncate">예상 판매량</span>
          <div className="text-xl sm:text-2xl font-black text-[#3F4145] mt-1.5 truncate">{calculatedSales} EA</div>
          <span className="text-[10px] text-[#8A8D96] mt-1 block truncate">선택 기간 합계</span>
        </div>
        <div className="bg-white/40 backdrop-blur-md border border-white/60 p-4 sm:p-5 rounded-[28px] shadow-sm min-w-0">
          <span className="text-[11px] text-[#8A8D96] font-medium block truncate">품절 확률</span>
          <div className="text-xl sm:text-2xl font-black text-[#3F4145] mt-1.5 truncate">{currentData.outOfStockProb}%</div>
          <span className="text-[10px] text-[#8A8D96] mt-1 block truncate">수요 시뮬레이션 기준</span>
        </div>
        <div className="bg-white/40 backdrop-blur-md border border-white/60 p-4 sm:p-5 rounded-[28px] shadow-sm min-w-0">
          <span className="text-[11px] text-[#8A8D96] font-medium block truncate">예상 기말재고</span>
          <div className="text-xl sm:text-2xl font-black text-[#3F4145] mt-1.5 truncate">{calculatedEnding} EA</div>
          <span className="text-[10px] text-[#8A8D96] mt-1 block truncate">가용+입고-예상판매</span>
        </div>
        <div className="bg-white/40 backdrop-blur-md border border-white/60 p-4 sm:p-5 rounded-[28px] shadow-sm min-w-0">
          <span className="text-[11px] text-[#8A8D96] font-medium block truncate">권장 발주량</span>
          <div className="text-xl sm:text-2xl font-black text-[#3F4145] mt-1.5 truncate">{calculatedOrder} EA</div>
          <span className="text-[10px] text-[#8A8D96] mt-1 block truncate">발주일 {currentData.orderDate}</span>
        </div>
      </div>

      {/* 4. 중단 차트 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* 좌측: 실제-예측 판매 추이 차트 */}
        <div className="lg:col-span-7 bg-white/40 backdrop-blur-md border border-white/60 p-5 sm:p-6 rounded-[28px] shadow-sm flex flex-col justify-between min-h-[280px]">
          <div className="flex justify-between items-start">
            <div className="min-w-0">
              <h3 className="text-base font-bold text-[#3F4145] truncate">실제·예측 판매 추이</h3>
              <p className="text-[11px] text-[#8A8D96] mt-0.5 truncate">예측 상한·하한 포함</p>
            </div>
            <span className="text-[10px] bg-white/80 border border-white/90 px-3 py-1 rounded-full font-semibold text-[#8A8D96] shrink-0">
              신뢰구간
            </span>
          </div>

          <div className="relative w-full h-40 my-2">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 500 130" preserveAspectRatio="none">
              {/* 신뢰구간 영역 */} /* 신뢰구간 영역 삭제 보기 않좋아여 */
              {/* 실제 판매선 (실선) */}
              <path d={currentData.realPath} fill="none" stroke="#3F4145" strokeWidth="2.5" strokeLinecap="round" />
              {/* 예측 판매선 (점선) */}
              <path d={currentData.forecastPath} fill="none" stroke="#3F4145" strokeWidth="3" strokeDasharray="5 4" strokeLinecap="round" />
            </svg>
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

        {/* 우측: 예상 기말재고 구성 막대 차트 */}
        <div className="lg:col-span-5 bg-white/40 backdrop-blur-md border border-white/60 p-5 sm:p-6 rounded-[28px] shadow-sm flex flex-col justify-between min-h-[280px]">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-[#3F4145] truncate">예상 기말재고 구성</h3>
            <p className="text-[11px] text-[#8A8D96] mt-0.5 truncate">현재 가용 → 입고 → 예상판매 → 기말</p>
          </div>

          <div className="grid grid-cols-4 gap-2 items-end h-36 pt-4 text-center">
            {/* 현재 가용 */}
            <div className="flex flex-col items-center h-full justify-end">
              <div
                style={{ height: `${Math.max(6, (currentData.currentAvailable / 60) * 100)}px` }}
                className="w-full max-w-[40px] bg-[#3F4145] rounded-t-lg transition-all duration-300"
              ></div>
              <span className="text-[11px] font-extrabold mt-2 text-[#3F4145] truncate">{currentData.currentAvailable}</span>
              <span className="text-[10px] text-[#8A8D96] mt-0.5 truncate">현재 가용</span>
            </div>

            {/* 입고 예정 */}
            <div className="flex flex-col items-center h-full justify-end">
              <div
                style={{ height: `${Math.max(6, (currentData.incoming / 60) * 100)}px` }}
                className="w-full max-w-[40px] bg-[#5B6068] rounded-t-lg transition-all duration-300"
              ></div>
              <span className="text-[11px] font-extrabold mt-2 text-[#3F4145] truncate">{currentData.incoming}</span>
              <span className="text-[10px] text-[#8A8D96] mt-0.5 truncate">입고 예정</span>
            </div>

            {/* 예상 판매 */}
            <div className="flex flex-col items-center h-full justify-end">
              <div
                style={{ height: `${Math.max(6, (calculatedSales / 60) * 100)}px` }}
                className="w-full max-w-[40px] bg-[#8A8D96] rounded-t-lg transition-all duration-300"
              ></div>
              <span className="text-[11px] font-extrabold mt-2 text-[#3F4145] truncate">-{calculatedSales}</span>
              <span className="text-[10px] text-[#8A8D96] mt-0.5 truncate">예상 판매</span>
            </div>

            {/* 기말 재고 */}
            <div className="flex flex-col items-center h-full justify-end">
              <div
                style={{ height: `${Math.max(6, (calculatedEnding / 60) * 100)}px` }}
                className="w-full max-w-[40px] bg-[#3F4145] rounded-t-lg transition-all duration-300"
              ></div>
              <span className="text-[11px] font-extrabold mt-2 text-[#3F4145] truncate">{calculatedEnding}</span>
              <span className="text-[10px] text-[#8A8D96] mt-0.5 truncate">기말 재고</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. 하단 2열 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* 예측 위험 */}
        <div className="lg:col-span-7 bg-white/40 backdrop-blur-md border border-white/60 p-5 sm:p-6 rounded-[28px] shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-[#3F4145]">예측 위험</h3>
            <p className="text-[11px] text-[#8A8D96] mt-0.5">품절과 과잉을 함께 확인</p>
          </div>

          <div className="space-y-4 pt-1">
            <div>
              <div className="flex justify-between text-xs font-bold text-[#3F4145] mb-2">
                <span>품절 확률</span>
                <span>{currentData.outOfStockProb}%</span>
              </div>
              <div className="w-full bg-white/60 h-2.5 rounded-full overflow-hidden border border-white/80 p-0.5">
                <div
                  className="bg-[#3F4145] h-full rounded-full transition-all duration-500"
                  style={{ width: `${currentData.outOfStockProb}%` }}
                ></div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-1 border-t border-black/5">
              <span className="text-xs font-bold text-[#3F4145]">과잉 예상 수량</span>
              <span className="text-xs font-bold text-[#3F4145]">{currentData.excessQty} EA</span>
            </div>
          </div>
        </div>

        {/* 날씨 영향도 */}
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