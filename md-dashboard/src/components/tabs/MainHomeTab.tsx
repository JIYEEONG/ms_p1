// 메인 홈 화면
// 26.08.04 수정 (민) 백엔드 수정중 더미데이터가 포함된 기존 코드 제거 후 백엔드 API 연동 코드로 교체

"use client";

import { useEffect, useState } from "react";

export default function MainHomeTab() {
  const [kpi, setKpi] = useState<any>(null);
  const [categorySales, setCategorySales] = useState<any[]>([]);

  useEffect(() => {
    // 1. KPI 데이터 호출
    fetch("http://localhost:8001/api/v1/dashboard/kpi")
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") setKpi(data.data);
      })
      .catch((err) => console.error("KPI 연동 에러:", err));

    // 2. 카테고리 매출 데이터 호출
    fetch("http://localhost:8001/api/v1/dashboard/category-sales")
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") setCategorySales(data.data);
      })
      .catch((err) => console.error("카테고리 연동 에러:", err));
  }, []);

  return (
    <div className="space-y-6">
      {/* 상단 글로벌 필터 바 */}
      <div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-sm">
        <span className="font-semibold text-gray-700">글로벌 필터</span>
        <select className="px-3 py-1.5 border rounded-md text-sm">
          <option>조회 기간 (최근 30일)</option>
        </select>
        <select className="px-3 py-1.5 border rounded-md text-sm">
          <option>카테고리 전체</option>
        </select>
        <select className="px-3 py-1.5 border rounded-md text-sm">
          <option>시즌 전체</option>
        </select>
      </div>

      {/* KPI 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 font-medium">목표매출</p>
          <h4 className="text-xl font-bold mt-1">₩1.5억</h4>
          <span className="text-xs text-emerald-600 font-medium">달성률 85%</span>
        </div>

        <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 font-medium">총매출액</p>
          <h4 className="text-xl font-bold mt-1">
            ₩{kpi ? (kpi.total_sales / 100000000).toFixed(1) : "0"}억
          </h4>
          <span className="text-xs text-blue-600 font-medium">
            전월 대비 +{kpi?.sales_growth || 0}%
          </span>
        </div>

        <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 font-medium">재고회전율</p>
          <h4 className="text-xl font-bold mt-1">{kpi?.inventory_turnover || 0} 회</h4>
          <span className="text-xs text-gray-400">연간 기준</span>
        </div>

        <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 font-medium">소진율(Sell-Through)</p>
          <h4 className="text-xl font-bold mt-1">{kpi?.sell_through_rate || 0}%</h4>
          <span className="text-xs text-gray-400">시즌 누적</span>
        </div>

        <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 font-medium">리오더 필요 상품</p>
          <h4 className="text-xl font-bold mt-1 text-red-500">
            {kpi?.reorder_needed_count || 0} 건
          </h4>
          <span className="text-xs text-red-400">재고 부족 주의</span>
        </div>

        <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 font-medium">UPT</p>
          <h4 className="text-xl font-bold mt-1">2.4 개</h4>
          <span className="text-xs text-gray-400">판매개수÷주문건수</span>
        </div>
      </div>

      {/* 차트 및 대시보드 하단 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 bg-white rounded-lg shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4">카테고리별 매출 (FastAPI 연동)</h3>
          <div className="space-y-3">
            {categorySales.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <span className="w-24 text-gray-600 font-medium">{item.category}</span>
                <div className="flex-1 mx-4 bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full"
                    style={{ width: `${Math.min((item.sales / 50000000) * 100, 100)}%` }}
                  />
                </div>
                <span className="font-semibold text-gray-800">
                  ₩{(item.sales / 10000).toLocaleString()}만원
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 bg-white rounded-lg shadow-sm border border-gray-100 flex items-center justify-center text-gray-400 min-h-[250px]">
          공급사 TOP5 영역
        </div>
      </div>
    </div>
  );
}