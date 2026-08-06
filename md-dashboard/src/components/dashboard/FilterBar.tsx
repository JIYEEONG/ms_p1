// 상단 필터바 UI
// 26.08.04 수정 (민) 
// 26.08.05 UI 변경에 따른 코드 변경

'use client';

import React from 'react';

export default function FilterBar() {
  return (
    <div className="bg-white/70 backdrop-blur-md border border-white/90 rounded-[28px] p-6 shadow-[0_20px_35px_-10px_rgba(160,175,200,0.2),inset_0_1px_2px_0_rgba(255,255,255,0.8)]">
      {/* 카드 타이틀 */}
      <h3 className="text-base font-extrabold text-[#3F4145] mb-3.5 tracking-tight">분석 조건</h3>
      
      {/* 4개 필터 레이아웃 (기간, 카테고리, 시즌, HUB) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-[11px] font-bold text-[#8A8D96] mb-1.5 ml-1">기간</label>
          <select className="w-full bg-white/90 border border-white rounded-[16px] px-4 py-2.5 text-xs font-bold text-[#3F4145] focus:outline-none focus:ring-2 focus:ring-[#3F4145]/10 shadow-[0_6px_12px_-2px_rgba(140,150,170,0.12),0_2px_4px_-1px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_16px_-2px_rgba(140,150,170,0.18)] transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%238A8D96%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:9px_9px] bg-[right_16px_center] bg-no-repeat pr-9">
            <option>2025-12</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-[#8A8D96] mb-1.5 ml-1">카테고리</label>
          <select className="w-full bg-white/90 border border-white rounded-[16px] px-4 py-2.5 text-xs font-bold text-[#3F4145] focus:outline-none focus:ring-2 focus:ring-[#3F4145]/10 shadow-[0_6px_12px_-2px_rgba(140,150,170,0.12),0_2px_4px_-1px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_16px_-2px_rgba(140,150,170,0.18)] transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%238A8D96%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:9px_9px] bg-[right_16px_center] bg-no-repeat pr-9">
            <option>전체</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-[#8A8D96] mb-1.5 ml-1">시즌</label>
          <select className="w-full bg-white/90 border border-white rounded-[16px] px-4 py-2.5 text-xs font-bold text-[#3F4145] focus:outline-none focus:ring-2 focus:ring-[#3F4145]/10 shadow-[0_6px_12px_-2px_rgba(140,150,170,0.12),0_2px_4px_-1px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_16px_-2px_rgba(140,150,170,0.18)] transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%238A8D96%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:9px_9px] bg-[right_16px_center] bg-no-repeat pr-9">
            <option>전체</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-[#8A8D96] mb-1.5 ml-1">HUB</label>
          <select className="w-full bg-white/90 border border-white rounded-[16px] px-4 py-2.5 text-xs font-bold text-[#3F4145] focus:outline-none focus:ring-2 focus:ring-[#3F4145]/10 shadow-[0_6px_12px_-2px_rgba(140,150,170,0.12),0_2px_4px_-1px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_16px_-2px_rgba(140,150,170,0.18)] transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%238A8D96%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:9px_9px] bg-[right_16px_center] bg-no-repeat pr-9">
            <option>전체</option>
          </select>
        </div>
      </div>
    </div>
  );
}