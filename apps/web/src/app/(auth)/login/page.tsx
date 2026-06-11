'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthApi } from '@/lib/api';
import { homeOf, useAuth, UserRole } from '@/stores/auth';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuth((s) => s.setAuth);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await AuthApi.login(phone, password);
      const role = res.role as UserRole;
      setAuth({ accessToken: res.accessToken, refreshToken: res.refreshToken, role });
      router.push(homeOf(role));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در ورود');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center px-4">
      <div className="glass-card w-full max-w-md !p-8">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-teal-400 to-sky-400 text-2xl shadow-lg shadow-teal-500/25">
            🩸
          </div>
          <h1 className="text-xl font-extrabold">ورود به گلوسیا</h1>
          <p className="txt2 mt-1 text-sm">مدیریت هوشمند دیابت</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="txt2 mb-1.5 block text-xs">شماره موبایل</label>
            <input
              dir="ltr"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="09123456789"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-teal-400/50"
              required
            />
          </div>
          <div>
            <label className="txt2 mb-1.5 block text-xs">رمز عبور</label>
            <input
              dir="ltr"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-teal-400/50"
              required
            />
          </div>

          {error && (
            <p className="rounded-xl bg-red-400/10 px-4 py-3 text-xs text-red-300">{error}</p>
          )}

          <button
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-l from-teal-400 to-sky-400 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'در حال ورود…' : 'ورود'}
          </button>
        </form>

        <p className="txt2 mt-6 text-center text-xs">
          حساب ندارید؟{' '}
          <Link href="/register" className="font-bold text-teal-300 hover:underline">
            ثبت‌نام کنید
          </Link>
        </p>
      </div>
    </main>
  );
}
