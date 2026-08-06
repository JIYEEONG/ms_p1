// 26.08.05 UI 변경에 따른 타입 스크립트 추가

export type DashboardView = 'overview' | 'hub' | 'product' | 'forecast';

export interface NavItem {
  id: DashboardView;
  label: string;
}