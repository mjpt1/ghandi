'use client';

/** اسکن غذا با دوربین/گالری → تشخیص AI → تحلیل گلیسمی */
import { useRef, useState } from 'react';
import { FoodAiApi } from '@/lib/api';
import { faNum } from '@/lib/fa';

interface Match {
  foodId: string;
  nameFa: string;
  confidence: number;
  carbsG: number;
  calories: number;
  glycemicIndex: number;
  giLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  healthierSwap?: string;
}

const demoResult = {
  engine: 'mock',
  noteFa: 'حالت پیش‌نمایش: نتایج نمونه هستند. غذای درست را دستی انتخاب کنید.',
  matches: [
    { foodId: 'd1', nameFa: 'قورمه سبزی با برنج', confidence: 0.85, carbsG: 58, calories: 620, glycemicIndex: 52, giLevel: 'MEDIUM', healthierSwap: 'برنج را نصف کنید یا با برنج قهوه‌ای جایگزین کنید.' },
    { foodId: 'd2', nameFa: 'زرشک پلو با مرغ', confidence: 0.6, carbsG: 74, calories: 680, glycemicIndex: 68, giLevel: 'HIGH', healthierSwap: 'عدس‌پلو با برنج قهوه‌ای — GI حدود ٪۴۰ پایین‌تر.' },
    { foodId: 'd3', nameFa: 'کوکو سبزی', confidence: 0.35, carbsG: 12, calories: 280, glycemicIndex: 32, giLevel: 'LOW' },
  ] as Match[],
};

const giCls: Record<string, string> = {
  LOW: 'bg-emerald-400/10 text-emerald-300',
  MEDIUM: 'bg-amber-400/10 text-amber-300',
  HIGH: 'bg-red-400/10 text-red-300',
};
const giFa: Record<string, string> = { LOW: 'GI پایین', MEDIUM: 'GI متوسط', HIGH: 'GI بالا' };

export default function FoodScanPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<typeof demoResult | null>(null);
  const [loading, setLoading] = useState(false);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setPreview(dataUrl);
      setResult(null);
      setLoading(true);
      const base64 = dataUrl.split(',')[1];
      try {
        const r = await FoodAiApi.detect(base64);
        setResult(r as typeof demoResult);
      } catch {
        setResult(demoResult);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <main className="mx-auto max-w-3xl px-5 py-7">
      <header className="mb-6">
        <h1 className="text-xl font-extrabold">📸 اسکن غذای ایرانی</h1>
        <p className="txt2 mt-1 text-sm">
          از غذای خود عکس بگیرید؛ هوش مصنوعی نوع غذا، کربوهیدرات و تاثیر آن بر قند را تخمین می‌زند.
        </p>
      </header>

      <div
        onClick={() => fileRef.current?.click()}
        className="glass-card grid min-h-48 cursor-pointer place-items-center border-2 border-dashed !border-white/15 text-center transition hover:!border-teal-400/40"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="پیش‌نمایش غذا" className="max-h-72 rounded-2xl object-contain" />
        ) : (
          <div>
            <div className="text-4xl">🍽️</div>
            <p className="mt-2 text-sm font-bold">عکس غذا را انتخاب کنید</p>
            <p className="txt2 mt-1 text-xs">یا با موبایل مستقیم عکس بگیرید</p>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={onFile} className="hidden" />
      </div>

      {loading && (
        <div className="glass-card mt-4 animate-pulse text-center text-sm">
          🤖 در حال تحلیل تصویر…
        </div>
      )}

      {result && (
        <section className="mt-4 space-y-3">
          {result.matches.map((m, i) => (
            <div key={m.foodId} className="glass-card flex flex-wrap items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/5 text-2xl">
                {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
              </div>
              <div className="min-w-0 flex-1">
                <b>{m.nameFa}</b>
                <div className="txt2 mt-0.5 text-xs">
                  اطمینان ٪{faNum(Math.round(m.confidence * 100))} · {faNum(m.carbsG)} گرم کربوهیدرات ·{' '}
                  {faNum(m.calories)} کالری
                </div>
                {m.healthierSwap && (
                  <div className="mt-1.5 text-xs text-teal-300">💡 {m.healthierSwap}</div>
                )}
              </div>
              <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${giCls[m.giLevel]}`}>
                {giFa[m.giLevel]} ({faNum(m.glycemicIndex)})
              </span>
            </div>
          ))}
          <p className="txt2 text-center text-xs">{result.noteFa}</p>
        </section>
      )}
    </main>
  );
}
