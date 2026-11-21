import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { AUTH_COOKIE, type JwtPayload } from './auth.constants.js';

/** Request after AuthGuard has run: `user` is the logged-in user. */
export interface AuthenticatedRequest extends Request {
  user: { id: string };
}

/**
 * Lets a request through only if it carries a valid login cookie.
 * Use with `@UseGuards(AuthGuard)` on a route or controller.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token: unknown = request.cookies?.[AUTH_COOKIE];
    if (typeof token !== 'string' || !token) {
      throw new UnauthorizedException('You need to log in');
    }

    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token);
      request.user = { id: payload.sub };
      return true;
    } catch {
      throw new UnauthorizedException('Your session has expired, please log in again');
    }
  }
}
