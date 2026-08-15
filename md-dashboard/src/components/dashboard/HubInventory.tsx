// 26.08.05 UI 변경으로 인한 파일 추가 HUB별 재고 관리 컴포넌트

'use client';

import { useState, useEffect } from 'react';
import { getHubInventory, HubCardData, getHubTransferRecommendation, TransferRecommendation } from '@/services/dashboardApi';

function getInventoryStatus(wos: number) {
  if (wos < 4) {
    return {
      label: '부족 상태',
      description: '4주 미만 · 보충 또는 HUB 이동 검토',
      badgeClassName: 'bg-[#FDE7E7] text-[#A84C4C] border-[#F4CACA]',
      barClassName: 'bg-[#D96B6B]',
    };
  }
  if (wos > 12) {
    return {
      label: '과잉재고',
      description: '12주 초과 · 타 HUB 이동 또는 소진 촉진',
      badgeClassName: 'bg-[#FFF0D9] text-[#9A651F] border-[#F3D7AA]',
      barClassName: 'bg-[#D99A45]',
    };
  }
  return {
    label: '안전재고',
    description: '4~12주 · 현재 재고 수준 유지',
    badgeClassName: 'bg-[#E2F3E9] text-[#397255] border-[#C8E7D5]',
    barClassName: 'bg-[#5C9B78]',
  };
}

function getTransferKey(transfer: TransferRecommendation) {
  return [transfer.product_name, transfer.from_hub, transfer.to_hub, transfer.qty].join('|');
}

