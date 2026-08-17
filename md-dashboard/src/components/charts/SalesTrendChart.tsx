'use client';

import React from 'react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { DisplayCurrency } from '../dashboard/FilterBar';

export type SalesTrendUnit = 'week' | 'month' | 'year';

export interface SalesTrendPoint {
  label: string;
  period_start: string;
  period_days: number;
  current_net_sales: number | null;
  current_gross_sales: number | null;
  previous_net_sales: number | null;
  previous_gross_sales: number | null;
  two_year_net_sales: number | null;
  two_year_gross_sales: number | null;
}

export interface SalesTrendData {
  current_label: string;
  previous_label: string;
  two_year_label: string;
  points: SalesTrendPoint[];
}

interface TooltipPayloadItem {
  dataKey?: string;
  payload?: SalesTrendPoint;
}

const series = [
  { netKey: 'current_net_sales', grossKey: 'current_gross_sales', labelKey: 'current_label', opacity: 1, width: 2, dash: '', color: '#FF4500' },
  { netKey: 'previous_net_sales', grossKey: 'previous_gross_sales', labelKey: 'previous_label', opacity: 0.82, width: 1.4, dash: '8 5', color: '#AFC8E5' },
  { netKey: 'two_year_net_sales', grossKey: 'two_year_gross_sales', labelKey: 'two_year_label', opacity: 0.72, width: 1, dash: '2 5', color: '#C7CFD7' },
] as const;

type SeriesKey = (typeof series)[number]['netKey'];

