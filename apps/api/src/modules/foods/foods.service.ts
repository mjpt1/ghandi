import { Injectable, NotFoundException } from '@nestjs/common';
import { FoodCategory, Prisma } from '@prisma/client';
import { estimatedSpike, glycemicLoad } from '../../common/utils/health-math';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FoodsService {
  constructor(private prisma: PrismaService) {}

  /** جستجو در دیتابیس غذاهای ایرانی */
  search(q?: string, category?: FoodCategory) {
    const where: Prisma.IranianFoodWhereInput = {
      ...(category ? { category } : {}),
      ...(q
        ? {
            OR: [
              { nameFa: { contains: q } },
              { nameEn: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    return this.prisma.iranianFood.findMany({
      where,
      orderBy: { nameFa: 'asc' },
      take: 50,
    });
  }

  async byId(id: string) {
    const food = await this.prisma.iranianFood.findUnique({ where: { id } });
    if (!food) throw new NotFoundException('غذا یافت نشد');
    return food;
  }

  /**
   * تحلیل تاثیر غذا روی قند خون
   * خروجی: بار گلیسمی وعده، تخمین جهش قند و زمان اوج
   */
  async analyzeImpact(foodId: string, servings = 1) {
    const food = await this.byId(foodId);
    const carbs = food.carbsG * servings;
    const gl = glycemicLoad(food.glycemicIndex, carbs);

    // تخمین تجربی: هر واحد GL ≈ ۳ تا ۴ mg/dL افزایش قند در افراد دیابتی نوع ۲
    const spike = estimatedSpike(gl);
    const peakMinutes = food.glycemicIndex >= 70 ? 45 : food.glycemicIndex >= 55 ? 75 : 105;

    return {
      food: food.nameFa,
      servings,
      totalCarbsG: Math.round(carbs * 10) / 10,
      totalCalories: Math.round(food.calories * servings),
      glycemicIndex: food.glycemicIndex,
      giLevel: food.giLevel,
      glycemicLoad: gl,
      estimatedSpikeMgDl: spike,
      estimatedPeakMinutes: peakMinutes,
      note: food.sugarSpikeNote,
      healthierSwap: food.healthierSwap,
      summaryFa: `این وعده حدود ${Math.round(carbs)} گرم کربوهیدرات دارد و انتظار می‌رود قند خون را تقریباً ${spike} واحد، با اوج در حدود ${peakMinutes} دقیقه بعد، افزایش دهد.`,
    };
  }
}
