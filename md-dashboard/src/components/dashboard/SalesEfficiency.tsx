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

      <div className="flex flex-col gap-3">
        {/* ASP */}
        <div className="bg-white/60 border border-white/80 p-4 rounded-[20px]">
          <span className="text-[11px] font-bold text-[#8A8D96] block mb-1">ASP</span>
          <h4 className="text-xl font-black text-[#3F4145] mb-0.5">₩93,993</h4>
          <p className="text-[10px] text-[#8A8D96] font-medium">총매출액 ÷ 판매수량</p>
        </div>

        {/* ATV */}
        <div className="bg-white/60 border border-white/80 p-4 rounded-[20px]">
          <span className="text-[11px] font-bold text-[#8A8D96] block mb-1">ATV</span>
          <h4 className="text-xl font-black text-[#3F4145] mb-0.5">₩110,847</h4>
          <p className="text-[10px] text-[#8A8D96] font-medium">총매출액 ÷ 주문건수</p>
        </div>

        {/* UPT */}
        <div className="bg-white/60 border border-white/80 p-4 rounded-[20px]">
          <span className="text-[11px] font-bold text-[#8A8D96] block mb-1">UPT</span>
          <h4 className="text-xl font-black text-[#3F4145] mb-0.5">1.18</h4>
          <p className="text-[10px] text-[#8A8D96] font-medium">판매수량 ÷ 주문건수</p>
        </div>
      </div>
    </div>
  );
}