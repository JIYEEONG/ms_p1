// 26.08.05 UI 변경으로 인한 파일 추가 HUB별 재고 관리 컴포넌트

'use client';

import React, { useState } from 'react';

const DATA_HUBS = [
  { id: "HUB01", name: "수도권 통합 허브", sales: 221839400, orders: 1976, qty: 2333, available: 3410, reserved: 240, in_transit: 310, incoming: 460, wos: 7.2, stockout: 4, over: 56 },
  { id: "HUB02", name: "호남·충청권 허브", sales: 78987400, orders: 712, qty: 838, available: 1760, reserved: 101, in_transit: 221, incoming: 290, wos: 9.6, stockout: 5, over: 42 },
  { id: "HUB03", name: "영남권 거점 허브", sales: 96671600, orders: 898, qty: 1058, available: 2266, reserved: 140, in_transit: 290, incoming: 350, wos: 8.4, stockout: 4, over: 53 }
];

const DATA_SKUS = [
  { product: "니트가디건", available: 0, wos: 0 },
  { product: "트렌치코트", available: 0, wos: 0 },
  { product: "와이드슬랙스", available: 31, wos: 24.1 },
  { product: "캐시미어코트", available: 18, wos: 19.6 }
];

const DATA_TRANSFERS = [
  { sku: "SKU0000", product: "니트가디건", from: "호남·충청권 허브", to: "수도권 통합 허브", qty: 18, before_from: 10.4, after_from: 7.9, before_to: 1.2, after_to: 4.1, status: "승인 대기" },
  { sku: "SKU0055", product: "트렌치코트", from: "영남권 거점 허브", to: "호남·충청권 허브", qty: 12, before_from: 9.1, after_from: 6.8, before_to: 0.9, after_to: 3.7, status: "요청 생성" },
  { sku: "SKU0188", product: "캐시미어코트", from: "수도권 통합 허브", to: "영남권 거점 허브", qty: 6, before_from: 18.0, after_from: 12.0, before_to: 2.8, after_to: 6.0, status: "출고 완료" }
];

