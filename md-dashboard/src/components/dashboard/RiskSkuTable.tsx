// 26.08.05 UI 변경에 따른 파일 추가

'use client';

import React from 'react';

const riskData = [
  { status: '장기재고', sku: 'SKU0225', name: '린넨숏팬츠', category: '팬츠', hub: '수도권 통합 허브', available: '22 EA', noSaleDays: '99일', wos: '—' },
  { status: '품절', sku: 'SKU0000', name: '니트가디건', category: '아우터', hub: '호남·충청권 허브', available: '0 EA', noSaleDays: '10일', wos: '0.0' },
  { status: '품절', sku: 'SKU0055', name: '트렌치코트', category: '아우터', hub: '영남권 거점 허브', available: '0 EA', noSaleDays: '12일', wos: '0.0' },
  { status: '장기재고', sku: 'SKU0142', name: '와이드슬랙스', category: '팬츠', hub: '수도권 통합 허브', available: '31 EA', noSaleDays: '67일', wos: '24.8' },
  { status: '과잉재고', sku: 'SKU0188', name: '캐시미어코트', category: '아우터', hub: '수도권 통합 허브', available: '18 EA', noSaleDays: '21일', wos: '18.0' },
  { status: '과잉재고', sku: 'SKU0314', name: '플리츠스커트', category: '스커트', hub: '영남권 거점 허브', available: '27 EA', noSaleDays: '18일', wos: '15.4' },
];

export default function RiskSkuTable() {
  const getBadgeStyle = (status: string) => {
    switch (status) {
      case '장기재고':
        return 'bg-[#F2E8CE] text-[#8C733E]';
      case '품절':
        return 'bg-[#FCE3DC] text-[#C05638]';
      case '과잉재고':
        return 'bg-[#DDE2F0] text-[#4A6396]';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="bg-white/50 backdrop-blur-xl border border-white/70 rounded-[32px] p-6 shadow-sm space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-base font-extrabold text-[#3F4145]">우선 확인 위험 SKU</h3>
          <p className="text-xs text-[#8A8D96] mt-0.5">품절·과잉·장기재고를 한 목록에서 비교</p>
        </div>
        <button className="bg-white/80 hover:bg-white text-[#3F4145] text-xs font-bold px-4 py-2 rounded-[14px] border border-white/80 shadow-sm transition">
          CSV 다운로드
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[11px] font-bold text-[#8A8D96] border-b border-black/5 pb-2">
              <th className="py-3 px-2">상태</th>
              <th className="py-3 px-2">SKU</th>
              <th className="py-3 px-2">상품명</th>
              <th className="py-3 px-2">카테고리</th>
              <th className="py-3 px-2">HUB</th>
              <th className="py-3 px-2">가용재고</th>
              <th className="py-3 px-2">무판매 일수</th>
              <th className="py-3 px-2">WOS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 text-xs font-medium text-[#3F4145]">
            {riskData.map((row, idx) => (
              <tr key={idx} className="hover:bg-white/30 transition">
                <td className="py-3 px-2">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${getBadgeStyle(row.status)}`}>
                    {row.status}
                  </span>
                </td>
                <td className="py-3 px-2 font-bold">{row.sku}</td>
                <td className="py-3 px-2">{row.name}</td>
                <td className="py-3 px-2">{row.category}</td>
                <td className="py-3 px-2">{row.hub}</td>
                <td className="py-3 px-2 font-bold">{row.available}</td>
                <td className="py-3 px-2">{row.noSaleDays}</td>
                <td className="py-3 px-2 font-bold">{row.wos}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[10px] text-[#8A8D96] pt-2">
        과잉재고는 우선실행 화면에서 WOS 12주 이상을 임시 기준으로 표시했습니다. 장기재고는 무판매 60일 이상으로 고정했습니다.
      </p>
    </div>
  );
}