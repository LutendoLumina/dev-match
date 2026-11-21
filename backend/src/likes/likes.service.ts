import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class LikesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Like a profile. Liking twice is harmless (idempotent).
   * Returns `matched: true` when the other person has already liked you back.
   */
  async like(userId: string, targetProfileId: string) {
    const me = await this.requireOwnProfile(userId);
    if (me.id === targetProfileId) {
      throw new BadRequestException("You can't like your own profile");
    }
    const target = await this.prisma.profile.findUnique({ where: { id: targetProfileId } });
    if (!target) {
      throw new NotFoundException(`Profile with id ${targetProfileId} not found`);
    }

    // upsert = "create it, or do nothing if it already exists".
    await this.prisma.like.upsert({
      where: { fromProfileId_toProfileId: { fromProfileId: me.id, toProfileId: target.id } },
      create: { fromProfileId: me.id, toProfileId: target.id },
      update: {},
    });

    const likedBack = await this.prisma.like.findUnique({
      where: { fromProfileId_toProfileId: { fromProfileId: target.id, toProfileId: me.id } },
    });
    return { matched: likedBack !== null };
  }

  /** Remove a like (which also undoes a match). Unliking something you never liked is harmless. */
  async unlike(userId: string, targetProfileId: string) {
    const me = await this.requireOwnProfile(userId);
    await this.prisma.like.deleteMany({
      where: { fromProfileId: me.id, toProfileId: targetProfileId },
    });
  }

  /** Ids of every profile the user has liked. */
  async likedProfileIds(userId: string): Promise<string[]> {
    const me = await this.prisma.profile.findUnique({ where: { userId } });
    if (!me) return [];

    const likes = await this.prisma.like.findMany({
      where: { fromProfileId: me.id },
      select: { toProfileId: true },
    });
    return likes.map((like) => like.toProfileId);
  }

  /** Profiles that the user liked AND that liked the user back. */
  async matches(userId: string) {
    const me = await this.prisma.profile.findUnique({ where: { userId } });
    if (!me) return [];

    return this.prisma.profile.findMany({
      where: {
        likesReceived: { some: { fromProfileId: me.id } }, // I liked them
        likesGiven: { some: { toProfileId: me.id } }, // they liked me
      },
      orderBy: { name: 'asc' },
    });
  }

  /** True when both profiles have liked each other. */
  async isMatch(profileIdA: string, profileIdB: string): Promise<boolean> {
    const count = await this.prisma.like.count({
      where: {
        OR: [
          { fromProfileId: profileIdA, toProfileId: profileIdB },
          { fromProfileId: profileIdB, toProfileId: profileIdA },
        ],
      },
    });
    return count === 2;
  }

  private async requireOwnProfile(userId: string) {
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    if (!profile) {
      throw new ForbiddenException('Create your profile before liking others');
    }
    return profile;
  }
}
