import { Injectable, Logger } from '@nestjs/common';

/**
 * آداپتور پیامک — سازگار با کاوه‌نگار / SMS.ir
 * بدون کلید، فقط لاگ می‌کند (حالت توسعه).
 */
@Injectable()
export class SmsProvider {
  private logger = new Logger('SMS');
  private apiKey = process.env.SMS_PROVIDER_API_KEY;

  async send(phone: string, text: string): Promise<boolean> {
    if (!this.apiKey) {
      this.logger.log(`[DEV] پیامک به ${phone}: ${text}`);
      return true;
    }
    try {
      // نمونه برای کاوه‌نگار:
      const res = await fetch(
        `https://api.kavenegar.com/v1/${this.apiKey}/sms/send.json`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ receptor: phone, message: text }),
        },
      );
      return res.ok;
    } catch (e) {
      this.logger.error(`خطای ارسال پیامک: ${e}`);
      return false;
    }
  }
}
