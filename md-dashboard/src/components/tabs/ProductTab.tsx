// 상품 관리 화면
// 26.08.04 수정 (민) 하기 주석까지 기존코드 오픈코드는 가상데이터 테스트

/* 'use client';

import React from 'react';
import KpiCard from '../dashboard/KpiCard';

export default function ProductTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard title="품절 임박 SKU" value="15 SKUs" desc="긴급 발주 필요" type="danger" borderColor="#ef4444" />
        <KpiCard title="안전재고 미달" value="8 SKUs" desc="WOS < 2주" type="warning" borderColor="#f59e0b" />
        <KpiCard title="악성재고 SKU" value="22 SKUs" desc="60일 이상 무실적" type="info" borderColor="#3b82f6" />
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
        <h3 className="text-base font-semibold mb-4 text-slate-800">통합 상품·재고 그리드</h3>
        <div className="p-8 bg-slate-50 border border-dashed border-slate-300 rounded text-center text-slate-400 text-sm">
          상품 및 재고 관리 테이블이 들어갈 위치입니다.
        </div>
      </div>
    </div>
  );
} */

// 테스트 코드
'use client';

import React, { useState } from 'react';
import KpiCard from '../dashboard/KpiCard';
import FilterBar from '../dashboard/FilterBar';

const mockProducts = [
  { id: 'PRD-001', name: '오버핏 린넨 셔츠', category: '상의', stock: 12, status: '품절임박', wos: '1.2주', recommendation: '긴급 리오더 300개' },
  { id: 'PRD-002', name: '와이드 슬랙스', category: '하의', stock: 450, status: '정상', wos: '5.4주', recommendation: '유지' },
  { id: 'PRD-003', name: '쿨링 원피스', category: '원피스', stock: 8, status: '품절임박', wos: '0.8주', recommendation: '긴급 리오더 500개' },
  { id: 'PRD-004', name: '헤비 코튼 티셔츠', category: '상의', stock: 1200, status: '재고과다', wos: '12.1주', recommendation: '시즌 Off 할인 검토' },
];

export default function ProductTab() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = mockProducts.filter((p) =>
    p.name.includes(searchTerm) || p.id.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {/* KPI 영역 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard title="품절 임박 SKU" value="15 SKUs" desc="WOS 2주 미만" type="danger" borderColor="#ef4444" />
        <KpiCard title="안전재고 미달" value="8 SKUs" desc="발주점 도달" type="warning" borderColor="#f59e0b" />
        <KpiCard title="악성재고 SKU" value="22 SKUs" desc="60일 이상 무실적" type="info" borderColor="#3b82f6" />
      </div>

      {/* AI 인사이트 박스 */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-5 rounded-lg shadow-md border border-indigo-700">
        <div className="flex items-center gap-2 mb-2 font-bold text-indigo-300">
          ✨ AI MD Recommendation Engine
        </div>
        <p className="text-sm text-slate-200">
          현재 <span className="text-amber-300 font-semibold">'쿨링 원피스'</span> 및 <span className="text-amber-300 font-semibold">'오버핏 린넨 셔츠'</span>의 소진 속도가 예측치보다 24% 빠릅니다. 이번 주 내 <strong>총 800개 리오더 생성</strong>을 권장합니다.
        </p>
      </div>

      {/* 필터 바 */}
      <FilterBar>
        <input
          type="text"
          placeholder="상품명 또는 SKU 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border border-slate-300 rounded px-3 py-1.5 text-sm bg-slate-50 outline-none w-64"
        />
        <select className="border border-slate-300 rounded px-3 py-1.5 text-sm bg-slate-50 outline-none">
          <option>상태 전체 (품절임박/정상/과다)</option>
          <option>품절임박</option>
          <option>재고과다</option>
        </select>
      </FilterBar>

      {/* 상품 테이블 */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 font-semibold text-slate-800">
          통합 상품 및 재고 현황
        </div>
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
            <tr>
              <th className="p-3">SKU Code</th>
              <th className="p-3">상품명</th>
              <th className="p-3">카테고리</th>
              <th className="p-3">현재 재고</th>
              <th className="p-3">재고주수 (WOS)</th>
              <th className="p-3">상태</th>
              <th className="p-3">AI 액션 제안</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((item) => (
              <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="p-3 font-mono text-xs text-slate-500">{item.id}</td>
                <td className="p-3 font-medium text-slate-900">{item.name}</td>
                <td className="p-3">{item.category}</td>
                <td className="p-3 font-semibold">{item.stock.toLocaleString()} EA</td>
                <td className="p-3">{item.wos}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    item.status === '품절임박' ? 'bg-rose-100 text-rose-700' :
                    item.status === '재고과다' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {item.status}
                  </span>
                </td>
                <td className="p-3 font-medium text-indigo-600">{item.recommendation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}