import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import express, { type Request, type Response, json } from 'express';
import { AppModule } from './app.module';

const expressApp = express();
let cachedApp: INestApplication | null = null;

async function bootstrap(): Promise<INestApplication> {
  if (cachedApp) return cachedApp;
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));
  app.use(json({ limit: '8mb' }));
  app.use(helmet());
  app.enableCors({
    origin: process.env.WEB_ORIGIN?.split(',') ?? ['http://localhost:3000'],
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.setGlobalPrefix('api/v1');
  await app.init();
  cachedApp = app;
  return app;
}

// Vercel serverless handler
export default async function handler(req: Request, res: Response) {
  try {
    await bootstrap();
    expressApp(req, res);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[bootstrap error]', msg);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Bootstrap failed', detail: msg });
    }
  }
}

// Local development
if (require.main === module) {
  bootstrap().then(() => {
    const port = Number(process.env.API_PORT ?? 4000);
    expressApp.listen(port, () => {
      console.log(`🚀 Glucia API → http://localhost:${port}/api/v1`);
    });
  });
}
