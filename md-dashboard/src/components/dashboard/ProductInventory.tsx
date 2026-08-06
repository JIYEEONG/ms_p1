// 26.08.05 UI 변경으로 인한 파일 추가 상품별 재고 관리 컴포넌트
// 안전재고 설정 모달 팝업 상태 및 변경 기능이 추가

'use client';

import React, { useState } from 'react';

const PRODUCTS = [
  { sku: "SKU0000", product: "니트가디건", category: "아우터", season: "간절기", color: "블랙", size: "M", available: 0, safety: 24, sales90: 218, daily: 2.42, sell_through: 88.4, wos: 0, claim_rate: 4.1, status: "품절 임박", lead: 21, moq: 50, incoming: 50 },
  { sku: "SKU0055", product: "트렌치코트", category: "아우터", season: "간절기", color: "베이지", size: "S", available: 0, safety: 18, sales90: 163, daily: 1.81, sell_through: 91.2, wos: 0, claim_rate: 3.2, status: "품절 임박", lead: 28, moq: 30, incoming: 30 },
  { sku: "SKU0142", product: "와이드슬랙스", category: "팬츠", season: "사계절", color: "차콜", size: "L", available: 31, safety: 14, sales90: 32, daily: 0.36, sell_through: 54.7, wos: 24.1, claim_rate: 2.8, status: "장기재고", lead: 14, moq: 40, incoming: 0 },
  { sku: "SKU0188", product: "캐시미어코트", category: "아우터", season: "겨울", color: "그레이", size: "M", available: 18, safety: 9, sales90: 21, daily: 0.23, sell_through: 42.1, wos: 19.6, claim_rate: 6.5, status: "과잉재고", lead: 35, moq: 20, incoming: 0 },
  { sku: "SKU0225", product: "린넨숏팬츠", category: "팬츠", season: "여름", color: "화이트", size: "S", available: 22, safety: 8, sales90: 9, daily: 0.1, sell_through: 31.4, wos: 55.0, claim_rate: 1.4, status: "장기재고", lead: 18, moq: 30, incoming: 0 },
  { sku: "SKU0314", product: "플리츠스커트", category: "스커트", season: "사계절", color: "네이비", size: "M", available: 27, safety: 10, sales90: 28, daily: 0.31, sell_through: 49.3, wos: 21.8, claim_rate: 2.1, status: "과잉재고", lead: 16, moq: 30, incoming: 0 }
];

