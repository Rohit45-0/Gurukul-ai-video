import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { Response } from 'express';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const webRoot = join(process.cwd(), 'public');
  const allowedOrigins = (
    process.env.CORS_ORIGINS ??
    process.env.WEB_APP_URL ??
    'http://localhost:3000,http://127.0.0.1:3000'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const corsOrigin: NonNullable<CorsOptions['origin']> = (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin ${origin} is not allowed by CORS.`), false);
  };

  app.enableCors({
    origin: corsOrigin,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  if (existsSync(webRoot)) {
    app.useStaticAssets(webRoot, { index: false });
  }

  const prismaService = app.get(PrismaService);
  prismaService.enableShutdownHooks(app);

  if (existsSync(webRoot)) {
    const expressApp = app.getHttpAdapter().getInstance();
    expressApp.get(/^(?!\/api\/v1).*/, (_request: unknown, response: Response) => {
      response.sendFile(join(webRoot, 'index.html'));
    });
  }

  await app.listen(
    Number(process.env.PORT ?? process.env.API_PORT ?? 4000),
    process.env.API_HOST ?? '0.0.0.0',
  );
}

void bootstrap();
