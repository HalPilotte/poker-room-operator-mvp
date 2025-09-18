// services/api/src/main.ts
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
  app.enableCors({ origin: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));

  const shutdown = async () => {
    try { await app.close(); } finally { process.exit(0); }
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
  process.once('beforeExit', async () => { await app.close(); });

  await app.listen(Number(process.env.PORT || 4000), '0.0.0.0');
}
bootstrap();