export default function HubInventory() {
  const [selectedHub, setSelectedHub] = useState(0);
  const [hubs, setHubs] = useState<HubCardData[]>([]);
  const [transfers, setTransfers] = useState<TransferRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [executedTransfers, setExecutedTransfers] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([getHubInventory(), getHubTransferRecommendation()])
      .then(([hubData, transferData]) => {
        setHubs(hubData.hubs);
        setTransfers(transferData.transfers);
      })
      .catch(() => setError('HUB별 재고 데이터를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('hub_transfer_execution_status');
      if (saved) setExecutedTransfers(JSON.parse(saved));
    } catch {
      // 저장값이 손상된 경우 빈 상태로 시작합니다.
    }
  }, []);

  const maxSpeed = hubs.length ? Math.max(...hubs.map(h => h.speed_per_day)) : 1;

  const updateTransferExecution = (transfer: TransferRecommendation, execute: boolean) => {
    const action = execute ? '이동 실행 요청' : '이동 요청 취소';
    if (!window.confirm(`${transfer.product_name} ${transfer.qty.toLocaleString()} EA의 ${action}을 진행할까요?`)) return;

    const key = getTransferKey(transfer);
    const next = { ...executedTransfers };
    if (execute) next[key] = new Date().toLocaleString('ko-KR');
    else delete next[key];
    setExecutedTransfers(next);
    window.localStorage.setItem('hub_transfer_execution_status', JSON.stringify(next));
  };

  const handleExcelDownload = async () => {
    if (!hubs.length || exporting) return;

    setExporting(true);
    try {
      const XLSX = await import('xlsx');
      const generatedAt = new Date();
      const generatedAtText = generatedAt.toLocaleString('ko-KR');
      const dateText = [
        generatedAt.getFullYear(),
        String(generatedAt.getMonth() + 1).padStart(2, '0'),
        String(generatedAt.getDate()).padStart(2, '0'),
      ].join('');

      const summaryRows = hubs.map((hub) => {
        const status = getInventoryStatus(hub.wos);
        return {
          '추출 일시': generatedAtText,
          'HUB ID': hub.hub_id,
          'HUB명': hub.hub_name,
          '가용재고(EA)': hub.available,
          '예약(EA)': hub.reserved,
          '이동 중(EA)': hub.in_transit,
          '입고 예정(EA)': hub.incoming,
          '소진 속도(EA/일)': Number(hub.speed_per_day.toFixed(1)),
          'WOS(주)': hub.wos,
          '재고 상태': status.label,
          '판단 및 권장 조치': status.description,
        };
      });

      const transferRows = transfers.map((transfer) => ({
        '추출 일시': generatedAtText,
        '상품명': transfer.product_name,
        '출발 HUB': transfer.from_hub,
        '도착 HUB': transfer.to_hub,
        '권장 수량(EA)': transfer.qty,
        '출발 WOS(이동 전)': transfer.before_from,
        '출발 WOS(이동 후)': transfer.after_from,
        '출발 HUB 이동 후 상태': getInventoryStatus(transfer.after_from).label,
        '도착 WOS(이동 전)': transfer.before_to,
        '도착 WOS(이동 후)': transfer.after_to,
        '도착 HUB 이동 후 상태': getInventoryStatus(transfer.after_to).label,
        '진행 상태': executedTransfers[getTransferKey(transfer)] ? '이동 요청 완료' : transfer.status,
        '실행 요청 일시': executedTransfers[getTransferKey(transfer)] ?? '',
      }));

      const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
      summarySheet['!cols'] = [
        { wch: 22 }, { wch: 12 }, { wch: 24 }, { wch: 14 }, { wch: 12 },
        { wch: 14 }, { wch: 16 }, { wch: 18 }, { wch: 11 }, { wch: 13 }, { wch: 34 },
      ];
      summarySheet['!autofilter'] = { ref: summarySheet['!ref'] ?? 'A1:K1' };

      const transferSheet = XLSX.utils.json_to_sheet(
        transferRows.length ? transferRows : [{ '안내': '현재 권장 이동 내역이 없습니다.' }],
      );
      transferSheet['!cols'] = [
        { wch: 22 }, { wch: 24 }, { wch: 26 }, { wch: 26 }, { wch: 16 },
        { wch: 20 }, { wch: 20 }, { wch: 22 }, { wch: 20 }, { wch: 20 },
        { wch: 22 }, { wch: 14 }, { wch: 22 },
      ];
      if (transferRows.length) transferSheet['!autofilter'] = { ref: transferSheet['!ref'] ?? 'A1:M1' };

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'HUB 재고 상태 요약');
      XLSX.utils.book_append_sheet(workbook, transferSheet, '권장 이동 및 진행 상태');
      XLSX.writeFile(workbook, `HUB_소진속도_재고상태_${dateText}.xlsx`);
    } catch (downloadError) {
      console.error('HUB Excel download failed:', downloadError);
      alert('엑셀 파일을 생성하지 못했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm font-medium text-[#8A8D96]">
        불러오는 중...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 text-xs px-4 py-3 rounded-2xl">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 상단 타이틀 영역 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#3F4145]">HUB별 제품 재고 관리</h2>
          <p className="text-xs text-[#8A8D96] mt-1">세 HUB의 재고량, 판매 속도, WOS와 위험 상태를 비교하고 HUB 이동 가능성을 검토합니다.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-white/60 border border-white/80 px-3 py-2 rounded-2xl text-xs font-semibold shadow-sm">목표재고 4주</span>
          <button 
            onClick={() => document.getElementById('transferSection')?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-white/80 border border-white rounded-2xl px-4 py-2 text-xs font-extrabold shadow-sm hover:bg-white transition"
          >
            이동 요청 보기
          </button>
        </div>
      </div>

      {/* HUB 카드 3종 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {hubs.map((hub, idx) => (
          <div
            key={hub.hub_id}
            onClick={() => setSelectedHub(idx)}
            className={`p-5 rounded-[28px] border backdrop-blur-xl transition cursor-pointer shadow-sm ${
              selectedHub === idx 
                ? 'bg-white/80 border-[#3F4145]/40 ring-2 ring-[#3F4145]/20' 
                : 'bg-white/50 border-white/70 hover:bg-white/60'
            }`}
          >
            <div className="text-[11px] text-[#8A8D96] font-medium">{hub.hub_id}</div>
            <div className="text-xl font-extrabold text-[#3F4145] mt-1">{hub.hub_name}</div>
            <div className="text-xs text-[#65676E] mt-1">가용재고 {hub.available.toLocaleString()} EA · WOS {hub.wos}주</div>
            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="bg-white/40 p-2 rounded-xl">
                <span className="block text-[10px] text-[#8A8D96]">예약</span>
                <b className="text-xs text-[#3F4145]">{hub.reserved}</b>
              </div>
              <div className="bg-white/40 p-2 rounded-xl">
                <span className="block text-[10px] text-[#8A8D96]">이동 중</span>
                <b className="text-xs text-[#3F4145]">{hub.in_transit}</b>
              </div>
              <div className="bg-white/40 p-2 rounded-xl">
                <span className="block text-[10px] text-[#8A8D96]">입고 예정</span>
                <b className="text-xs text-[#3F4145]">{hub.incoming}</b>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 소진 속도 + WOS 통합 재고 상태 */}
      <div id="transferSection" className="bg-white/50 backdrop-blur-xl border border-white/70 p-6 rounded-[28px] shadow-sm">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-base font-extrabold text-[#3F4145]">HUB별 소진 속도 및 재고 상태</h3>
            <p className="text-[11px] text-[#8A8D96]">최근 28일 판매 속도와 WOS를 함께 비교합니다.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:justify-end">
            <p className="text-[10px] font-bold text-[#8A8D96]">부족 &lt; 4주 · 안전 4~12주 · 과잉 &gt; 12주</p>
            <button
              type="button"
              onClick={handleExcelDownload}
              disabled={exporting || !hubs.length}
              className="rounded-xl border border-white/90 bg-white/80 px-3.5 py-2 text-[11px] font-extrabold text-[#3F4145] shadow-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {exporting ? '엑셀 생성 중...' : '엑셀 다운로드'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {hubs.map((hub) => {
            const status = getInventoryStatus(hub.wos);
            const speedWidth = maxSpeed > 0 ? (hub.speed_per_day / maxSpeed) * 100 : 0;
            const wosWidth = Math.min((hub.wos / 12) * 100, 100);
            const hubTransfers = transfers.filter(
              (transfer) => transfer.from_hub === hub.hub_name || transfer.to_hub === hub.hub_name,
            );

            return (
              <article key={hub.hub_id} className="rounded-[22px] border border-white/80 bg-white/45 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold text-[#8A8D96]">{hub.hub_id}</p>
                    <h4 className="mt-0.5 text-sm font-extrabold text-[#3F4145]">{hub.hub_name}</h4>
                  </div>
                  <span className={`rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${status.badgeClassName}`}>
                    {status.label}
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  <div>
                    <div className="mb-1.5 flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-[#65676E]">소진 속도</span>
                      <strong className="text-[#3F4145]">{hub.speed_per_day.toFixed(1)} EA/일</strong>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/70">
                      <div className="h-full rounded-full bg-[#65676E]" style={{ width: `${speedWidth}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-[#65676E]">재고 커버리지</span>
                      <strong className="text-[#3F4145]">WOS {hub.wos}주</strong>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/70">
                      <div className={`h-full rounded-full ${status.barClassName}`} style={{ width: `${wosWidth}%` }} />
                    </div>
                  </div>
                </div>

                <div className="mt-4 border-t border-black/5 pt-3">
                  <p className="text-[10px] font-semibold text-[#65676E]">{status.description}</p>
                  <p className="mt-1 text-[10px] text-[#8A8D96]">가용재고 {hub.available.toLocaleString()} EA</p>
                </div>

                <details className="group mt-4 overflow-hidden rounded-2xl border border-white/90 bg-white/45">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3.5 py-3 text-[11px] font-extrabold text-[#3F4145] [&::-webkit-details-marker]:hidden">
                    <span>권장 이동 및 진행 상태</span>
                    <span className="flex items-center gap-2">
                      <span className="rounded-full bg-white/80 px-2 py-0.5 text-[9px] text-[#65676E]">{hubTransfers.length}건</span>
                      <span className="text-[#8A8D96] transition-transform group-open:rotate-180" aria-hidden="true">⌄</span>
                    </span>
                  </summary>

                  <div className="border-t border-black/5 px-3.5 pb-3.5 pt-2">
                    {hubTransfers.length > 0 ? (
                      <div className="divide-y divide-black/5">
                        {hubTransfers.map((transfer, index) => {
                          const isOutbound = transfer.from_hub === hub.hub_name;
                          const counterpartHub = isOutbound ? transfer.to_hub : transfer.from_hub;
                          const beforeWos = isOutbound ? transfer.before_from : transfer.before_to;
                          const afterWos = isOutbound ? transfer.after_from : transfer.after_to;
                          const transferKey = getTransferKey(transfer);
                          const executedAt = executedTransfers[transferKey];

                          return (
                            <div key={`${transfer.product_name}-${counterpartHub}-${index}`} className="py-3 first:pt-1 last:pb-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold ${isOutbound ? 'bg-[#FFF0D9] text-[#9A651F]' : 'bg-[#DCEBFA] text-[#496B8F]'}`}>
                                      {isOutbound ? '보내기' : '받기'}
                                    </span>
                                    <span className="truncate text-[11px] font-extrabold text-[#3F4145]">{transfer.product_name}</span>
                                  </div>
                                  <p className="mt-1.5 text-[10px] font-semibold text-[#65676E]">
                                    {isOutbound ? `${counterpartHub}(으)로 이동` : `${counterpartHub}에서 입고`}
                                  </p>
                                </div>
                                <strong className="shrink-0 text-[11px] text-[#3F4145]">{transfer.qty.toLocaleString()} EA</strong>
                              </div>
                              <div className="mt-2 flex items-center justify-between text-[9px] text-[#8A8D96]">
                                <span>WOS {beforeWos} → {afterWos}주</span>
                                <span className={`rounded-full border px-2 py-0.5 font-bold ${executedAt ? 'border-[#C8E7D5] bg-[#E2F3E9] text-[#397255]' : 'border-white/80 bg-white/70 text-[#496B8F]'}`}>
                                  {executedAt ? '이동 요청 완료' : transfer.status}
                                </span>
                              </div>
                              {isOutbound && (
                                <div className="mt-2.5 flex items-center justify-between gap-2 rounded-xl bg-white/55 p-2.5">
                                  <div className="min-w-0">
                                    <p className="text-[9px] font-bold text-[#65676E]">{executedAt ? '실행 요청이 등록되었습니다.' : '권장 수량으로 바로 이동 요청'}</p>
                                    {executedAt && <p className="mt-0.5 truncate text-[8px] text-[#8A8D96]">요청 일시 {executedAt}</p>}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => updateTransferExecution(transfer, !executedAt)}
                                    className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[9px] font-extrabold transition ${executedAt ? 'bg-white text-[#8A8D96] hover:text-[#A84C4C]' : 'bg-[#3F4145] text-white hover:bg-[#2F3135]'}`}
                                  >
                                    {executedAt ? '요청 취소' : '이동 실행 요청'}
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="py-2 text-center text-[10px] font-semibold text-[#8A8D96]">현재 권장 이동 내역이 없습니다.</p>
                    )}
                  </div>
                </details>
              </article>
            );
          })}
        </div>
      </div>

    </div>
  );
}
