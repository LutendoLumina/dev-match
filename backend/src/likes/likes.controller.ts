import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import { CurrentUserId } from '../auth/current-user.decorator.js';
import { LikesService } from './likes.service.js';

/** Every route here needs a logged-in user. */
@Controller()
@UseGuards(AuthGuard)
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  // POST /profiles/:id/like
  @Post('profiles/:id/like')
  @HttpCode(HttpStatus.OK)
  like(@CurrentUserId() userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.likesService.like(userId, id);
  }

  // DELETE /profiles/:id/like
  @Delete('profiles/:id/like')
  @HttpCode(HttpStatus.NO_CONTENT)
  unlike(@CurrentUserId() userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.likesService.unlike(userId, id);
  }

  // GET /likes: ids of the profiles I've liked
  @Get('likes')
  likedProfileIds(@CurrentUserId() userId: string) {
    return this.likesService.likedProfileIds(userId);
  }

  // GET /matches: people who liked me back
  @Get('matches')
  matches(@CurrentUserId() userId: string) {
    return this.likesService.matches(userId);
  }
}
