// 시즌 분석 화면
// 26.08.04 수정 (민) 하기 주석까지 기존코드 오픈코드는 가상데이터 테스트

/*
'use client';

import React from 'react';
import KpiCard from '../dashboard/KpiCard';

export default function SeasonTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard title="주간 평균기온 예측" value="28.5°C" desc="평년 대비 +2.1°C" type="danger" />
        <KpiCard title="24절기 D-Day" value="입추 D-4" desc="2026-08-07 예정" type="neutral" />
        <KpiCard title="기상 특보" value="폭염 주의보" desc="냉감 소재 리오더 추천" type="danger" borderColor="#ef4444" />
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
        <h3 className="text-base font-semibold mb-4 text-slate-800">시즌 달력 & 타임라인 (Gantt)</h3>
        <div className="p-8 bg-slate-50 border border-dashed border-slate-300 rounded text-center text-slate-400 text-sm">
          기온 예측 시뮬레이터 및 간트 차트가 들어갈 위치입니다.
        </div>
      </div>
    </div>
  );
} */

'use client';

import React from 'react';
import KpiCard from '../dashboard/KpiCard';

export default function SeasonTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard title="주간 평균기온 예측" value="28.5°C" desc="평년 대비 +2.1°C 상승" type="danger" />
        <KpiCard title="시즌절기 D-Day" value="입추 D-3" desc="2026-08-07 예정" type="neutral" />
        <KpiCard title="기상 특보 알림" value="폭염 경보" desc="냉감 아우터/티셔츠 수요 폭증" type="danger" borderColor="#ef4444" />
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
        <h3 className="text-base font-semibold mb-2 text-slate-800">🌡️ 날씨 기반 카테고리 수요 예측 시뮬레이터</h3>
        <p className="text-xs text-slate-500 mb-6">기상청 기온 예측 데이터와 과거 판매 데이터를 매핑한 AI 예측 모델입니다.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border border-blue-200 bg-blue-50/50 rounded-lg">
            <div className="font-bold text-blue-900 mb-1">냉감/Short-Sleeve</div>
            <div className="text-2xl font-extrabold text-blue-600 mb-2">▲ 38%</div>
            <p className="text-xs text-slate-600">폭염 지속으로 8월 3주차까지 매출 우상향 예상</p>
          </div>
          <div className="p-4 border border-amber-200 bg-amber-50/50 rounded-lg">
            <div className="font-bold text-amber-900 mb-1">간절기 아우터 (Early FW)</div>
            <div className="text-2xl font-extrabold text-amber-600 mb-2">▼ 15%</div>
            <p className="text-xs text-slate-600">고온 현상으로 FW 차수 출고일 1주일 연기 권장</p>
          </div>
          <div className="p-4 border border-slate-200 bg-slate-50 rounded-lg">
            <div className="font-bold text-slate-900 mb-1">잡화/선글라스</div>
            <div className="text-2xl font-extrabold text-slate-700 mb-2">▲ 12%</div>
            <p className="text-xs text-slate-600">휴가철 피크 시즌과 물려 안정적인 판매 유지</p>
          </div>
        </div>
      </div>
    </div>
  );
}