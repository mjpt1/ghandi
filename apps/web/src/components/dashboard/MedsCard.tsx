'use client';

import { useState } from 'react';

const initial = [
  { id: 1, name: 'متفورمین ۵۰۰', desc: '۱ قرص همراه صبحانه', time: '۰۸:۰۰', done: true },
  { id: 2, name: 'انسولین نوورپید', desc: '۸ واحد قبل از ناهار', time: '۱۳:۰۰', done: true },
  { id: 3, name: 'متفورمین ۵۰۰', desc: '۱ قرص همراه شام', time: '۲۰:۰۰', done: false },
  { id: 4, name: 'انسولین لانتوس', desc: '۱۴ واحد قبل از خواب', time: '۲۳:۰۰', done: false },
];

export function MedsCard() {
  const [meds, setMeds] = useState(initial);
  const toggle = (id: number) =>
    setMeds((m) => m.map((x) => (x.id === id ? { ...x, done: !x.done } : x)));

  const doneCount = meds.filter((m) => m.done).length;

  return (
    <div className="glass-card">
      <h3 className="font-bold">💊 داروهای امروز</h3>
      <p className="txt2 mb-3 text-xs">
        {['۰', '۱', '۲', '۳', '۴'][doneCount]} از ۴ نوبت مصرف شده
      </p>

      {meds.map((m) => (
        <div
          key={m.id}
          className={`flex items-center gap-3 border-b border-dashed border-white/10 py-3 text-sm last:border-0 ${m.done ? 'opacity-50' : ''}`}
        >
          <button
            onClick={() => toggle(m.id)}
            aria-label={m.done ? 'لغو ثبت مصرف' : 'ثبت مصرف'}
            className={`grid h-6 w-6 shrink-0 place-items-center rounded-lg border-2 text-xs text-white transition ${
              m.done ? 'border-transparent bg-gradient-to-br from-teal-400 to-sky-400' : 'border-white/20'
            }`}
          >
            {m.done && '✓'}
          </button>
          <div>
            <b className={m.done ? 'line-through' : ''}>{m.name}</b>
            <div className="txt2 text-[11px]">{m.desc}</div>
          </div>
          <span className="txt2 mr-auto text-xs">{m.time}</span>
        </div>
      ))}

      <div className="mt-4 flex items-center gap-2 rounded-2xl border border-orange-400/25 bg-gradient-to-l from-orange-400/15 to-amber-400/5 px-4 py-3 text-xs">
        🔥 <b>استریک ۱۲ روزه!</b> ۱۲ روز پیاپی همه داده‌ها را ثبت کرده‌اید.
      </div>
    </div>
  );
}
