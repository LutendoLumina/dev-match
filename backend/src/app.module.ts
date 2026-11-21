import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { LikesModule } from './likes/likes.module.js';
import { MessagesModule } from './messages/messages.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ProfilesModule } from './profiles/profiles.module.js';

@Module({
  imports: [PrismaModule, AuthModule, ProfilesModule, LikesModule, MessagesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
