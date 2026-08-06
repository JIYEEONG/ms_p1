// 26.08.05 UI 변경에 따른 파일 추가 목표 매출액 수정 모달

'use client';

import React, { useState } from 'react';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentGoal: number;
  onSave: (newGoal: number) => void;
}

export default function GoalModal({ isOpen, onClose, currentGoal, onSave }: GoalModalProps) {
  const [goalInput, setGoalInput] = useState(currentGoal.toString());

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/20 backdrop-blur-sm">
      <div className="glass p-6 rounded-[28px] w-full max-w-[400px] shadow-2xl">
        <h3 className="text-base font-extrabold text-[#3F4145] mb-2">목표 매출액 설정</h3>
        <p className="text-xs text-[#8A8D96] mb-4">대시보드의 달성률 계산 기준 목표 매출을 수정합니다.</p>
        
        <div className="mb-5">
          <label className="block text-[11px] font-bold text-[#65676E] mb-1.5">목표 금액 (원)</label>
          <input
            type="number"
            value={goalInput}
            onChange={(e) => setGoalInput(e.target.value)}
            className="w-full bg-white/70 border border-white/90 rounded-[14px] px-3.5 py-2.5 text-sm font-bold text-[#3F4145] outline-none"
            placeholder="예: 1200000000"
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-[12px] text-xs font-bold text-[#65676E] bg-white/40 hover:bg-white/60 transition"
          >
            취소
          </button>
          <button
            onClick={() => {
              onSave(Number(goalInput));
              onClose();
            }}
            className="px-4 py-2 rounded-[12px] text-xs font-bold text-white bg-[#3F4145] hover:bg-[#2A2B2E] shadow-md transition"
          >
            저장하기
          </button>
        </div>
      </div>
    </div>
  );
}