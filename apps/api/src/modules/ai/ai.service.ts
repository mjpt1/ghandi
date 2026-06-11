import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { InsightType, Severity } from '@prisma/client';
import { linearSlope } from '../../common/utils/health-math';
import { PrismaService } from '../../prisma/prisma.service';

/** زمینه ۱۴ روزه بیمار برای موتورهای تحلیل */
interface PatientContext {
  logs: { valueMgDl: number; measuredAt: Date }[];
  sleeps: { value: number | null }[];
  meals: { items: { food: { nameFa: string; glycemicIndex: number } }[] }[];
  avg7: number | null;
  avgPrev7: number | null;
  trendDelta: number;
  shortSleepDays: number;
  insulinLogged: boolean;
}

interface InsightDraft {
  type: InsightType;
  severity: Severity;
  title: string;
  body: string;
}

/**
 * سرویس هوش مصنوعی گلوسیا
 *
 * استراتژی دوگانه:
 *  - اگر OPENAI_API_KEY تنظیم شده باشد → تحلیل واقعی با مدل زبانی
 *  - در غیر این صورت → موتور قواعد محلی (Mock هوشمند) به‌صورت خودکار
 *
 * خروجی هر دو حالت یکسان است؛ فرانت‌اند تفاوتی نمی‌بیند.
 */
@Injectable()
export class AiService {
  private logger = new Logger('AI');
  private openai: OpenAI | null = null;

