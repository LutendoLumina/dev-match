import { Module } from '@nestjs/common';
import { LikesModule } from '../likes/likes.module.js';
import { MessagesController } from './messages.controller.js';
import { MessagesService } from './messages.service.js';

@Module({
  imports: [LikesModule], // for LikesService.isMatch / matches
  controllers: [MessagesController],
  providers: [MessagesService],
})
export class MessagesModule {}
