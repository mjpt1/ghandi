import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateHealthLogDto, CreateMealDto } from './patients.dto';

@Injectable()
export class PatientsService {
  constructor(private prisma: PrismaService) {}

  // ---------- لیست بیماران برای پزشک ----------
  async listForDoctor() {
    const patients = await this.prisma.patient.findMany({
      include: { user: { select: { fullName: true, phone: true, avatarUrl: true } } },
      take: 200,
    });

    const since = new Date(Date.now() - 7 * 24 * 3600 * 1000);
    const avgs = await this.prisma.glucoseLog.groupBy({
      by: ['patientId'],
      where: { measuredAt: { gte: since } },
      _avg: { valueMgDl: true },
      _max: { measuredAt: true },
      _count: true,
    });
    const map = new Map(avgs.map((a) => [a.patientId, a]));

    return patients.map((p) => {
      const a = map.get(p.id);
      return {
        id: p.id,
        fullName: p.user.fullName,
        phone: p.user.phone,
        diabetesType: p.diabetesType,
        healthScore: p.healthScore,
        avg7: a?._avg.valueMgDl ? Math.round(a._avg.valueMgDl) : null,
        logsCount7d: a?._count ?? 0,
        lastMeasuredAt: a?._max.measuredAt ?? null,
      };
    });
  }

  // ---------- پرونده بیمار (پزشک) ----------
  async detail(patientId: string) {
    const p = await this.prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        user: { select: { fullName: true, phone: true } },
        glucoseLogs: { orderBy: { measuredAt: 'desc' }, take: 100 },
        meals: {
          orderBy: { eatenAt: 'desc' },
          take: 10,
          include: { items: { include: { food: true } } },
        },
        aiInsights: { orderBy: { createdAt: 'desc' }, take: 10 },
        medications: { where: { active: true } },
        prescriptions: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: { items: true },
        },
      },
    });
    if (!p) throw new NotFoundException('بیمار یافت نشد');
    return p;
  }

  // ---------- پروفایل خود بیمار ----------
  me(patientId: string) {
    return this.prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        user: { select: { fullName: true, phone: true, email: true } },
        badges: { include: { badge: true } },
      },
    });
  }

  // ---------- ثبت داده سلامتی ----------
  addHealthLog(patientId: string, dto: CreateHealthLogDto) {
    return this.prisma.healthLog.create({
      data: {
        patientId,
        kind: dto.kind,
        value: dto.value,
        systolic: dto.systolic,
        diastolic: dto.diastolic,
        text: dto.text,
        loggedAt: dto.loggedAt ? new Date(dto.loggedAt) : new Date(),
      },
    });
  }

  listHealthLogs(patientId: string, kind?: string) {
    return this.prisma.healthLog.findMany({
      where: { patientId, ...(kind ? { kind: kind as never } : {}) },
      orderBy: { loggedAt: 'desc' },
      take: 200,
    });
  }

  // ---------- ثبت وعده غذایی با محاسبه خودکار ----------
  async addMeal(patientId: string, dto: CreateMealDto) {
    const foods = await this.prisma.iranianFood.findMany({
      where: { id: { in: dto.items.map((i) => i.foodId) } },
    });
    if (foods.length !== dto.items.length) {
      throw new NotFoundException('یک یا چند غذا یافت نشد');
    }

    let carbs = 0;
    let calories = 0;
    for (const item of dto.items) {
      const f = foods.find((x) => x.id === item.foodId)!;
      carbs += f.carbsG * item.servings;
      calories += f.calories * item.servings;
    }

    return this.prisma.meal.create({
      data: {
        patientId,
        type: dto.type,
        note: dto.note,
        eatenAt: dto.eatenAt ? new Date(dto.eatenAt) : new Date(),
        totalCarbsG: Math.round(carbs * 10) / 10,
        totalCalories: Math.round(calories),
        items: {
          create: dto.items.map((i) => ({ foodId: i.foodId, servings: i.servings })),
        },
      },
      include: { items: { include: { food: true } } },
    });
  }

  listMeals(patientId: string) {
    return this.prisma.meal.findMany({
      where: { patientId },
      orderBy: { eatenAt: 'desc' },
      take: 50,
      include: { items: { include: { food: true } } },
    });
  }
}
