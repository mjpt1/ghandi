import { ForbiddenException, Injectable } from '@nestjs/common';
import { hba1cFromAvg, timeInRange } from '../../common/utils/health-math';
import { PrismaService } from '../../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { CreateGlucoseLogDto, GlucoseQueryDto } from './dto/glucose.dto';

@Injectable()
export class GlucoseService {
  constructor(
    private prisma: PrismaService,
    private realtime: RealtimeGateway,
  ) {}

  // ---------- ثبت قند خون ----------
  async create(patientId: string, dto: CreateGlucoseLogDto) {
    const log = await this.prisma.glucoseLog.create({
      data: {
        patientId,
        valueMgDl: dto.valueMgDl,
        context: dto.context,
        note: dto.note,
        measuredAt: dto.measuredAt ? new Date(dto.measuredAt) : new Date(),
      },
    });

    // هشدار لحظه‌ای هیپوگلیسمی / هایپرگلیسمی
    const patient = await this.prisma.patient.findUnique({ where: { id: patientId } });
    if (patient) {
      if (dto.valueMgDl < patient.targetGlucoseMin) {
        this.realtime.emitToUser(patient.userId, 'alert', {
          severity: 'CRITICAL',
          title: 'هشدار افت قند خون',
          body: `قند شما ${dto.valueMgDl} است. سریعاً ۱۵ گرم کربوهیدرات سریع‌الجذب (مثلاً ۳ حبه قند یا نصف لیوان آبمیوه) مصرف کنید.`,
        });
      } else if (dto.valueMgDl > 250) {
        this.realtime.emitToUser(patient.userId, 'alert', {
          severity: 'HIGH',
          title: 'هشدار قند خون بالا',
          body: `قند شما ${dto.valueMgDl} است. آب کافی بنوشید و در صورت تکرار با پزشک خود تماس بگیرید.`,
        });
      }
      this.realtime.emitToUser(patient.userId, 'glucose:new', log);
    }

    return log;
  }

  // ---------- لیست با فیلتر بازه ----------
  list(patientId: string, q: GlucoseQueryDto) {
    return this.prisma.glucoseLog.findMany({
      where: {
        patientId,
        measuredAt: {
          gte: q.from ? new Date(q.from) : undefined,
          lte: q.to ? new Date(q.to) : undefined,
        },
      },
      orderBy: { measuredAt: 'desc' },
      take: 500,
    });
  }

  // ---------- آمار: میانگین، TIR، تخمین HbA1c ----------
  async stats(patientId: string, days = 7) {
    const patient = await this.prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) throw new ForbiddenException();

    const from = new Date(Date.now() - days * 24 * 3600 * 1000);
    const logs = await this.prisma.glucoseLog.findMany({
      where: { patientId, measuredAt: { gte: from } },
      select: { valueMgDl: true },
    });

    if (!logs.length) {
      return { count: 0, average: null, timeInRange: null, estimatedHba1c: null };
    }

    const values = logs.map((l) => l.valueMgDl);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;

    return {
      count: values.length,
      average: Math.round(avg),
      estimatedHba1c: hba1cFromAvg(avg), // فرمول ADAG
      timeInRange: timeInRange(values, patient.targetGlucoseMin, patient.targetGlucoseMax),
    };
  }
}
