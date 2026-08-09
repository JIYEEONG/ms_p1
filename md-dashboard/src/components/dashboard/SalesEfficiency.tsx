// 26.08.05 UI 변경에 따른 파일 추가 ASP / ATV / UPT 판매 효율 카드

'use client';

import React from 'react';

export default function SalesEfficiency() {
  return (
    <div className="bg-white/50 backdrop-blur-xl border border-white/70 rounded-[32px] p-6 shadow-sm flex flex-col justify-between h-full gap-4">
      <div>
        <h3 className="text-base font-extrabold text-[#3F4145] mb-0.5">판매 효율</h3>
        <p className="text-xs text-[#8A8D96]">주문 단위와 판매수량 기준</p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {/* ASP */}
        <div className="bg-white/60 border border-white/80 p-4 rounded-[20px]">
          <p className="mb-1 text-xs font-bold text-[#8A8D96]">평균 판매 단가</p>
          <h4 className="mb-1 text-2xl font-black text-[#3F4145]">93,993원</h4>
          <div className="flex items-center gap-2 text-[10px] font-medium text-[#8A8D96]">
            <span className="font-extrabold">ASP</span>
            <span>총매출액 ÷ 판매수량</span>
          </div>
        </div>

        {/* ATV */}
        <div className="bg-white/60 border border-white/80 p-4 rounded-[20px]">
          <p className="mb-1 text-xs font-bold text-[#8A8D96]">주문 1건당 평균 결제금액</p>
          <h4 className="mb-1 text-2xl font-black text-[#3F4145]">110,847원</h4>
          <div className="flex items-center gap-2 text-[10px] font-medium text-[#8A8D96]">
            <span className="font-extrabold">ATV</span>
            <span>총매출액 ÷ 주문건수</span>
          </div>
        </div>

        {/* UPT */}
        <div className="bg-white/60 border border-white/80 p-4 rounded-[20px]">
          <p className="mb-1 text-xs font-bold text-[#8A8D96]">주문 1건당 평균 구매 수량</p>
          <h4 className="mb-1 text-2xl font-black text-[#3F4145]">1.18개</h4>
          <div className="flex items-center gap-2 text-[10px] font-medium text-[#8A8D96]">
            <span className="font-extrabold">UPT</span>
            <span>판매수량 ÷ 주문건수</span>
          </div>
        </div>
      </div>
    </div>
  );
}
