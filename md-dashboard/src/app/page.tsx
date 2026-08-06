// 26.08.04 수정 (민) 26.08.05 UI 변경에 따른 코드 변경 추가

'use client';

import { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import OverviewTab from '@/components/tabs/OverviewTab';
import HubInventory from '@/components/dashboard/HubInventory';
import ProductInventory from '@/components/dashboard/ProductInventory';
import ForecastInventory from '@/components/dashboard/ForecastInventory';
import { DashboardView } from '@/types/dashboard';

export default function Home() {
  const [currentView, setCurrentView] = useState<DashboardView>('overview');
  // 사이드바 열림/닫힘 상태
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    // max-w-[1620px] 제거 후 w-full로 넓히고 여백을 조정해 화면에 꽉 차게 변경
    <div className="w-full p-4 sm:p-6 flex gap-6 min-h-screen">
      <Sidebar 
        currentView={currentView} 
        onViewChange={setCurrentView}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <main className="main flex-1 min-w-0 transition-all duration-300">
        <Header />

        {currentView === 'overview' && <OverviewTab />}
        {currentView === 'hub' && <HubInventory />}
        {currentView === 'product' && <ProductInventory />}
        {currentView === 'forecast' && <ForecastInventory />}
      </main>
    </div>
  );
}