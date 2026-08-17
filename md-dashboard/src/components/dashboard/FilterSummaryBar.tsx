'use client';

import { useEffect, useState, type ReactNode } from 'react';

export interface FilterSummaryItem {
  label: string;
  value: string;
}

export default function FilterSummaryBar({
  items,
  targetId,
  editor,
}: {
  items: FilterSummaryItem[];
  targetId: string;
  editor?: ReactNode;
}) {
  const [visible, setVisible] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const movedAboveViewport = entry.boundingClientRect.top < 8;
        const filterIsFullyVisible = entry.isIntersecting && entry.intersectionRatio >= 0.98;
        const nextVisible = movedAboveViewport && !filterIsFullyVisible;
        setVisible(nextVisible);
        if (!nextVisible) setEditing(false);
      },
      { threshold: [0, 0.98, 1] },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [targetId]);

  if (!visible) return null;

  return (
    <div className="material-glass-floating sticky top-6 z-40 w-full self-start rounded-2xl border border-white/90 px-3 py-2" aria-label="현재 필터 요약">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <button type="button" onClick={() => setEditing((value) => !value)} className="shrink-0 text-[10px] font-black text-[#3F4145]">필터 요약</button>
        {items.map((item) => (
          <button key={item.label} type="button" onClick={() => setEditing(true)} className="flex shrink-0 items-center gap-1 rounded-full bg-[#E6E8EB] px-2.5 py-1 text-[9px] font-bold text-[#656970]" title={`${item.label} 필터 수정`}>
            <span className="text-[#8A8D96]">{item.label}</span>
            <strong className="whitespace-nowrap text-[#3F4145]">{item.value || '전체'}</strong>
          </button>
        ))}
        <button type="button" onClick={() => setEditing((value) => !value)} className="material-glass-control ml-auto shrink-0 rounded-xl bg-[#4F5258] px-3 py-1.5 text-[9px] font-extrabold text-white">{editing ? '닫기' : '수정'}</button>
      </div>
      {editing && editor && <div className="mt-2 border-t border-black/5 pt-2">{editor}</div>}
    </div>
  );
}
