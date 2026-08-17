'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { DashboardView } from '@/types/dashboard';
import { getHubInventory, getProductInventory, type HubCardData, type ProductSkuRow } from '@/services/dashboardApi';
import type { OverviewFilters } from './FilterBar';

interface InventoryMetricProps {
  label: string;
  value: number | null;
  unit: 'EA' | 'SKU';
  tone?: 'neutral' | 'warning' | 'danger';
}

function InventoryMetric({ label, value, unit, tone = 'neutral' }: InventoryMetricProps) {
  const toneClass = tone === 'warning'
    ? 'bg-[#F3E4C9] text-[#704D1D]'
    : tone === 'danger' ? 'bg-[#EED7D7] text-[#7D3E3E]' : 'bg-[#E6E8EB] text-[#42464D]';
  return (
    <div className={`rounded-[18px] px-3 py-3 text-center ${toneClass}`}>
      <p className="mb-1 text-[10px] font-extrabold opacity-75">{label}</p>
      <p className={`text-lg font-black tabular-nums ${value == null ? 'animate-pulse text-[#9BA0A8]' : ''}`}>{value == null ? '—' : value.toLocaleString('ko-KR')}</p>
      <span className="text-[9px] font-extrabold opacity-65">{unit}</span>
    </div>
  );
}

export default function InventoryStatus({ onNavigate, allowedViews, filters }: { onNavigate: (view: DashboardView) => void; allowedViews: DashboardView[]; filters: OverviewFilters | null }) {
  const [hubs, setHubs] = useState<HubCardData[]>([]);
  const [products, setProducts] = useState<ProductSkuRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    Promise.all([
      getHubInventory(),
      getProductInventory({
        category_large: filters?.categoryLarge !== '전체' ? filters?.categoryLarge : undefined,
        category_middle: filters?.categoryMiddle !== '전체' ? filters?.categoryMiddle : undefined,
      }),
    ]).then(([hubData, productData]) => {
      if (!active) return;
      setHubs(filters?.hub && filters.hub !== '전체' ? hubData.hubs.filter((hub) => hub.hub_name === filters.hub) : hubData.hubs);
      setProducts(productData.products);
    }).catch(() => active && setError('재고 데이터를 불러오지 못했습니다.')).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [filters?.categoryLarge, filters?.categoryMiddle, filters?.hub]);

  const hubInventory = useMemo(() => {
    const available = hubs.reduce((sum, hub) => sum + hub.available, 0);
    const reserved = hubs.reduce((sum, hub) => sum + hub.reserved, 0);
    return [
      { label: '보유재고', value: available + reserved }, { label: '가용재고', value: available },
      { label: '예약재고', value: reserved }, { label: '이동 중', value: hubs.reduce((sum, hub) => sum + hub.in_transit, 0) },
    ];
  }, [hubs]);
  const productInventory = useMemo(() => [
    { label: '품절 임박 SKU', value: products.filter((item) => item.risk_status === '품절 임박').length, tone: 'warning' as const },
    { label: '과잉재고 SKU', value: products.filter((item) => item.risk_status === '과잉재고').length, tone: 'danger' as const },
    { label: '장기재고 SKU', value: products.filter((item) => item.risk_status === '장기재고').length, tone: 'danger' as const },
  ], [products]);

  return (
    <div className="flex h-full min-h-[420px] flex-col rounded-[32px] border border-white/70 bg-white/50 p-6 shadow-sm backdrop-blur-xl">
      <div>
        <h3 className="mb-0.5 text-base font-extrabold text-[#3F4145]">재고 상태</h3>
        <p className="mb-5 text-xs text-[#8A8D96]">2025년 12월 31일 스냅샷</p>
        {error && <p className="mb-3 text-xs font-bold text-rose-600">{error}</p>}
      </div>

      <section aria-labelledby="hub-inventory-summary">
        <div className="mb-2 flex items-center justify-between">
          <h4 id="hub-inventory-summary" className="text-[11px] font-extrabold text-[#5B5E65]">허브별 재고</h4>
          <span className="text-[9px] font-semibold text-[#9A9DA5]">전체 HUB 합산</span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
          {hubInventory.map((item) => <InventoryMetric key={item.label} {...item} value={loading ? null : item.value} unit="EA" />)}
        </div>
        {allowedViews.includes('hub') && (
          <button type="button" onClick={() => onNavigate('hub')} className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-2xl border border-[#D6D8DD] bg-[#E5E7EA] px-4 py-2 text-[11px] font-extrabold text-[#4C4F56] transition hover:bg-[#DCDEE2]">
            허브별 재고 자세히 보기 <span aria-hidden="true">→</span>
          </button>
        )}
      </section>

      <div className="my-5 h-px bg-[#D9DCE2]" />

      <section aria-labelledby="product-inventory-summary">
        <div className="mb-2 flex items-center justify-between">
          <h4 id="product-inventory-summary" className="text-[11px] font-extrabold text-[#5B5E65]">상품별 재고</h4>
          <span className="text-[9px] font-semibold text-[#9A9DA5]">상태별 SKU 수</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {productInventory.map((item) => <InventoryMetric key={item.label} label={item.label} value={loading ? null : item.value} unit="SKU" tone={item.tone} />)}
        </div>
        {allowedViews.includes('product') && (
          <button type="button" onClick={() => onNavigate('product')} className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-2xl border border-[#D6D8DD] bg-[#E5E7EA] px-4 py-2 text-[11px] font-extrabold text-[#4C4F56] transition hover:bg-[#DCDEE2]">
            상품별 재고 자세히 보기 <span aria-hidden="true">→</span>
          </button>
        )}
      </section>
    </div>
  );
}
