'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

interface ReportSummaryKpi {
  target_rate?: string | number;
  total_sales?: string | number;
  asp?: string | number;
  atv?: string | number;
}

interface ReportChart {
  id?: string | number;
  title?: string;
  type?: string;
  data?: Array<Record<string, unknown>>;
}

interface ReportActionPlan {
  team?: string;
  action?: string;
  [key: string]: unknown;
}

interface ReportData {
  period_card_label?: string;
  period_meta?: Record<string, unknown>;
  summary_kpi?: ReportSummaryKpi;
  charts?: ReportChart[];
  md_insights?: {
    sales_analysis?: string;
    inventory_risk?: string;
    action_plans?: ReportActionPlan[];
  };
  disclaimer?: string;
  [key: string]: unknown;
}

export default function AiReportChatWidget() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [chatMessage, setChatMessage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // 도움말 팝업 및 키워드 목록
  const [showHelp, setShowHelp] = useState(false);
  const keywords = [
    "리포트", "보고서", "액션플랜", "분석", "현황", "추이", 
    "실적", "재고", "매출", "지표", "작성", "수치"
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleKeywordClick = (word: string) => {
    setPrompt((prev) => (prev ? `${prev} ${word}` : word));
  };

  const extractFileName = (disposition: string): string => {
    if (!disposition) return 'AI_판매리포트.xlsx';

    const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (utf8Match) {
      try {
        return decodeURIComponent(utf8Match[1]);
      } catch {
        // decode 실패시 폴백
      }
    }

    const quotedMatch = disposition.match(/filename="([^"]+)"/i);
    if (quotedMatch) {
      try {
        return decodeURIComponent(quotedMatch[1]);
      } catch {
        return quotedMatch[1];
      }
    }

    const plainMatch = disposition.match(/filename=([^;]+)/i);
    if (plainMatch) {
      return plainMatch[1].trim();
    }

    return 'AI_판매리포트.xlsx';
  };

  const handleExcelDownload = async () => {
    if (!reportData) {
      alert('다운로드할 리포트 데이터가 없습니다.');
      return;
    }
    if (!reportData.period_meta) {
      alert('기간 정보가 없어 엑셀을 생성할 수 없습니다. 리포트를 다시 생성해주세요.');
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/reports/export-excel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period_meta: reportData.period_meta }),
      });

      if (!res.ok) {
        throw new Error(`HTTP Error! Status: ${res.status}`);
      }

      const disposition = res.headers.get('Content-Disposition') || '';
      const fileName = extractFileName(disposition);

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('❌ Excel Download Error:', error);
      alert('엑셀 파일 생성 중 오류가 발생했습니다. 백엔드 서버 상태를 확인해주세요.');
    }
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || loading) return;

    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/reports/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        throw new Error(`HTTP Error! Status: ${res.status}`);
      }

      const data = await res.json();

      let parsedData = data;
      if (typeof data === 'string') {
        try {
          parsedData = JSON.parse(data);
        } catch (err) {
          console.error('JSON Parse error:', err);
        }
      }

      if (parsedData?.type === 'chat') {
        setReportData(null);
        setChatMessage(parsedData.message || '안녕하세요! 무엇을 도와드릴까요?');
        setIsModalOpen(false);
      } else {
        setChatMessage(null);
        setReportData(parsedData);
        setIsModalOpen(true);
      }
      setPrompt('');
    } catch (err) {
      console.error('❌ Report Generation Error:', err);
      alert('백엔드 API 호출에 실패했습니다. 백엔드 서버 구동 여부를 확인해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  const getKeys = (dataList: Array<Record<string, unknown>> | undefined) => {
    if (!dataList || dataList.length === 0) return [];
    return Object.keys(dataList[0]).filter((key) => key !== 'name');
  };

  const colors = ['#2563eb', '#8b5cf6', '#3f4145', '#10b981', '#f59e0b'];

  const displayCharts = Array.isArray(reportData?.charts) ? reportData.charts : [];

  return (
    <>
      {/* 1. 사이드바 입력 위젯 */}
      <div className="relative flex flex-col h-full p-3.5 bg-white/80 backdrop-blur-sm rounded-2xl border border-white shadow-[0_10px_20px_-5px_rgba(140,150,170,0.15)] text-xs justify-between">
        
        {/* 타이틀 및 우측 상단 가이드 버튼 */}
        <div className="font-bold text-[#3F4145] mb-2 flex items-center justify-between border-b border-black/5 pb-2">
          <span className="flex items-center gap-1.5">🤖 AI 리포트 생성기</span>
          
          <button
            type="button"
            onClick={() => setShowHelp(!showHelp)}
            className="w-5 h-5 flex items-center justify-center text-[11px] font-bold text-[#8A8D96] hover:text-[#3F4145] bg-white hover:bg-slate-100 rounded-full border border-slate-200 transition-all cursor-pointer shadow-sm"
            title="키워드 가이드"
          >
            ?
          </button>
        </div>

        {/* '?' 버튼 클릭 시 뜨는 키워드 안내 팝업 */}
        {showHelp && (
          <div className="absolute left-0 bottom-full mb-2 w-64 p-3 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-2xl z-50 text-xs">
            <div className="flex justify-between items-center pb-1.5 mb-2 border-b border-slate-100 font-bold text-[#3F4145]">
              <span>💡 리포트 요청 키워드</span>
              <button
                type="button"
                onClick={() => setShowHelp(false)}
                className="text-slate-400 hover:text-slate-600 font-bold px-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <p className="text-[#8A8D96] mb-2 leading-tight text-[11px]">
              아래 키워드가 포함되면 리포트가 생성됩니다. (클릭 시 입력창에 추가)
            </p>
            <div className="flex flex-wrap gap-1 mb-2.5 max-h-28 overflow-y-auto">
              {keywords.map((kw, i) => (
                <span
                  key={i}
                  onClick={() => handleKeywordClick(kw)}
                  className="px-1.5 py-0.5 bg-slate-100 hover:bg-blue-50 text-[#3F4145] hover:text-blue-600 rounded-md cursor-pointer transition-colors text-[11px] font-medium"
                >
                  #{kw}
                </span>
              ))}
            </div>
            <div className="bg-blue-50/70 p-2 rounded-xl text-[10px] text-blue-700 font-medium">
              <strong>예시:</strong> "26년 8월 매출 리포트 보여줘"
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col justify-center items-center py-3 bg-white/50 rounded-xl border border-gray-100 mb-2 min-h-[80px]">
          {chatMessage ? (
            <p className="text-[#3F4145] text-[11px] text-center px-3 leading-relaxed font-medium break-keep">
              {chatMessage}
            </p>
          ) : reportData ? (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg font-semibold hover:bg-blue-100 transition-colors text-[11px] flex items-center gap-1 cursor-pointer"
            >
              📊 생성된 리포트 대시보드 보기
            </button>
          ) : (
            <p className="text-[#8A8D96] text-[11px] text-center px-2 leading-relaxed">
              "리포트 작성해줘"를 입력하시면<br />화면 중앙에 차트 리포트가 열립니다.
            </p>
          )}
        </div>

        <form onSubmit={handleGenerate} className="flex gap-1.5">
          <input
            type="text"
            className="flex-1 border border-gray-200 rounded-xl px-2.5 py-1.5 text-[11px] focus:outline-none focus:border-slate-500 bg-white/90 text-[#3F4145]"
            placeholder="예: 리포트 작성해줘"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-[#3F4145] text-white px-3 py-1.5 rounded-xl hover:bg-slate-700 disabled:bg-gray-300 text-[11px] font-semibold shrink-0 transition-colors shadow-sm cursor-pointer"
          >
            {loading ? '생성중...' : '전송'}
          </button>
        </form>
      </div>

      {/* 2. 대시보드 팝업 모달 */}
      {mounted &&
        isModalOpen &&
        createPortal(
          <div
            className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-md p-6"
            style={{ zIndex: 999999 }}
          >
            <div className="bg-white w-full max-w-5xl h-[85vh] rounded-[32px] shadow-2xl flex flex-col overflow-hidden border border-gray-100">
              {/* 헤더 */}
              <div className="px-8 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <span className="text-base font-extrabold text-[#3F4145]">
                    📊 AI 판매현황 & MD 액션플랜 리포트
                  </span>
                  <span className="text-xs bg-green-100 text-green-700 font-bold px-2.5 py-0.5 rounded-full">
                    ZERO
                  </span>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* 본문 대시보드 */}
              <div className="flex-1 p-6 overflow-y-auto bg-gray-50/30 space-y-6">
                {reportData?.period_card_label && (
                  <div className="p-4 bg-indigo-50 border-2 border-indigo-200 rounded-2xl text-center">
                    <p className="text-lg font-extrabold text-indigo-900 tracking-tight">
                      📅 {reportData.period_card_label}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                    <p className="text-[11px] text-gray-500 font-semibold mb-1">목표 달성률</p>
                    <p className="text-xl font-extrabold text-blue-600">
                      {typeof reportData?.summary_kpi?.target_rate === 'number'
                        ? `${reportData.summary_kpi.target_rate}%`
                        : reportData?.summary_kpi?.target_rate ?? '0.0%'}
                    </p>
                  </div>
                  <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                    <p className="text-[11px] text-gray-500 font-semibold mb-1">총 매출액</p>
                    <p className="text-xl font-extrabold text-slate-800">
                      {`${Number(reportData?.summary_kpi?.total_sales ?? 0).toLocaleString()} 원`}
                    </p>
                  </div>
                  <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                    <p className="text-[11px] text-gray-500 font-semibold mb-1">평균 판매단가 (ASP)</p>
                    <p className="text-xl font-extrabold text-slate-800">
                      {`${Number(reportData?.summary_kpi?.asp ?? 0).toLocaleString()} 원`}
                    </p>
                  </div>
                  <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                    <p className="text-[11px] text-gray-500 font-semibold mb-1">객단가 (ATV)</p>
                    <p className="text-xl font-extrabold text-purple-600">
                      {`${Number(reportData?.summary_kpi?.atv ?? 0).toLocaleString()} 원`}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {displayCharts.map((chart: ReportChart, idx: number) => {
                    const chartData = chart.data ?? [];
                    const dataKeys = getKeys(chartData);
                    return (
                      <div
                        key={chart.id ?? idx}
                        className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm flex flex-col"
                      >
                        <h4 className="text-xs font-bold text-[#3F4145] mb-4 flex items-center gap-1.5">
                          <span>📈</span> {chart.title ?? `차트 ${idx + 1}`}
                        </h4>
                        <div className="w-full h-[220px] min-h-[220px]">
                          <ResponsiveContainer width="100%" height="100%">
                            {chart.type === 'line' ? (
                              <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="name" stroke="#888888" fontSize={10} />
                                <YAxis stroke="#888888" fontSize={10} domain={['auto', 'auto']} />
                                <Tooltip />
                                <Legend wrapperStyle={{ fontSize: '11px' }} />
                                {dataKeys.map((key, kIdx) => (
                                  <Line
                                    key={key}
                                    type="monotone"
                                    dataKey={key}
                                    stroke={colors[kIdx % colors.length]}
                                    strokeWidth={2.5}
                                    dot={{ r: 4 }}
                                  />
                                ))}
                              </LineChart>
                            ) : (
                              <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="name" stroke="#888888" fontSize={10} />
                                <YAxis stroke="#888888" fontSize={10} />
                                <Tooltip />
                                <Legend wrapperStyle={{ fontSize: '11px' }} />
                                {dataKeys.map((key, kIdx) => (
                                  <Bar
                                    key={key}
                                    dataKey={key}
                                    fill={colors[kIdx % colors.length]}
                                    radius={[4, 4, 0, 0]}
                                  />
                                ))}
                              </BarChart>
                            )}
                          </ResponsiveContainer>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-5">
                  <h4 className="text-sm font-extrabold text-[#3F4145] flex items-center gap-1.5">
                    💡 MD 시점 진단 리포트
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="font-bold text-slate-700 block mb-1.5 text-xs">
                        • 실적 및 효율 지표 분석
                      </span>
                      <p className="text-gray-600 leading-relaxed">
                        {reportData?.md_insights?.sales_analysis || '실적 데이터 분석이 완료되지 않았습니다.'}
                      </p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="font-bold text-slate-700 block mb-1.5 text-xs">
                        • 재고 리스크 진단
                      </span>
                      <p className="text-gray-600 leading-relaxed">
                        {reportData?.md_insights?.inventory_risk || '재고 리스크 분석이 완료되지 않았습니다.'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <h5 className="text-xs font-bold text-[#3F4145] mb-3 flex items-center gap-1">
                      <span>🚀</span> 부서별 제안 액션 플랜
                    </h5>
                    <div className="flex flex-col gap-2.5">
                      {(reportData?.md_insights?.action_plans || []).map((plan: ReportActionPlan, idx: number) => (
                        <div
                          key={idx}
                          className="p-3.5 bg-blue-50/40 border border-blue-100 rounded-xl flex items-start gap-3"
                        >
                          <span className="text-[11px] font-bold text-blue-600 bg-blue-100 px-2.5 py-1 rounded-lg shrink-0">
                            [{plan.team ?? `팀 ${idx + 1}`}]
                          </span>
                          <p className="text-xs text-gray-800 font-medium leading-relaxed pt-0.5">
                            {plan.action}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 푸터 */}
              <div className="px-8 py-4 border-t border-gray-100 bg-white flex justify-between items-center text-xs text-[#8A8D96]">
                <div className="flex flex-col gap-0.5 shrink-0 min-w-0">
                  <span className="truncate">
                    {reportData?.disclaimer ||
                      '※ ATV/UPT는 order_id 데이터 부재로 order_item_id 단위 근사치입니다.'}
                  </span>
                  <span className="truncate text-[10px]">
                    본 리포트는 참고용이며, 실제 발주·재고 결정은 담당자가 직접 판단하여 진행합니다.
                  </span>
                </div>
                <div className="flex gap-2 shrink-0 ml-4">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors cursor-pointer"
                  >
                    닫기
                  </button>
                  <button
                    onClick={() => {
                      if (reportData) {
                        navigator.clipboard.writeText(
                          JSON.stringify(reportData, null, 2)
                        );
                        alert('리포트 JSON 데이터가 클립보드에 복사되었습니다.');
                      }
                    }}
                    className="px-4 py-2 bg-[#3F4145] hover:bg-slate-700 text-white rounded-xl font-bold transition-colors shadow-sm cursor-pointer whitespace-nowrap"
                  >
                    데이터 복사
                  </button>
                  <button
                    onClick={handleExcelDownload}
                    disabled={!reportData}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-xl font-bold transition-colors shadow-sm cursor-pointer whitespace-nowrap"
                  >
                    📥 엑셀 다운로드
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