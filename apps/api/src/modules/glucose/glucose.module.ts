import { Module } from '@nestjs/common';
import { RealtimeModule } from '../realtime/realtime.module';
import { GlucoseController } from './glucose.controller';
import { GlucoseService } from './glucose.service';

@Module({
  imports: [RealtimeModule],
  controllers: [GlucoseController],
  providers: [GlucoseService],
  exports: [GlucoseService],
})
export class GlucoseModule {}