export default function ProductInventory() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('전체');
  const [categoryFilter, setCategoryFilter] = useState('전체');
  const [seasonFilter, setSeasonFilter] = useState('전체');

  // 안전재고 설정 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [serviceLevel, setServiceLevel] = useState('95');
  const [leadTimeFactor, setLeadTimeFactor] = useState('1.5');

  const filtered = PRODUCTS.filter(p => {
    const matchSearch = !search || (p.product + p.sku).toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === '전체' || p.status === statusFilter;
    const matchCategory = categoryFilter === '전체' || p.category === categoryFilter;
    const matchSeason = seasonFilter === '전체' || p.season === seasonFilter;
    return matchSearch && matchStatus && matchCategory && matchSeason;
  });

  const p = PRODUCTS[selectedIdx] || PRODUCTS[0];

  const getBadgeStyle = (status: string) => {
    if (status === '품절 임박') return 'bg-[#FCE8E6] text-[#A83232]';
    if (status === '장기재고') return 'bg-[#FEF3D6] text-[#8C6B1B]';
    return 'bg-[#E3EFFC] text-[#2D5A88]';
  };

  return (
    <div className="space-y-5 text-[#3F4145] relative">
      {/* 상단 제목 및 우측 버튼 영역 */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">상품별 제품 재고 관리</h2>
          <p className="text-xs text-[#8A8D96] mt-1">상품·SKU·옵션별 판매 속도, 안전재고, WOS, 클레임과 공급 조건을 확인합니다.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-white/80 border border-white/90 px-4 py-2.5 rounded-2xl text-xs font-semibold shadow-sm text-[#3F4145]">
            안전재고 서비스 수준 {serviceLevel}%
          </span>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-white/90 hover:bg-white border border-white/90 px-4 py-2.5 rounded-2xl text-xs font-bold shadow-sm text-[#3F4145] transition cursor-pointer"
          >
            안전재고 설정
          </button>
        </div>
      </div>

      {/* 필터 영역 */}
      <div className="bg-white/40 backdrop-blur-md border border-white/60 p-5 rounded-[28px] shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-[11px] font-medium text-[#8A8D96] mb-1.5">상품 검색</label>
            <input 
              type="text" 
              placeholder="상품명 또는 SKU" 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white/70 border border-white/80 rounded-2xl px-4 py-2.5 text-xs text-[#3F4145] placeholder-[#8A8D96] outline-none shadow-inner"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-[#8A8D96] mb-1.5">위험 상태</label>
            <select 
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full bg-white/70 border border-white/80 rounded-2xl px-4 py-2.5 text-xs text-[#3F4145] outline-none shadow-inner cursor-pointer"
            >
              <option>전체</option>
              <option>품절 임박</option>
              <option>과잉재고</option>
              <option>장기재고</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-[#8A8D96] mb-1.5">카테고리</label>
            <select 
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="w-full bg-white/70 border border-white/80 rounded-2xl px-4 py-2.5 text-xs text-[#3F4145] outline-none shadow-inner cursor-pointer"
            >
              <option>전체</option>
              <option>아우터</option>
              <option>팬츠</option>
              <option>스커트</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-[#8A8D96] mb-1.5">시즌</label>
            <select 
              value={seasonFilter}
              onChange={e => setSeasonFilter(e.target.value)}
              className="w-full bg-white/70 border border-white/80 rounded-2xl px-4 py-2.5 text-xs text-[#3F4145] outline-none shadow-inner cursor-pointer"
            >
              <option>전체</option>
              <option>간절기</option>
              <option>사계절</option>
              <option>여름</option>
              <option>겨울</option>
            </select>
          </div>
        </div>
      </div>

      {/* 상품·SKU 목록 */}
      <div className="bg-white/40 backdrop-blur-md border border-white/60 p-6 rounded-[28px] shadow-sm space-y-3">
        <div>
          <h3 className="text-base font-bold text-[#3F4145]">상품·SKU 목록</h3>
          <p className="text-[11px] text-[#8A8D96] mt-0.5">행을 선택하면 하단 상세 지표가 갱신됩니다.</p>
        </div>

        <div className="space-y-2 mt-3">
          {filtered.map((item) => {
            const realIndex = PRODUCTS.indexOf(item);
            const isSelected = realIndex === selectedIdx;
            return (
              <div
                key={item.sku}
                onClick={() => setSelectedIdx(realIndex)}
                className={`grid grid-cols-8 gap-4 items-center p-4 rounded-2xl cursor-pointer transition text-xs ${
                  isSelected ? 'bg-white/90 shadow-md border border-white' : 'bg-white/30 hover:bg-white/50 border border-transparent'
                }`}
              >
                <div className="col-span-2">
                  <div className="font-bold text-[#3F4145] text-sm">{item.product}</div>
                  <div className="text-[11px] text-[#8A8D96] mt-0.5">{item.sku} · {item.color} · {item.size}</div>
                </div>
                <div><span className="text-[10px] text-[#8A8D96] block mb-0.5">가용</span><strong className="text-sm font-semibold">{item.available}</strong> EA</div>
                <div><span className="text-[10px] text-[#8A8D96] block mb-0.5">안전</span><strong className="text-sm font-semibold">{item.safety}</strong> EA</div>
                <div><span className="text-[10px] text-[#8A8D96] block mb-0.5">WOS</span><strong className="text-sm font-semibold">{item.wos}</strong></div>
                <div><span className="text-[10px] text-[#8A8D96] block mb-0.5">판매율</span><strong className="text-sm font-semibold">{item.sell_through}%</strong></div>
                <div><span className="text-[10px] text-[#8A8D96] block mb-0.5">클레임</span><strong className="text-sm font-semibold">{item.claim_rate}%</strong></div>
                <div>
                  <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold ${getBadgeStyle(item.status)}`}>
                    {item.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 상세 지표 */}
      {p && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white/40 backdrop-blur-md border border-white/60 p-6 rounded-[28px] shadow-sm">
            <h3 className="text-base font-bold text-[#3F4145]">{p.product} 상세</h3>
            <p className="text-[11px] text-[#8A8D96] mt-0.5 mb-4">현재고·안전재고·판매속도</p>
            <div className="grid grid-cols-4 gap-3 text-center">
              <div className="bg-white/50 p-3.5 rounded-2xl border border-white/60">
                <span className="block text-[10px] text-[#8A8D96] mb-1">가용재고</span>
                <span className="text-lg font-bold text-[#3F4145]">{p.available}</span> <span className="text-xs text-[#8A8D96]">EA</span>
              </div>
              <div className="bg-white/50 p-3.5 rounded-2xl border border-white/60">
                <span className="block text-[10px] text-[#8A8D96] mb-1">안전재고</span>
                <span className="text-lg font-bold text-[#3F4145]">{p.safety}</span> <span className="text-xs text-[#8A8D96]">EA</span>
              </div>
              <div className="bg-white/50 p-3.5 rounded-2xl border border-white/60">
                <span className="block text-[10px] text-[#8A8D96] mb-1">WOS</span>
                <span className="text-lg font-bold text-[#3F4145]">{p.wos}</span> <span className="text-xs text-[#8A8D96]">주</span>
              </div>
              <div className="bg-white/50 p-3.5 rounded-2xl border border-white/60">
                <span className="block text-[10px] text-[#8A8D96] mb-1">판매율</span>
                <span className="text-lg font-bold text-[#3F4145]">{p.sell_through}</span> <span className="text-xs text-[#8A8D96]">%</span>
              </div>
            </div>
          </div>

          <div className="bg-white/40 backdrop-blur-md border border-white/60 p-6 rounded-[28px] shadow-sm">
            <h3 className="text-base font-bold text-[#3F4145]">공급 조건</h3>
            <p className="text-[11px] text-[#8A8D96] mt-0.5 mb-4">입고 예정량·MOQ·리드타임</p>
            <div className="grid grid-cols-4 gap-3 text-center">
              <div className="bg-white/50 p-3.5 rounded-2xl border border-white/60">
                <span className="block text-[10px] text-[#8A8D96] mb-1">입고 예정량</span>
                <span className="text-lg font-bold text-[#3F4145]">{p.incoming}</span> <span className="text-xs text-[#8A8D96]">EA</span>
              </div>
              <div className="bg-white/50 p-3.5 rounded-2xl border border-white/60">
                <span className="block text-[10px] text-[#8A8D96] mb-1">MOQ</span>
                <span className="text-lg font-bold text-[#3F4145]">{p.moq}</span> <span className="text-xs text-[#8A8D96]">EA</span>
              </div>
              <div className="bg-white/50 p-3.5 rounded-2xl border border-white/60">
                <span className="block text-[10px] text-[#8A8D96] mb-1">리드타임</span>
                <span className="text-lg font-bold text-[#3F4145]">{p.lead}</span> <span className="text-xs text-[#8A8D96]">일</span>
              </div>
              <div className="bg-white/50 p-3.5 rounded-2xl border border-white/60">
                <span className="block text-[10px] text-[#8A8D96] mb-1">클레임률</span>
                <span className="text-lg font-bold text-[#3F4145]">{p.claim_rate}</span> <span className="text-xs text-[#8A8D96]">%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 안전재고 설정 모달 팝업 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white/90 backdrop-blur-xl border border-white rounded-[32px] p-6 w-full max-w-md shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div>
              <h3 className="text-lg font-extrabold text-[#3F4145]">안전재고 산출 기준 설정</h3>
              <p className="text-xs text-[#8A8D96] mt-1">목표 서비스 수준 및 리드타임 안전 계수를 변경합니다.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#3F4145] mb-2">목표 서비스 수준 (Service Level)</label>
                <div className="grid grid-cols-3 gap-2">
                  {['90', '95', '99'].map(lvl => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setServiceLevel(lvl)}
                      className={`py-2 rounded-xl text-xs font-bold transition ${
                        serviceLevel === lvl 
                          ? 'bg-[#3F4145] text-white' 
                          : 'bg-white/70 border border-white/80 text-[#3F4145] hover:bg-white'
                      }`}
                    >
                      {lvl}%
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3F4145] mb-1">리드타임 변동 가중치</label>
                <input 
                  type="number" 
                  step="0.1" 
                  value={leadTimeFactor}
                  onChange={e => setLeadTimeFactor(e.target.value)}
                  className="w-full bg-white/80 border border-white rounded-2xl px-4 py-2.5 text-xs text-[#3F4145] outline-none shadow-inner"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-3 bg-white/60 hover:bg-white border border-white/80 rounded-2xl text-xs font-bold text-[#8A8D96] transition"
              >
                취소
              </button>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-3 bg-[#3F4145] hover:bg-[#2D2F33] rounded-2xl text-xs font-bold text-white shadow-md transition"
              >
                적용하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}