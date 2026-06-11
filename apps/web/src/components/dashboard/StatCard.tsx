'use client';

interface Props {
  label: string;
  value: string;
  unit?: string;
  trend?: string;
  tone?: 'ok' | 'good' | 'bad';
  live?: boolean;
}

const toneClass: Record<string, string> = {
  ok: 'bg-teal-400/10 text-teal-300',
  good: 'bg-emerald-400/10 text-emerald-300',
  bad: 'bg-red-400/10 text-red-300',
};

export function StatCard({ label, value, unit, trend, tone = 'ok', live }: Props) {
  return (
    <div className="glass-card">
      <div className="txt2 flex items-center gap-2 text-xs">
        {live && <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400" />}
        {label}
      </div>
      <div className="my-2 text-3xl font-extrabold">
        {value} {unit && <small className="txt2 text-sm font-normal">{unit}</small>}
      </div>
      {trend && (
        <span className={`rounded-full px-3 py-1 text-xs ${toneClass[tone]}`}>{trend}</span>
      )}
    </div>
  );
}
