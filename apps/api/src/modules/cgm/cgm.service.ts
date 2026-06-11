import { BadRequestException, ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { MeasurementContext, Severity } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

const PROVIDERS = ['dexcom', 'libre'] as const;
type Provider = (typeof PROVIDERS)[number];

/**
 * ماژول CGM (سنسور پیوسته قند)
 *
 * نکته: API رسمی Dexcom/Abbott نیازمند قرارداد و OAuth اختصاصی است.
 * این ماژول معماری کامل ingest را پیاده می‌کند:
 *  - connect/disconnect برای بیمار
 *  - sync: در حالت توسعه، شبیه‌ساز خوانش تولید می‌کند؛ با کلید واقعی، fetch از provider
 *  - webhook: ورودی استاندارد برای bridgeهای خارجی (با secret)
 */
@Injectable()
export class CgmService {
  private logger = new Logger('CGM');

  constructor(
    private prisma: PrismaService,
    private notifs: NotificationsService,
  ) {}

  async connect(patientId: string, provider: string) {
    if (!PROVIDERS.includes(provider as Provider)) {
      throw new BadRequestException('سنسور پشتیبانی‌شده: dexcom یا libre');
    }
    return this.prisma.patient.update({
      where: { id: patientId },
      data: { cgmConnected: true, cgmProvider: provider },
      select: { cgmConnected: true, cgmProvider: true },
    });
  }

  disconnect(patientId: string) {
    return this.prisma.patient.update({
      where: { id: patientId },
      data: { cgmConnected: false, cgmProvider: null },
      select: { cgmConnected: true },
    });
  }

  /** همگام‌سازی خوانش‌ها؛ بدون کلید واقعی → شبیه‌ساز ۳ ساعت اخیر (هر ۱۵ دقیقه) */
  async sync(patientId: string) {
    const patient = await this.prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient?.cgmConnected) {
      throw new BadRequestException('ابتدا سنسور خود را متصل کنید');
    }

    // TODO با قرارداد واقعی: fetch از Dexcom EGV API / LibreLinkUp
    const readings = this.simulateReadings();
    const result = await this.ingest(patientId, readings);
    this.logger.log(`CGM sync (${patient.cgmProvider}): ${result.inserted} خوانش`);
    return { provider: patient.cgmProvider, ...result, simulated: true };
  }

  /** ورودی webhook برای bridge خارجی — احراز با secret اشتراکی */
  async webhook(
    secret: string | undefined,
    body: { patientId: string; readings: { valueMgDl: number; measuredAt: string }[] },
  ) {
    if (!process.env.CGM_WEBHOOK_SECRET || secret !== process.env.CGM_WEBHOOK_SECRET) {
      throw new ForbiddenException('secret نامعتبر');
    }
    return this.ingest(
      body.patientId,
      body.readings.map((r) => ({ valueMgDl: r.valueMgDl, measuredAt: new Date(r.measuredAt) })),
    );
  }

  // ---------- درج خوانش‌ها + هشدار افت ----------
  private async ingest(
    patientId: string,
    readings: { valueMgDl: number; measuredAt: Date }[],
  ) {
    if (!readings.length) return { inserted: 0 };

    await this.prisma.glucoseLog.createMany({
      data: readings.map((r) => ({
        patientId,
        valueMgDl: r.valueMgDl,
        measuredAt: r.measuredAt,
        context: MeasurementContext.CGM,
        source: 'cgm',
      })),
    });

    const last = readings[readings.length - 1];
    if (last.valueMgDl < 70) {
      const patient = await this.prisma.patient.findUnique({ where: { id: patientId } });
      if (patient) {
        await this.notifs.notify(
          patient.userId,
          '🚨 هشدار سنسور: افت قند',
          `سنسور CGM قند ${last.valueMgDl} را ثبت کرد. سریعاً کربوهیدرات سریع‌الجذب مصرف کنید.`,
          Severity.CRITICAL,
        );
      }
    }
    return { inserted: readings.length };
  }

  /** شبیه‌ساز خوانش واقع‌گرایانه با random walk حول ۱۲۰ */
  private simulateReadings() {
    const out: { valueMgDl: number; measuredAt: Date }[] = [];
    let v = 115 + Math.round(Math.random() * 30);
    for (let i = 12; i >= 0; i--) {
      v = Math.max(60, Math.min(260, v + Math.round((Math.random() - 0.48) * 14)));
      out.push({ valueMgDl: v, measuredAt: new Date(Date.now() - i * 15 * 60_000) });
    }
    return out;
  }
}