function formatMoney(value: number, currency: DisplayCurrency, exchangeRate: number) {
  if (currency === 'USD') {
    return `$${(value / exchangeRate).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  }
  return `${Math.round(value).toLocaleString()}원`;
}

function formatCompactMoney(value: number, currency: DisplayCurrency, exchangeRate: number) {
  const converted = currency === 'USD' ? value / exchangeRate : value;
  if (currency === 'USD') {
    if (Math.abs(converted) >= 1000000) return `$${(converted / 1000000).toFixed(2)}M`;
    if (Math.abs(converted) >= 1000) return `$${(converted / 1000).toFixed(1)}K`;
    return formatMoney(value, currency, exchangeRate);
  }
  if (Math.abs(converted) >= 100000000) return `${(converted / 100000000).toFixed(2)}억원`;
  if (Math.abs(converted) >= 10000) return `${(converted / 10000).toFixed(1)}만원`;
  return formatMoney(value, currency, exchangeRate);
}

function formatAxisValue(value: number, currency: DisplayCurrency, exchangeRate: number) {
  const converted = currency === 'USD' ? value / exchangeRate : value;
  if (Math.abs(converted) >= 100000000) return `${(converted / 100000000).toFixed(1)}억`;
  if (Math.abs(converted) >= 10000) return `${(converted / 10000).toFixed(0)}만`;
  return converted.toLocaleString('ko-KR', { maximumFractionDigits: 0 });
}

function SalesTooltip({
  active,
  payload,
  chartData,
  goalAmount,
  currency,
  exchangeRate,
  visibleSeries,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  chartData: SalesTrendData;
  goalAmount: number;
  currency: DisplayCurrency;
  exchangeRate: number;
  visibleSeries: SeriesKey[];
}) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;

  const totalDays = chartData.points.reduce((sum, item) => sum + item.period_days, 0);
  const pointGoal = totalDays > 0 ? goalAmount * (point.period_days / totalDays) : 0;
  const goalRate = pointGoal > 0 && point.current_net_sales != null ? (point.current_net_sales / pointGoal) * 100 : null;
  const compareRate = (past: number | null) => past != null && past > 0 && point.current_net_sales != null
    ? ((point.current_net_sales - past) / past) * 100 : null;
  const previousRate = compareRate(point.previous_net_sales);
  const twoYearRate = compareRate(point.two_year_net_sales);

  return (
    <div className="w-max min-w-64 max-w-[calc(100vw-2rem)] whitespace-normal rounded-[16px] border border-white/90 bg-white/95 p-4 shadow-[0_12px_28px_-10px_rgba(63,65,69,0.25)] backdrop-blur-md">
      <p className="mb-3 text-xs font-extrabold text-[#3F4145]">{point.label}</p>
      <div className="space-y-3">
        {series.filter((item) => visibleSeries.includes(item.netKey)).map((item, index) => {
          const netSales = point[item.netKey];
          const grossSales = point[item.grossKey];
          return (
            <div
              key={item.netKey}
              className={index > 0 ? 'border-t border-[#D9DCE2] pt-3' : undefined}
            >
              <div className="flex items-baseline justify-between gap-5 text-[10px] font-semibold">
                <p className="text-[#8A8D96]">{chartData[item.labelKey]}</p>
                {item.netKey === 'current_net_sales' && (
                  <div className="flex flex-col items-end gap-0.5">
                    {previousRate != null && <span className={`font-extrabold ${previousRate >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>전년 {previousRate >= 0 ? '▲' : '▼'} {Math.abs(previousRate).toFixed(1)}%</span>}
                    {twoYearRate != null && <span className={`font-extrabold ${twoYearRate >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>재작년 {twoYearRate >= 0 ? '▲' : '▼'} {Math.abs(twoYearRate).toFixed(1)}%</span>}
                  </div>
                )}
              </div>
              <p className="mt-1 text-base font-black text-[#3F4145]">{netSales == null ? '—' : formatCompactMoney(netSales, currency, exchangeRate)}</p>
              {netSales != null && <p className="text-[10px] font-semibold text-[#8A8D96]">{formatMoney(netSales, currency, exchangeRate)}</p>}
              <p className="mt-1 text-[10px] font-semibold text-[#8A8D96]">총매출 {grossSales == null ? '—' : `${formatCompactMoney(grossSales, currency, exchangeRate)} · ${formatMoney(grossSales, currency, exchangeRate)}`}</p>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-[#D9DCE2] pt-3 text-[10px] font-semibold text-[#4F7761]"><span>목표 대비</span><span className="font-extrabold">{goalRate == null ? '—' : `${goalRate.toFixed(1)}%`}</span></div>
      <p className="mt-1 text-right text-[10px] font-semibold text-[#8A8D96]">목표 {formatCompactMoney(pointGoal, currency, exchangeRate)} · {formatMoney(pointGoal, currency, exchangeRate)}</p>
    </div>
  );
}

export default function SalesTrendChart({
  data,
  unit,
  onUnitChange,
  goalAmount,
  currency,
  exchangeRate,
  loading = false,
}: {
  data: SalesTrendData | null;
  unit: SalesTrendUnit;
  onUnitChange: (unit: SalesTrendUnit) => void;
  goalAmount: number;
  currency: DisplayCurrency;
  exchangeRate: number;
  loading?: boolean;
}) {
  const hasData = Boolean(data?.points.length);
  const [visibleSeries, setVisibleSeries] = React.useState<SeriesKey[]>(series.map((item) => item.netKey));
  const toggleSeries = (key: SeriesKey) => {
    setVisibleSeries((current) => (
      current.includes(key)
        ? current.length === 1 ? current : current.filter((item) => item !== key)
        : [...current, key]
    ));
  };

  return (
    <div className="radius-frame-32-p24 relative z-20 flex min-h-[430px] h-full flex-col justify-between overflow-visible rounded-[32px] border border-white/70 bg-white/50 p-6 shadow-sm backdrop-blur-xl">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-extrabold text-[#3F4145]">순매출 추이</h3>
          <p className="mt-0.5 text-xs text-[#8A8D96]">총매출에서 클레임 금액을 제외한 순매출 비교</p>
        </div>
        <div className="flex items-start gap-4">
          <span className="rounded-full border border-white/80 bg-white/60 px-3 py-1 text-[11px] font-bold text-[#8A8D96]">
            Y축 단위: {currency === 'KRW' ? '원' : '달러'}
          </span>
          {data && (
            <div className="flex items-start gap-3" role="group" aria-label="순매출 비교 기간 표시">
              <span className="pt-0.5 text-[11px] font-extrabold text-[#65676E]">표시 기간</span>
              <div className="flex flex-col gap-1.5">
                {series.map((item) => {
                  const selected = visibleSeries.includes(item.netKey);
                  return (
                    <button
                      key={item.netKey}
                      type="button"
                      role="checkbox"
                      aria-checked={selected}
                      onClick={() => toggleSeries(item.netKey)}
                      className={`flex cursor-pointer items-center justify-end gap-2 text-[11px] font-bold transition ${selected ? 'text-[#3F4145]' : 'text-[#8A8D96]'}`}
                      style={{ opacity: item.opacity }}
                    >
                      <span>{data[item.labelKey]}</span>
                      <span className="relative h-3.5 w-7" aria-hidden="true"><span className="absolute left-0 right-0 top-1/2 border-t-2" style={{ borderColor: item.color, opacity: selected ? item.opacity : 0.2, borderTopStyle: item.dash ? 'dashed' : 'solid' }} /></span>
                      <span className="grid h-3.5 w-3.5 place-items-center rounded-full border border-[#8A8D96] bg-white/50" aria-hidden="true">
                        {selected && <span className="h-1.5 w-1.5 rounded-full bg-[#65676E]" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-start gap-2" aria-label="순매출 집계 단위">
        {([
          ['week', '1주일'],
          ['month', '한달'],
          ['year', '1년'],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={unit === value}
            onClick={() => onUnitChange(value)}
            className={`min-w-16 rounded-[12px] px-3.5 py-2 text-xs font-bold transition-all ${
              unit === value
                ? 'bg-[#3F4145] text-white shadow-[0_6px_12px_-2px_rgba(63,65,69,0.25)]'
                : 'bg-white/70 text-[#65676E] shadow-[0_4px_10px_-2px_rgba(140,150,170,0.12)] hover:bg-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="relative overflow-visible h-[290px] w-full">
        {loading ? (
          <div className="flex h-full items-end gap-3 px-6 pb-6" aria-label="매출 추이 집계 중">{[35, 58, 42, 75, 48, 66, 40, 82, 62, 72].map((height, index) => <div key={index} className="flex-1 animate-pulse rounded-t-lg bg-black/5" style={{ height: `${height}%` }} />)}</div>
        ) : hasData && data ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.points} margin={{ top: 12, right: 14, left: 8, bottom: 0 }}>
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#8A8D96', fontSize: 11 }} />
              <YAxis
                width={64}
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#8A8D96', fontSize: 10 }}
                tickFormatter={(value: number) => formatAxisValue(value, currency, exchangeRate)}
              />
              <Tooltip
                cursor={{ stroke: '#8A8D96', strokeOpacity: 0.2 }}
                allowEscapeViewBox={{ x: false, y: true }}
                content={<SalesTooltip chartData={data} goalAmount={goalAmount} currency={currency} exchangeRate={exchangeRate} visibleSeries={visibleSeries} />}
              />
              {series.filter((item) => visibleSeries.includes(item.netKey)).map((item) => (
                <Line
                  key={item.netKey}
                  type="monotone"
                  dataKey={item.netKey}
                  stroke={item.color}
                  strokeOpacity={item.opacity}
                  strokeWidth={item.width}
                  strokeDasharray={item.dash || undefined}
                  connectNulls
                  dot={{ r: 3.5, fill: item.color, fillOpacity: item.opacity, stroke: '#FFFFFF', strokeWidth: 1.5 }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white/30 text-sm font-medium text-[#8A8D96]">
            조회된 매출 데이터가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
