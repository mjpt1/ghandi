import { Injectable } from '@nestjs/common';
import { NotificationChannel, Severity } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { SmsProvider } from './channels/sms.provider';
import { TelegramProvider } from './channels/telegram.provider';
import { PushProvider } from './channels/push.provider';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private realtime: RealtimeGateway,
    private sms: SmsProvider,
    private telegram: TelegramProvider,
    private push: PushProvider,
  ) {}

  /** ایجاد اعلان + ارسال از کانال مناسب (درون‌برنامه‌ای همیشه، بقیه بر اساس channel) */
  async notify(
    userId: string,
    title: string,
    body: string,
    severity: Severity = Severity.INFO,
    channel: NotificationChannel = NotificationChannel.IN_APP,
  ) {
    const n = await this.prisma.notification.create({
      data: { userId, title, body, severity, channel, sentAt: new Date() },
    });
    this.realtimeAndExternal(userId, channel, title, body, n);
    return n;
  }

  private async realtimeAndExternal(
    userId: string,
    channel: NotificationChannel,
    title: string,
    body: string,
    payload: unknown,
  ) {
    this.realtime.emitToUser(userId, 'notification', payload);

    if (channel === NotificationChannel.SMS) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user) await this.sms.send(user.phone, `${title}\n${body}`);
    } else if (channel === NotificationChannel.TELEGRAM) {
      // chatId کاربر باید در فاز اتصال بات ذخیره شود؛ فعلاً userId به‌عنوان placeholder
      await this.telegram.send(userId, `${title}\n${body}`);
    } else if (channel === NotificationChannel.PUSH) {
      await this.push.sendToUser(userId, title, body);
    }
  }

  /** ثبت/به‌روزرسانی توکن FCM دستگاه کاربر */
  registerDevice(userId: string, fingerprint: string, pushToken: string, userAgent?: string) {
    return this.prisma.device.upsert({
      where: { userId_fingerprint: { userId, fingerprint } },
      update: { pushToken, lastSeenAt: new Date() },
      create: { userId, fingerprint, pushToken, userAgent },
    });
  }

  list(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  markRead(userId: string, id: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { readAt: new Date() },
    });
  }
}
