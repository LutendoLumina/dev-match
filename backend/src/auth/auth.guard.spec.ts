import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AUTH_COOKIE } from './auth.constants.js';
import { AuthGuard } from './auth.guard.js';

const jwt = new JwtService({ secret: 'test-secret' });
const guard = new AuthGuard(jwt);

function contextWithCookies(cookies: Record<string, string>) {
  const request: Record<string, unknown> = { cookies };
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  return { context, request };
}

describe('AuthGuard', () => {
  it('allows a request with a valid token and sets request.user', async () => {
    const token = await jwt.signAsync({ sub: 'user-1' });
    const { context, request } = contextWithCookies({ [AUTH_COOKIE]: token });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toEqual({ id: 'user-1' });
  });

  it('rejects a request without a token', async () => {
    const { context } = contextWithCookies({});

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects a token signed with a different secret', async () => {
    const forged = await new JwtService({ secret: 'attacker' }).signAsync({ sub: 'user-1' });
    const { context } = contextWithCookies({ [AUTH_COOKIE]: forged });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
