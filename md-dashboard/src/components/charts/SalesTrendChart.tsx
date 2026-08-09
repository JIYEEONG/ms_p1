'use client';

import React from 'react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { DisplayCurrency } from '../dashboard/FilterBar';

export type SalesTrendUnit = 'week' | 'month' | 'year';

export interface SalesTrendPoint {
  label: string;
  period_start: string;
  period_days: number;
  current_net_sales: number;
  current_gross_sales: number;
  previous_net_sales: number;
  previous_gross_sales: number;
  two_year_net_sales: number;
  two_year_gross_sales: number;
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
  { netKey: 'current_net_sales', grossKey: 'current_gross_sales', labelKey: 'current_label', opacity: 1, width: 2, dash: '' },
  { netKey: 'previous_net_sales', grossKey: 'previous_gross_sales', labelKey: 'previous_label', opacity: 0.45, width: 1.4, dash: '8 5' },
  { netKey: 'two_year_net_sales', grossKey: 'two_year_gross_sales', labelKey: 'two_year_label', opacity: 0.45, width: 1, dash: '2 5' },
] as const;

type SeriesKey = (typeof series)[number]['netKey'];

function formatMoney(value: number, currency: DisplayCurrency, exchangeRate: number) {
  if (currency === 'USD') {
    return `$${(value / exchangeRate).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  }
  return `${Math.round(value).toLocaleString()}원`;
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

  return (
    <div className="min-w-56 rounded-[16px] border border-white/90 bg-white/95 p-4 shadow-[0_12px_28px_-10px_rgba(63,65,69,0.25)] backdrop-blur-md">
      <p className="mb-3 text-xs font-extrabold text-[#3F4145]">{point.label}</p>
      <div className="space-y-3">
        {series.filter((item) => visibleSeries.includes(item.netKey)).map((item) => {
          const netSales = Number(point[item.netKey] ?? 0);
          const grossSales = Number(point[item.grossKey] ?? 0);
          return (
            <div key={item.netKey} style={{ opacity: item.opacity }}>
              <p className="text-[10px] font-bold text-[#8A8D96]">{chartData[item.labelKey]}</p>
              <p className="text-sm font-black text-[#3F4145]">순매출 {formatMoney(netSales, currency, exchangeRate)}</p>
              <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] font-semibold text-[#8A8D96]">
                <span>총매출 {formatMoney(grossSales, currency, exchangeRate)}</span>
                <span>목표매출 {formatMoney(pointGoal, currency, exchangeRate)}</span>
              </div>
            </div>
          );
        })}
      </div>
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
}: {
  data: SalesTrendData | null;
  unit: SalesTrendUnit;
  onUnitChange: (unit: SalesTrendUnit) => void;
  goalAmount: number;
  currency: DisplayCurrency;
  exchangeRate: number;
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
    <div className="flex min-h-[430px] h-full flex-col justify-between rounded-[32px] border border-white/70 bg-white/50 p-6 shadow-sm backdrop-blur-xl">
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
                      <span className="grid h-3.5 w-3.5 place-items-center rounded-full border border-[#8A8D96]" aria-hidden="true">
                        {selected && <span className="h-1.5 w-1.5 rounded-full bg-[#3F4145]" />}
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

      <div className="h-[290px] w-full">
        {hasData && data ? (
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
                content={<SalesTooltip chartData={data} goalAmount={goalAmount} currency={currency} exchangeRate={exchangeRate} visibleSeries={visibleSeries} />}
              />
              {series.filter((item) => visibleSeries.includes(item.netKey)).map((item) => (
                <Line
                  key={item.netKey}
                  type="monotone"
                  dataKey={item.netKey}
                  stroke="#3F4145"
                  strokeOpacity={item.opacity}
                  strokeWidth={item.width}
                  strokeDasharray={item.dash || undefined}
                  connectNulls
                  dot={{ r: 3.5, fill: '#3F4145', fillOpacity: item.opacity, stroke: '#FFFFFF', strokeWidth: 1.5 }}
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
