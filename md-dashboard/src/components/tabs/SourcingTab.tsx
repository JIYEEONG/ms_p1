// 소싱 관리 화면
// 26.08.04 수정 (민) 하기 주석까지 기존코드 오픈코드는 가상데이터 테스트

/*
'use client';

import React from 'react';
import KpiCard from '../dashboard/KpiCard';

export default function SourcingTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard title="전체 거래처" value="22 개사" desc="활성 거래처" type="success" />
        <KpiCard title="총 미납 대금" value="₩1.5 억" desc="정산 대기" type="neutral" />
        <KpiCard title="진행 리오더" value="12 건" desc="생산/입고 중" type="info" />
        <KpiCard title="납기 지연 Alert" value="3 건" desc="Lead-Time 초과 위험" type="danger" />
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
        <h3 className="text-base font-semibold mb-4 text-slate-800">발주/리오더 & 리드타임 관리 (PO Tracker)</h3>
        <div className="p-8 bg-slate-50 border border-dashed border-slate-300 rounded text-center text-slate-400 text-sm">
          소싱 및 공정 스텝퍼(Stepper)가 들어갈 위치입니다.
        </div>
      </div>
    </div>
  );
} */

'use client';

import React from 'react';
import KpiCard from '../dashboard/KpiCard';

const mockOrders = [
  { poNumber: 'PO-2026-088', supplier: '성진어패럴', item: '쿨링 원피스 (3차 리오더)', qty: '1,000 EA', leadTime: '12일 소요', status: '원단 방적중', risk: '양호' },
  { poNumber: 'PO-2026-092', supplier: '(주)태광텍스타일', item: '오버핏 린넨 셔츠', qty: '500 EA', leadTime: '18일 소요', status: '봉제 단계', risk: '지연위험' },
];

export default function SourcingTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard title="활성 거래처" value="22 개사" desc="협력 공장 및 공급사" type="success" />
        <KpiCard title="진행 리오더 PO" value="12 건" desc="총 15,000 EA 생산중" type="info" />
        <KpiCard title="납기 지연 Alert" value="2 건" desc="원자재 입고 지연" type="danger" borderColor="#ef4444" />
        <KpiCard title="이번 달 정산 예정" value="₩1.5 억" desc="월말 지급건" type="neutral" />
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 font-semibold text-slate-800 flex justify-between items-center">
          <span>진행중인 발주/소싱 (PO Tracker)</span>
          <button className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors">
            + 신규 PO 발주 등록
          </button>
        </div>
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
            <tr>
              <th className="p-3">PO 번호</th>
              <th className="p-3">공급사/공장</th>
              <th className="p-3">발주 품목</th>
              <th className="p-3">수량</th>
              <th className="p-3">리드타임</th>
              <th className="p-3">현재 공정</th>
              <th className="p-3">위험도</th>
            </tr>
          </thead>
          <tbody>
            {mockOrders.map((order, idx) => (
              <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-3 font-mono text-xs text-slate-500">{order.poNumber}</td>
                <td className="p-3 font-medium text-slate-900">{order.supplier}</td>
                <td className="p-3">{order.item}</td>
                <td className="p-3 font-semibold">{order.qty}</td>
                <td className="p-3">{order.leadTime}</td>
                <td className="p-3"><span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs">{order.status}</span></td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    order.risk === '지연위험' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {order.risk}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}