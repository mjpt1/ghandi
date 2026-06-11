import { Injectable, Logger } from '@nestjs/common';

/** آداپتور تلگرام — Bot API. بدون توکن فقط لاگ می‌کند */
@Injectable()
export class TelegramProvider {
  private logger = new Logger('Telegram');
  private token = process.env.TELEGRAM_BOT_TOKEN;

  async send(chatId: string, text: string): Promise<boolean> {
    if (!this.token) {
      this.logger.log(`[DEV] تلگرام به ${chatId}: ${text}`);
      return true;
    }
    try {
      const res = await fetch(`https://api.telegram.org/bot${this.token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text }),
      });
      return res.ok;
    } catch (e) {
      this.logger.error(`خطای تلگرام: ${e}`);
      return false;
    }
  }
}
