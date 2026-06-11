import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'گلوسیا — مدیریت هوشمند دیابت',
  description: 'پلتفرم هوشمند مدیریت دیابت با هوش مصنوعی؛ پایش قند، تحلیل غذای ایرانی و مربی سلامت فارسی',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#070c1b',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" className="dark" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
