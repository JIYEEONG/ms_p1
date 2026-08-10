// 26.08.05 UI 변경에 따른 파일 추가 현황 파악 탭 전체 조립 컴포넌트

'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import FilterBar, { DisplayCurrency, OverviewFilters } from '../dashboard/FilterBar';
import KpiCards, { AchievementBanner, OverviewKpiData } from '../dashboard/KpiCard';
import type { GoalSettings, GoalUnit } from '../dashboard/GoalModal';
import SalesTrendChart, { SalesTrendData, SalesTrendUnit } from '../charts/SalesTrendChart';
import SalesEfficiency from '../dashboard/SalesEfficiency';
import CategorySalesChart from '../charts/CategorySalesChart';
import InventoryStatus from '../dashboard/InventoryStatus';
import RiskSkuTable from '../dashboard/RiskSkuTable';

export default function OverviewTab() {
  // 백엔드 데이터를 보관할 State
  const [salesTrendData, setSalesTrendData] = useState<SalesTrendData | null>(null);
  const [salesTrendUnit, setSalesTrendUnit] = useState<SalesTrendUnit>('month');
  const [categorySalesData, setCategorySalesData] = useState([]);
  const [filters, setFilters] = useState<OverviewFilters | null>(null);
  const [kpiData, setKpiData] = useState<OverviewKpiData | null>(null);
  const [kpiLoading, setKpiLoading] = useState(false);
  const [kpiError, setKpiError] = useState('');
  const [goalSettings, setGoalSettings] = useState<GoalSettings>({
    day: 3287671,
    week: 23076923,
    month: 100000000,
    year: 1200000000,
  });
  const [goalUnit, setGoalUnit] = useState<GoalUnit>('year');
  const [currency, setCurrency] = useState<DisplayCurrency>('KRW');
  const exchangeRate = Number(process.env.NEXT_PUBLIC_KRW_PER_USD) || 1350;
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const handleFilterChange = useCallback((nextFilters: OverviewFilters) => {
    setKpiLoading(true);
    setKpiError('');
    setFilters(nextFilters);
  }, []);
  const handleGoalSettingsChange = useCallback((goals: GoalSettings, unit: GoalUnit) => {
    setGoalSettings(goals);
    setGoalUnit(unit);
  }, []);
  const goalAmount = useMemo(() => {
    if (!filters) return goalSettings[goalUnit];
    const periodDays = Math.max(
      1,
      Math.round((Date.parse(filters.endDate) - Date.parse(filters.startDate)) / 86400000) + 1,
    );
    const factor = {
      day: periodDays,
      week: periodDays / 7,
      month: periodDays / (365 / 12),
      year: periodDays / 365,
    }[goalUnit];
    return goalSettings[goalUnit] * factor;
  }, [filters, goalSettings, goalUnit]);

  // 카테고리별 매출 API 호출
  useEffect(() => {
    fetch(`${apiBaseUrl}/api/v1/dashboard/category-sales`)
      .then((res) => res.json())
      .then((data) => setCategorySalesData(data))
      .catch((err) => console.error('Category sales fetch error:', err));
  }, [apiBaseUrl]);

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

    fetch(`${apiBaseUrl}/api/v1/dashboard/overview-kpis?${params}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('KPI 데이터를 불러오지 못했습니다.');
        return response.json() as Promise<OverviewKpiData>;
      })
      .then(setKpiData)
      .catch((requestError: Error) => {
        if (requestError.name !== 'AbortError') setKpiError(requestError.message);
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

    fetch(`${apiBaseUrl}/api/v1/dashboard/sales-trend?${params}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('순매출 추이 데이터를 불러오지 못했습니다.');
        return response.json() as Promise<SalesTrendData>;
      })
      .then(setSalesTrendData)
      .catch((requestError: Error) => {
        if (requestError.name !== 'AbortError') console.error(requestError.message);
      });

    return () => controller.abort();
  }, [filters, salesTrendUnit, apiBaseUrl]);

  return (
    <div className="space-y-6 pb-12">
      {/* 1. 페이지 최상단 목표 달성 현황 */}
      <section>
        <AchievementBanner data={kpiData} goalAmount={goalAmount} loading={kpiLoading} />
      </section>

      {/* 2. 상단 조건 필터 */}
      <section>
        <FilterBar
          onChange={handleFilterChange}
          currency={currency}
          onCurrencyChange={setCurrency}
        />
      </section>

      {/* 3. 목표와 달성 */}
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
        />
      </section>

      {/* 4. 순매출 추이 */}
      <section>
        <SalesTrendChart
          data={salesTrendData}
          unit={salesTrendUnit}
          onUnitChange={setSalesTrendUnit}
          goalAmount={goalAmount}
          currency={currency}
          exchangeRate={exchangeRate}
        />
      </section>

      {/* 5. 판매 효율 */}
      <section>
        <SalesEfficiency />
      </section>

      {/* 6. 카테고리별 매출 (좌 2칸) + 재고/위험 상태 (우 1칸) */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        <div className="lg:col-span-2 h-full">
          {/* data 전달 */}
          <CategorySalesChart data={categorySalesData} />
        </div>
        <div className="lg:col-span-1 h-full">
          <InventoryStatus />
        </div>
      </section>

      {/* 5. 우선 확인 위험 SKU 테이블 (전체 너비) */}
      <section>
        <RiskSkuTable />
      </section>
    </div>
  );
}
