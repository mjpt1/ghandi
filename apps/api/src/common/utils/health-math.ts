/**
 * توابع خالص ریاضی سلامت — بدون وابستگی، قابل تست واحد
 */

/** HbA1c تخمینی با فرمول استاندارد ADAG */
export function hba1cFromAvg(avgMgDl: number): number {
  return Math.round(((avgMgDl + 46.7) / 28.7) * 10) / 10;
}

export interface TirResult {
  inRange: number;
  below: number;
  above: number;
  veryHigh: number;
}

/** درصد زمان در محدوده هدف (Time In Range) */
export function timeInRange(values: number[], lo: number, hi: number): TirResult | null {
  if (!values.length) return null;
  const pct = (n: number) => Math.round((n / values.length) * 100);
  return {
    inRange: pct(values.filter((v) => v >= lo && v <= hi).length),
    below: pct(values.filter((v) => v < lo).length),
    above: pct(values.filter((v) => v > hi && v <= 250).length),
    veryHigh: pct(values.filter((v) => v > 250).length),
  };
}

/** بار گلیسمی: GL = GI × کربوهیدرات ÷ ۱۰۰ */
export function glycemicLoad(gi: number, carbsG: number): number {
  return Math.round(((gi * carbsG) / 100) * 10) / 10;
}

/** تخمین جهش قند (mg/dL) از بار گلیسمی — ضریب تجربی دیابت نوع ۲ */
export function estimatedSpike(gl: number, factor = 3.5): number {
  return Math.round(gl * factor);
}

/** شیب رگرسیون خطی ساده — برای پیش‌بینی روند قند (واحد در ساعت) */
export function linearSlope(points: { t: number; v: number }[]): number {
  const n = points.length;
  if (n < 2) return 0;
  const mt = points.reduce((a, p) => a + p.t, 0) / n;
  const mv = points.reduce((a, p) => a + p.v, 0) / n;
  const denom = points.reduce((a, p) => a + (p.t - mt) ** 2, 0) || 1;
  return points.reduce((a, p) => a + (p.t - mt) * (p.v - mv), 0) / denom;
}
