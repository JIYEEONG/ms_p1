// 26.08.07 AI 챗봇 서비스 구축에 따른 파일 추가

'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function AiReportChatWidget() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Next.js SSR 환경 대응 (클라이언트 렌더링 확인)
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        setReport(data.report);
        setIsModalOpen(true);
      }
    } catch (err) {
      console.error('Report Generation Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* 1. 사이드바 내부 영역: 입력 폼 전용 위젯 */}
      <div className="flex flex-col h-full p-3.5 bg-white/80 backdrop-blur-sm rounded-2xl border border-white shadow-[0_10px_20px_-5px_rgba(140,150,170,0.15)] text-xs justify-between">
        <div className="font-bold text-[#3F4145] mb-2 flex items-center justify-between border-b border-black/5 pb-2">
          <span className="flex items-center gap-1.5">🤖 AI 리포트 생성기</span>
        </div>

        <div className="flex-1 flex flex-col justify-center items-center py-4 bg-white/50 rounded-xl border border-gray-100 mb-2">
          {report ? (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg font-semibold hover:bg-blue-100 transition-colors text-[11px] flex items-center gap-1"
            >
              📄 생성된 리포트 크게 보기
            </button>
          ) : (
            <p className="text-[#8A8D96] text-[11px] text-center px-2 leading-relaxed">
              요청사항을 입력하면<br />화면 중앙에 리포트가 열립니다.
            </p>
          )}
        </div>

        {/* 입력 폼 */}
        <div className="flex gap-1.5">
          <input
            type="text"
            className="flex-1 border border-gray-200 rounded-xl px-2.5 py-1.5 text-[11px] focus:outline-none focus:border-slate-500 bg-white/90 text-[#3F4145]"
            placeholder="예: 이번 주 판매현황..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
          />
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="bg-[#3F4145] text-white px-3 py-1.5 rounded-xl hover:bg-slate-700 disabled:bg-gray-300 text-[11px] font-semibold shrink-0 transition-colors shadow-sm"
          >
            {loading ? '생성중...' : '전송'}
          </button>
        </div>
      </div>

      {/* 2. 대시보드 화면 중앙 전체 모달 (createPortal로 body 최상위에 배치) */}
      {mounted && isModalOpen && createPortal(
        <div 
          className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-md p-6"
          style={{ zIndex: 999999 }}
        >
          <div className="bg-white w-full max-w-5xl h-[82vh] rounded-[32px] shadow-2xl flex flex-col overflow-hidden border border-gray-100">
            {/* 모달 상단 헤더 */}
            <div className="px-8 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <span className="text-base font-extrabold text-[#3F4145]">📊 AI 판매현황 액션플랜 리포트</span>
                <span className="text-xs bg-green-100 text-green-700 font-bold px-2.5 py-0.5 rounded-full">
                  Team2
                </span>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* 모달 본문 (충분히 넓고 긴 리포트 에디터 공간) */}
            <div className="flex-1 p-6 overflow-y-auto bg-gray-50/30">
              <textarea
                className="w-full h-full p-5 text-xs md:text-sm border border-gray-200 rounded-2xl bg-white text-[#3F4145] leading-relaxed focus:outline-none focus:ring-2 focus:ring-slate-400 font-mono resize-none shadow-inner"
                value={report || ''}
                onChange={(e) => setReport(e.target.value)}
              />
            </div>

            {/* 모달 하단 푸터 */}
            <div className="px-8 py-4 border-t border-gray-100 bg-white flex justify-between items-center text-xs text-[#8A8D96]">
              <span>※ ATV/UPT는 order_id 데이터 부재로 order_item_id 단위 근사치입니다.</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors"
                >
                  닫기
                </button>
                <button
                  onClick={() => {
                    if (report) {
                      navigator.clipboard.writeText(report);
                      alert('리포트 내용이 클립보드에 복사되었습니다.');
                    }
                  }}
                  className="px-4 py-2 bg-[#3F4145] hover:bg-slate-700 text-white rounded-xl font-bold transition-colors shadow-sm"
                >
                  텍스트 복사
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}