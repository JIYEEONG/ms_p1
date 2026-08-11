// 현황 탭 상단 분석 조건 필터

'use client';

import React, { useEffect, useMemo, useState, type ReactNode } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

interface FilterOptions {
  min_date: string;
  max_date: string;
  category_large: string[];
  category_middle: string[];
  seasons: string[];
  hubs: string[];
}

interface DateParts {
  year: number;
  month: number;
  day: number;
}

type PeriodPreset = 'today' | 'week' | 'month' | 'year';
export type DisplayCurrency = 'KRW' | 'USD';

export interface OverviewFilters {
  startDate: string;
  endDate: string;
  categoryLarge: string;
  categoryMiddle: string;
  season: string;
  hub: string;
}

const selectClassName = "w-full bg-white/90 border border-white rounded-[16px] px-3 py-2.5 text-xs font-bold text-[#3F4145] focus:outline-none focus:ring-2 focus:ring-[#3F4145]/10 shadow-[0_6px_12px_-2px_rgba(140,150,170,0.12),0_2px_4px_-1px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_16px_-2px_rgba(140,150,170,0.18)] transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-60";
const dateSelectClassName = "w-full min-w-0 cursor-pointer bg-transparent px-2.5 py-2.5 text-center text-xs font-bold text-[#3F4145] outline-none";

function parseDate(value: string): DateParts {
  const [year, month, day] = value.split('-').map(Number);
  return { year, month, day };
}

function toDateValue(value: DateParts) {
  return `${value.year}-${String(value.month).padStart(2, '0')}-${String(value.day).padStart(2, '0')}`;
}

function numberRange(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function shiftDays(value: DateParts, amount: number): DateParts {
  const date = new Date(Date.UTC(value.year, value.month - 1, value.day));
  date.setUTCDate(date.getUTCDate() + amount);
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
}

function shiftMonths(value: DateParts, amount: number): DateParts {
  const targetMonth = value.month - 1 + amount;
  const year = value.year + Math.floor(targetMonth / 12);
  const month = ((targetMonth % 12) + 12) % 12 + 1;
  return { year, month, day: Math.min(value.day, daysInMonth(year, month)) };
}

function shiftYears(value: DateParts, amount: number): DateParts {
  const year = value.year + amount;
  return { year, month: value.month, day: Math.min(value.day, daysInMonth(year, value.month)) };
}

function DateDropdowns({
  value,
  minDate,
  maxDate,
  onChange,
}: {
  value: DateParts;
  minDate: DateParts;
  maxDate: DateParts;
  onChange: (value: DateParts) => void;
}) {
  const years = numberRange(minDate.year, maxDate.year);
  const months = numberRange(
    value.year === minDate.year ? minDate.month : 1,
    value.year === maxDate.year ? maxDate.month : 12,
  );
  const firstDay = value.year === minDate.year && value.month === minDate.month ? minDate.day : 1;
  const lastDay = value.year === maxDate.year && value.month === maxDate.month
    ? maxDate.day
    : daysInMonth(value.year, value.month);
  const days = numberRange(firstDay, lastDay);

  const update = (next: Partial<DateParts>) => {
    const candidate = { ...value, ...next };
    const minimumDay = candidate.year === minDate.year && candidate.month === minDate.month ? minDate.day : 1;
    const maximumDay = candidate.year === maxDate.year && candidate.month === maxDate.month
      ? maxDate.day
      : daysInMonth(candidate.year, candidate.month);
    candidate.day = Math.min(Math.max(candidate.day, minimumDay), maximumDay);
    onChange(candidate);
  };

  return (
    <div className="grid grid-cols-3 divide-x divide-black/10 overflow-hidden rounded-[16px] border border-white bg-white/90 shadow-[0_6px_12px_-2px_rgba(140,150,170,0.12),0_2px_4px_-1px_rgba(0,0,0,0.04)]">
      <select aria-label="년도" className={dateSelectClassName} value={value.year} onChange={(event) => update({ year: Number(event.target.value) })}>
        {years.map((year) => <option key={year} value={year}>{year}년</option>)}
      </select>
      <select aria-label="월" className={dateSelectClassName} value={value.month} onChange={(event) => update({ month: Number(event.target.value) })}>
        {months.map((month) => <option key={month} value={month}>{month}월</option>)}
      </select>
      <select aria-label="일" className={dateSelectClassName} value={value.day} onChange={(event) => update({ day: Number(event.target.value) })}>
        {days.map((day) => <option key={day} value={day}>{day}일</option>)}
      </select>
    </div>
  );
}

function SelectFilter({
  label,
  values,
  value,
  disabled,
  onChange,
}: {
  label: string;
  values: string[];
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-[#8A8D96] mb-1.5 ml-1">{label}</label>
      <select aria-label={label} className={selectClassName} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)}>
        <option value="전체">전체</option>
        {values.map((value) => <option key={value} value={value}>{value}</option>)}
      </select>
    </div>
  );
}

