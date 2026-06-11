/** ابزارهای فارسی‌سازی: اعداد فارسی و تاریخ شمسی */

export const faNum = (n: number | string): string =>
  String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);

export const jalaliDate = (date: Date = new Date()): string =>
  new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);

export const jalaliTime = (date: Date): string =>
  new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit' }).format(date);
