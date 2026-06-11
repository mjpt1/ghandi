'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthApi } from '@/lib/api';
import { homeOf, useAuth, UserRole } from '@/stores/auth';

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuth((s) => s.setAuth);
  const [form, setForm] = useState({ fullName: '', phone: '', password: '', role: 'PATIENT' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await AuthApi.register(form);
      const role = res.role as UserRole;
      setAuth({ accessToken: res.accessToken, refreshToken: res.refreshToken, role });
      router.push(homeOf(role));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در ثبت‌نام');
    } finally {
      setLoading(false);
    }
  };

  const input =
    'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-teal-400/50';

  return (
    <main className="grid min-h-screen place-items-center px-4">
      <div className="glass-card w-full max-w-md !p-8">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-teal-400 to-sky-400 text-2xl shadow-lg shadow-teal-500/25">
            🩸
          </div>
          <h1 className="text-xl font-extrabold">ساخت حساب گلوسیا</h1>
          <p className="txt2 mt-1 text-sm">چند ثانیه تا شروع مدیریت هوشمند دیابت</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="txt2 mb-1.5 block text-xs">نام و نام خانوادگی</label>
            <input value={form.fullName} onChange={set('fullName')} className={input} required />
          </div>
          <div>
            <label className="txt2 mb-1.5 block text-xs">شماره موبایل</label>
            <input dir="ltr" value={form.phone} onChange={set('phone')} placeholder="09123456789" className={input} required />
          </div>
          <div>
            <label className="txt2 mb-1.5 block text-xs">رمز عبور (حداقل ۸ کاراکتر)</label>
            <input dir="ltr" type="password" value={form.password} onChange={set('password')} className={input} required />
          </div>

          <div>
            <label className="txt2 mb-1.5 block text-xs">نوع حساب</label>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ['PATIENT', '🧑 بیمار'],
                  ['DOCTOR', '🩺 پزشک'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, role: value }))}
                  className={`rounded-xl border py-3 text-sm transition ${
                    form.role === value
                      ? 'border-teal-400/60 bg-teal-400/10 font-bold'
                      : 'border-white/10 bg-white/5'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {form.role === 'DOCTOR' && (
              <p className="txt2 mt-2 text-[11px]">
                حساب پزشک پس از بررسی مدارک نظام پزشکی توسط ادمین فعال می‌شود.
              </p>
            )}
          </div>

          {error && (
            <p className="rounded-xl bg-red-400/10 px-4 py-3 text-xs text-red-300">{error}</p>
          )}

          <button
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-l from-teal-400 to-sky-400 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'در حال ساخت حساب…' : 'ثبت‌نام'}
          </button>
        </form>

        <p className="txt2 mt-6 text-center text-xs">
          قبلاً ثبت‌نام کرده‌اید؟{' '}
          <Link href="/login" className="font-bold text-teal-300 hover:underline">
            وارد شوید
          </Link>
        </p>
      </div>
    </main>
  );
}
