import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { json } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // حد بدنه برای آپلود base64 عکس غذا
  app.use(json({ limit: '8mb' }));

  // ---------- امنیت ----------
  app.use(helmet());
  app.enableCors({
    origin: process.env.WEB_ORIGIN?.split(',') ?? ['http://localhost:3000'],
    credentials: true,
  });

  // ---------- اعتبارسنجی سراسری ----------
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,            // حذف فیلدهای ناشناخته
      forbidNonWhitelisted: true, // خطا برای فیلد اضافی
      transform: true,
    }),
  );

  app.setGlobalPrefix('api/v1');

  const port = Number(process.env.API_PORT ?? 4000);
  await app.listen(port);
  console.log(`🚀 Glucia API → http://localhost:${port}/api/v1`);
}
bootstrap();
