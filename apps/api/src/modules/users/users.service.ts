import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const safeUser = {
  id: true,
  phone: true,
  email: true,
  fullName: true,
  role: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // ---------- لیست کاربران (ادمین) ----------
  list(q?: string, role?: Role) {
    return this.prisma.user.findMany({
      where: {
        ...(role ? { role } : {}),
        ...(q
          ? { OR: [{ fullName: { contains: q } }, { phone: { contains: q } }] }
          : {}),
      },
      select: safeUser,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  // ---------- فعال/غیرفعال‌سازی ----------
  async toggleActive(id: string, adminId: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('کاربر یافت نشد');

    const updated = await this.prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: safeUser,
    });

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: updated.isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
        entity: 'user',
        entityId: id,
      },
    });
    return updated;
  }

  // ---------- آمار کلی سیستم (ادمین) ----------
  async stats() {
    const [patients, doctors, admins, glucoseLogs, meals, insights, activeSubs, audit24h] =
      await Promise.all([
        this.prisma.user.count({ where: { role: Role.PATIENT } }),
        this.prisma.user.count({ where: { role: Role.DOCTOR } }),
        this.prisma.user.count({ where: { role: Role.ADMIN } }),
        this.prisma.glucoseLog.count(),
        this.prisma.meal.count(),
        this.prisma.aiInsight.count(),
        this.prisma.subscription.count({ where: { status: 'ACTIVE' } }),
        this.prisma.auditLog.count({
          where: { createdAt: { gte: new Date(Date.now() - 24 * 3600 * 1000) } },
        }),
      ]);
    return { patients, doctors, admins, glucoseLogs, meals, insights, activeSubs, audit24h };
  }

  // ---------- لاگ‌های حسابرسی ----------
  auditLogs() {
    return this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { user: { select: { fullName: true, phone: true } } },
    });
  }
}
