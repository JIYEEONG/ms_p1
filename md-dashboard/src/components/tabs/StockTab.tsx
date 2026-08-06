// 재고 관리 화면
// 26.08.04 수정 (민) 하기 주석까지 기존코드 오픈코드는 가상데이터 테스트

/*
'use client';

import React from 'react';
import KpiCard from '../dashboard/KpiCard';

export default function StockTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard title="총 보유재고" value="128,500 EA" desc="전체 HUB 합산" type="neutral" />
        <KpiCard title="가용재고" value="112,000 EA" desc="즉시 판매 가능" type="success" />
        <KpiCard title="이동 중(In-Transit)" value="12,000 EA" desc="HUB 간 이송 중" type="neutral" />
        <KpiCard title="불량/폐기재고" value="4,500 EA" desc="검수 대기·손상" type="danger" />
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
        <h3 className="text-base font-semibold mb-4 text-slate-800">HUB 별 재고 매트릭스</h3>
        <div className="p-8 bg-slate-50 border border-dashed border-slate-300 rounded text-center text-slate-400 text-sm">
          물류 HUB 재고 현황 테이블이 들어갈 위치입니다.
        </div>
      </div>
    </div>
  );
} */

'use client';

import React from 'react';
import KpiCard from '../dashboard/KpiCard';
import FilterBar from '../dashboard/FilterBar';

const mockHubStock = [
  { hub: '이천 제1물류센터', capacity: '82%', available: '45,000 EA', reserved: '5,000 EA', status: '원활' },
  { hub: '용인 제2물류센터', capacity: '94%', available: '62,000 EA', reserved: '8,500 EA', status: '포화 임박' },
  { hub: '칠곡 물류HUB', capacity: '45%', available: '15,000 EA', reserved: '1,200 EA', status: '여유' },
];

export default function StockTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard title="총 보유재고" value="128,500 EA" desc="전체 HUB 합산" type="neutral" />
        <KpiCard title="가용재고" value="112,000 EA" desc="즉시 출고 가능" type="success" />
        <KpiCard title="HUB 간 이동중" value="12,000 EA" desc="이송 트럭 4대" type="info" />
        <KpiCard title="검수/손상 재고" value="4,500 EA" desc="처리 반품 대기" type="danger" />
      </div>

      <FilterBar>
        <span className="font-semibold text-sm text-slate-700">물류 거점 필터</span>
        <select className="border border-slate-300 rounded px-3 py-1.5 text-sm bg-slate-50 outline-none">
          <option>전체 HUB</option>
          <option>이천 제1물류센터</option>
          <option>용인 제2물류센터</option>
          <option>칠곡 물류HUB</option>
        </select>
      </FilterBar>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
        <h3 className="text-base font-semibold mb-4 text-slate-800">거점별 창고 가동률 & 재고 보유량</h3>
        <div className="space-y-4">
          {mockHubStock.map((hub, idx) => (
            <div key={idx} className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="font-bold text-slate-800">{hub.hub}</div>
                <div className="text-xs text-slate-500 mt-1">가용: {hub.available} | 예약: {hub.reserved}</div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-xs text-slate-500">수용률</div>
                  <div className="font-bold text-slate-800">{hub.capacity}</div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  hub.status === '포화 임박' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {hub.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}