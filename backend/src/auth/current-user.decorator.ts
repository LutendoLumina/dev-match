import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedRequest } from './auth.guard.js';

/**
 * Injects the logged-in user's id into a route handler:
 * `@CurrentUserId() userId: string`. Only use on routes protected by AuthGuard.
 */
export const CurrentUserId = createParamDecorator((_data: unknown, context: ExecutionContext) => {
  return context.switchToHttp().getRequest<AuthenticatedRequest>().user.id;
});
