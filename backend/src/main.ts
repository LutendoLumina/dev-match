import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { configureApp, serveFrontend } from './app.setup.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  configureApp(app);
  if (process.env.SERVE_FRONTEND === 'true') {
    serveFrontend(app);
  }

  // Hosting platforms like Render tell the app which port to use via PORT.
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
