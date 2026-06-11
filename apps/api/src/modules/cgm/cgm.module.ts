import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { CgmController } from './cgm.controller';
import { CgmService } from './cgm.service';

@Module({
  imports: [NotificationsModule],
  controllers: [CgmController],
  providers: [CgmService],
})
export class CgmModule {}
