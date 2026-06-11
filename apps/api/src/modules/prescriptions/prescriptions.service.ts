import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Severity } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreatePrescriptionDto, CreateTemplateDto } from './prescriptions.dto';

@Injectable()
export class PrescriptionsService {
  constructor(
    private prisma: PrismaService,
    private notifs: NotificationsService,
  ) {}

  // ---------- صدور نسخه ----------
  async create(doctorId: string, dto: CreatePrescriptionDto) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: dto.patientId },
      include: { user: true },
    });
    if (!patient) throw new NotFoundException('بیمار یافت نشد');

    const rx = await this.prisma.prescription.create({
      data: {
        patientId: dto.patientId,
        doctorId,
        diagnosis: dto.diagnosis,
        notes: dto.notes,
        dietPlan: dto.dietPlan,
        exercisePlan: dto.exercisePlan,
        items: { create: dto.items },
      },
      include: {
        items: true,
        doctor: { include: { user: { select: { fullName: true } } } },
      },
    });

    await this.notifs.notify(
      patient.userId,
      'نسخه جدید صادر شد',
      `پزشک شما نسخه جدیدی با ${dto.items.length} قلم دارو ثبت کرد. از بخش نسخه‌ها مشاهده کنید.`,
      Severity.INFO,
    );

    return rx;
  }

  // ---------- نسخه‌های بیمار ----------
  mine(patientId: string) {
    return this.prisma.prescription.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
        doctor: { include: { user: { select: { fullName: true } } } },
      },
    });
  }

  async byId(id: string, user: { patientId?: string; doctorId?: string; role: string }) {
    const rx = await this.prisma.prescription.findUnique({
      where: { id },
      include: {
        items: true,
        doctor: { include: { user: { select: { fullName: true } } } },
        patient: { include: { user: { select: { fullName: true } } } },
      },
    });
    if (!rx) throw new NotFoundException('نسخه یافت نشد');
    // کنترل دسترسی: فقط بیمارِ نسخه، پزشکِ صادرکننده یا ادمین
    const allowed =
      user.role === 'ADMIN' ||
      rx.patientId === user.patientId ||
      rx.doctorId === user.doctorId;
    if (!allowed) throw new ForbiddenException('دسترسی به این نسخه مجاز نیست');
    return rx;
  }

  // ---------- قالب‌های نسخه ----------
  createTemplate(doctorId: string, dto: CreateTemplateDto) {
    return this.prisma.prescriptionTemplate.create({
      data: { doctorId, title: dto.title, body: dto.body as object },
    });
  }

  listTemplates(doctorId: string) {
    return this.prisma.prescriptionTemplate.findMany({ where: { doctorId } });
  }
}