export default function HubInventory() {
  const [selectedHub, setSelectedHub] = useState(0);

  const maxSpeed = Math.max(...DATA_HUBS.map(h => h.qty / 28));
  const maxWos = Math.max(...DATA_HUBS.map(h => h.wos));

  return (
    <div className="space-y-6">
      {/* 상단 타이틀 영역 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#3F4145]">HUB별 제품 재고 관리</h2>
          <p className="text-xs text-[#8A8D96] mt-1">세 HUB의 재고량, 판매 속도, WOS와 위험 상태를 비교하고 HUB 이동 가능성을 검토합니다.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-white/60 border border-white/80 px-3 py-2 rounded-2xl text-xs font-semibold shadow-sm">목표재고 4주</span>
          <button 
            onClick={() => document.getElementById('transferSection')?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-white/80 border border-white rounded-2xl px-4 py-2 text-xs font-extrabold shadow-sm hover:bg-white transition"
          >
            이동 요청 보기
          </button>
        </div>
      </div>

      {/* HUB 카드 3종 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {DATA_HUBS.map((hub, idx) => (
          <div
            key={hub.id}
            onClick={() => setSelectedHub(idx)}
            className={`p-5 rounded-[28px] border backdrop-blur-xl transition cursor-pointer shadow-sm ${
              selectedHub === idx 
                ? 'bg-white/80 border-[#3F4145]/40 ring-2 ring-[#3F4145]/20' 
                : 'bg-white/50 border-white/70 hover:bg-white/60'
            }`}
          >
            <div className="text-[11px] text-[#8A8D96] font-medium">{hub.id}</div>
            <div className="text-xl font-extrabold text-[#3F4145] mt-1">{hub.name}</div>
            <div className="text-xs text-[#65676E] mt-1">가용재고 {hub.available.toLocaleString()} EA · WOS {hub.wos}주</div>
            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="bg-white/40 p-2 rounded-xl">
                <span className="block text-[10px] text-[#8A8D96]">예약</span>
                <b className="text-xs text-[#3F4145]">{hub.reserved}</b>
              </div>
              <div className="bg-white/40 p-2 rounded-xl">
                <span className="block text-[10px] text-[#8A8D96]">이동 중</span>
                <b className="text-xs text-[#3F4145]">{hub.in_transit}</b>
              </div>
              <div className="bg-white/40 p-2 rounded-xl">
                <span className="block text-[10px] text-[#8A8D96]">입고 예정</span>
                <b className="text-xs text-[#3F4145]">{hub.incoming}</b>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 속도 & WOS 비교 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white/50 backdrop-blur-xl border border-white/70 p-6 rounded-[28px] shadow-sm">
          <h3 className="text-base font-extrabold text-[#3F4145]">HUB별 소진 속도</h3>
          <p className="text-[11px] text-[#8A8D96] mb-4">최근 28일 순판매량 기준 EA/일</p>
          <div className="space-y-3">
            {DATA_HUBS.map(hub => {
              const speed = (hub.qty / 28);
              return (
                <div key={hub.id} className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <span className="text-xs text-[#3F4145] font-semibold">{hub.name}</span>
                    <div className="h-2 bg-white/60 rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-[#65676E] rounded-full" style={{ width: `${(speed / maxSpeed) * 100}%` }} />
                    </div>
                  </div>
                  <strong className="text-xs text-[#3F4145]">{speed.toFixed(1)} EA/일</strong>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white/50 backdrop-blur-xl border border-white/70 p-6 rounded-[28px] shadow-sm">
          <h3 className="text-base font-extrabold text-[#3F4145]">WOS 비교</h3>
          <p className="text-[11px] text-[#8A8D96] mb-4">4주 부족·12주 과잉 기준</p>
          <div className="space-y-3">
            {DATA_HUBS.map(hub => (
              <div key={hub.id} className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <span className="text-xs text-[#3F4145] font-semibold">{hub.name}</span>
                  <div className="h-2 bg-white/60 rounded-full overflow-hidden mt-1">
                    <div className="h-full bg-[#8A8D96] rounded-full" style={{ width: `${(hub.wos / maxWos) * 100}%` }} />
                  </div>
                </div>
                <strong className="text-xs text-[#3F4145]">{hub.wos}주</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 균형 매트릭스 */}
      <div className="bg-white/50 backdrop-blur-xl border border-white/70 p-6 rounded-[28px] shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-base font-extrabold text-[#3F4145]">HUB 재고 균형 매트릭스</h3>
            <p className="text-[11px] text-[#8A8D96]">동일 SKU의 HUB별 가용재고와 이동 후보</p>
          </div>
          <span className="bg-white/70 px-2.5 py-1 rounded-full text-[10px] font-extrabold text-[#496B8F]">WOS 차이 큰 순</span>
        </div>
        <div className="grid grid-cols-4 gap-2 items-center text-center">
          <div className="text-[11px] text-[#8A8D96] font-bold text-left p-2">SKU</div>
          {DATA_HUBS.map(h => (
            <div key={h.id} className="text-[11px] text-[#8A8D96] font-bold p-2">{h.name}</div>
          ))}
          {DATA_SKUS.map((p, ri) => (
            <React.Fragment key={ri}>
              <div className="text-xs text-[#3F4145] font-bold text-left p-2">{p.product}</div>
              {DATA_HUBS.map((h, hi) => {
                const avail = Math.max(0, Math.round(p.available * (0.7 + hi * 0.25) + ri * 3));
                const wos = Math.max(0, (p.wos * (0.7 + hi * 0.2))).toFixed(1);
                return (
                  <div key={hi} className="bg-white/45 p-3 rounded-2xl text-xs text-[#3F4145]">
                    {avail} EA<br />
                    <span className="text-[10px] text-[#8A8D96]">WOS {wos}</span>
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* 권장 이동 및 진행 상태 */}
      <div id="transferSection" className="bg-white/50 backdrop-blur-xl border border-white/70 p-6 rounded-[28px] shadow-sm">
        <h3 className="text-base font-extrabold text-[#3F4145]">권장 이동 및 진행 상태</h3>
        <p className="text-[11px] text-[#8A8D96] mb-4">이동 전·후 WOS 비교</p>
        <div className="overflow-x-auto rounded-2xl">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-white/50 text-[10px] text-[#8A8D96] font-extrabold border-b border-[#65676E]/10">
                <th className="p-3">상품</th>
                <th className="p-3">출발 HUB</th>
                <th className="p-3">도착 HUB</th>
                <th className="p-3">권장 수량</th>
                <th className="p-3">출발 WOS 전→후</th>
                <th className="p-3">도착 WOS 전→후</th>
                <th className="p-3">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#65676E]/10 text-xs text-[#3F4145]">
              {DATA_TRANSFERS.map((t, idx) => (
                <tr key={idx} className="hover:bg-white/30">
                  <td className="p-3 font-semibold">{t.product}</td>
                  <td className="p-3">{t.from}</td>
                  <td className="p-3">{t.to}</td>
                  <td className="p-3 font-bold">{t.qty} EA</td>
                  <td className="p-3">{t.before_from} → {t.after_from}</td>
                  <td className="p-3">{t.before_to} → {t.after_to}</td>
                  <td className="p-3">
                    <span className="bg-[#DCEBFA] text-[#496B8F] px-2.5 py-1 rounded-full text-[10px] font-extrabold border border-white/80">
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}