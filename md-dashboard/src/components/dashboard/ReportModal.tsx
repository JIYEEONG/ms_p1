// 26.08.09 AI고도화의 따른 파일 추가
// 26.08.XX 조회 기간 명시 카드 추가 (period_card_label)

// src/components/ReportModal.tsx
'use client';

import React from 'react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportData: any; // 백엔드 ReportResponse 타입
}

export default function ReportModal({ isOpen, onClose, reportData }: ReportModalProps) {
  if (!isOpen || !reportData) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-4">
          <h2 className="text-xl font-bold">📊 AI 판매현황 & MD 액션플랜 리포트</h2>
          <button onClick={onClose} className="px-3 py-1 bg-gray-100 rounded-lg hover:bg-gray-200">닫기</button>
        </div>

        {/* 0. 조회 기간 명시 배너 (헤더 바로 아래, 제목처럼 크게) */}
        {reportData.period_card_label ? (
          <div className="p-4 bg-indigo-50 border-2 border-indigo-200 rounded-xl text-center">
            <p className="text-2xl font-extrabold text-indigo-900 tracking-tight">
              📅 {reportData.period_card_label}
            </p>
          </div>
        ) : (
          // TODO: 정상 작동 확인되면 이 디버그 줄 삭제
          <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
            ⚠ period_card_label 없음 - 백엔드 응답 확인 필요 (재시작 여부, Network 탭 Response)
          </div>
        )}

        {/* 1. 상단 KPI Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-xs text-blue-600 font-semibold">목표 달성률</p>
            <p className="text-2xl font-bold text-blue-900">{reportData.summary_kpi?.target_rate}%</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg border border-green-100">
            <p className="text-xs text-green-600 font-semibold">총 매출액</p>
            <p className="text-2xl font-bold text-green-900">{reportData.summary_kpi?.total_sales?.toLocaleString()} 원</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
            <p className="text-xs text-purple-600 font-semibold">평균 판매단가 (ASP)</p>
            <p className="text-2xl font-bold text-purple-900">{reportData.summary_kpi?.asp?.toLocaleString()} 원</p>
          </div>
        </div>

        {/* 2. 중앙 Charts Grid */}
        <div className="grid grid-cols-2 gap-6">
          {reportData.charts?.map((chart: any) => (
            <div key={chart.id} className="p-4 border rounded-xl bg-gray-50">
              <h3 className="text-sm font-semibold mb-4">{chart.title}</h3>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  {chart.type === 'line' ? (
                    <LineChart data={chart.data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} />
                    </LineChart>
                  ) : (
                    <BarChart data={chart.data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#3b82f6" />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>

        {/* 3. 하단 MD Insights */}
        <div className="space-y-4 border-t pt-4">
          <h3 className="font-bold text-lg text-gray-800">💡 MD 시점 종합 진단 & 액션 플랜</h3>
          <div className="p-4 bg-gray-50 border rounded-lg text-sm text-gray-700 space-y-2">
            <p><strong>• 매출 진단:</strong> {reportData.md_insights?.sales_analysis}</p>
            <p><strong>• 재고 리스크:</strong> {reportData.md_insights?.inventory_risk}</p>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            {reportData.md_insights?.action_plans?.map((plan: any, idx: number) => (
              <div key={idx} className="p-3 border border-blue-100 bg-blue-50/50 rounded-lg">
                <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                  {plan.team}
                </span>
                <p className="text-xs mt-2 text-gray-800 font-medium">{plan.action}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}