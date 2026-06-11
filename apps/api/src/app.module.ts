import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { GlucoseModule } from './modules/glucose/glucose.module';
import { FoodsModule } from './modules/foods/foods.module';
import { AiModule } from './modules/ai/ai.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { PatientsModule } from './modules/patients/patients.module';
import { PrescriptionsModule } from './modules/prescriptions/prescriptions.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { UsersModule } from './modules/users/users.module';
import { ChatModule } from './modules/chat/chat.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { CgmModule } from './modules/cgm/cgm.module';
import { HealthController } from './health.controller';

import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Rate Limiting: حداکثر ۱۰۰ درخواست در دقیقه برای هر IP
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    GlucoseModule,
    FoodsModule,
    AiModule,
    RealtimeModule,
    PatientsModule,
    PrescriptionsModule,
    NotificationsModule,
    UsersModule,
    ChatModule,
    PaymentsModule,
    AppointmentsModule,
    CgmModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard }, // همه مسیرها محافظت‌شده مگر @Public
    { provide: APP_GUARD, useClass: RolesGuard },   // RBAC
  ],
})
export class AppModule {}
