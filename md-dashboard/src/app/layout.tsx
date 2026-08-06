// 26.08.04 수정 (민)

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MD 대시보드 - 2팀',
  description: 'AI & Data-driven MD Dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
} 
