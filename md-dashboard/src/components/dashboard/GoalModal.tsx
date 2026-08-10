'use client';

import React, { useState } from 'react';
const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

export type GoalUnit = 'day' | 'week' | 'month' | 'year';

export interface GoalSettings {
  day: number;
  week: number;
  month: number;
  year: number;
}

const goalUnits: Array<{ value: GoalUnit; label: string }> = [
  { value: 'day', label: '일 목표' },
  { value: 'week', label: '주 목표' },
  { value: 'month', label: '월 목표' },
  { value: 'year', label: '년 목표' },
];

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentGoals: GoalSettings;
  currentUnit: GoalUnit;
  onSave: (goals: GoalSettings, unit: GoalUnit) => void;
}

export default function GoalModal({ isOpen, onClose, currentGoals, currentUnit, onSave }: GoalModalProps) {
  const [goals, setGoals] = useState<GoalSettings>({ ...currentGoals });
  const [selectedUnit, setSelectedUnit] = useState<GoalUnit>(currentUnit);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/20 backdrop-blur-sm">
      <div className="glass w-full max-w-[480px] rounded-[28px] p-6 shadow-2xl">
        <h3 className="mb-2 text-base font-extrabold text-[#3F4145]">목표 매출액 설정</h3>
        <p className="mb-4 text-xs text-[#8A8D96]">단위별 목표액을 입력하고 달성률 계산에 사용할 기준을 선택합니다.</p>

        <div className="mb-5 space-y-2" role="radiogroup" aria-label="목표 매출액 기준 단위">
          {goalUnits.map(({ value, label }) => {
            const selected = selectedUnit === value;
            return (
              <div key={value} className="grid grid-cols-[auto_1fr] items-center gap-3 rounded-[14px] bg-white/50 px-3.5 py-3">
                <button
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setSelectedUnit(value)}
                  className={`flex cursor-pointer items-center gap-2 text-xs font-bold ${selected ? 'text-[#3F4145]' : 'text-[#8A8D96]'}`}
                >
                  <span className="grid h-3.5 w-3.5 place-items-center rounded-full border border-[#8A8D96]" aria-hidden="true">
                    {selected && <span className="h-1.5 w-1.5 rounded-full bg-[#3F4145]" />}
                  </span>
                  {label}
                </button>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={goals[value]}
                    onFocus={() => setSelectedUnit(value)}
                    onChange={(event) => setGoals((current) => ({ ...current, [value]: Math.max(0, Number(event.target.value)) }))}
                    className="w-full rounded-[12px] border border-white/90 bg-white/70 px-3 py-2 text-right text-sm font-bold text-[#3F4145] outline-none"
                  />
                  <span className="text-xs font-bold text-[#65676E]">원</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-[12px] bg-white/40 px-4 py-2 text-xs font-bold text-[#65676E] transition hover:bg-white/60">
            취소
          </button>
          <button
            type="button"
            onClick={async () => {
              try {
                const res = await fetch(`${apiBaseUrl}/api/v1/dashboard/goal-settings`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    day_amount: goals.day,
                    week_amount: goals.week,
                    month_amount: goals.month,
                    year_amount: goals.year,
                  }),
                });
                if (!res.ok) throw new Error('목표 설정 저장에 실패했습니다.');
              } catch (err) {
                console.error('Goal settings save error:', err);
                alert('목표 설정을 저장하지 못했습니다. 다시 시도해주세요.');
                return;
              }
              onSave(goals, selectedUnit);
              onClose();
            }}
            className="rounded-[12px] bg-[#3F4145] px-4 py-2 text-xs font-bold text-white shadow-md transition hover:bg-[#2A2B2E]"
          >
            저장하기
          </button>
        </div>
      </div>
    </div>
  );
}
