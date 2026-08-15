// 차트 UI
// 26.08.04 수정 (민)
// 26.08.05 UI 변경에 따른 코드 변경
// 26.08.06 이슈수정 테스트 코드
/* 'use client';

import React from 'react';

const categoryData = [
  { name: '아우터', value: '₩296,703,900', percentage: 85 },
  { name: '팬츠', value: '₩36,911,500', percentage: 22 },
  { name: '상의', value: '₩33,083,800', percentage: 18 },
  { name: '스커트', value: '₩18,615,300', percentage: 12 },
  { name: '원피스', value: '₩12,183,900', percentage: 8 },
];

export default function CategorySalesChart() {
  return (
    <div className="bg-white/50 backdrop-blur-xl border border-white/70 rounded-[32px] p-6 shadow-sm flex flex-col justify-between h-full min-h-[360px]">
      <div>
        <h3 className="text-base font-extrabold text-[#3F4145] mb-0.5">카테고리별 매출</h3>
        <p className="text-xs text-[#8A8D96] mb-6">선택 기간 내 순매출 비중</p>
      </div>

      <div className="space-y-5 my-auto">
        {categoryData.map((item) => (
          <div key={item.name} className="flex items-center text-xs">
            <span className="w-16 font-bold text-[#3F4145]">{item.name}</span>
            <div className="flex-1 mx-4 bg-black/5 h-3 rounded-full overflow-hidden">
              <div
                className="bg-[#414348] h-full rounded-full transition-all duration-500"
                style={{ width: `${item.percentage}%` }}
              />
            </div>
            <span className="font-extrabold text-[#3F4145] w-28 text-right">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
  */

'use client';

import React from 'react';

// API 데이터 타입 정의
export interface CategoryDataItem {
  name: string;
  value: string | number;
  percentage: number;
}

interface CategorySalesChartProps {
  data?: CategoryDataItem[]; // 백엔드에서 전달받는 데이터 (Optional)
}

export default function CategorySalesChart({ data }: CategorySalesChartProps) {
  // 데이터 검증 (데이터가 없거나 빈 배열일 경우 판단)
  const hasData = data && Array.isArray(data) && data.length > 0;

  return (
    <div className="bg-white/50 backdrop-blur-xl border border-white/70 rounded-[32px] p-6 shadow-sm flex flex-col justify-between h-full min-h-[360px]">
      <div>
        <h3 className="text-base font-extrabold text-[#3F4145] mb-0.5">카테고리별 매출</h3>
        <p className="text-xs text-[#8A8D96] mb-6">선택 기간 내 순매출 비중</p>
      </div>

      {hasData ? (
        <div className="space-y-5 my-auto">
          {data.map((item) => (
            <div key={item.name} className="flex items-center text-xs">
              <span className="w-16 font-bold text-[#3F4145]">{item.name}</span>
              <div className="flex-1 mx-4 bg-black/5 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-[#414348] h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(Math.max(item.percentage, 0), 100)}%` }}
                />
              </div>
              <span className="font-extrabold text-[#3F4145] w-28 text-right">
                {typeof item.value === 'number'
                  ? `${item.value.toLocaleString('ko-KR')}원`
                  : `${String(item.value).replace(/^₩\s*/, '').replace(/원$/, '')}원`}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex h-[200px] w-full items-center justify-center text-sm font-medium text-[#8A8D96] bg-white/30 rounded-2xl border border-dashed border-gray-200">
          조회된 카테고리 데이터가 없습니다.
        </div>
      )}
    </div>
  );
}
