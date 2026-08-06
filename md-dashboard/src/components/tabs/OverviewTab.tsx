// 26.08.05 UI 변경에 따른 파일 추가 현황 파악 탭 전체 조립 컴포넌트

'use client';

import React, { useState, useEffect } from 'react';
import FilterBar from '../dashboard/FilterBar';
import KpiCards from '../dashboard/KpiCard';
import SalesTrendChart from '../charts/SalesTrendChart';
import SalesEfficiency from '../dashboard/SalesEfficiency';
import CategorySalesChart from '../charts/CategorySalesChart';
import InventoryStatus from '../dashboard/InventoryStatus';
import RiskSkuTable from '../dashboard/RiskSkuTable';

export default function OverviewTab() {
  // 백엔드 데이터를 보관할 State
  const [salesTrendData, setSalesTrendData] = useState([]);
  const [categorySalesData, setCategorySalesData] = useState([]);

  // API 데이터 호출
  useEffect(() => {
    // 1. 월별 순매출 추이 API 호출
    fetch('http://127.0.0.1:8000/api/v1/dashboard/sales-trend')
      .then((res) => res.json())
      .then((data) => setSalesTrendData(data))
      .catch((err) => console.error('Sales trend fetch error:', err));

    // 2. 카테고리별 매출 API 호출
    fetch('http://127.0.0.1:8000/api/v1/dashboard/category-sales')
      .then((res) => res.json())
      .then((data) => setCategorySalesData(data))
      .catch((err) => console.error('Category sales fetch error:', err));
  }, []);

  return (
    <div className="space-y-6 pb-12">
      {/* 1. 상단 조건 필터 */}
      <section>
        <FilterBar />
      </section>

      {/* 2. KPI 4열 카드 */}
      <section>
        <KpiCards />
      </section>

      {/* 3. 월별 순매출 추이 (좌 2칸) + 판매 효율 (우 1칸) */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        <div className="lg:col-span-2 h-full">
          {/* data 전달 */}
          <SalesTrendChart data={salesTrendData} />
        </div>
        <div className="lg:col-span-1 h-full">
          <SalesEfficiency />
        </div>
      </section>

      {/* 4. 카테고리별 매출 (좌 2칸) + 재고/위험 상태 (우 1칸) */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        <div className="lg:col-span-2 h-full">
          {/* data 전달 */}
          <CategorySalesChart data={categorySalesData} />
        </div>
        <div className="lg:col-span-1 h-full">
          <InventoryStatus />
        </div>
      </section>

      {/* 5. 우선 확인 위험 SKU 테이블 (전체 너비) */}
      <section>
        <RiskSkuTable />
      </section>
    </div>
  );
}