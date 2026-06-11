/**
 * Seed دیتابیس گلوسیا
 * - غذاهای ایرانی با اطلاعات کامل تغذیه‌ای و گلیسمی
 * - نقش‌ها، مدال‌ها و کاربر ادمین اولیه
 */
import { PrismaClient, GiLevel, FoodCategory, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface FoodRow {
  nameFa: string;
  nameEn?: string;
  category: keyof typeof FoodCategory;
  servingDesc: string;
  servingGrams: number;
  calories: number;
  carbsG: number;
  proteinG: number;
  fatG: number;
  fiberG: number;
  glycemicIndex: number;
  giLevel: keyof typeof GiLevel;
  sugarSpikeNote?: string;
  healthierSwap?: string;
}

async function seedFoods() {
  const file = path.join(__dirname, 'data', 'iranian-foods.json');
  const foods: FoodRow[] = JSON.parse(fs.readFileSync(file, 'utf-8'));

  for (const f of foods) {
    await prisma.iranianFood.upsert({
      where: { nameFa: f.nameFa },
      update: {},
      create: {
        ...f,
        category: FoodCategory[f.category],
        giLevel: GiLevel[f.giLevel],
        glycemicLoad: Math.round((f.glycemicIndex * f.carbsG) / 100 * 10) / 10,
      },
    });
  }
  console.log(`✅ ${foods.length} غذای ایرانی ثبت شد`);
}

async function seedBadges() {
  const badges = [
    { code: 'streak_7', titleFa: '۷ روز ثبت کامل', description: 'هفت روز پیاپی همه داده‌ها را ثبت کردید', icon: '🥇' },
    { code: 'streak_30', titleFa: 'یک ماه پایداری', description: 'سی روز پیاپی ثبت داده', icon: '🏆' },
    { code: 'tir_champion', titleFa: 'قهرمان TIR', description: 'یک هفته بیش از ٪۸۰ در محدوده هدف', icon: '🎯' },
    { code: 'walker_30', titleFa: '۳۰ روز ورزش', description: 'سی روز فعالیت بدنی ثبت‌شده', icon: '🏃' },
    { code: 'food_logger', titleFa: 'دفترچه تغذیه', description: '۱۰۰ وعده غذایی ثبت‌شده', icon: '🍽️' },
  ];
  for (const b of badges) {
    await prisma.badge.upsert({ where: { code: b.code }, update: {}, create: b });
  }
  console.log(`✅ ${badges.length} مدال ثبت شد`);
}

async function seedAdmin() {
  const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD ?? 'Admin@Glucia1', 12);
  await prisma.user.upsert({
    where: { phone: '09120000000' },
    update: {},
    create: {
      phone: '09120000000',
      email: 'admin@glucia.ir',
      fullName: 'مدیر سیستم',
      role: Role.ADMIN,
      passwordHash,
    },
  });
  console.log('✅ کاربر ادمین ایجاد شد (۰۹۱۲۰۰۰۰۰۰۰)');
}

async function main() {
  await seedFoods();
  await seedBadges();
  await seedAdmin();
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
