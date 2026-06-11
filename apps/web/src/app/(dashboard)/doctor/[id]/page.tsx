'use client';

/** پرونده بیمار + تحلیل بالینی AI + نسخه‌نویسی قابل چاپ */
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ClinicalAiApi, PatientsApi, RxApi } from '@/lib/api';
import { faNum, jalaliDate, jalaliTime } from '@/lib/fa';
import { GlucoseChart, GlucosePoint } from '@/components/dashboard/GlucoseChart';

interface RxItem {
  drugName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instruction?: string;
}

const emptyItem: RxItem = { drugName: '', dosage: '', frequency: '', duration: '', instruction: '' };

const demoInsights = [
  { title: 'الگوی افت قند شبانه', body: 'در ۳ نوبت بین ساعت ۰۰ تا ۰۶ قند زیر ۷۰ ثبت شده است. بازبینی دوز انسولین پایه توصیه می‌شود.', severity: 'HIGH' },
  { title: 'روند نزولی کنترل قند', body: 'میانگین قند هفته اخیر ۱۸ واحد بالاتر از هفته قبل است. وضعیت بیمار طی ۲ هفته اخیر بدتر شده است.', severity: 'MEDIUM' },
];

const sevCls: Record<string, string> = {
  CRITICAL: 'border-red-400/40 bg-red-400/10',
  HIGH: 'border-red-400/30 bg-red-400/5',
  MEDIUM: 'border-amber-400/30 bg-amber-400/5',
  INFO: 'border-teal-400/30 bg-teal-400/5',
  LOW: 'border-teal-400/30 bg-teal-400/5',
};

