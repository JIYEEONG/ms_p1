'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getFilterOptions, getHubInventory, getProductFilterOptions } from '@/services/dashboardApi';
import { DashboardView } from '@/types/dashboard';

type SearchItem = { label: string; detail: string; view: DashboardView; query?: string };

export default function Header({ onViewChange, allowedViews }: { onViewChange: (view: DashboardView) => void; allowedViews: DashboardView[] }) {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<SearchItem[]>([]);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([getFilterOptions(), getHubInventory(), getProductFilterOptions({})]).then(([filters, hubs, productFilters]) => {
      const menus: SearchItem[] = [
        { label: '대시보드', detail: '전체 현황', view: 'overview' }, { label: 'HUB별 재고', detail: '허브 재고 및 이동', view: 'hub' },
        { label: '상품별 재고', detail: '상품·SKU 상세', view: 'product' }, { label: '예측', detail: '판매 예측 및 발주', view: 'forecast' },
      ];
      const products = filters.products.map((p) => ({ label: p.product_name, detail: `상품 · ${p.product_id}`, view: 'product' as DashboardView, query: p.product_name }));
      const skus = productFilters.skus.map((sku) => ({ label: sku.sku_id, detail: `SKU · ${sku.color_name} · ${sku.size_code}`, view: 'product' as DashboardView, query: sku.sku_id }));
      const categories = [...filters.category_large, ...filters.category_middle].map((name) => ({ label: name, detail: '카테고리', view: 'product' as DashboardView, query: name }));
      const hubItems = hubs.hubs.map((hub) => ({ label: hub.hub_name, detail: `HUB · ${hub.hub_id}`, view: 'hub' as DashboardView }));
      setItems([...menus, ...products, ...skus, ...categories, ...hubItems]);
    }).catch(() => setItems([]));
  }, []);

  useEffect(() => {
    const close = (event: MouseEvent) => { if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const results = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return keyword ? items.filter((item) => allowedViews.includes(item.view) && `${item.label} ${item.detail}`.toLowerCase().includes(keyword)).slice(0, 8) : [];
  }, [query, items, allowedViews]);

  const selectItem = (item: SearchItem) => {
    onViewChange(item.view);
    if (item.query) {
      sessionStorage.setItem('global_product_search', item.query);
      window.dispatchEvent(new CustomEvent('global-product-search', { detail: item.query }));
    }
    setQuery(''); setOpen(false);
  };

  return (
    <header className="header flex justify-between items-center mb-6 gap-4">
      <div ref={wrapperRef} className="relative w-full max-w-[420px]">
        <div className="search-bar flex items-center gap-2.5 px-4 py-2.5 rounded-[20px] bg-white/70 backdrop-blur-md border border-white/90 shadow-[0_10px_20px_-5px_rgba(160,175,200,0.2),inset_0_1px_2px_0_rgba(255,255,255,0.8)] focus-within:bg-white">
          <span className="text-sm text-[#8A8D96]">⌕</span>
          <input type="search" value={query} onFocus={() => setOpen(true)} onChange={(e) => { setQuery(e.target.value); setOpen(true); }} onKeyDown={(e) => { if (e.key === 'Enter' && results[0]) selectItem(results[0]); }} placeholder="통합 검색 (상품, SKU, HUB, 카테고리)..." className="bg-transparent border-none outline-none text-xs w-full text-[#3F4145] placeholder-[#8A8D96] font-medium" />
          {query && <button type="button" onClick={() => setQuery('')} className="text-xs font-bold text-[#8A8D96]">×</button>}
        </div>
        {open && query.trim() && <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl border border-white bg-white/95 p-2 shadow-xl backdrop-blur-xl">
          {results.length ? results.map((item, index) => <button type="button" key={`${item.view}-${item.label}-${index}`} onClick={() => selectItem(item)} className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left hover:bg-[#F1F3F6]"><span className="text-xs font-bold text-[#3F4145]">{item.label}</span><span className="text-[10px] font-semibold text-[#8A8D96]">{item.detail}</span></button>) : <div className="px-3 py-5 text-center text-xs text-[#8A8D96]">검색 결과가 없습니다.</div>}
        </div>}
      </div>
      <div className="user-profile flex items-center gap-3"><div className="text-right hidden sm:block"><p className="text-xs font-bold text-[#3F4145] m-0">ZERO</p><p className="text-[10px] text-[#8A8D96] m-0 mt-0.5">AI 재고관리 ERP</p></div><div className="avatar w-10 h-10 rounded-full bg-white/80 border border-white/90 grid place-items-center text-xs font-extrabold text-[#3F4145] shadow-sm">ZERO</div></div>
    </header>
  );
}
