# 🩸 گلوسیا — پلتفرم هوشمند مدیریت دیابت

پلتفرم فارسی و RTL مدیریت دیابت با هوش مصنوعی؛ شامل پایش قند خون، تحلیل غذاهای ایرانی با شاخص گلیسمی، مربی هوشمند فارسی، پیش‌بینی روند قند و هشدار بلادرنگ.

## معماری

```
glucia/
├── docker-compose.yml          ← PostgreSQL + Redis + API + Web
├── .env.example                ← الگوی متغیرهای محیطی
├── apps/
│   ├── api/                    ← NestJS + Prisma (بک‌اند)
│   │   ├── prisma/
│   │   │   ├── schema.prisma   ← طراحی کامل ۲۵+ جدول
│   │   │   ├── seed.ts         ← Seed غذاها، مدال‌ها، ادمین
│   │   │   └── data/iranian-foods.json  ← دیتابیس غذاهای ایرانی + GI
│   │   └── src/
│   │       ├── common/         ← گاردها و دکوریتورها (JWT + RBAC)
│   │       └── modules/
│   │           ├── auth/       ← ثبت‌نام/ورود، Refresh Rotation، Audit
│   │           ├── glucose/    ← ثبت قند، آمار، TIR، HbA1c تخمینی
│   │           ├── foods/      ← جستجوی غذا و تحلیل تاثیر بر قند
│   │           ├── ai/         ← مربی هوشمند + پیش‌بینی + تحلیل بالینی
│   │           └── realtime/   ← Socket.io با احراز هویت JWT
│   └── web/                    ← Next.js 15 + Tailwind + Recharts (فرانت‌اند)
│       └── src/
│           ├── app/(dashboard)/dashboard/  ← داشبورد بیمار
│           ├── components/dashboard/       ← کارت‌ها و نمودارها
│           └── lib/            ← کلاینت API، اعداد فارسی، تاریخ شمسی
└── glucia-patient-dashboard.html  ← دموی مستقل UI (بدون نیاز به نصب)
```

## راه‌اندازی سریع

```bash
cp .env.example .env        # مقادیر secret را تغییر دهید
docker compose up -d --build
# سپس داخل کانتینر یا لوکال:
npm install
npm run db:migrate
npm run db:seed
```

- وب: http://localhost:3000
- API: http://localhost:4000/api/v1
- ادمین اولیه: شماره `09120000000` / رمز `Admin@Glucia1` (بلافاصله تغییر دهید)

## اجرای توسعه بدون Docker

```bash
docker compose up -d postgres redis
npm install
npm run db:migrate && npm run db:seed
npm run dev:api    # ترمینال ۱
npm run dev:web    # ترمینال ۲
```

## هوش مصنوعی — دو حالته

| حالت | شرط فعال‌شدن | موتور |
|---|---|---|
| واقعی | تنظیم `OPENAI_API_KEY` در `.env` | OpenAI (پیش‌فرض gpt-4o-mini) با خروجی JSON فارسی |
| Mock | بدون کلید | موتور قواعد محلی (خواب، الگوی غذایی، روند هفتگی) |

در صورت خطای OpenAI، سیستم به‌صورت خودکار به موتور قواعد برمی‌گردد. خروجی هر دو حالت یکسان است.

### APIهای هوش مصنوعی

- `GET /api/v1/ai/coach` — بینش‌های مربی هوشمند (بیمار)
- `GET /api/v1/ai/predict` — پیش‌بینی قند ۱ و ۲ ساعت آینده (رگرسیون خطی + پیام فارسی)
- `GET /api/v1/ai/clinical/:patientId` — تحلیل بالینی (پزشک): افت قند شبانه، مقاومت انسولینی، روند دوهفته‌ای

## امنیت پیاده‌سازی‌شده

JWT کوتاه‌عمر + Refresh Token با هش SHA-256 و Rotation، گارد سراسری (همه مسیرها بسته مگر `@Public`)، RBAC با دکوریتور `@Roles`، Rate Limiting سراسری و سخت‌گیرانه‌تر روی auth (۵ درخواست/دقیقه)، Helmet، CORS محدود، ValidationPipe با whitelist، پیام یکسان خطای ورود (ضد user enumeration)، bcrypt با cost 12، و Audit Log برای ورود/ثبت‌نام/ورود ناموفق.

## فرمول‌های پزشکی استفاده‌شده

- HbA1c تخمینی (ADAG): `(میانگین قند + 46.7) / 28.7`
- بار گلیسمی: `GI × کربوهیدرات ÷ 100`
- TIR بر اساس محدوده هدف شخصی هر بیمار (پیش‌فرض ۷۰–۱۸۰)

## پنل‌ها و مسیرها

| مسیر | نقش | شرح |
|---|---|---|
| `/login` ، `/register` | عمومی | ورود و ثبت‌نام با ریدایرکت بر اساس نقش |
| `/dashboard` | بیمار | نمودار قند، TIR، مربی AI، تغذیه، دارو |
| `/doctor` | پزشک | لیست بیماران با میانگین ۷ روزه |
| `/doctor/[id]` | پزشک | پرونده بیمار، تحلیل بالینی AI، نسخه‌نویسی + چاپ/PDF |
| `/admin` | ادمین | آمار سیستم، مدیریت و فعال/غیرفعال‌سازی کاربران |
| `/chat` | بیمار/پزشک | چت بلادرنگ با Socket.io و پیش‌نمایش آفلاین |
| `/food-scan` | بیمار | تشخیص غذای ایرانی از عکس (Vision یا Mock) + تحلیل GI |
| `/visit` | بیمار/پزشک | ویزیت تصویری P2P (WebRTC + سیگنالینگ Socket.io) |

صفحات پزشک و ادمین در صورت عدم اتصال بک‌اند، به‌صورت خودکار با داده نمونه (حالت پیش‌نمایش) نمایش داده می‌شوند.

## سرویس‌های خارجی (همه با fallback بدون کلید)

| سرویس | متغیر env | بدون کلید |
|---|---|---|
| OpenAI (مربی AI + Vision غذا) | `OPENAI_API_KEY` | موتور قواعد / نتایج نمونه |
| پیامک کاوه‌نگار | `SMS_PROVIDER_API_KEY` | فقط لاگ |
| تلگرام Bot | `TELEGRAM_BOT_TOKEN` | فقط لاگ |
| زرین‌پال | `ZARINPAL_MERCHANT_ID` | پرداخت Mock موفق |
| Push (FCM) | `FCM_SERVER_KEY` | فقط لاگ |
| CGM Webhook | `CGM_WEBHOOK_SECRET` | sync با شبیه‌ساز خوانش |

## تست‌ها

```bash
npm test --workspace=apps/api        # تست واحد فرمول‌های پزشکی (health-math)
npm run test:e2e --workspace=apps/api  # e2e — نیازمند Postgres در حال اجرا
```

پوشش e2e: سلامت سرویس، رد درخواست بدون توکن (۴۰۱)، اعتبارسنجی ورود، چرخه کامل ثبت‌نام → ورود → ثبت قند → آمار.

## نقشه راه (فازهای بعدی)

اتصال OAuth واقعی Dexcom/LibreLinkUp (نیازمند قرارداد)، واتساپ Business API، TURN server برای WebRTC پشت NAT سخت‌گیر، اپ PWA آفلاین با Service Worker، داشبورد گزارش‌گیری پیشرفته ادمین.

> ⚠️ این نرم‌افزار جایگزین مشاوره پزشکی نیست؛ تصمیم‌های درمانی فقط با پزشک.
