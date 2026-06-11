import {
  estimatedSpike,
  glycemicLoad,
  hba1cFromAvg,
  linearSlope,
  timeInRange,
} from './health-math';

describe('health-math (فرمول‌های پزشکی)', () => {
  describe('hba1cFromAvg — فرمول ADAG', () => {
    it('میانگین ۱۲۶ → حدود ۶٪', () => {
      expect(hba1cFromAvg(126)).toBeCloseTo(6.0, 1);
    });
    it('میانگین ۱۵۴ → حدود ۷٪', () => {
      expect(hba1cFromAvg(154)).toBeCloseTo(7.0, 1);
    });
    it('میانگین ۲۱۲ → حدود ۹٪', () => {
      expect(hba1cFromAvg(212)).toBeCloseTo(9.0, 1);
    });
  });

  describe('timeInRange', () => {
    it('آرایه خالی → null', () => {
      expect(timeInRange([], 70, 180)).toBeNull();
    });
    it('همه در محدوده → ٪۱۰۰', () => {
      const r = timeInRange([100, 120, 150], 70, 180)!;
      expect(r.inRange).toBe(100);
      expect(r.below).toBe(0);
    });
    it('توزیع ترکیبی درست محاسبه می‌شود', () => {
      // ۶۰ پایین، ۱۰۰و۱۵۰ در محدوده، ۲۰۰ بالا، ۳۰۰ خیلی بالا
      const r = timeInRange([60, 100, 150, 200, 300], 70, 180)!;
      expect(r.below).toBe(20);
      expect(r.inRange).toBe(40);
      expect(r.above).toBe(20);
      expect(r.veryHigh).toBe(20);
    });
  });

  describe('glycemicLoad', () => {
    it('برنج سفید: GI=73، کربو=42 → GL≈30.7', () => {
      expect(glycemicLoad(73, 42)).toBeCloseTo(30.7, 1);
    });
    it('کوکو سبزی: GI=32، کربو=12 → GL پایین', () => {
      expect(glycemicLoad(32, 12)).toBeLessThan(10);
    });
  });

  describe('estimatedSpike', () => {
    it('GL=20 با ضریب پیش‌فرض → ۷۰ واحد', () => {
      expect(estimatedSpike(20)).toBe(70);
    });
  });

  describe('linearSlope', () => {
    it('روند صعودی یکنواخت → شیب مثبت دقیق', () => {
      const pts = [
        { t: 0, v: 100 },
        { t: 1, v: 110 },
        { t: 2, v: 120 },
      ];
      expect(linearSlope(pts)).toBeCloseTo(10, 5);
    });
    it('روند نزولی → شیب منفی', () => {
      const pts = [
        { t: 0, v: 180 },
        { t: 1, v: 150 },
        { t: 2, v: 120 },
      ];
      expect(linearSlope(pts)).toBeLessThan(0);
    });
    it('کمتر از ۲ نقطه → صفر', () => {
      expect(linearSlope([{ t: 0, v: 100 }])).toBe(0);
    });
  });
});
