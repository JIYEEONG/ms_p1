// 26.08.05 UI 변경에 따른 파일 추가

'use client';

import React from 'react';

export default function Header() {
  return (
    <header className="header flex justify-between items-center mb-6 gap-4">
      {/* 입체감 적용된 검색 바 */}
      <div className="search-bar flex items-center gap-2.5 px-4 py-2.5 rounded-[20px] w-full max-w-[360px] bg-white/70 backdrop-blur-md border border-white/90 shadow-[0_10px_20px_-5px_rgba(160,175,200,0.2),inset_0_1px_2px_0_rgba(255,255,255,0.8)] transition-all focus-within:bg-white focus-within:shadow-[0_12px_24px_-4px_rgba(160,175,200,0.3)]">
        <span className="text-sm text-[#8A8D96] select-none">🔍</span>
        <input
          type="text"
          placeholder="통합 검색 (SKU, HUB, 카테고리)..."
          className="bg-transparent border-none outline-none text-xs w-full text-[#3F4145] placeholder-[#8A8D96] font-medium"
        />
      </div>

      {/* 사용자 프로필 영역 */}
      <div className="user-profile flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-xs font-bold text-[#3F4145] m-0">Team2 MD</p>
          <p className="text-[10px] text-[#8A8D96] m-0 mt-0.5">재고관리팀 / 총괄</p>
        </div>
        
        {/* 입체감 적용된 아바타 아이콘 */}
        <div className="avatar w-10 h-10 rounded-full bg-white/80 backdrop-blur-md border border-white/90 grid place-items-center text-xs font-extrabold text-[#3F4145] shadow-[0_8px_16px_-4px_rgba(140,150,170,0.2),inset_0_1px_2px_0_rgba(255,255,255,0.9)] select-none">
          T2
        </div>
      </div>
    </header>
  );
}
