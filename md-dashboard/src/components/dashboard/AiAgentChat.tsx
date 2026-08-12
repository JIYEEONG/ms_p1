// 26.08/04 백엔드 구축 AI Agent 챗봇 UI Component
// 26.08.12 AI 챗봇 가이드 구축

// src/components/dashboard/AiAgentChat.tsx
import React, { useState } from 'react';

export const AiAgentChat = () => {
  const [showHelp, setShowHelp] = useState(false);
  const [inputQuery, setInputQuery] = useState('');

  // 12개 키워드 배열
  const keywords = [
    "리포트", "보고서", "액션플랜", "분석", "현황", "추이", 
    "실적", "재고", "매출", "지표", "작성", "수치"
  ];

  const handleKeywordClick = (word: string) => {
    setInputQuery((prev) => (prev ? `${prev} ${word}` : word));
  };

  return (
    // relative 필수: 팝업 위치의 기준점이 됩니다.
    <div className="relative bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      
      {/* 챗봇 타이틀 영역 + 우측 상단 도움말 버튼 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 font-bold text-gray-800 text-xs">
          <span>🤖</span> AI 리포트 생성기
        </div>
        
        {/* 우측 상단 가이드/도움말 버튼 */}
        <button
          type="button"
          onClick={() => setShowHelp(!showHelp)}
          className="w-5 h-5 flex items-center justify-center text-xs text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full transition-all"
          title="키워드 가이드"
        >
          ?
        </button>
      </div>

      {/* 우측 상단 가이드 팝업 (Modal / Tooltip) */}
      {showHelp && (
        <div className="absolute right-0 top-8 w-64 p-3 bg-white border border-gray-200 rounded-lg shadow-xl z-50 text-xs">
          <div className="flex justify-between items-center pb-1.5 mb-2 border-b font-bold text-gray-700">
            <span>💡 리포트 요청 키워드</span>
            <button 
              onClick={() => setShowHelp(false)} 
              className="text-gray-400 hover:text-gray-600 font-bold px-1"
            >
              ✕
            </button>
          </div>
          <p className="text-gray-500 mb-2 leading-tight text-[11px]">
            아래 키워드가 문장에 포함되면 리포트가 열립니다. (클릭 시 입력)
          </p>
          <div className="flex flex-wrap gap-1 mb-2">
            {keywords.map((kw, i) => (
              <span
                key={i}
                onClick={() => handleKeywordClick(kw)}
                className="px-1.5 py-0.5 bg-gray-100 hover:bg-blue-50 text-gray-700 hover:text-blue-600 rounded cursor-pointer transition-colors text-[11px]"
              >
                #{kw}
              </span>
            ))}
          </div>
          <div className="bg-blue-50 p-1.5 rounded text-[10px] text-blue-700 font-medium">
            예시: "26년 8월 매출 리포트 보여줘"
          </div>
        </div>
      )}

      {/* 안내 박스 및 입력 폼 */}
      <div className="p-3 bg-gray-50 rounded-lg text-center text-xs text-gray-400 mb-3 leading-relaxed">
        "리포트 작성해줘"를 입력하시면<br />화면 중앙에 차트 리포트가 열립니다.
      </div>

      <form onSubmit={(e) => { e.preventDefault(); }} className="flex gap-1.5">
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder="예: 리포트 작성해줘"
          className="flex-1 text-xs px-2.5 py-1.5 border border-gray-200 rounded-md focus:outline-none focus:border-slate-800"
        />
        <button
          type="submit"
          className="px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-md hover:bg-slate-800 transition-colors"
        >
          전송
        </button>
      </form>
    </div>
  );
};

export default AiAgentChat;