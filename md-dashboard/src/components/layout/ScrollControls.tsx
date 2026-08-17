'use client';

import React, { useEffect, useState } from 'react';

export default function ScrollControls() {
  const [canGoUp, setCanGoUp] = useState(false);
  const [canGoDown, setCanGoDown] = useState(false);

  useEffect(() => {
    const getStops = () => {
      const main = document.querySelector('main');
      const page = main?.lastElementChild as HTMLElement | null;
      if (!page || page.tagName === 'HEADER') return [0];
      const positions = Array.from(page.children)
        .filter((element): element is HTMLElement => element instanceof HTMLElement && element.offsetHeight > 24)
        .map((element) => Math.max(0, element.getBoundingClientRect().top + window.scrollY - 24));
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      return [...new Set([0, ...positions, maxScroll])].sort((a, b) => a - b);
    };
    const update = () => {
      const stops = getStops();
      setCanGoUp(stops.some((position) => position < window.scrollY - 12));
      setCanGoDown(stops.some((position) => position > window.scrollY + 12));
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    const observer = new ResizeObserver(update);
    observer.observe(document.body);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      observer.disconnect();
    };
  }, []);

  const moveTo = (top: number) => window.scrollTo({ top, behavior: 'smooth' });
  const moveSection = (direction: 'up' | 'down') => {
    const main = document.querySelector('main');
    const page = main?.lastElementChild as HTMLElement | null;
    if (!page || page.tagName === 'HEADER') return;
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const stops = [...new Set([0, ...Array.from(page.children)
      .filter((element): element is HTMLElement => element instanceof HTMLElement && element.offsetHeight > 24)
      .map((element) => Math.max(0, element.getBoundingClientRect().top + window.scrollY - 24)), maxScroll])].sort((a, b) => a - b);
    const target = direction === 'up'
      ? [...stops].reverse().find((position) => position < window.scrollY - 12)
      : stops.find((position) => position > window.scrollY + 12);
    if (target != null) moveTo(target);
  };

  return (
    <nav aria-label="페이지 섹션 이동" className="fixed bottom-4 right-2 z-40 flex flex-col gap-1.5 sm:bottom-5 sm:right-3">
      <button
        type="button"
        onClick={() => moveSection('up')}
        disabled={!canGoUp}
        aria-label="이전 섹션으로 이동"
        title="이전 섹션"
        className="material-glass-control group flex h-9 w-9 items-center justify-center rounded-xl border border-white/90 bg-white/85 text-base font-black text-[#3F4145] shadow-[0_8px_18px_-7px_rgba(50,55,65,0.35)] backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white disabled:pointer-events-none disabled:opacity-30"
      >
        <span aria-hidden="true">↑</span>
        <span className="pointer-events-none absolute right-10 whitespace-nowrap rounded-lg bg-[#3F4145] px-2 py-1 text-[9px] font-bold text-white opacity-0 transition group-hover:opacity-100">이전 섹션</span>
      </button>
      <button
        type="button"
        onClick={() => moveSection('down')}
        disabled={!canGoDown}
        aria-label="다음 섹션으로 이동"
        title="다음 섹션"
        className="material-glass-control group flex h-9 w-9 items-center justify-center rounded-xl border border-white/90 bg-[#3F4145]/90 text-base font-black text-white shadow-[0_8px_18px_-7px_rgba(50,55,65,0.45)] backdrop-blur-md transition hover:translate-y-0.5 hover:bg-[#292B2F] disabled:pointer-events-none disabled:opacity-30"
      >
        <span aria-hidden="true">↓</span>
        <span className="pointer-events-none absolute right-10 whitespace-nowrap rounded-lg bg-[#3F4145] px-2 py-1 text-[9px] font-bold text-white opacity-0 transition group-hover:opacity-100">다음 섹션</span>
      </button>
    </nav>
  );
}
