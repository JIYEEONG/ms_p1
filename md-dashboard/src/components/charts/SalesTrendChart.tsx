// 26.08.05 UI 변경에 따른 파일 추가
// 26.08.06 이슈수정 테스트 코드
/* 'use client';

import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

const data = [
  { month: '01', sales: 320 },
  { month: '02', sales: 300 },
  { month: '03', sales: 310 },
  { month: '04', sales: 290 },
  { month: '05', sales: 330 },
  { month: '06', sales: 280 },
  { month: '07', sales: 310 },
  { month: '08', sales: 300 },
  { month: '09', sales: 420 },
  { month: '10', sales: 530 },
  { month: '11', sales: 580 },
  { month: '12', sales: 540 },
];

export default function SalesTrendChart() {
  return (
    <div className="bg-white/50 backdrop-blur-xl border border-white/70 rounded-[32px] p-6 shadow-sm flex flex-col justify-between h-full min-h-[380px]">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-base font-extrabold text-[#3F4145]">월별 순매출 추이</h3>
          <p className="text-xs text-[#8A8D96] mt-0.5">정상 주문 매출에서 클레임 수량은 연동해 조정</p>
        </div>
        <span className="text-[11px] font-bold text-[#8A8D96] bg-white/60 px-3 py-1 rounded-full border border-white/80">
          단위: 억 원
        </span>
      </div>

      <div className="w-full h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3F4145" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#3F4145" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#8A8D96', fontSize: 11 }} />
            <YAxis hide domain={['dataMin - 50', 'dataMax + 50']} />
            <Tooltip
              contentStyle={{ background: 'rgba(255, 255, 255, 0.9)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
            />
            <Area
              type="monotone"
              dataKey="sales"
              stroke="#3F4145"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorSales)"
              dot={{ r: 4, fill: '#3F4145', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
  */

'use client';

import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

// API 데이터 타입 정의
interface SalesDataItem {
  month: string;
  sales: number;
}

interface SalesTrendChartProps {
  data?: SalesDataItem[]; // 백엔드에서 전달받는 데이터 (Optional)
}

export default function SalesTrendChart({ data }: SalesTrendChartProps) {
  // 데이터 검증 (데이터가 없거나 빈 배열일 경우 판단)
  const hasData = data && Array.isArray(data) && data.length > 0;

  return (
    <div className="bg-white/50 backdrop-blur-xl border border-white/70 rounded-[32px] p-6 shadow-sm flex flex-col justify-between h-full min-h-[380px]">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-base font-extrabold text-[#3F4145]">월별 순매출 추이</h3>
          <p className="text-xs text-[#8A8D96] mt-0.5">정상 주문 매출에서 클레임 수량은 연동해 조정</p>
        </div>
        <span className="text-[11px] font-bold text-[#8A8D96] bg-white/60 px-3 py-1 rounded-full border border-white/80">
          단위: 억 원
        </span>
      </div>

      <div className="w-full h-[260px]">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3F4145" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3F4145" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#8A8D96', fontSize: 11 }} />
              <YAxis hide domain={['dataMin - 50', 'dataMax + 50']} />
              <Tooltip
                contentStyle={{ background: 'rgba(255, 255, 255, 0.9)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
              />
              <Area
                type="monotone"
                dataKey="sales"
                stroke="#3F4145"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorSales)"
                dot={{ r: 4, fill: '#3F4145', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm font-medium text-[#8A8D96] bg-white/30 rounded-2xl border border-dashed border-gray-200">
            조회된 매출 데이터가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}