'use client';

/**
 * داشبورد بیمار گلوسیا
 * در حالت دمو با داده نمونه کار می‌کند؛ هوک‌های GlucoseApi / AiApi برای اتصال واقعی آماده‌اند.
 */
import { useEffect, useState } from 'react';
import { faNum, jalaliDate } from '@/lib/fa';
import { StatCard } from '@/components/dashboard/StatCard';
import { GlucoseChart } from '@/components/dashboard/GlucoseChart';
import { TimeInRange } from '@/components/dashboard/TimeInRange';
import { AiCoach } from '@/components/dashboard/AiCoach';
import { MealsCard } from '@/components/dashboard/MealsCard';
import { MedsCard } from '@/components/dashboard/MedsCard';

export default function DashboardPage() {
  const [dark, setDark] = useState(true);
  const [today, setToday] = useState('');

  useEffect(() => setToday(jalaliDate()), []);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  return (
    <main className="mx-auto max-w-7xl px-5 py-7">
      {/* ---------- هدر ---------- */}
      <header className="mb-7 flex flex-wrap items-center gap-4">
        <div>
          <h1 className="text-xl font-extrabold">سلام، محسن عزیز 👋</h1>
          <p className="txt2 mt-1 text-sm">{today} · امروز وضعیت قند شما عالی است</p>
        </div>
        <div className="grow" />
        <button
          onClick={() => setDark(!dark)}
          className="glass-card !rounded-2xl !px-4 !py-2.5 text-sm"
        >
          {dark ? '☀️ حالت روشن' : '🌙 حالت تاریک'}
        </button>
      </header>

      {/* ---------- کارت‌های آمار ---------- */}
      <section className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="قند خون فعلی" value={faNum(112)} unit="mg/dL" trend="پایدار · در محدوده هدف" tone="ok" live />
        <StatCard label="میانگین هفتگی" value={faNum(128)} unit="mg/dL" trend={`↓ ٪${faNum(6)} بهتر از هفته قبل`} tone="good" />
        <StatCard label="HbA1c تخمینی" value={`٪${faNum('6.4').replace('.', '٫')}`} trend={`↓ ${faNum('0.3').replace('.', '٫')} واحد در ۳ ماه`} tone="good" />
        <StatCard label="امتیاز سلامتی" value={faNum(82)} unit={`از ${faNum(100)}`} trend={`↑ ${faNum(4)} امتیاز این هفته`} tone="ok" />
      </section>

      {/* ---------- نمودار قند + TIR ---------- */}
      <section className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="glass-card xl:col-span-2">
          <h3 className="font-bold">روند قند خون ۲۴ ساعت گذشته</h3>
          <p className="txt2 mb-4 text-xs">محدوده هدف: ۷۰ تا ۱۸۰ میلی‌گرم بر دسی‌لیتر</p>
          <GlucoseChart />
        </div>
        <div className="glass-card">
          <h3 className="font-bold">زمان در محدوده هدف (TIR)</h3>
          <p className="txt2 mb-4 text-xs">۷ روز گذشته</p>
          <TimeInRange />
        </div>
      </section>

      {/* ---------- AI + تغذیه + دارو ---------- */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <AiCoach />
        <MealsCard />
        <MedsCard />
      </section>
    </main>
  );
}
