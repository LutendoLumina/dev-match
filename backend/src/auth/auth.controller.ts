import { Body, Controller, Get, HttpCode, HttpStatus, Post, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AUTH_COOKIE, authCookieOptions } from './auth.constants.js';
import { AuthGuard } from './auth.guard.js';
import { AuthService } from './auth.service.js';
import { CurrentUserId } from './current-user.decorator.js';
import { AuthCredentialsDto } from './dto/auth-credentials.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // POST /auth/register: create an account. Does NOT log in; the user logs in
  // afterwards with POST /auth/login, which confirms they know the password.
  @Post('register')
  register(@Body() dto: AuthCredentialsDto) {
    return this.authService.register(dto);
  }

  // POST /auth/login
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: AuthCredentialsDto, @Res({ passthrough: true }) res: Response) {
    const { userId, token } = await this.authService.login(dto);
    res.cookie(AUTH_COOKIE, token, authCookieOptions);
    return this.authService.getMe(userId);
  }

  // POST /auth/logout
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Res({ passthrough: true }) res: Response) {
    const { maxAge: _maxAge, ...clearOptions } = authCookieOptions;
    res.clearCookie(AUTH_COOKIE, clearOptions);
  }

  // GET /auth/me: who is logged in?
  @Get('me')
  @UseGuards(AuthGuard)
  me(@CurrentUserId() userId: string) {
    return this.authService.getMe(userId);
  }
}
