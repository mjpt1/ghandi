import { Injectable, NotFoundException } from '@nestjs/common';
import { AppointmentKind, AppointmentStatus, Severity } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AppointmentsService {
  constructor(
    private prisma: PrismaService,
    private notifs: NotificationsService,
  ) {}

  /** رزرو نوبت توسط بیمار */
  async book(
    patientId: string,
    dto: { doctorId: string; kind: AppointmentKind; scheduledAt: string; note?: string },
  ) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: dto.doctorId },
      include: { user: true },
    });
    if (!doctor) throw new NotFoundException('پزشک یافت نشد');

    const appt = await this.prisma.appointment.create({
      data: {
        patientId,
        doctorId: dto.doctorId,
        kind: dto.kind,
        scheduledAt: new Date(dto.scheduledAt),
        note: dto.note,
      },
    });

    await this.notifs.notify(
      doctor.userId,
      'درخواست نوبت جدید',
      'یک بیمار درخواست ویزیت ثبت کرد. از پنل خود تایید یا رد کنید.',
    );
    return appt;
  }

  mine(patientId: string) {
    return this.prisma.appointment.findMany({
      where: { patientId },
      orderBy: { scheduledAt: 'desc' },
      include: { doctor: { include: { user: { select: { id: true, fullName: true } } } } },
    });
  }

  forDoctor(doctorId: string) {
    return this.prisma.appointment.findMany({
      where: { doctorId },
      orderBy: { scheduledAt: 'asc' },
      include: { patient: { include: { user: { select: { id: true, fullName: true } } } } },
    });
  }

  /** تغییر وضعیت توسط پزشک + اطلاع‌رسانی بیمار */
  async setStatus(doctorId: string, id: string, status: AppointmentStatus) {
    const appt = await this.prisma.appointment.findFirst({
      where: { id, doctorId },
      include: { patient: true },
    });
    if (!appt) throw new NotFoundException('نوبت یافت نشد');

    const updated = await this.prisma.appointment.update({ where: { id }, data: { status } });

    const msgs: Partial<Record<AppointmentStatus, string>> = {
      CONFIRMED: 'نوبت شما تایید شد. سر ساعت مقرر وارد بخش ویزیت تصویری شوید.',
      CANCELLED: 'متاسفانه نوبت شما لغو شد. لطفاً زمان دیگری رزرو کنید.',
      COMPLETED: 'ویزیت شما انجام شد. مراقب سلامتی خود باشید!',
    };
    if (msgs[status]) {
      await this.notifs.notify(
        appt.patient.userId,
        'به‌روزرسانی نوبت',
        msgs[status]!,
        status === 'CANCELLED' ? Severity.MEDIUM : Severity.INFO,
      );
    }
    return updated;
  }
}
