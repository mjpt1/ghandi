'use client';

import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { faNum } from '@/lib/fa';

const tir = [
  { name: 'خیلی بالا (بیش از ۲۵۰)', value: 3, color: '#f87171' },
  { name: 'بالا (۱۸۰ تا ۲۵۰)', value: 18, color: '#fbbf24' },
  { name: 'در محدوده (۷۰ تا ۱۸۰)', value: 74, color: '#34d399' },
  { name: 'پایین (کمتر از ۷۰)', value: 5, color: '#38bdf8' },
];

export function TimeInRange() {
  return (
    <>
      <div className="relative h-44">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={tir} dataKey="value" innerRadius="72%" outerRadius="100%" paddingAngle={3} cornerRadius={8}>
              {tir.map((s) => (
                <Cell key={s.name} fill={s.color} stroke="transparent" />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <div className="text-2xl font-extrabold">٪{faNum(74)}</div>
            <div className="txt2 text-[11px]">در محدوده</div>
          </div>
        </div>
      </div>
      <ul className="mt-4 space-y-2 text-xs">
        {tir.map((s) => (
          <li key={s.name} className="flex items-center gap-2">
            <i className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
            {s.name}
            <b className="txt2 mr-auto">٪{faNum(s.value)}</b>
          </li>
        ))}
      </ul>
    </>
  );
}
