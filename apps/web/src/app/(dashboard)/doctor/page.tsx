'use client';

/** پنل پزشک — لیست بیماران با وضعیت قند */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PatientsApi } from '@/lib/api';
import { faNum } from '@/lib/fa';

interface Row {
  id: string;
  fullName: string;
  phone: string;
  diabetesType: string;
  healthScore: number;
  avg7: number | null;
  logsCount7d: number;
}

// داده نمونه برای حالت پیش‌نمایش (وقتی بک‌اند بالا نیست)
const demo: Row[] = [
  { id: 'demo1', fullName: 'محسن رضایی', phone: '۰۹۱۲***۴۵۶۷', diabetesType: 'TYPE2', healthScore: 82, avg7: 128, logsCount7d: 21 },
  { id: 'demo2', fullName: 'فاطمه احمدی', phone: '۰۹۳۵***۸۸۲۱', diabetesType: 'TYPE1', healthScore: 64, avg7: 176, logsCount7d: 35 },
  { id: 'demo3', fullName: 'علی محمدی', phone: '۰۹۱۹***۲۲۴۰', diabetesType: 'TYPE2', healthScore: 91, avg7: 112, logsCount7d: 14 },
  { id: 'demo4', fullName: 'زهرا کریمی', phone: '۰۹۰۱***۶۷۷۳', diabetesType: 'GESTATIONAL', healthScore: 47, avg7: 198, logsCount7d: 8 },
];

const typeFa: Record<string, string> = {
  TYPE1: 'نوع ۱',
  TYPE2: 'نوع ۲',
  GESTATIONAL: 'بارداری',
  PREDIABETES: 'پیش‌دیابت',
};

function avgBadge(avg: number | null) {
  if (avg === null) return <span className="txt2 text-xs">بدون داده</span>;
  const cls =
    avg <= 154
      ? 'bg-emerald-400/10 text-emerald-300'
      : avg <= 180
        ? 'bg-amber-400/10 text-amber-300'
        : 'bg-red-400/10 text-red-300';
  return <span className={`rounded-full px-3 py-1 text-xs font-bold ${cls}`}>{faNum(avg)} mg/dL</span>;
}

export default function DoctorPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    PatientsApi.list()
      .then((r) => setRows(r as Row[]))
      .catch(() => {
        setRows(demo);
        setOffline(true);
      });
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-5 py-7">
      <header className="mb-6 flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-xl font-extrabold">🩺 پنل پزشک — بیماران من</h1>
          <p className="txt2 mt-1 text-sm">{faNum(rows.length)} بیمار تحت نظر</p>
        </div>
        {offline && (
          <span className="mr-auto rounded-full bg-amber-400/10 px-3 py-1.5 text-xs text-amber-300">
            حالت پیش‌نمایش — داده نمونه
          </span>
        )}
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {rows.map((p) => (
          <Link key={p.id} href={`/doctor/${p.id}`} className="glass-card block">
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-400 to-pink-400 font-extrabold text-white">
                {p.fullName.charAt(0)}
              </div>
              <div className="min-w-0">
                <b className="block truncate">{p.fullName}</b>
                <span className="txt2 text-xs">
                  دیابت {typeFa[p.diabetesType] ?? p.diabetesType} · {faNum(p.logsCount7d)} اندازه‌گیری در هفته
                </span>
              </div>
              <div className="mr-auto text-left">
                {avgBadge(p.avg7)}
                <div className="txt2 mt-1.5 text-[11px]">امتیاز سلامتی: {faNum(p.healthScore)}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
