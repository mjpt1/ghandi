'use client';

/**
 * کارت مربی هوشمند — در نسخه متصل از AiApi.coach() و AiApi.predict() تغذیه می‌شود
 */
const insights = [
  {
    icon: '😴',
    tone: 'bg-amber-400/10',
    title: 'الگوی خواب و نوسان قند',
    body: 'وقتی کمتر از ۶ ساعت می‌خوابید، نوسان قند شما تا ٪۳۵ بیشتر می‌شود. دیشب ۵٫۵ ساعت خوابیده‌اید.',
  },
  {
    icon: '🍚',
    tone: 'bg-red-400/10',
    title: 'الگوی غذایی شناسایی‌شده',
    body: 'بعد از خوردن زرشک‌پلو، قند شما به‌طور میانگین ۶۸ واحد افزایش می‌یابد. نصف کردن برنج را امتحان کنید.',
  },
  {
    icon: '🚶',
    tone: 'bg-emerald-400/10',
    title: 'اثر پیاده‌روی عصر',
    body: 'پیاده‌روی‌های بعد از شام، قند ناشتای صبح شما را به‌طور میانگین ۱۲ واحد کاهش داده است. ادامه دهید!',
  },
];

export function AiCoach() {
  return (
    <div className="glass-card">
      <h3 className="font-bold">🤖 مربی هوشمند گلوسیا</h3>
      <p className="txt2 mb-3 text-xs">تحلیل شخصی‌سازی‌شده بر اساس داده‌های شما</p>

      {insights.map((i) => (
        <div key={i.title} className="flex gap-3 border-b border-dashed border-white/10 py-3 last:border-0">
          <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-lg ${i.tone}`}>{i.icon}</div>
          <div>
            <b className="block text-sm">{i.title}</b>
            <p className="txt2 text-xs leading-6">{i.body}</p>
          </div>
        </div>
      ))}

      <div className="mt-3 rounded-2xl border border-amber-400/25 bg-gradient-to-l from-amber-400/10 to-red-400/5 p-4 text-xs leading-6">
        ⚠️ <b>پیش‌بینی هوشمند:</b> با توجه به انسولین تزریق‌شده و فعالیت امروز، احتمال افت قند تا ۲ ساعت
        آینده <b>٪۶۸</b> است. یک میان‌وعده سبک (مثلاً ۲ عدد خرما) توصیه می‌شود.
      </div>
    </div>
  );
}
