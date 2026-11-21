import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Reject request bodies that fail DTO validation, and strip unknown fields.
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));

  // Allow the React frontend to call the API when it's hosted on another origin.
  app.enableCors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173' });

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
