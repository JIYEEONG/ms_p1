// 26.08.05 UI 변경에 따른 파일 추가 ASP / ATV / UPT 판매 효율 카드

'use client';

import React from 'react';

function compactWon(value: number) {
  if (Math.abs(value) >= 100000000) return `${(value / 100000000).toFixed(2)}억원`;
  if (Math.abs(value) >= 10000) return `${(value / 10000).toFixed(1)}만원`;
  return `${Math.round(value).toLocaleString('ko-KR')}원`;
}

function MoneyMetric({ value, loading }: { value: number; loading: boolean }) {
  if (loading) return <h4 className="mb-1 text-2xl font-black text-[#3F4145]">—</h4>;
  return <div className="mb-1 text-2xl font-black text-[#3F4145]"><span className="block">{compactWon(value)}</span><span className="mt-0.5 block text-[10px] font-semibold text-[#7A7D84]">{Math.round(value).toLocaleString('ko-KR')}원</span></div>;
}

export default function SalesEfficiency({ sales, orders, units, loading }: { sales: number; orders: number; units: number; loading: boolean }) {
  const asp = units > 0 ? sales / units : 0;
  const atv = orders > 0 ? sales / orders : 0;
  const upt = orders > 0 ? units / orders : 0;
  return (
    <section className="flex flex-col justify-between gap-4 rounded-[22px] border border-white/80 bg-white/45 p-5" aria-labelledby="sales-efficiency-title">
      <div>
        <h3 id="sales-efficiency-title" className="text-sm font-extrabold text-[#3F4145] mb-0.5">판매 효율</h3>
        <p className="text-xs text-[#8A8D96]">주문 단위와 판매수량 기준</p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {/* ASP */}
        <div className="bg-white/60 border border-white/80 p-4 rounded-[20px]">
          <p className="mb-1 text-xs font-bold text-[#8A8D96]">평균 판매 단가</p>
          <MoneyMetric value={asp} loading={loading} />
          <div className="flex items-center gap-2 text-[10px] font-medium text-[#8A8D96]">
            <span className="font-extrabold">ASP</span>
            <span>총매출액 ÷ 판매수량</span>
          </div>
        </div>

        {/* ATV */}
        <div className="bg-white/60 border border-white/80 p-4 rounded-[20px]">
          <p className="mb-1 text-xs font-bold text-[#8A8D96]">주문 1건당 평균 결제금액</p>
          <MoneyMetric value={atv} loading={loading} />
          <div className="flex items-center gap-2 text-[10px] font-medium text-[#8A8D96]">
            <span className="font-extrabold">ATV</span>
            <span>총매출액 ÷ 주문건수</span>
          </div>
        </div>

        {/* UPT */}
        <div className="bg-white/60 border border-white/80 p-4 rounded-[20px]">
          <p className="mb-1 text-xs font-bold text-[#8A8D96]">주문 1건당 평균 구매 수량</p>
          <h4 className="mb-1 text-2xl font-black text-[#3F4145]">{loading ? '—' : `${upt.toFixed(2)}개`}</h4>
          <div className="flex items-center gap-2 text-[10px] font-medium text-[#8A8D96]">
            <span className="font-extrabold">UPT</span>
            <span>판매수량 ÷ 주문건수</span>
          </div>
        </div>
      </div>
    </section>
  );
}