export default function PatientFilePage() {
  const { id } = useParams<{ id: string }>();
  const [name, setName] = useState('بیمار نمونه');
  const [chart, setChart] = useState<GlucosePoint[] | undefined>(undefined);
  const [insights, setInsights] = useState(demoInsights);
  const [offline, setOffline] = useState(false);

  // فرم نسخه
  const [rx, setRx] = useState({ diagnosis: '', notes: '', dietPlan: '', exercisePlan: '' });
  const [items, setItems] = useState<RxItem[]>([{ ...emptyItem }]);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    PatientsApi.detail(id)
      .then((p: any) => {
        setName(p.user.fullName);
        const pts = [...p.glucoseLogs]
          .reverse()
          .slice(-30)
          .map((l: any) => ({ hour: jalaliTime(new Date(l.measuredAt)), value: l.valueMgDl }));
        if (pts.length) setChart(pts);
      })
      .catch(() => setOffline(true));
    ClinicalAiApi.analyze(id)
      .then((r: any[]) => r.length && setInsights(r))
      .catch(() => {});
  }, [id]);

  const setItem = (i: number, k: keyof RxItem, v: string) =>
    setItems((arr) => arr.map((x, j) => (j === i ? { ...x, [k]: v } : x)));

  const submitRx = async () => {
    setMsg('');
    try {
      await RxApi.create({ patientId: id, ...rx, items: items.filter((i) => i.drugName) });
      setMsg('✅ نسخه با موفقیت صادر و به بیمار اطلاع‌رسانی شد');
    } catch (e) {
      setMsg(offline ? '✅ نسخه در حالت پیش‌نمایش ثبت شد (بک‌اند متصل نیست)' : `❌ ${e instanceof Error ? e.message : 'خطا'}`);
    }
  };

  const inputCls =
    'w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none transition focus:border-teal-400/50';

  return (
    <main className="mx-auto max-w-6xl px-5 py-7">
      <header className="mb-6 flex flex-wrap items-center gap-3 print:hidden">
        <div>
          <h1 className="text-xl font-extrabold">پرونده: {name}</h1>
          <p className="txt2 mt-1 text-sm">{jalaliDate()}</p>
        </div>
        {offline && (
          <span className="mr-auto rounded-full bg-amber-400/10 px-3 py-1.5 text-xs text-amber-300">
            حالت پیش‌نمایش — داده نمونه
          </span>
        )}
      </header>

      <section className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-3 print:hidden">
        <div className="glass-card xl:col-span-2">
          <h3 className="mb-4 font-bold">روند قند خون اخیر</h3>
          <GlucoseChart data={chart} />
        </div>
        <div className="glass-card">
          <h3 className="mb-3 font-bold">🤖 تحلیل بالینی هوش مصنوعی</h3>
          <div className="space-y-3">
            {insights.map((i) => (
              <div key={i.title} className={`rounded-2xl border p-3.5 text-xs leading-6 ${sevCls[i.severity] ?? sevCls.INFO}`}>
                <b className="block text-sm">{i.title}</b>
                {i.body}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- نسخه‌نویسی ---------- */}
      <section className="glass-card print:hidden">
        <h3 className="font-bold">📝 نسخه جدید</h3>
        <p className="txt2 mb-4 text-xs">پس از ثبت، بیمار به‌صورت بلادرنگ مطلع می‌شود</p>

        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <input placeholder="تشخیص (مثلاً: دیابت نوع ۲ کنترل‌نشده)" value={rx.diagnosis} onChange={(e) => setRx({ ...rx, diagnosis: e.target.value })} className={inputCls} />
          <input placeholder="یادداشت برای بیمار" value={rx.notes} onChange={(e) => setRx({ ...rx, notes: e.target.value })} className={inputCls} />
          <input placeholder="برنامه غذایی (مثلاً: حذف نوشابه، نان سنگک به‌جای لواش)" value={rx.dietPlan} onChange={(e) => setRx({ ...rx, dietPlan: e.target.value })} className={inputCls} />
          <input placeholder="برنامه ورزشی (مثلاً: ۳۰ دقیقه پیاده‌روی بعد از شام)" value={rx.exercisePlan} onChange={(e) => setRx({ ...rx, exercisePlan: e.target.value })} className={inputCls} />
        </div>

        <div className="space-y-2">
          {items.map((it, i) => (
            <div key={i} className="grid grid-cols-2 gap-2 md:grid-cols-5">
              <input placeholder="نام دارو" value={it.drugName} onChange={(e) => setItem(i, 'drugName', e.target.value)} className={inputCls} />
              <input placeholder="دوز (۵۰۰ میلی‌گرم)" value={it.dosage} onChange={(e) => setItem(i, 'dosage', e.target.value)} className={inputCls} />
              <input placeholder="تواتر (روزی ۲ بار)" value={it.frequency} onChange={(e) => setItem(i, 'frequency', e.target.value)} className={inputCls} />
              <input placeholder="مدت (۳۰ روز)" value={it.duration} onChange={(e) => setItem(i, 'duration', e.target.value)} className={inputCls} />
              <input placeholder="دستور (همراه غذا)" value={it.instruction} onChange={(e) => setItem(i, 'instruction', e.target.value)} className={inputCls} />
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button onClick={() => setItems((a) => [...a, { ...emptyItem }])} className="rounded-xl border border-white/15 px-4 py-2.5 text-xs transition hover:bg-white/5">
            + افزودن دارو
          </button>
          <button onClick={submitRx} className="rounded-xl bg-gradient-to-l from-teal-400 to-sky-400 px-6 py-2.5 text-xs font-bold text-white">
            ثبت و صدور نسخه
          </button>
          <button onClick={() => window.print()} className="rounded-xl border border-white/15 px-4 py-2.5 text-xs transition hover:bg-white/5">
            🖨️ چاپ / PDF
          </button>
          {msg && <span className="text-xs">{msg}</span>}
        </div>
      </section>

      {/* ---------- نسخه چاپی ---------- */}
      <section className="hidden rounded-none bg-white p-10 text-black print:block" dir="rtl">
        <div className="mb-6 flex items-center justify-between border-b-2 border-black pb-4">
          <div>
            <h2 className="text-lg font-extrabold">نسخه پزشکی — گلوسیا</h2>
            <p className="text-xs">تاریخ: {jalaliDate()}</p>
          </div>
          <div className="text-xs">
            بیمار: <b>{name}</b>
          </div>
        </div>
        {rx.diagnosis && <p className="mb-3 text-sm">تشخیص: {rx.diagnosis}</p>}
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              {['ردیف', 'دارو', 'دوز', 'تواتر', 'مدت', 'دستور مصرف'].map((h) => (
                <th key={h} className="border border-black p-2 text-right">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.filter((i) => i.drugName).map((it, i) => (
              <tr key={i}>
                <td className="border border-black p-2">{faNum(i + 1)}</td>
                <td className="border border-black p-2">{it.drugName}</td>
                <td className="border border-black p-2">{it.dosage}</td>
                <td className="border border-black p-2">{it.frequency}</td>
                <td className="border border-black p-2">{it.duration}</td>
                <td className="border border-black p-2">{it.instruction}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rx.dietPlan && <p className="mt-4 text-sm">🍽️ برنامه غذایی: {rx.dietPlan}</p>}
        {rx.exercisePlan && <p className="mt-2 text-sm">🏃 برنامه ورزشی: {rx.exercisePlan}</p>}
        {rx.notes && <p className="mt-2 text-sm">یادداشت: {rx.notes}</p>}
        <p className="mt-10 text-left text-sm">مهر و امضای پزشک</p>
      </section>
    </main>
  );
}
