// 26.08.10 역할별 접근 제어 - 비밀번호 하나로 CEO/MD/재고담당자 자동 판별
'use client';

import { useState } from 'react';

export type UserRole = 'ceo' | 'md' | 'stock' | null;

interface AccessGateProps {
  onUnlock: (role: UserRole) => void;
}

export default function AccessGate({ onUnlock }: AccessGateProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || loading) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/dashboard/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (data.success) {
        // 세션 동안 유지 (새로고침해도 다시 안 물어봄, 탭/브라우저 닫으면 초기화)
        sessionStorage.setItem('dashboard_role', data.role);
        onUnlock(data.role);
      } else {
        setError('비밀번호가 올바르지 않습니다.');
      }
    } catch (err) {
      setError('인증 서버에 연결할 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-900/95 backdrop-blur-xl">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white/95 backdrop-blur-md rounded-[32px] p-8 shadow-2xl border border-white"
      >
        <div className="w-12 h-12 rounded-2xl bg-[#3F4145] text-white flex items-center justify-center font-bold text-sm mb-5 shadow-[0_4px_10px_rgba(0,0,0,0.15)]">
          MD
        </div>
        <h2 className="text-lg font-extrabold text-[#3F4145] mb-1">ZERO</h2>
        <p className="text-xs text-[#8A8D96] mb-6">비밀번호를 입력하면 권한에 맞는 화면으로 이동합니다.</p>

        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-slate-500 bg-white mb-3"
        />

        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#3F4145] text-white py-3 rounded-xl font-bold text-sm hover:bg-slate-700 disabled:bg-gray-300 transition-colors cursor-pointer"
        >
          {loading ? '확인 중...' : '입장하기'}
        </button>
      </form>
    </div>
  );
}