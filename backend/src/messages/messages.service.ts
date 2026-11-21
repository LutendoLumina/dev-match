import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { LikesService } from '../likes/likes.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

const MESSAGE_PAGE_SIZE = 200;

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly likes: LikesService,
  ) {}

  /**
   * One entry per match: their profile, the latest message (if any) and how
   * many of their messages I haven't read. Most recent activity first.
   */
  async conversations(userId: string) {
    const me = await this.requireOwnProfile(userId);
    const matches = await this.likes.matches(userId);

    // One query per match keeps this simple; fine for a handful of matches.
    // At scale this would become a single SQL query with window functions.
    const conversations = await Promise.all(
      matches.map(async (profile) => {
        const [lastMessage, unreadCount] = await Promise.all([
          this.prisma.message.findFirst({
            where: this.between(me.id, profile.id),
            orderBy: { createdAt: 'desc' },
          }),
          this.prisma.message.count({
            where: { senderProfileId: profile.id, recipientProfileId: me.id, readAt: null },
          }),
        ]);
        return { profile, lastMessage, unreadCount };
      }),
    );

    const lastActivity = (c: (typeof conversations)[number]) =>
      (c.lastMessage?.createdAt ?? new Date(0)).getTime();
    return conversations.sort((a, b) => lastActivity(b) - lastActivity(a));
  }

  /** Messages between me and a match, oldest first. `since` limits it to newer ones (polling). */
  async list(userId: string, otherProfileId: string, since?: Date) {
    const me = await this.requireMatch(userId, otherProfileId);

    if (since) {
      return this.prisma.message.findMany({
        where: { ...this.between(me.id, otherProfileId), createdAt: { gte: since } },
        orderBy: { createdAt: 'asc' },
        take: MESSAGE_PAGE_SIZE,
      });
    }

    // First load: the most recent page, returned oldest-first for display.
    const latest = await this.prisma.message.findMany({
      where: this.between(me.id, otherProfileId),
      orderBy: { createdAt: 'desc' },
      take: MESSAGE_PAGE_SIZE,
    });
    return latest.reverse();
  }

  async send(userId: string, otherProfileId: string, body: string) {
    const me = await this.requireMatch(userId, otherProfileId);
    return this.prisma.message.create({
      data: { senderProfileId: me.id, recipientProfileId: otherProfileId, body },
    });
  }

  /** Mark every message they sent me as read. */
  async markRead(userId: string, otherProfileId: string) {
    const me = await this.requireMatch(userId, otherProfileId);
    await this.prisma.message.updateMany({
      where: { senderProfileId: otherProfileId, recipientProfileId: me.id, readAt: null },
      data: { readAt: new Date() },
    });
  }

  /** Messages in either direction between two profiles. */
  private between(a: string, b: string) {
    return {
      OR: [
        { senderProfileId: a, recipientProfileId: b },
        { senderProfileId: b, recipientProfileId: a },
      ],
    };
  }

  private async requireOwnProfile(userId: string) {
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    if (!profile) {
      throw new ForbiddenException('Create your profile before messaging');
    }
    return profile;
  }

  /** Returns my profile, or throws unless I'm matched with the other profile. */
  private async requireMatch(userId: string, otherProfileId: string) {
    const me = await this.requireOwnProfile(userId);
    const other = await this.prisma.profile.findUnique({ where: { id: otherProfileId } });
    if (!other) {
      throw new NotFoundException(`Profile with id ${otherProfileId} not found`);
    }
    if (!(await this.likes.isMatch(me.id, other.id))) {
      throw new ForbiddenException('You can only message people you have matched with');
    }
    return me;
  }
}
