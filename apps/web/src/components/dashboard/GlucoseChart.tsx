'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { faNum } from '@/lib/fa';

export interface GlucosePoint {
  hour: string;
  value: number;
}

// داده نمونه — در نسخه متصل، از GlucoseApi.list() می‌آید
const demoData: GlucosePoint[] = [
  142, 128, 110, 98, 92, 88, 95, 118, 165, 188, 172, 148,
  132, 178, 196, 168, 141, 126, 119, 138, 158, 144, 127, 118, 112,
].map((v, h) => ({ hour: `${faNum(String(h).padStart(2, '0'))}:۰۰`, value: v }));

export function GlucoseChart({ data = demoData }: { data?: GlucosePoint[] }) {
  return (
    <div dir="ltr" className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 6, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="glu" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2dd4bf" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#2dd4bf" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeOpacity={0.08} vertical={false} />
          <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#8b94ab' }} interval={3} axisLine={false} tickLine={false} />
          <YAxis domain={[40, 260]} tick={{ fontSize: 10, fill: '#8b94ab' }} tickFormatter={(v) => faNum(v)} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              direction: 'rtl',
              background: 'rgb(11 18 38)',
              border: '1px solid rgba(255,255,255,.1)',
              borderRadius: 12,
              fontFamily: 'Vazirmatn',
            }}
            formatter={(v: number) => [`${faNum(v)} mg/dL`, 'قند خون']}
          />
          <ReferenceLine y={180} stroke="#f87171" strokeDasharray="6 6" strokeOpacity={0.6} />
          <ReferenceLine y={70} stroke="#38bdf8" strokeDasharray="6 6" strokeOpacity={0.6} />
          <Area type="monotone" dataKey="value" stroke="#2dd4bf" strokeWidth={3} fill="url(#glu)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
