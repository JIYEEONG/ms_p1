// 현황 탭 목표 및 판매 실적 UI

'use client';

import React, { useState } from 'react';
import GoalModal, { type GoalSettings, type GoalUnit } from './GoalModal';
import type { DisplayCurrency } from './FilterBar';

interface LegacyKpiCardProps {
  title: string;
  value: string;
  desc: string;
  type?: string;
  borderColor?: string;
}

function LegacyKpiCard({ title, value, desc, type = 'neutral', borderColor = '#9ca3af' }: LegacyKpiCardProps) {
  const toneClassName = {
    danger: 'border-rose-200 bg-rose-50/80 text-rose-700',
    warning: 'border-amber-200 bg-amber-50/80 text-amber-700',
    info: 'border-sky-200 bg-sky-50/80 text-sky-700',
    success: 'border-emerald-200 bg-emerald-50/80 text-emerald-700',
    neutral: 'border-slate-200 bg-slate-50/80 text-slate-700',
  }[type] ?? 'border-slate-200 bg-slate-50/80 text-slate-700';

  return (
    <div className={`rounded-[20px] border p-4 shadow-[0_10px_20px_-10px_rgba(160,175,200,0.18)] ${toneClassName}`} style={{ borderLeftColor: borderColor, borderLeftWidth: 4 }}>
      <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#8A8D96]">{title}</p>
      <p className="mt-2 text-2xl font-black text-[#3F4145]">{value}</p>
      <p className="mt-1 text-sm text-[#65676E]">{desc}</p>
    </div>
  );
}

export interface OverviewKpiData {
  total_sales: number;
  achievement_base_sales: number;
  order_count: number;
  total_units: number;
  sales_change_rate: number | null;
  average_daily_orders: number;
  return_rate: number;
}

interface MoneyDisplayProps {
  currency: DisplayCurrency;
  exchangeRate: number;
}

