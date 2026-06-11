'use client';

/** پنل ادمین — آمار سیستم و مدیریت کاربران */
import { useEffect, useState } from 'react';
import { AdminApi } from '@/lib/api';
import { faNum } from '@/lib/fa';

interface UserRow {
  id: string;
  fullName: string;
  phone: string;
  role: 'PATIENT' | 'DOCTOR' | 'ADMIN';
  isActive: boolean;
  createdAt: string;
}

const demoStats = { patients: 1240, doctors: 86, admins: 3, glucoseLogs: 184500, meals: 42300, insights: 9800, activeSubs: 312, audit24h: 1450 };
const demoUsers: UserRow[] = [
  { id: 'u1', fullName: 'محسن رضایی', phone: '09120001111', role: 'PATIENT', isActive: true, createdAt: '' },
  { id: 'u2', fullName: 'دکتر سارا موسوی', phone: '09120002222', role: 'DOCTOR', isActive: true, createdAt: '' },
  { id: 'u3', fullName: 'علی محمدی', phone: '09120003333', role: 'PATIENT', isActive: false, createdAt: '' },
  { id: 'u4', fullName: 'دکتر رضا کاظمی', phone: '09120004444', role: 'DOCTOR', isActive: false, createdAt: '' },
];

const roleFa: Record<string, { label: string; cls: string }> = {
  PATIENT: { label: 'بیمار', cls: 'bg-sky-400/10 text-sky-300' },
  DOCTOR: { label: 'پزشک', cls: 'bg-violet-400/10 text-violet-300' },
  ADMIN: { label: 'ادمین', cls: 'bg-amber-400/10 text-amber-300' },
};

export default function AdminPage() {
  const [stats, setStats] = useState(demoStats);
  const [users, setUsers] = useState<UserRow[]>(demoUsers);
  const [q, setQ] = useState('');
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    AdminApi.stats().then(setStats).catch(() => setOffline(true));
    AdminApi.users().then((u) => setUsers(u as UserRow[])).catch(() => {});
  }, []);

  const toggle = async (id: string) => {
    setUsers((arr) => arr.map((u) => (u.id === id ? { ...u, isActive: !u.isActive } : u)));
    if (!offline) AdminApi.toggle(id).catch(() => {});
  };

  const filtered = users.filter(
    (u) => u.fullName.includes(q) || u.phone.includes(q),
  );

  const cards = [
    { label: 'بیماران', value: stats.patients, icon: '🧑‍🤝‍🧑' },
    { label: 'پزشکان', value: stats.doctors, icon: '🩺' },
    { label: 'اندازه‌گیری قند', value: stats.glucoseLogs, icon: '🩸' },
    { label: 'وعده‌های ثبت‌شده', value: stats.meals, icon: '🍽️' },
    { label: 'بینش‌های AI', value: stats.insights, icon: '🤖' },
    { label: 'اشتراک فعال', value: stats.activeSubs, icon: '⭐' },
    { label: 'رویداد ۲۴ ساعت', value: stats.audit24h, icon: '🛡️' },
  ];

  return (
    <main className="mx-auto max-w-6xl px-5 py-7">
      <header className="mb-6 flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-xl font-extrabold">⚙️ پنل ادمین گلوسیا</h1>
          <p className="txt2 mt-1 text-sm">مانیتورینگ سیستم و مدیریت کاربران</p>
        </div>
        {offline && (
          <span className="mr-auto rounded-full bg-amber-400/10 px-3 py-1.5 text-xs text-amber-300">
            حالت پیش‌نمایش — داده نمونه
          </span>
        )}
      </header>

      {/* ---------- آمار ---------- */}
      <section className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        {cards.map((c) => (
          <div key={c.label} className="glass-card !p-4 text-center">
            <div className="text-xl">{c.icon}</div>
            <div className="mt-1 text-lg font-extrabold">{faNum(c.value.toLocaleString('en-US').replace(/,/g, '،'))}</div>
            <div className="txt2 text-[11px]">{c.label}</div>
          </div>
        ))}
      </section>

      {/* ---------- کاربران ---------- */}
      <section className="glass-card">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h3 className="font-bold">مدیریت کاربران</h3>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="جستجوی نام یا شماره…"
            className="mr-auto w-64 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs outline-none transition focus:border-teal-400/50"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="txt2 border-b border-white/10 text-right text-xs">
                <th className="py-3 font-normal">نام</th>
                <th className="font-normal">شماره</th>
                <th className="font-normal">نقش</th>
                <th className="font-normal">وضعیت</th>
                <th className="font-normal">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-dashed border-white/5 last:border-0">
                  <td className="py-3.5 font-bold">{u.fullName}</td>
                  <td dir="ltr" className="text-right">{faNum(u.phone)}</td>
                  <td>
                    <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${roleFa[u.role].cls}`}>
                      {roleFa[u.role].label}
                    </span>
                  </td>
                  <td>
                    <span className={`text-xs ${u.isActive ? 'text-emerald-300' : 'text-red-300'}`}>
                      {u.isActive ? '● فعال' : '● غیرفعال'}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => toggle(u.id)}
                      className={`rounded-lg px-3 py-1.5 text-[11px] font-bold transition ${
                        u.isActive
                          ? 'bg-red-400/10 text-red-300 hover:bg-red-400/20'
                          : 'bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/20'
                      }`}
                    >
                      {u.isActive ? 'غیرفعال‌سازی' : 'فعال‌سازی'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
