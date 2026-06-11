'use client';

/** وعده‌های اخیر با تحلیل گلیسمی غذای ایرانی — منبع: FoodsApi */
const meals = [
  { emoji: '🥘', name: 'قورمه سبزی با برنج', meta: 'ناهار · ۵۸ گرم کربوهیدرات · ۶۲۰ کالری', gi: 'MEDIUM' },
  { emoji: '🍢', name: 'جوجه کباب با نان سنگک', meta: 'شام دیشب · ۴۲ گرم کربوهیدرات · ۵۱۰ کالری', gi: 'LOW' },
  { emoji: '🍚', name: 'زرشک پلو با مرغ', meta: 'سه‌شنبه · ۷۴ گرم کربوهیدرات · ۶۸۰ کالری', gi: 'HIGH' },
  { emoji: '🫖', name: 'چای با ۲ عدد گز', meta: 'عصرانه · ۲۲ گرم کربوهیدرات · ۱۴۰ کالری', gi: 'HIGH' },
];

const giBadge: Record<string, { cls: string; label: string }> = {
  LOW: { cls: 'bg-emerald-400/10 text-emerald-300', label: 'GI پایین' },
  MEDIUM: { cls: 'bg-amber-400/10 text-amber-300', label: 'GI متوسط' },
  HIGH: { cls: 'bg-red-400/10 text-red-300', label: 'GI بالا' },
};

export function MealsCard() {
  return (
    <div className="glass-card">
      <h3 className="font-bold">🍽️ وعده‌های امروز</h3>
      <p className="txt2 mb-3 text-xs">شاخص گلیسمی و کربوهیدرات هر وعده</p>

      {meals.map((m) => (
        <div key={m.name} className="flex items-center gap-3 border-b border-dashed border-white/10 py-3 last:border-0">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 text-xl">
            {m.emoji}
          </div>
          <div>
            <b className="block text-sm">{m.name}</b>
            <span className="txt2 text-[11px]">{m.meta}</span>
          </div>
          <span className={`mr-auto rounded-full px-3 py-1 text-[10px] font-bold ${giBadge[m.gi].cls}`}>
            {giBadge[m.gi].label}
          </span>
        </div>
      ))}

      <div className="mt-3 rounded-2xl bg-teal-400/10 p-4 text-xs leading-6">
        💡 <b>پیشنهاد جایگزین:</b> به‌جای زرشک‌پلو، <b>عدس‌پلو با برنج قهوه‌ای</b> امتحان کنید —
        شاخص گلیسمی ٪۴۰ پایین‌تر.
      </div>
    </div>
  );
}