function formatMoney(value: number, currency: DisplayCurrency, exchangeRate: number) {
  if (currency === 'USD') {
    return `$${(value / exchangeRate).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
  return `${Math.round(value).toLocaleString()}원`;
}

export function AchievementBanner({
  data,
  goalAmount,
  loading,
}: {
  data: OverviewKpiData | null;
  goalAmount: number;
  loading: boolean;
}) {
  const rate = goalAmount > 0 ? ((data?.achievement_base_sales ?? 0) / goalAmount) * 100 : 0;

  return (
    <div className="rounded-[28px] border border-white/90 bg-white/70 px-6 py-5 shadow-[0_20px_35px_-10px_rgba(160,175,200,0.18),inset_0_1px_2px_0_rgba(255,255,255,0.8)] backdrop-blur-md">
      <p className="text-lg font-black tracking-tight text-[#3F4145] sm:text-xl">
        {loading ? '목표 달성 현황을 불러오고 있어요' : `목표까지 ${rate.toFixed(1)}% 도달했어요 🐶`}
      </p>
    </div>
  );
}

export function KpiCards({
  data,
  loading,
  error,
  goalAmount,
  goalSettings,
  goalUnit,
  onGoalSettingsChange,
  currency,
  exchangeRate,
}: {
  data: OverviewKpiData | null;
  loading: boolean;
  error: string;
  goalAmount: number;
  goalSettings: GoalSettings;
  goalUnit: GoalUnit;
  onGoalSettingsChange: (goals: GoalSettings, unit: GoalUnit) => void;
  currency: DisplayCurrency;
  exchangeRate: number;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const currentSales = data?.total_sales ?? 0;
  const achievementRate = goalAmount > 0 ? (currentSales / goalAmount) * 100 : 0;
  const remainingAmount = Math.max(goalAmount - currentSales, 0);
  const exceededAmount = Math.max(currentSales - goalAmount, 0);
  const valuePlaceholder = loading || error ? '—' : null;
  const moneyDisplay: MoneyDisplayProps = { currency, exchangeRate };

  return (
    <>
      <div className="rounded-[28px] border border-white/90 bg-white/35 p-6 shadow-[0_20px_35px_-10px_rgba(160,175,200,0.16),inset_0_1px_2px_0_rgba(255,255,255,0.75)] backdrop-blur-md">
        <h3 className="mb-4 text-base font-extrabold tracking-tight text-[#3F4145]">목표와 달성</h3>

        <div className="space-y-5">
          <section className="rounded-[22px] border border-white/80 bg-white/45 p-5" aria-labelledby="sales-goal-title">
            <div className="mb-4">
              <h4 id="sales-goal-title" className="text-sm font-extrabold text-[#3F4145]">총 매출액 · 목표 매출액</h4>
            </div>

            {/* 1행: 목표 매출액(연한색) 위에 총 매출액(진한색)을 표시 */}
            <div className="relative mb-4 h-5 w-full overflow-hidden rounded-full bg-black/5" role="img" aria-label={`목표 대비 총 매출액 ${achievementRate.toFixed(1)}%`}>
              <div
                className="h-full rounded-full bg-[#4F7761] transition-all duration-500"
                style={{ width: `${Math.min(achievementRate, 100)}%` }}
              />
            </div>

            {/* 2행: 총 매출액 + 목표 매출액 */}
            <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-[16px] bg-white/60 px-4 py-3">
                <p className="mb-1 text-xs font-bold text-[#8A8D96]">총 매출액</p>
                <p className="text-2xl font-black text-[#3F4145]">{valuePlaceholder ?? formatMoney(currentSales, moneyDisplay.currency, moneyDisplay.exchangeRate)}</p>
              </div>
              <div className="rounded-[16px] bg-white/60 px-4 py-3">
                <div className="flex flex-col items-start justify-between gap-3 xl:flex-row">
                  <div className="min-w-0">
                    <div className="mb-1 flex items-center gap-2">
                      <p className="text-xs font-bold text-[#8A8D96]">목표 매출액</p>
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(true)}
                        className="cursor-pointer text-[10px] font-bold text-[#65676E] transition hover:text-[#3F4145]"
                      >
                        목표 수정 ✏️
                      </button>
                    </div>
                    <p className="text-2xl font-black text-[#3F4145]">{formatMoney(goalAmount, moneyDisplay.currency, moneyDisplay.exchangeRate)}</p>
                    <p className="mt-1 text-[10px] font-semibold text-[#8A8D96]">선택 기간 환산 목표</p>
                  </div>

                  <div className="flex shrink-0 items-start gap-3 self-end xl:self-auto" role="radiogroup" aria-label="목표 매출액 단위">
                    <span className="pt-0.5 text-[10px] font-extrabold text-[#65676E]">목표 단위</span>
                    <div className="flex flex-col gap-1.5">
                      {([
                        ['day', '일'],
                        ['week', '주'],
                        ['month', '월'],
                        ['year', '년'],
                      ] as const).map(([value, label]) => {
                        const selected = goalUnit === value;
                        return (
                          <button
                            key={value}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            onClick={() => onGoalSettingsChange(goalSettings, value)}
                            className={`flex cursor-pointer items-center justify-end gap-1.5 text-[10px] font-bold transition ${selected ? 'text-[#3F4145]' : 'text-[#8A8D96]'}`}
                          >
                            <span>{label}</span>
                            <span className="grid h-3.5 w-3.5 place-items-center rounded-full border border-[#8A8D96]" aria-hidden="true">
                              {selected && <span className="h-1.5 w-1.5 rounded-full bg-[#3F4145]" />}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3행: 목표까지 남은 금액 */}
            <p className="text-sm font-extrabold text-[#4F7761]">
              {valuePlaceholder ?? (
                remainingAmount > 0
                  ? `목표 달성까지 ${formatMoney(remainingAmount, moneyDisplay.currency, moneyDisplay.exchangeRate)} 남았어요.`
                  : `목표를 ${formatMoney(exceededAmount, moneyDisplay.currency, moneyDisplay.exchangeRate)} 초과 달성했어요.`
              )}
            </p>
          </section>

          <section className="rounded-[22px] border border-white/80 bg-white/45 p-5" aria-labelledby="sales-volume-title">
            <h4 id="sales-volume-title" className="mb-4 text-sm font-extrabold text-[#3F4145]">주문과 판매량</h4>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="glass-card flex flex-col justify-between">
                <div>
                  <p className="mb-1 text-xs font-bold text-[#8A8D96]">주문 건수 (Orders)</p>
                  <h3 className="mb-3 text-2xl font-black text-[#3F4145]">{valuePlaceholder ?? `${(data?.order_count ?? 0).toLocaleString()} 건`}</h3>
                </div>
                <span className="badge-info inline-block w-fit rounded-[10px] px-2.5 py-1 text-[11px] font-bold">
                  평균 일일 {(data?.average_daily_orders ?? 0).toLocaleString()}건
                </span>
              </div>

              <div className="glass-card flex flex-col justify-between">
                <div>
                  <p className="mb-1 text-xs font-bold text-[#8A8D96]">총 판매량 (Units)</p>
                  <h3 className="mb-3 text-2xl font-black text-[#3F4145]">{valuePlaceholder ?? `${(data?.total_units ?? 0).toLocaleString()} 개`}</h3>
                </div>
                <span className="badge-ok inline-block w-fit rounded-[10px] px-2.5 py-1 text-[11px] font-bold">
                  반품률 {(data?.return_rate ?? 0).toLocaleString()}%
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>

      {isModalOpen && (
        <GoalModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          currentGoals={goalSettings}
          currentUnit={goalUnit}
          onSave={onGoalSettingsChange}
        />
      )}
    </>
  );
}

export default function KpiCard(props: LegacyKpiCardProps) {
  return <LegacyKpiCard {...props} />;
}
