// 수치 카드 UI
// 26.08.04 수정 (민)
// 26.08.05 UI 변경에 따른 코드 변경

'use client';

import React, { useState } from 'react';
import GoalModal from './GoalModal';

export default function KpiCards() {
  const [goalAmount, setGoalAmount] = useState(1200000000);
  const currentSales = 984500000;
  const achievementRate = ((currentSales / goalAmount) * 100).toFixed(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="kpi-grid-container">
        {/* 카드 1 */}
        <div className="glass-card flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold text-[#8A8D96] mb-1">총 매출액 (Gross Sales)</p>
            <h3 className="text-2xl font-black text-[#3F4145] mb-3">
              ₩{currentSales.toLocaleString()}
            </h3>
          </div>
          <div>
            <span className="inline-block badge-ok px-2.5 py-1 rounded-[10px] text-[11px] font-bold">
              ▲ 전년 대비 +14.2%
            </span>
          </div>
        </div>

        {/* 카드 2 */}
        <div className="glass-card flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-1">
              <p className="text-xs font-bold text-[#8A8D96]">목표 달성률</p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="text-[10px] text-[#65676E] bg-white/60 px-2 py-0.5 rounded-[8px] font-bold hover:bg-white transition cursor-pointer"
              >
                목표 수정 ✏️
              </button>
            </div>
            <h3 className="text-2xl font-black text-[#3F4145] mb-2">{achievementRate}%</h3>
          </div>
          <div>
            <div className="w-full bg-black/5 h-2 rounded-full overflow-hidden mb-1.5">
              <div
                className="bg-[#4F7761] h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(Number(achievementRate), 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-[#8A8D96] font-medium">
              목표: ₩{goalAmount.toLocaleString()}
            </p>
          </div>
        </div>

        {/* 카드 3 */}
        <div className="glass-card flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold text-[#8A8D96] mb-1">주문 건수 (Orders)</p>
            <h3 className="text-2xl font-black text-[#3F4145] mb-3">24,580 건</h3>
          </div>
          <div>
            <span className="inline-block badge-info px-2.5 py-1 rounded-[10px] text-[11px] font-bold">
              평균 일일 819건
            </span>
          </div>
        </div>

        {/* 카드 4 */}
        <div className="glass-card flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold text-[#8A8D96] mb-1">총 판매 수량 (Units)</p>
            <h3 className="text-2xl font-black text-[#3F4145] mb-3">38,920 개</h3>
          </div>
          <div>
            <span className="inline-block badge-ok px-2.5 py-1 rounded-[10px] text-[11px] font-bold">
              반품률 2.1% (양호)
            </span>
          </div>
        </div>
      </div>

      <GoalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentGoal={goalAmount}
        onSave={(newGoal) => setGoalAmount(newGoal)}
      />
    </>
  );
}