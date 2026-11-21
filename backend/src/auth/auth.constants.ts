import type { CookieOptions } from 'express';

/** Name of the httpOnly cookie that carries the login token. */
export const AUTH_COOKIE = 'access_token';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export const authCookieOptions: CookieOptions = {
  httpOnly: true, // not readable from JavaScript, so XSS can't steal it
  sameSite: 'lax', // not sent on cross-site POST/PUT/DELETE, which blocks CSRF
  secure: process.env.NODE_ENV === 'production', // HTTPS-only in production
  maxAge: SEVEN_DAYS_MS,
  path: '/',
};

/** Shape of the data signed into the JWT. `sub` (subject) is the user id. */
export interface JwtPayload {
  sub: string;
}
