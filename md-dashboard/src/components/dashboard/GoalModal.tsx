'use client';

import React, { useState } from 'react';
const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || '/backend';

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

function formatCompactWon(value: number) {
  const amount = Math.max(0, Number(value) || 0);
  if (amount >= 100000000) {
    const compact = (amount / 100000000).toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
    return `${compact}억원`;
  }
  if (amount >= 10000) {
    const compact = (amount / 10000).toFixed(1).replace(/\.0$/, '');
    return `${compact}만원`;
  }
  return `${Math.round(amount).toLocaleString('ko-KR')}원`;
}

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentGoals: GoalSettings;
  currentUnit: GoalUnit;
  currentPeriodSales: number;
  periodDays: number;
  onSave: (goals: GoalSettings, unit: GoalUnit) => void;
}

export default function GoalModal({ isOpen, onClose, currentGoals, currentUnit, currentPeriodSales, periodDays, onSave }: GoalModalProps) {
  const [goals, setGoals] = useState<GoalSettings>({ ...currentGoals });
  const [selectedUnit, setSelectedUnit] = useState<GoalUnit>(currentUnit);
  const [upliftRate, setUpliftRate] = useState(10);

  const unitDays: Record<GoalUnit, number> = { day: 1, week: 7, month: 365 / 12, year: 365 };
  const currentUnitSales = periodDays > 0
    ? (currentPeriodSales / periodDays) * unitDays[selectedUnit]
    : 0;
  const recommendedGoal = Math.ceil(currentUnitSales * (1 + Math.max(upliftRate, 0) / 100));
  const minimumGoal = Math.floor(currentUnitSales) + 1;
  const selectedLabel = goalUnits.find((item) => item.value === selectedUnit)?.label ?? '목표';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/20 backdrop-blur-sm">
      <div className="glass max-h-[90vh] w-full max-w-[520px] overflow-y-auto rounded-[28px] p-6 shadow-2xl">
        <h3 className="mb-2 text-base font-extrabold text-[#3F4145]">목표 매출액 설정</h3>
        <p className="mb-4 text-xs text-[#8A8D96]">단위별 목표액을 입력하고 달성률 계산에 사용할 기준을 선택합니다.</p>

        <section className="mb-4 rounded-[18px] bg-[#E8F3ED] p-4" aria-labelledby="goal-recommendation-title">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 id="goal-recommendation-title" className="text-xs font-extrabold text-[#3F4145]">현재 실적 기준 목표 추천</h4>
              <p className="mt-1 text-[10px] font-semibold text-[#668274]">현재 시점까지 달성한 실적보다 높은 {selectedLabel}를 계산합니다.</p>
            </div>
            <label className="flex items-center gap-2 text-xs font-bold text-[#4F7761]">
              인상률
              <input type="number" min="0" max="999" step="1" value={upliftRate} onChange={(event) => setUpliftRate(Math.max(0, Number(event.target.value)))} className="w-20 rounded-xl bg-white/80 px-3 py-2 text-right font-black outline-none" />%
            </label>
          </div>
          <div className="mt-3 flex items-center gap-2" aria-label="목표 인상률 빠른 선택">
            <span className="text-[9px] font-bold text-[#668274]">빠른 선택</span>
            {[5, 10, 20].map((rate) => <button key={rate} type="button" onClick={() => setUpliftRate(rate)} className={`rounded-full px-2.5 py-1 text-[9px] font-extrabold ${upliftRate === rate ? 'bg-[#4F7761] text-white' : 'bg-white/70 text-[#668274]'}`}>{rate === 5 ? '보수적' : rate === 10 ? '기준' : '공격적'} {rate}%</button>)}
          </div>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-3 border-t border-[#BDD8C9] pt-3">
              <div>
                <p className="text-[10px] font-semibold text-[#668274]">현재 시점 환산 실적 {formatCompactWon(currentUnitSales)}</p>
                <p className="mt-1 text-xl font-black text-[#35664C]">추천 {formatCompactWon(recommendedGoal)}</p>
                <p className="mt-0.5 text-[10px] font-semibold tabular-nums text-[#668274]">{recommendedGoal.toLocaleString('ko-KR')}원</p>
                <p className="mt-1 text-[10px] font-semibold text-[#668274]">{formatCompactWon(currentUnitSales)} × {(1 + upliftRate / 100).toFixed(2)}</p>
                <p className="mt-1 text-[10px] font-semibold text-[#668274]">현재 {selectedLabel}보다 {recommendedGoal >= goals[selectedUnit] ? '+' : '−'}{Math.abs(recommendedGoal - goals[selectedUnit]).toLocaleString('ko-KR')}원 · 필요 일평균 {Math.round(recommendedGoal / unitDays[selectedUnit]).toLocaleString('ko-KR')}원</p>
              </div>
              <button type="button" onClick={() => setGoals((current) => ({ ...current, [selectedUnit]: recommendedGoal }))} className="rounded-xl bg-[#4F7761] px-3 py-2 text-[10px] font-extrabold text-white">추천값 적용</button>
          </div>
        </section>

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
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={value === selectedUnit ? minimumGoal : 0}
                      value={goals[value]}
                      onFocus={() => setSelectedUnit(value)}
                      onChange={(event) => setGoals((current) => ({ ...current, [value]: Math.max(0, Number(event.target.value)) }))}
                      className="w-full rounded-[12px] border border-white/90 bg-white/70 px-3 py-2 text-right text-sm font-bold text-[#3F4145] outline-none"
                    />
                    <span className="text-xs font-bold text-[#65676E]">원</span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center justify-end gap-x-2 gap-y-0.5 text-right">
                    <strong className="text-[11px] font-black text-[#D93B00]">{formatCompactWon(goals[value])}</strong>
                    <span className="text-[9px] font-semibold tabular-nums text-[#8A8D96]">{Math.round(goals[value]).toLocaleString('ko-KR')}원</span>
                  </div>
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
              if (goals[selectedUnit] < minimumGoal) {
                alert(`현재 시점까지 이미 달성한 실적보다 높은 목표를 입력해주세요. 최소 ${minimumGoal.toLocaleString('ko-KR')}원 이상이어야 합니다.`);
                return;
              }
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
