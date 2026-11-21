import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  // GET /api/health: used by the hosting platform to check the app is up.
  @Get('health')
  health() {
    return { status: 'ok' };
  }
}
