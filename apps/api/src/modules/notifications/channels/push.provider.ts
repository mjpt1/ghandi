import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * آداپتور Push Notification (FCM HTTP v1 legacy)
 * بدون FCM_SERVER_KEY فقط لاگ می‌کند.
 */
@Injectable()
export class PushProvider {
  private logger = new Logger('Push');
  private serverKey = process.env.FCM_SERVER_KEY;

  constructor(private prisma: PrismaService) {}

  async sendToUser(userId: string, title: string, body: string): Promise<number> {
    const devices = await this.prisma.device.findMany({
      where: { userId, pushToken: { not: null } },
      select: { pushToken: true },
    });
    const tokens = devices.map((d) => d.pushToken!).filter(Boolean);

    if (!this.serverKey) {
      this.logger.log(`[DEV] Push به ${tokens.length} دستگاه کاربر ${userId}: ${title}`);
      return tokens.length;
    }

    let sent = 0;
    for (const token of tokens) {
      try {
        const res = await fetch('https://fcm.googleapis.com/fcm/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `key=${this.serverKey}`,
          },
          body: JSON.stringify({ to: token, notification: { title, body } }),
        });
        if (res.ok) sent++;
      } catch (e) {
        this.logger.error(`خطای FCM: ${e}`);
      }
    }
    return sent;
  }
}
