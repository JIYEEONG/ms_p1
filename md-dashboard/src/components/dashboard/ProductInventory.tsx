// 26.08.05 UI 변경으로 인한 파일 추가 상품별 재고 관리 컴포넌트
// 안전재고 설정 모달 팝업 상태 및 변경 기능이 추가

'use client';

import React, { useState, useEffect } from 'react';
import {
  getProductInventory, getProductFilterOptions,
  ProductSkuRow, ProductFilterOptionsData,
} from '@/services/dashboardApi';

export default function ProductInventory() {
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('전체');
  const [categoryLargeFilter, setCategoryLargeFilter] = useState('');
  const [categoryMiddleFilter, setCategoryMiddleFilter] = useState('');
  const [skuFilter, setSkuFilter] = useState('');

  const [filterOptions, setFilterOptions] = useState<ProductFilterOptionsData | null>(null);
  const [products, setProducts] = useState<ProductSkuRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedSearch = sessionStorage.getItem('global_product_search');
    if (savedSearch) {
      setSearch(savedSearch);
      sessionStorage.removeItem('global_product_search');
    }
    const handleGlobalSearch = (event: Event) => setSearch((event as CustomEvent<string>).detail);
    window.addEventListener('global-product-search', handleGlobalSearch);
    return () => window.removeEventListener('global-product-search', handleGlobalSearch);
  }, []);

  // 안전재고 설정 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [serviceLevel, setServiceLevel] = useState('95');
  const [leadTimeFactor, setLeadTimeFactor] = useState('1.5');

  // 대/중분류 바뀔 때마다 필터 옵션(중분류·SKU 목록) 갱신
  useEffect(() => {
    getProductFilterOptions({
      category_large: categoryLargeFilter || undefined,
      category_middle: categoryMiddleFilter || undefined,
    })
      .then(setFilterOptions)
      .catch(() => setFilterOptions(null));
  }, [categoryLargeFilter, categoryMiddleFilter]);

  // 대분류 바뀌면 중분류·SKU 선택 초기화
  const handleCategoryLargeChange = (value: string) => {
    setCategoryLargeFilter(value);
    setCategoryMiddleFilter('');
    setSkuFilter('');
  };

  // 필터 또는 안전재고 산출 기준(서비스수준/가중치) 바뀔 때마다 상품 목록 재조회
  useEffect(() => {
    setLoading(true);
    getProductInventory({
      category_large: categoryLargeFilter || undefined,
      category_middle: categoryMiddleFilter || undefined,
      sku_id: skuFilter || undefined,
      risk_status: statusFilter !== '전체' ? statusFilter : undefined,
      service_level: Number(serviceLevel),
      leadtime_factor: Number(leadTimeFactor),
    })
      .then((data) => {
        setProducts(data.products);
        setSelectedIdx(-1);
      })
      .catch(() => setError('상품별 재고 데이터를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [categoryLargeFilter, categoryMiddleFilter, skuFilter, statusFilter, serviceLevel, leadTimeFactor]);

  const filtered = products.filter(p => {
    const term = search.toLowerCase();
    return !term || (p.product_name + p.sku_id).toLowerCase().includes(term);
  });

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
          <p className="text-xs text-[#8A8D96] mt-1">상품·SKU·옵션별 판매 속도, 안전재고, WOS와 클레임을 확인합니다.</p>
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
      {/* 필터 영역 */}
      <div className="bg-white/40 backdrop-blur-md border border-white/60 p-5 rounded-[28px] shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
              <option>정상</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-[#8A8D96] mb-1.5">대분류</label>
            <select 
              value={categoryLargeFilter}
              onChange={e => handleCategoryLargeChange(e.target.value)}
              className="w-full bg-white/70 border border-white/80 rounded-2xl px-4 py-2.5 text-xs text-[#3F4145] outline-none shadow-inner cursor-pointer"
            >
              <option value="">전체</option>
              {filterOptions?.category_large.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-[#8A8D96] mb-1.5">중분류</label>
            <select 
              value={categoryMiddleFilter}
              onChange={e => { setCategoryMiddleFilter(e.target.value); setSkuFilter(''); }}
              className="w-full bg-white/70 border border-white/80 rounded-2xl px-4 py-2.5 text-xs text-[#3F4145] outline-none shadow-inner cursor-pointer"
            >
              <option value="">전체</option>
              {filterOptions?.category_middle.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-[#8A8D96] mb-1.5">SKU</label>
            <select 
              value={skuFilter}
              onChange={e => setSkuFilter(e.target.value)}
              className="w-full bg-white/70 border border-white/80 rounded-2xl px-4 py-2.5 text-xs text-[#3F4145] outline-none shadow-inner cursor-pointer"
            >
              <option value="">전체</option>
              {filterOptions?.skus.map((s) => (
                <option key={s.sku_id} value={s.sku_id}>
                  {s.sku_id} · {s.color_name} · {s.size_code}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 상품·SKU 목록 */}
      <div className="bg-white/40 backdrop-blur-md border border-white/60 p-6 rounded-[28px] shadow-sm space-y-3">
        <div>
          <h3 className="text-base font-bold text-[#3F4145]">상품·SKU 목록</h3>
          <p className="text-[11px] text-[#8A8D96] mt-0.5">상품·SKU 행을 누르면 현재고·안전재고·판매속도가 바로 펼쳐집니다.</p>
        </div>

        <div className="space-y-2 mt-3">
          {loading && (
            <div className="text-center text-xs text-[#8A8D96] py-8">불러오는 중...</div>
          )}
          {!loading && error && (
            <div className="text-center text-xs text-red-500 py-8">{error}</div>
          )}
          {!loading && !error && filtered.map((item, idx) => {
            const isSelected = idx === selectedIdx;
            return (
              <div key={item.sku_id} className={`overflow-hidden rounded-2xl border transition ${isSelected ? 'bg-white/90 shadow-md border-white' : 'bg-white/30 hover:bg-white/50 border-transparent'}`}>
                <button type="button" onClick={() => setSelectedIdx(isSelected ? -1 : idx)} aria-expanded={isSelected} className="grid w-full grid-cols-[minmax(0,2fr)_repeat(5,minmax(62px,1fr))_100px_24px] gap-4 items-center p-4 text-left text-xs">
                  <div className="min-w-0">
                    <div className="truncate font-bold text-[#3F4145] text-sm">{item.product_name}</div>
                    <div className="truncate text-[11px] text-[#8A8D96] mt-0.5">{item.sku_id} · {item.color_name} · {item.size_code}</div>
                  </div>
                  <div><span className="text-[10px] text-[#8A8D96] block mb-0.5">가용</span><strong className="text-sm font-semibold">{item.available}</strong> EA</div>
                  <div><span className="text-[10px] text-[#8A8D96] block mb-0.5">안전</span><strong className="text-sm font-semibold">{item.safety_stock}</strong> EA</div>
                  <div><span className="text-[10px] text-[#8A8D96] block mb-0.5">WOS</span><strong className="text-sm font-semibold">{item.wos}</strong></div>
                  <div><span className="text-[10px] text-[#8A8D96] block mb-0.5">판매율</span><strong className="text-sm font-semibold">{item.sell_through}%</strong></div>
                  <div><span className="text-[10px] text-[#8A8D96] block mb-0.5">클레임</span><strong className="text-sm font-semibold">{item.claim_rate}%</strong></div>
                  <span className={`inline-block px-3 py-1 rounded-full text-center text-[11px] font-bold ${getBadgeStyle(item.risk_status)}`}>{item.risk_status}</span>
                  <span className={`text-base text-[#8A8D96] transition-transform ${isSelected ? 'rotate-180' : ''}`}>⌄</span>
                </button>
                {isSelected && (
                  <div className="border-t border-[#E9E9EC] px-4 pb-4 pt-3">
                    <div className="mb-3 flex items-center justify-between">
                      <div><strong className="text-xs text-[#3F4145]">{item.product_name} · {item.sku_id}</strong><p className="mt-0.5 text-[10px] text-[#8A8D96]">현재고·안전재고·판매속도 상세</p></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {[['현재 가용재고', item.available, 'EA'], ['안전재고', item.safety_stock, 'EA'], ['판매속도 (WOS)', item.wos, '주'], ['누적 판매율', item.sell_through, '%']].map(([label, value, unit]) => (
                        <div key={String(label)} className="rounded-2xl border border-white bg-white/60 p-3.5 text-center">
                          <span className="mb-1 block text-[10px] text-[#8A8D96]">{label}</span><strong className="text-lg text-[#3F4145]">{value}</strong> <span className="text-xs text-[#8A8D96]">{unit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

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
