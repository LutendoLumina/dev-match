import { ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import type { NextFunction, Request, Response } from 'express';
import { existsSync } from 'fs';
import { join, resolve } from 'path';

/** All API routes live under /api, leaving every other path for the React app. */
export const API_PREFIX = 'api';

/**
 * Shared app configuration, used by main.ts and the e2e tests so tests run
 * against exactly what's deployed.
 */
export function configureApp(app: NestExpressApplication) {
  app.setGlobalPrefix(API_PREFIX);

  // Read cookies (the login token lives in an httpOnly cookie).
  app.use(cookieParser());

  // Reject request bodies that fail DTO validation, and strip unknown fields.
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  // Only needed when the frontend runs on a different origin (e.g. Vite dev server without proxy).
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  });
}

/**
 * In production the backend also serves the built React app, so the whole
 * site is one origin: no CORS, and the login cookie stays first-party.
 */
export function serveFrontend(app: NestExpressApplication) {
  // backend/dist/main.js -> frontend/dist
  const frontendDir = resolve(import.meta.dirname, '../../frontend/dist');
  if (!existsSync(join(frontendDir, 'index.html'))) {
    throw new Error(`SERVE_FRONTEND is set but no build was found at ${frontendDir}`);
  }

  app.useStaticAssets(frontendDir, { index: false, maxAge: '1h' });

  // Any other GET that isn't an API call or a file (e.g. /profiles/123) is a
  // React route: answer with index.html and let React Router render the page.
  // Missing files like /assets/old.js fall through to a proper 404.
  const looksLikeFile = /\.[a-z0-9]+$/i;
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (
      req.method === 'GET' &&
      !req.path.startsWith(`/${API_PREFIX}/`) &&
      !looksLikeFile.test(req.path)
    ) {
      res.sendFile(join(frontendDir, 'index.html'));
    } else {
      next();
    }
  });
}