export default function FilterBar({
  onChange,
  currency = 'KRW',
  onCurrencyChange,
  children,
}: {
  onChange?: (filters: OverviewFilters) => void;
  currency?: DisplayCurrency;
  onCurrencyChange?: (currency: DisplayCurrency) => void;
  children?: ReactNode;
}) {
  const [options, setOptions] = useState<FilterOptions | null>(null);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState<DateParts | null>(null);
  const [endDate, setEndDate] = useState<DateParts | null>(null);
  const [categoryLarge, setCategoryLarge] = useState('전체');
  const [categoryMiddle, setCategoryMiddle] = useState('전체');
  const [season, setSeason] = useState('전체');
  const [hub, setHub] = useState('전체');
  const [activePreset, setActivePreset] = useState<PeriodPreset | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    if (categoryLarge !== '전체') params.set('category_large', categoryLarge);

    fetch(`${API_BASE_URL}/api/v1/dashboard/overview-filter-options?${params}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('분석 조건을 불러오지 못했습니다.');
        return response.json() as Promise<FilterOptions>;
      })
      .then((data) => {
        setOptions(data);
        setStartDate((prev) => prev ?? parseDate(data.min_date));
        setEndDate((prev) => prev ?? parseDate(data.max_date));
        setCategoryMiddle((prev) => (data.category_middle.includes(prev) ? prev : '전체'));
      })
      .catch((requestError: Error) => {
        if (requestError.name !== 'AbortError') setError(requestError.message);
      });

    return () => controller.abort();
  }, [categoryLarge]);

  const minDate = useMemo(() => options ? parseDate(options.min_date) : null, [options]);
  const maxDate = useMemo(() => options ? parseDate(options.max_date) : null, [options]);
  const loading = !options && !error;

  useEffect(() => {
    if (!startDate || !endDate) return;
    onChange?.({
      startDate: toDateValue(startDate),
      endDate: toDateValue(endDate),
      categoryLarge,
      categoryMiddle,
      season,
      hub,
    });
  }, [startDate, endDate, categoryLarge, categoryMiddle, season, hub, onChange]);

  const changeStartDate = (value: DateParts) => {
    setActivePreset(null);
    setStartDate(value);
    if (endDate && toDateValue(value) > toDateValue(endDate)) setEndDate(value);
  };

  const changeEndDate = (value: DateParts) => {
    setActivePreset(null);
    setEndDate(value);
    if (startDate && toDateValue(value) < toDateValue(startDate)) setStartDate(value);
  };

  const applyPeriodPreset = (preset: PeriodPreset) => {
    if (!minDate || !maxDate) return;

    const now = new Date();
    const today = {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      day: now.getDate(),
    };
    const referenceDate = toDateValue(today) > toDateValue(maxDate)
      ? maxDate
      : toDateValue(today) < toDateValue(minDate) ? minDate : today;
    let nextStart = referenceDate;

    if (preset === 'week') nextStart = shiftDays(referenceDate, -6);
    if (preset === 'month') nextStart = shiftDays(shiftMonths(referenceDate, -1), 1);
    if (preset === 'year') nextStart = shiftDays(shiftYears(referenceDate, -1), 1);
    if (toDateValue(nextStart) < toDateValue(minDate)) nextStart = minDate;

    setStartDate(nextStart);
    setEndDate(referenceDate);
    setActivePreset(preset);
  };

  return (
    <div className="bg-white/70 backdrop-blur-md border border-white/90 rounded-[28px] p-6 shadow-[0_20px_35px_-10px_rgba(160,175,200,0.2),inset_0_1px_2px_0_rgba(255,255,255,0.8)]">
      <div className="mb-3.5 flex items-center justify-between gap-4">
        <h3 className="text-base font-extrabold text-[#3F4145] tracking-tight">분석 조건</h3>
        <div className="flex items-center gap-3">
          {error && <p className="text-[11px] font-semibold text-red-500">{error}</p>}
          <div className="flex items-start gap-3" role="radiogroup" aria-label="표시 통화">
            <span className="pt-0.5 text-[11px] font-extrabold text-[#65676E]">표시 통화</span>
            <div className="flex flex-col gap-1.5">
              {([
                ['KRW', '원화'],
                ['USD', '달러'],
              ] as const).map(([value, label]) => {
                const selected = currency === value;
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => onCurrencyChange?.(value)}
                    className={`flex cursor-pointer items-center justify-end gap-2 text-[11px] font-bold transition ${selected ? 'text-[#3F4145]' : 'text-[#8A8D96]'}`}
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

      {children ? (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {children}
        </div>
      ) : null}

      <div className="grid grid-cols-1 items-stretch divide-y divide-black/10 lg:grid-cols-[2fr_1fr_1fr] lg:divide-x lg:divide-y-0">
        {/* 기간 열 */}
        <section className="h-full py-4 lg:pr-6" aria-labelledby="period-filter-title">
          <h4 id="period-filter-title" className="mb-4 text-sm font-extrabold text-[#3F4145]">기간</h4>
          <div className="divide-y divide-black/10">
            <div className="pb-4">
              <div className="flex flex-wrap items-center justify-start gap-2" aria-label="빠른 기간 선택">
                {([
                  ['today', '오늘'],
                  ['week', '1주일'],
                  ['month', '한달'],
                  ['year', '1년'],
                ] as const).map(([preset, label]) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => applyPeriodPreset(preset)}
                    disabled={!options}
                    aria-pressed={activePreset === preset}
                    className={`min-w-16 rounded-[12px] px-3.5 py-2 text-xs font-bold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                      activePreset === preset
                        ? 'bg-[#3F4145] text-white shadow-[0_6px_12px_-2px_rgba(63,65,69,0.25)]'
                        : 'bg-white/70 text-[#65676E] shadow-[0_4px_10px_-2px_rgba(140,150,170,0.12)] hover:bg-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="py-4">
              <SelectFilter label="시즌" values={options?.seasons ?? []} value={season} disabled={!options} onChange={setSeason} />
            </div>

            <div className="pt-4">
              <label className="mb-1.5 ml-1 block text-[11px] font-bold text-[#8A8D96]">조회 기간</label>
              {startDate && endDate && minDate && maxDate ? (
                <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
                  <DateDropdowns value={startDate} minDate={minDate} maxDate={maxDate} onChange={changeStartDate} />
                  <span className="text-xs font-bold text-[#8A8D96]">-</span>
                  <DateDropdowns value={endDate} minDate={minDate} maxDate={maxDate} onChange={changeEndDate} />
                </div>
              ) : (
                <div className={`${selectClassName} text-[#8A8D96]`}>{loading ? '기간 불러오는 중...' : '기간 정보 없음'}</div>
              )}
            </div>
          </div>
        </section>

        {/* 허브 열 */}
        <section className="h-full py-4 lg:px-6" aria-labelledby="hub-filter-title">
          <h4 id="hub-filter-title" className="mb-4 text-sm font-extrabold text-[#3F4145]">허브</h4>
          <SelectFilter label="허브" values={options?.hubs ?? []} value={hub} disabled={!options} onChange={setHub} />
        </section>

        {/* 상품 열 */}
        <section className="h-full py-4 lg:pl-6" aria-labelledby="product-filter-title">
          <h4 id="product-filter-title" className="mb-4 text-sm font-extrabold text-[#3F4145]">상품</h4>
          <div className="divide-y divide-black/10">
            <div className="pb-4">
              <SelectFilter label="대카테고리" values={options?.category_large ?? []} value={categoryLarge} disabled={!options} onChange={setCategoryLarge} />
            </div>
            <div className="pt-4">
              <SelectFilter label="중카테고리" values={options?.category_middle ?? []} value={categoryMiddle} disabled={!options} onChange={setCategoryMiddle} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