  constructor(private prisma: PrismaService) {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      this.logger.log('🤖 حالت AI واقعی (OpenAI) فعال شد');
    } else {
      this.logger.warn('⚠️ کلید OpenAI یافت نشد — حالت Mock فعال است');
    }
  }

  // ================= تحلیل مربی هوشمند بیمار =================
  async coachInsights(patientId: string) {
    const data = await this.gatherPatientContext(patientId);

    const insights = this.openai
      ? await this.llmInsights(data)
      : this.ruleBasedInsights(data);

    // ذخیره در دیتابیس برای تاریخچه
    for (const i of insights) {
      await this.prisma.aiInsight.create({
        data: {
          patientId,
          type: i.type,
          severity: i.severity,
          title: i.title,
          body: i.body,
          meta: { engine: this.openai ? 'openai' : 'rules' },
        },
      });
    }
    return insights;
  }

  // ================= پیش‌بینی روند قند =================
  async predictGlucose(patientId: string) {
    const logs = await this.prisma.glucoseLog.findMany({
      where: { patientId },
      orderBy: { measuredAt: 'desc' },
      take: 12,
    });
    if (logs.length < 3) {
      return {
        available: false,
        messageFa: 'برای پیش‌بینی، حداقل ۳ اندازه‌گیری اخیر لازم است.',
      };
    }

    // رگرسیون خطی ساده روی آخرین اندازه‌گیری‌ها (slope بر حسب mg/dL در ساعت)
    const pts = logs
      .slice()
      .reverse()
      .map((l) => ({ t: l.measuredAt.getTime() / 3_600_000, v: l.valueMgDl }));
    const slope = linearSlope(pts);
    const current = pts[pts.length - 1].v;
    const in1h = Math.round(current + slope);
    const in2h = Math.round(current + slope * 2);

    let risk: 'LOW' | 'HYPO' | 'HYPER' = 'LOW';
    let messageFa = 'روند قند شما در دو ساعت آینده پایدار پیش‌بینی می‌شود.';
    if (in2h < 70) {
      risk = 'HYPO';
      messageFa = `احتمال افت قند تا دو ساعت آینده وجود دارد (تخمین: ${in2h}). یک میان‌وعده سبک مانند ۲ عدد خرما توصیه می‌شود.`;
    } else if (in2h > 200) {
      risk = 'HYPER';
      messageFa = `روند قند شما صعودی است (تخمین دو ساعت آینده: ${in2h}). آب بنوشید و فعالیت سبک داشته باشید.`;
    }

    return {
      available: true,
      current,
      slopePerHour: Math.round(slope * 10) / 10,
      forecast: { in1h, in2h },
      risk,
      messageFa,
    };
  }

  // ================= تحلیل بالینی مخصوص پزشک =================
  async doctorAnalysis(patientId: string) {
    const data = await this.gatherPatientContext(patientId);
    const out: { title: string; body: string; severity: Severity }[] = [];

    // الگوی افت قند شبانه
    const nightLows = data.logs.filter(
      (l) => l.valueMgDl < 70 && [0, 1, 2, 3, 4, 5].includes(l.measuredAt.getHours()),
    );
    if (nightLows.length >= 2) {
      out.push({
        title: 'الگوی افت قند شبانه',
        body: `در ${nightLows.length} نوبت بین ساعت ۰۰ تا ۰۶ قند زیر ۷۰ ثبت شده است. بازبینی دوز انسولین پایه توصیه می‌شود.`,
        severity: Severity.HIGH,
      });
    }

    // روند بدترشدن دو هفته‌ای
    if (data.trendDelta > 15) {
      out.push({
        title: 'روند نزولی کنترل قند',
        body: `میانگین قند هفته اخیر ${data.trendDelta} واحد بالاتر از هفته قبل است. وضعیت بیمار طی ۲ هفته اخیر بدتر شده است.`,
        severity: Severity.MEDIUM,
      });
    }

    // مقاومت انسولینی احتمالی
    if (data.avg7 && data.avg7 > 180 && data.insulinLogged) {
      out.push({
        title: 'احتمال مقاومت انسولینی',
        body: 'با وجود ثبت منظم انسولین، میانگین قند بالای ۱۸۰ باقی مانده است. ارزیابی مقاومت انسولینی پیشنهاد می‌شود.',
        severity: Severity.MEDIUM,
      });
    }

    if (!out.length) {
      out.push({
        title: 'وضعیت پایدار',
        body: 'الگوی غیرطبیعی قابل توجهی در داده‌های اخیر بیمار مشاهده نشد.',
        severity: Severity.INFO,
      });
    }

    for (const i of out) {
      await this.prisma.aiInsight.create({
        data: {
          patientId,
          type: InsightType.CLINICAL,
          severity: i.severity,
          title: i.title,
          body: i.body,
          forDoctor: true,
        },
      });
    }
    return out;
  }

  // ================= تشخیص غذا از روی عکس =================
  /**
   * عکس (base64) → تطبیق با دیتابیس غذاهای ایرانی
   * با کلید OpenAI از مدل Vision استفاده می‌شود؛ بدون کلید، پاسخ Mock برمی‌گردد.
   */
  async detectFood(imageBase64: string) {
    const foods = await this.prisma.iranianFood.findMany({
      select: { id: true, nameFa: true, carbsG: true, calories: true, glycemicIndex: true, giLevel: true, healthierSwap: true },
    });

    let matches: { nameFa: string; confidence: number }[];

    if (this.openai) {
      try {
        const completion = await this.openai.chat.completions.create({
          model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
          temperature: 0,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content:
                'تصویر یک وعده غذایی است. فقط از بین این فهرست غذاهای ایرانی انتخاب کن: ' +
                foods.map((f) => f.nameFa).join('، ') +
                '. حداکثر ۳ مورد محتمل را با اطمینان ۰ تا ۱ برگردان: {"matches":[{"nameFa":"...","confidence":0.9}]}',
            },
            {
              role: 'user',
              content: [
                {
                  type: 'image_url',
                  image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
                },
              ],
            },
          ],
        });
        matches = JSON.parse(completion.choices[0].message.content ?? '{}').matches ?? [];
      } catch (e) {
        this.logger.error(`خطای Vision — بازگشت به Mock: ${e}`);
        matches = this.mockFoodMatches(foods.map((f) => f.nameFa));
      }
    } else {
      matches = this.mockFoodMatches(foods.map((f) => f.nameFa));
    }

    // اتصال نتایج به رکوردهای دیتابیس + تحلیل گلیسمی
    const enriched = matches
      .map((m) => {
        const f = foods.find((x) => x.nameFa === m.nameFa);
        if (!f) return null;
        return {
          foodId: f.id,
          nameFa: f.nameFa,
          confidence: Math.round(m.confidence * 100) / 100,
          carbsG: f.carbsG,
          calories: f.calories,
          glycemicIndex: f.glycemicIndex,
          giLevel: f.giLevel,
          healthierSwap: f.healthierSwap,
        };
      })
      .filter(Boolean);

    return {
      engine: this.openai ? 'openai-vision' : 'mock',
      matches: enriched,
      noteFa: this.openai
        ? 'نتیجه تشخیص تصویری؛ در صورت اشتباه، غذای درست را دستی انتخاب کنید.'
        : 'حالت دمو (بدون کلید OpenAI): نتایج نمونه هستند. غذای درست را دستی انتخاب کنید.',
    };
  }

  private mockFoodMatches(names: string[]) {
    const samples = ['قورمه سبزی با برنج', 'زرشک پلو با مرغ', 'کوکو سبزی'];
    return samples
      .filter((s) => names.includes(s))
      .map((nameFa, i) => ({ nameFa, confidence: 0.85 - i * 0.25 }));
  }

  // ================= جمع‌آوری زمینه بیمار =================
  private async gatherPatientContext(patientId: string): Promise<PatientContext> {
    const since = new Date(Date.now() - 14 * 24 * 3600 * 1000);
    const [logs, sleeps, meals] = await Promise.all([
      this.prisma.glucoseLog.findMany({
        where: { patientId, measuredAt: { gte: since } },
        orderBy: { measuredAt: 'asc' },
      }),
      this.prisma.healthLog.findMany({
        where: { patientId, kind: 'SLEEP', loggedAt: { gte: since } },
      }),
      this.prisma.meal.findMany({
        where: { patientId, eatenAt: { gte: since } },
        include: { items: { include: { food: true } } },
      }),
    ]);

    const week = 7 * 24 * 3600 * 1000;
    const now = Date.now();
    const lastWeek = logs.filter((l) => now - l.measuredAt.getTime() < week);
    const prevWeek = logs.filter((l) => {
      const d = now - l.measuredAt.getTime();
      return d >= week && d < 2 * week;
    });
    const avg = (xs: typeof logs) =>
      xs.length ? Math.round(xs.reduce((a, l) => a + l.valueMgDl, 0) / xs.length) : null;

    const insulinLogged = await this.prisma.medication.count({
      where: { patientId, isInsulin: true, active: true },
    });

    return {
      logs,
      sleeps,
      meals,
      avg7: avg(lastWeek),
      avgPrev7: avg(prevWeek),
      trendDelta: (avg(lastWeek) ?? 0) - (avg(prevWeek) ?? 0),
      shortSleepDays: sleeps.filter((s) => (s.value ?? 8) < 6).length,
      insulinLogged: insulinLogged > 0,
    };
  }

  // ================= موتور قواعد (Mock هوشمند) =================
  private ruleBasedInsights(data: PatientContext): InsightDraft[] {
    const out: InsightDraft[] = [];

    if (data.shortSleepDays >= 3) {
      out.push({
        type: InsightType.PATTERN,
        severity: Severity.MEDIUM,
        title: 'ارتباط خواب و نوسان قند',
        body: `در ${data.shortSleepDays} شب اخیر کمتر از ۶ ساعت خوابیده‌اید. در چنین روزهایی نوسان قند شما به‌طور معمول بیشتر است؛ خواب منظم ۷ ساعته را هدف بگیرید.`,
      });
    }

    // غذای پرتکرار با GI بالا
    const highGiMeals = data.meals.filter((m) =>
      m.items.some((i) => i.food.glycemicIndex >= 68),
    );
    if (highGiMeals.length) {
      const foodName = highGiMeals[0].items.find((i) => i.food.glycemicIndex >= 68)?.food.nameFa;
      out.push({
        type: InsightType.PATTERN,
        severity: Severity.MEDIUM,
        title: 'الگوی غذایی شناسایی‌شده',
        body: `بعد از خوردن ${foodName ?? 'غذاهای با شاخص گلیسمی بالا'} معمولاً قند شما بالا می‌رود. نصف‌کردن سهم برنج یا جایگزین کم‌GI را امتحان کنید.`,
      });
    }

    if (data.trendDelta < -10) {
      out.push({
        type: InsightType.ACHIEVEMENT,
        severity: Severity.INFO,
        title: 'روند عالی این هفته 🎉',
        body: `میانگین قند شما نسبت به هفته قبل ${Math.abs(data.trendDelta)} واحد بهتر شده است. همین مسیر را ادامه دهید!`,
      });
    }

    if (!out.length) {
      out.push({
        type: InsightType.RECOMMENDATION,
        severity: Severity.INFO,
        title: 'ثبت بیشتر، تحلیل دقیق‌تر',
        body: 'برای تحلیل‌های شخصی‌تر، قند خون، خواب و وعده‌های غذایی را روزانه ثبت کنید.',
      });
    }
    return out;
  }

  // ================= تحلیل با مدل زبانی =================
  private async llmInsights(data: PatientContext): Promise<InsightDraft[]> {
    try {
      const completion = await this.openai!.chat.completions.create({
        model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
        temperature: 0.4,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'تو «مربی هوشمند گلوسیا» هستی؛ دستیار فارسی‌زبان مدیریت دیابت. بر اساس داده‌ها حداکثر ۳ بینش کوتاه، دقیق و عملی تولید کن. ' +
              'فقط JSON با ساختار {"insights":[{"type":"PATTERN|PREDICTION|WARNING|ACHIEVEMENT|RECOMMENDATION","severity":"INFO|LOW|MEDIUM|HIGH","title":"...","body":"..."}]} برگردان. ' +
              'هرگز توصیه دارویی مستقیم (تغییر دوز) نده؛ به مشورت با پزشک ارجاع بده.',
          },
          {
            role: 'user',
            content: JSON.stringify({
              avgGlucose7d: data.avg7,
              avgGlucosePrev7d: data.avgPrev7,
              shortSleepDays: data.shortSleepDays,
              recentMeals: data.meals.slice(-10).map((m) => ({
                foods: m.items.map((i) => ({ name: i.food.nameFa, gi: i.food.glycemicIndex })),
              })),
              recentGlucose: data.logs.slice(-20).map((l) => l.valueMgDl),
            }),
          },
        ],
      });
      const parsed = JSON.parse(completion.choices[0].message.content ?? '{}');
      return (parsed.insights ?? []).map((i: any) => ({
        type: InsightType[i.type as keyof typeof InsightType] ?? InsightType.RECOMMENDATION,
        severity: Severity[i.severity as keyof typeof Severity] ?? Severity.INFO,
        title: String(i.title ?? '').slice(0, 120),
        body: String(i.body ?? '').slice(0, 600),
      }));
    } catch (e) {
      this.logger.error(`خطای OpenAI — بازگشت به موتور قواعد: ${e}`);
      return this.ruleBasedInsights(data); // fallback خودکار
    }
  }
}
