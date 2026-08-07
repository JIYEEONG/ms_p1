// 좌측 메뉴바
// 26.08.04 수정 (민)
// 26.08.05 UI 변경에 따른 타입 스크립트 추가

/* 'use client';

import React from 'react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const menuItems = [
    { id: 'tab1', label: '[1] Main Home' },
    { id: 'tab2', label: '[2] Product' },
    { id: 'tab3', label: '[3] Stock' },
    { id: 'tab4', label: '[4] Season' },
    { id: 'tab5', label: '[5] Sourcing' },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col justify-between shadow-lg z-10 shrink-0">
      <div>
        <div className="p-5 text-xl font-bold border-b border-slate-800 flex items-center justify-between">
          <span>MD 대시보드(v1.1)</span>
          <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-semibold">2팀</span>
        </div>
        <nav className="py-4">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full text-left px-6 py-4 transition-colors text-sm font-medium border-l-4 ${
                  isActive
                    ? 'bg-slate-800 text-white border-blue-500 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white border-transparent'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
      <div className="p-5 border-t border-slate-800 text-xs text-slate-400 space-y-1">
        <div className="font-bold text-white text-sm">User Profile</div>
        <div>Azure / Local</div>
      </div>
    </aside>
  );
}
  */

// 햄버거 버튼 추가, ai챗봇 추가
'use client';

import { DashboardView } from '@/types/dashboard';
import AiReportChatWidget from '@/components/layout/AiReportChatWidget';

interface SidebarProps {
  currentView: DashboardView;
  onViewChange: (view: DashboardView) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({ currentView, onViewChange, isOpen, onToggle }: SidebarProps) {
  // 닫혀있을 때: 입체감이 적용된 단독 햄버거 버튼
  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="shrink-0 w-12 h-12 bg-white/80 backdrop-blur-md border border-white rounded-2xl shadow-[0_10px_20px_-5px_rgba(140,150,170,0.2)] hover:shadow-[0_14px_24px_-4px_rgba(140,150,170,0.3)] transition-all flex items-center justify-center text-[#3F4145] cursor-pointer hover:-translate-y-0.5"
        title="사이드바 열기"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    );
  }

  // 열려있을 때: 몽환적인 3D 카드 효과가 적용된 사이드바
  return (
    <aside className="w-72 shrink-0 transition-all duration-300 ease-in-out">
      <div className="bg-white/70 backdrop-blur-md border border-white/90 rounded-[32px] p-6 shadow-[0_20px_35px_-10px_rgba(160,175,200,0.25),inset_0_1px_2px_0_rgba(255,255,255,0.8)] min-h-[calc(100vh-48px)] flex flex-col justify-between gap-4">
        <div>
          {/* 상단 로고 & X (닫기) 버튼 */}
          <div className="flex items-center justify-between mb-8 gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-[#3F4145] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-[0_4px_10px_rgba(0,0,0,0.15)]">
                MD
              </div>
              <div className="min-w-0">
                <h1 className="font-extrabold text-sm leading-tight text-[#3F4145] truncate">Inventory Lens</h1>
                <p className="text-[10px] text-[#8A8D96] truncate mt-0.5">판매·재고 의사결정 대시보드</p>
              </div>
            </div>

            {/* 열려있을 때 보여주는 X (닫기) 버튼 */}
            <button
              onClick={onToggle}
              className="p-2 bg-white/80 border border-white rounded-xl shadow-[0_4px_10px_-2px_rgba(140,150,170,0.15)] hover:bg-white hover:shadow-[0_6px_14px_-2px_rgba(140,150,170,0.25)] transition-all text-[#3F4145] shrink-0 cursor-pointer hover:-translate-y-0.5"
              title="사이드바 접기"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 네비게이션 탭 메뉴 */}
          <nav className="space-y-2.5">
            <button
              onClick={() => onViewChange('overview')}
              className={`w-full text-left px-4 py-3.5 rounded-2xl text-xs font-bold transition-all ${
                currentView === 'overview'
                  ? 'bg-white text-[#3F4145] shadow-[0_10px_20px_-5px_rgba(140,150,170,0.2)] border border-white'
                  : 'text-[#8A8D96] hover:bg-white/40 hover:text-[#3F4145]'
              }`}
            >
              현황 파악
            </button>
            <button
              onClick={() => onViewChange('hub')}
              className={`w-full text-left px-4 py-3.5 rounded-2xl text-xs font-bold transition-all ${
                currentView === 'hub'
                  ? 'bg-white text-[#3F4145] shadow-[0_10px_20px_-5px_rgba(140,150,170,0.2)] border border-white'
                  : 'text-[#8A8D96] hover:bg-white/40 hover:text-[#3F4145]'
              }`}
            >
              HUB별 재고
            </button>
            <button
              onClick={() => onViewChange('product')}
              className={`w-full text-left px-4 py-3.5 rounded-2xl text-xs font-bold transition-all ${
                currentView === 'product'
                  ? 'bg-white text-[#3F4145] shadow-[0_10px_20px_-5px_rgba(140,150,170,0.2)] border border-white'
                  : 'text-[#8A8D96] hover:bg-white/40 hover:text-[#3F4145]'
              }`}
            >
              상품별 재고
            </button>
            <button
              onClick={() => onViewChange('forecast')}
              className={`w-full text-left px-4 py-3.5 rounded-2xl text-xs font-bold transition-all ${
                currentView === 'forecast'
                  ? 'bg-white text-[#3F4145] shadow-[0_10px_20px_-5px_rgba(140,150,170,0.2)] border border-white'
                  : 'text-[#8A8D96] hover:bg-white/40 hover:text-[#3F4145]'
              }`}
            >
              예측
            </button>
          </nav>
        </div>

        {/* AI 리포트 생성기 위젯 (신규 추가 영역) */}
        <div className="my-2 h-[300px] w-full">
          <AiReportChatWidget />
        </div>

        {/* 좌측 하단 설명 문구 */}
        <div className="text-[10px] text-[#8A8D96] space-y-1 border-t border-black/5 pt-4">
          <p>장기재고: 무판매 60일 이상</p>
          <p>과잉재고: WOS 12주 이상</p>
          <p>주문건수: COUNT(DISTINCT order_item_id)</p>
          <p>목표매출: 추천값 또는 사용자 입력값</p>
        </div>
      </div>
    </aside>
  );
}