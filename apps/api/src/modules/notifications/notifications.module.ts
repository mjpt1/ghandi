import { Module } from '@nestjs/common';
import { RealtimeModule } from '../realtime/realtime.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { SmsProvider } from './channels/sms.provider';
import { TelegramProvider } from './channels/telegram.provider';
import { PushProvider } from './channels/push.provider';

@Module({
  imports: [RealtimeModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, SmsProvider, TelegramProvider, PushProvider],
  exports: [NotificationsService],
})
export class NotificationsModule {}
