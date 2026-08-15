'use client';

import React, { useEffect, useState } from 'react';

export default function ScrollControls() {
  const [canGoUp, setCanGoUp] = useState(false);
  const [canGoDown, setCanGoDown] = useState(false);

  useEffect(() => {
    const update = () => {
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      setCanGoUp(window.scrollY > 80);
      setCanGoDown(window.scrollY < maxScroll - 80);
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

  return (
    <nav aria-label="페이지 빠른 이동" className="fixed bottom-5 right-5 z-40 flex flex-col gap-2 sm:bottom-7 sm:right-7">
      <button
        type="button"
        onClick={() => moveTo(0)}
        disabled={!canGoUp}
        aria-label="페이지 맨 위로 이동"
        title="맨 위로"
        className="group flex h-11 w-11 items-center justify-center rounded-2xl border border-white/90 bg-white/85 text-lg font-black text-[#3F4145] shadow-[0_10px_25px_-8px_rgba(50,55,65,0.35)] backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white disabled:pointer-events-none disabled:opacity-30"
      >
        <span aria-hidden="true">↑</span>
        <span className="pointer-events-none absolute right-12 whitespace-nowrap rounded-lg bg-[#3F4145] px-2 py-1 text-[9px] font-bold text-white opacity-0 transition group-hover:opacity-100">맨 위로</span>
      </button>
      <button
        type="button"
        onClick={() => moveTo(document.documentElement.scrollHeight)}
        disabled={!canGoDown}
        aria-label="페이지 맨 아래로 이동"
        title="맨 아래로"
        className="group flex h-11 w-11 items-center justify-center rounded-2xl border border-white/90 bg-[#3F4145]/90 text-lg font-black text-white shadow-[0_10px_25px_-8px_rgba(50,55,65,0.45)] backdrop-blur-md transition hover:translate-y-0.5 hover:bg-[#292B2F] disabled:pointer-events-none disabled:opacity-30"
      >
        <span aria-hidden="true">↓</span>
        <span className="pointer-events-none absolute right-12 whitespace-nowrap rounded-lg bg-[#3F4145] px-2 py-1 text-[9px] font-bold text-white opacity-0 transition group-hover:opacity-100">맨 아래로</span>
      </button>
    </nav>
  );
}
