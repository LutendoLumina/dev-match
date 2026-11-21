import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import { CurrentUserId } from '../auth/current-user.decorator.js';
import { ListMessagesQueryDto } from './dto/list-messages-query.dto.js';
import { SendMessageDto } from './dto/send-message.dto.js';
import { MessagesService } from './messages.service.js';

/** A conversation is identified by the other person's profile id. */
@Controller('conversations')
@UseGuards(AuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  // GET /conversations: my matches with last message and unread count
  @Get()
  conversations(@CurrentUserId() userId: string) {
    return this.messagesService.conversations(userId);
  }

  // GET /conversations/:profileId/messages?since=<ISO date>
  @Get(':profileId/messages')
  list(
    @CurrentUserId() userId: string,
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Query() query: ListMessagesQueryDto,
  ) {
    return this.messagesService.list(userId, profileId, query.since);
  }

  // POST /conversations/:profileId/messages
  @Post(':profileId/messages')
  send(
    @CurrentUserId() userId: string,
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.messagesService.send(userId, profileId, dto.body);
  }

  // POST /conversations/:profileId/read: mark their messages as read
  @Post(':profileId/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  markRead(@CurrentUserId() userId: string, @Param('profileId', ParseUUIDPipe) profileId: string) {
    return this.messagesService.markRead(userId, profileId);
  }
}
