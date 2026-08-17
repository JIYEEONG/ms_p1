// 26.08.05 UI 변경에 따른 파일 추가 현황 파악 탭 전체 조립 컴포넌트

'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import FilterBar, { DisplayCurrency, OverviewFilters } from '../dashboard/FilterBar';
import { KpiCards, OverviewKpiData } from '../dashboard/KpiCard';
import type { GoalSettings, GoalUnit } from '../dashboard/GoalModal';
import SalesTrendChart, { SalesTrendData, SalesTrendUnit } from '../charts/SalesTrendChart';
import CategorySalesChart, { CategoryDataItem } from '../charts/CategorySalesChart';
import { DashboardApiError, fetchJson } from '../../services/dashboardApi';
import { DashboardView } from '@/types/dashboard';

export default function OverviewTab({ onNavigate, allowedViews, sidebarOpen }: { onNavigate: (view: DashboardView) => void; allowedViews: DashboardView[]; sidebarOpen: boolean }) {
  // 백엔드 데이터를 보관할 State
  const [salesTrendData, setSalesTrendData] = useState<SalesTrendData | null>(null);
  const [salesTrendUnit, setSalesTrendUnit] = useState<SalesTrendUnit>('month');
  const [categorySalesData, setCategorySalesData] = useState<CategoryDataItem[]>([]);
  const [filters, setFilters] = useState<OverviewFilters | null>(null);
  const [kpiData, setKpiData] = useState<OverviewKpiData | null>(null);
  const [kpiLoading, setKpiLoading] = useState(false);
  const [kpiError, setKpiError] = useState('');
  const [trendError, setTrendError] = useState('');
  const [trendLoading, setTrendLoading] = useState(false);
  const [categoryError, setCategoryError] = useState('');
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categoryLevel, setCategoryLevel] = useState<'large' | 'middle' | 'small'>('large');
  const [goalSettings, setGoalSettings] = useState<GoalSettings>({
    day: 3287671,
    week: 23076923,
    month: 100000000,
    year: 1200000000,
  });
  const [goalUnit, setGoalUnit] = useState<GoalUnit>('year');
  const [currency, setCurrency] = useState<DisplayCurrency>('KRW');
  const exchangeRate = Number(process.env.NEXT_PUBLIC_KRW_PER_USD) || 1350;
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || '/backend';
  const handleFilterChange = useCallback((nextFilters: OverviewFilters) => {
    setKpiLoading(true);
    setTrendLoading(true);
    setCategoryLoading(true);
    setKpiError('');
    setTrendError('');
    setCategoryError('');
    setFilters(nextFilters);
  }, []);
  const handleSalesTrendUnitChange = useCallback((unit: SalesTrendUnit) => {
    setTrendLoading(true);
    setTrendError('');
    setSalesTrendUnit(unit);
  }, []);
  const handleCategoryLevelChange = useCallback((level: 'large' | 'middle' | 'small') => {
    setCategoryLoading(true);
    setCategoryError('');
    setCategoryLevel(level);
  }, []);
  const handleGoalSettingsChange = useCallback((goals: GoalSettings, unit: GoalUnit) => {
    setGoalSettings(goals);
    setGoalUnit(unit);
  }, []);
  const periodDays = useMemo(() => {
    if (!filters) return 1;
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const effectiveEndDate = filters.endDate < today ? filters.endDate : today;
    return Math.max(
      1,
      Math.round((Date.parse(effectiveEndDate) - Date.parse(filters.startDate)) / 86400000) + 1,
    );
  }, [filters]);
  const goalAmount = useMemo(() => {
    if (!filters) return goalSettings[goalUnit];
    const factor = {
      day: periodDays,
      week: periodDays / 7,
      month: periodDays / (365 / 12),
      year: periodDays / 365,
    }[goalUnit];
    return goalSettings[goalUnit] * factor;
  }, [filters, goalSettings, goalUnit, periodDays]);

  // 카테고리별 매출 API 호출
  useEffect(() => {
    if (!filters) return;
    const params = new URLSearchParams({ start_date: filters.startDate, end_date: filters.endDate, level: categoryLevel });
    if (filters.categoryLarge !== '전체') params.set('category_large', filters.categoryLarge);
    if (filters.categoryMiddle !== '전체') params.set('category_middle', filters.categoryMiddle);
    if (filters.season !== '전체') params.set('season', filters.season);
    if (filters.hub !== '전체') params.set('hub', filters.hub);
    fetchJson<CategoryDataItem[]>(`${apiBaseUrl}/api/v1/dashboard/category-sales?${params}`, '카테고리별 매출 조회 실패')
      .then((data) => setCategorySalesData(data))
      .catch((err: DashboardApiError) => {
        setCategoryError(err.type === 'NETWORK_ERROR' ? '서버에 연결할 수 없습니다.' : err.message);
      })
      .finally(() => setCategoryLoading(false));
  }, [apiBaseUrl, filters, categoryLevel]);

  // 목표 설정값을 백엔드에서 불러오기 (최초 1회)
  useEffect(() => {
    fetch(`${apiBaseUrl}/api/v1/dashboard/goal-settings`)
      .then((res) => {
        if (!res.ok) throw new Error('목표 설정을 불러오지 못했습니다.');
        return res.json();
      })
      .then((data) => {
        setGoalSettings({
          day: data.day_amount,
          week: data.week_amount,
          month: data.month_amount,
          year: data.year_amount,
        });
      })
      .catch((err) => console.error('Goal settings fetch error:', err));
  }, [apiBaseUrl]);

  useEffect(() => {
    if (!filters) return;

    const controller = new AbortController();
    const params = new URLSearchParams({
      start_date: filters.startDate,
      end_date: filters.endDate,
    });
    if (filters.categoryLarge !== '전체') params.set('category_large', filters.categoryLarge);
    if (filters.categoryMiddle !== '전체') params.set('category_middle', filters.categoryMiddle);
    if (filters.season !== '전체') params.set('season', filters.season);
    if (filters.hub !== '전체') params.set('hub', filters.hub);

    fetchJson<OverviewKpiData>(
      `${apiBaseUrl}/api/v1/dashboard/overview-kpis?${params}`,
      'KPI 데이터를 불러오지 못했습니다.',
      { signal: controller.signal },
    )
      .then(setKpiData)
      .catch((requestError: DashboardApiError | DOMException) => {
        if (requestError.name === 'AbortError') return;
        const err = requestError as DashboardApiError;
        setKpiError(
          err.type === 'NETWORK_ERROR' ? '서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.' : err.message,
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setKpiLoading(false);
      });

    return () => controller.abort();
  }, [filters, apiBaseUrl]);

  useEffect(() => {
    if (!filters) return;

    const controller = new AbortController();
    const params = new URLSearchParams({
      start_date: filters.startDate,
      end_date: filters.endDate,
      unit: salesTrendUnit,
    });
    if (filters.categoryLarge !== '전체') params.set('category_large', filters.categoryLarge);
    if (filters.categoryMiddle !== '전체') params.set('category_middle', filters.categoryMiddle);
    if (filters.season !== '전체') params.set('season', filters.season);
    if (filters.hub !== '전체') params.set('hub', filters.hub);

    fetchJson<SalesTrendData>(
      `${apiBaseUrl}/api/v1/dashboard/sales-trend?${params}`,
      '순매출 추이 데이터를 불러오지 못했습니다.',
      { signal: controller.signal },
    )
      .then((data) => { setTrendError(''); setSalesTrendData(data); })
      .catch((requestError: DashboardApiError | DOMException) => {
        if (requestError.name === 'AbortError') return;
        const err = requestError as DashboardApiError;
        setTrendError(err.type === 'NETWORK_ERROR' ? '서버에 연결할 수 없습니다.' : err.message);
      })
      .finally(() => { if (!controller.signal.aborted) setTrendLoading(false); });

    return () => controller.abort();
  }, [filters, salesTrendUnit, apiBaseUrl]);

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h2 className="page-on-dark-title text-2xl font-extrabold tracking-tight">매출 현황</h2>
        <p className="page-on-dark-copy mt-1 text-xs">매출과 순이익, 목표 달성 및 카테고리별 수익성을 확인합니다.</p>
      </div>

      {/* 1. 페이지 최상단 조건 필터 */}
      <section id="overview-filters" className="scroll-mt-4">
        <FilterBar
          onChange={handleFilterChange}
          currency={currency}
          onCurrencyChange={setCurrency}
          sidebarOpen={sidebarOpen}
        />
      </section>

      {/* 2. 목표와 달성 */}
      <section>
        <KpiCards
          data={kpiData}
          loading={kpiLoading}
          error={kpiError}
          goalAmount={goalAmount}
          goalSettings={goalSettings}
          goalUnit={goalUnit}
          onGoalSettingsChange={handleGoalSettingsChange}
          currency={currency}
          exchangeRate={exchangeRate}
          periodDays={periodDays}
        />
      </section>

      {/* 4. 순매출 추이 */}
      <section>
        {trendError && <p className="text-sm text-red-500 mb-2">{trendError}</p>}
        <SalesTrendChart
          data={salesTrendData}
          unit={salesTrendUnit}
          onUnitChange={handleSalesTrendUnitChange}
          goalAmount={goalAmount}
          currency={currency}
          exchangeRate={exchangeRate}
          loading={trendLoading}
        />
      </section>

      {/* 5. 카테고리별 매출 */}
      <section>
        <div className="h-full">
          {categoryError && <p className="text-sm text-red-500 mb-2">{categoryError}</p>}
          <CategorySalesChart data={categorySalesData} loading={categoryLoading} level={categoryLevel} onLevelChange={handleCategoryLevelChange} onNavigateToProduct={() => onNavigate('product')} />
        </div>
      </section>

    </div>
  );
}
