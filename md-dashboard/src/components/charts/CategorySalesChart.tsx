'use client';

import React, { useEffect, useMemo, useState } from 'react';

export interface CategoryDataItem {
  name: string; value: number; percentage: number; units_sold: number;
  total_cost: number; net_profit: number; profit_margin: number;
  cost_per_unit: number; profit_per_unit: number; cost_breakdown: Record<string, number>;
}

const exactWon = (value: number) => `${Math.round(value).toLocaleString('ko-KR')}원`;
function compactWon(value: number) {
  if (Math.abs(value) >= 100000000) return `${(value / 100000000).toFixed(2)}억원`;
  if (Math.abs(value) >= 10000) return `${(value / 10000).toFixed(1)}만원`;
  return exactWon(value);
}
function Amount({ value, tone = '' }: { value: number; tone?: string }) {
  return <span className={tone}><span className="block">{compactWon(value)}</span><span className="mt-0.5 block whitespace-nowrap text-[9px] font-semibold opacity-65">{exactWon(value)}</span></span>;
}

export default function CategorySalesChart({ data, loading = false, level, onLevelChange, onNavigateToProduct }: { data?: CategoryDataItem[]; loading?: boolean; level: 'large' | 'middle' | 'small'; onLevelChange: (level: 'large' | 'middle' | 'small') => void; onNavigateToProduct?: () => void }) {
  const [sortBy, setSortBy] = useState<'sales' | 'profit'>('sales');
  const [openCost, setOpenCost] = useState<string | null>(null);
  useEffect(() => {
    if (!openCost) return;
    const closeOnOutside = (event: MouseEvent) => {
      if (!(event.target as HTMLElement).closest('[data-cost-control]')) setOpenCost(null);
    };
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpenCost(null); };
    document.addEventListener('mousedown', closeOnOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => { document.removeEventListener('mousedown', closeOnOutside); document.removeEventListener('keydown', closeOnEscape); };
  }, [openCost]);
  const top5 = useMemo(() => [...(data ?? [])]
    .sort((a, b) => sortBy === 'sales' ? b.value - a.value : b.net_profit - a.net_profit)
    .slice(0, 5), [data, sortBy]);

  return (
    <div className="radius-frame-32-p24 relative z-0 h-full min-h-[420px] rounded-[32px] border border-white/70 bg-white/50 p-6 shadow-sm backdrop-blur-xl">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-extrabold text-[#3F4145]">카테고리별 매출 Top 5</h3>
          <p className="mt-1 text-xs text-[#8A8D96]">매출과 가상 비용을 반영한 수익성 비교</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div><p className="mb-1 text-[9px] font-bold text-[#8A8D96]">분류 기준</p><div className="flex rounded-xl bg-black/5 p-1" aria-label="카테고리 분류 단계">
            {([['large', '대분류'], ['middle', '중분류'], ['small', '소분류']] as const).map(([value, label]) => (
              <button key={value} type="button" aria-pressed={level === value} onClick={() => onLevelChange(value)} className={`rounded-lg px-3 py-1.5 text-[10px] font-extrabold transition ${level === value ? 'bg-[#4F5258] text-white shadow-sm' : 'text-[#777B84]'}`}>{label}</button>
            ))}
          </div></div>
          <div><p className="mb-1 text-[9px] font-bold text-[#8A8D96]">정렬 기준</p><div className="flex rounded-xl bg-black/5 p-1" aria-label="카테고리 순위 기준">
            {([['sales', '매출 순'], ['profit', '순이익 순']] as const).map(([value, label]) => (
              <button key={value} type="button" aria-pressed={sortBy === value} onClick={() => setSortBy(value)} className={`rounded-lg px-3 py-1.5 text-[10px] font-extrabold transition ${sortBy === value ? 'bg-white text-[#3F4145] shadow-sm' : 'text-[#8A8D96]'}`}>{label}</button>
            ))}
          </div></div>
        </div>
      </div>
      {loading ? <div className="space-y-3" aria-label="카테고리 매출 집계 중">{Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-12 animate-pulse rounded-xl bg-black/5" />)}</div> : top5.length ? (
        <div className="overflow-x-auto overflow-y-visible pt-2">
          <table className="material-data-surface w-full min-w-[900px] table-fixed text-xs tabular-nums">
            <colgroup><col className="w-[28%]" />{Array.from({ length: 5 }).map((_, i) => <col key={i} className="w-[14.4%]" />)}</colgroup>
            <thead><tr className="border-b border-black/10 text-[#8A8D96]">
              <th className="px-4 py-3 text-left font-semibold">순위 / 카테고리</th>
              <th className="px-4 py-3 text-left font-semibold">순이익</th><th className="px-4 py-3 text-left font-semibold">매출</th>
              <th className="px-4 py-3 text-left font-semibold">총비용</th><th className="border-l border-black/10 px-4 py-3 text-left font-semibold">개당 순이익</th>
              <th className="px-4 py-3 text-left font-semibold">개당 비용</th>
            </tr></thead>
            <tbody>{top5.map((item, index) => {
              const lowMargin = item.profit_margin < 15;
              return <tr key={item.name} className="border-b border-black/5 last:border-0">
                <td className="px-4 py-3"><div className="flex items-center gap-3"><span className="w-5 font-extrabold text-[#8A8D96]">{index + 1}</span><div className="min-w-[130px]">
                  <div className="mb-1.5 flex items-center gap-2 font-bold text-[#3F4145]"><button type="button" onClick={onNavigateToProduct} className="whitespace-nowrap text-left underline-offset-4 transition hover:text-[#247F6B] hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#21F4BD]" title="상품별 재고에서 보기">{item.name}</button>{lowMargin && <span className="whitespace-nowrap rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] text-amber-700">낮은 수익성</span>}</div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-black/5"><div className="h-full rounded-full bg-[#414348]" style={{ width: `${Math.min(item.percentage, 100)}%` }} /></div>
                </div></div></td>
                <td className="px-4 py-3 text-left font-extrabold text-emerald-600"><Amount value={item.net_profit} /><span className="block text-[10px] font-semibold">({item.profit_margin}%)</span></td>
                <td className="px-4 py-3 text-left font-bold text-[#3F4145]"><Amount value={item.value} /></td>
                <td data-cost-control className="relative px-4 py-3 text-left"><button type="button" onClick={() => setOpenCost(openCost === item.name ? null : item.name)} className="text-left font-bold text-amber-700 underline decoration-dotted underline-offset-4" aria-expanded={openCost === item.name}><Amount value={item.total_cost} /></button>
                  {openCost === item.name && <div className="absolute left-4 top-10 z-20 w-64 rounded-2xl border border-white bg-white p-4 text-left shadow-xl"><div className="mb-2 flex items-center justify-between"><p className="font-extrabold text-[#3F4145]">비용 상세</p><button type="button" onClick={() => setOpenCost(null)} aria-label="비용 상세 닫기" className="grid h-6 w-6 place-items-center rounded-lg bg-[#ECEEF1] text-xs font-bold text-[#656970]">×</button></div>{Object.entries(item.cost_breakdown).map(([key, value]) => <div key={key} className="flex justify-between gap-3 py-1 text-[10px] text-[#65676E]"><span>{key}</span><span className="text-right font-bold"><span className="block">{compactWon(value)}</span><span className="block text-[8px] opacity-60">{exactWon(value)}</span></span></div>)}<div className="mt-2 flex justify-between border-t pt-2 font-extrabold"><span>총비용</span><span className="text-right"><span className="block">{compactWon(item.total_cost)}</span><span className="block text-[8px] opacity-60">{exactWon(item.total_cost)}</span></span></div></div>}
                </td>
                <td className="border-l border-black/10 px-4 py-3 text-left font-bold text-emerald-600"><Amount value={item.profit_per_unit} /></td>
                <td className="px-4 py-3 text-left text-[#61646B]"><Amount value={item.cost_per_unit} /></td>
              </tr>;
            })}</tbody>
          </table>
          <p className="mt-4 text-[11px] text-[#8A8D96]">총비용을 누르면 원가·인건비·물류비·마케팅비·관리비 등 전체 비용 내역을 확인할 수 있습니다.</p>
        </div>
      ) : <div className="flex h-[260px] items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white/30 text-sm font-medium text-[#8A8D96]">선택한 조건의 카테고리 데이터가 없습니다.</div>}
    </div>
  );
}
