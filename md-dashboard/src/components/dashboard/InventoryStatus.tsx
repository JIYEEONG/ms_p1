// 26.08.05 UI 변경에 따른 파일 추가 재고 상태 & 위험 상태 분석

'use client';

import React from 'react';

export default function InventoryStatus() {
  return (
    <div className="bg-white/50 backdrop-blur-xl border border-white/70 rounded-[32px] p-6 shadow-sm flex flex-col justify-between h-full min-h-[360px]">
      <div>
        <h3 className="text-base font-extrabold text-[#3F4145] mb-0.5">재고 상태</h3>
        <p className="text-xs text-[#8A8D96] mb-5">2025년 12월 31일 스냅샷</p>

        {/* 상단: 보유/가용/예약/이동중 카드 */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          <div className="bg-white/60 border border-white/80 p-3 rounded-[20px] text-center">
            <p className="text-[10px] font-bold text-[#8A8D96] mb-1">보유재고</p>
            <h4 className="text-lg font-black text-[#3F4145]">7,917</h4>
            <span className="text-[9px] text-[#8A8D96] font-bold">EA</span>
          </div>
          <div className="bg-white/60 border border-white/80 p-3 rounded-[20px] text-center">
            <p className="text-[10px] font-bold text-[#8A8D96] mb-1">가용재고</p>
            <h4 className="text-lg font-black text-[#3F4145]">7,436</h4>
            <span className="text-[9px] text-[#8A8D96] font-bold">EA</span>
          </div>
          <div className="bg-white/60 border border-white/80 p-3 rounded-[20px] text-center">
            <p className="text-[10px] font-bold text-[#8A8D96] mb-1">예약재고</p>
            <h4 className="text-lg font-black text-[#3F4145]">481</h4>
            <span className="text-[9px] text-[#8A8D96] font-bold">EA</span>
          </div>
          <div className="bg-white/60 border border-white/80 p-3 rounded-[20px] text-center">
            <p className="text-[10px] font-bold text-[#8A8D96] mb-1">이동 중</p>
            <h4 className="text-lg font-black text-[#3F4145]">821</h4>
            <span className="text-[9px] text-[#8A8D96] font-bold">EA</span>
          </div>
        </div>
      </div>

      {/* 하단: 품절/과잉/장기재고 SKU 바 */}
      <div className="space-y-3">
        <div className="flex items-center text-xs">
          <span className="w-24 font-bold text-[#3F4145]">품절 SKU</span>
          <div className="flex-1 mx-3 bg-black/5 h-2.5 rounded-full overflow-hidden">
            <div className="bg-[#414348] h-full rounded-full w-[8%]" />
          </div>
          <span className="font-extrabold text-[#3F4145] w-6 text-right">13</span>
        </div>

        <div className="flex items-center text-xs">
          <span className="w-24 font-bold text-[#3F4145]">과잉재고 SKU</span>
          <div className="flex-1 mx-3 bg-black/5 h-2.5 rounded-full overflow-hidden">
            <div className="bg-[#414348] h-full rounded-full w-[75%]" />
          </div>
          <span className="font-extrabold text-[#3F4145] w-6 text-right">151</span>
        </div>

        <div className="flex items-center text-xs">
          <span className="w-24 font-bold text-[#3F4145]">장기재고 SKU</span>
          <div className="flex-1 mx-3 bg-black/5 h-2.5 rounded-full overflow-hidden">
            <div className="bg-[#414348] h-full rounded-full w-[25%]" />
          </div>
          <span className="font-extrabold text-[#3F4145] w-6 text-right">26</span>
        </div>
      </div>
    </div>
  );
}