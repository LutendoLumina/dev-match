import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service.js';
import { LikesService } from './likes.service.js';

const userId = '11111111-1111-4111-8111-111111111111';
const myProfile = { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', userId };
const theirProfile = { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', userId: 'someone-else' };

describe('LikesService', () => {
  let service: LikesService;
  const prisma = {
    profile: { findUnique: vi.fn(), findMany: vi.fn() },
    like: { upsert: vi.fn(), findUnique: vi.fn(), deleteMany: vi.fn(), findMany: vi.fn() },
  };

  /** profile.findUnique returns my profile for { userId } and theirs for { id }. */
  function givenProfiles({ mine = true, theirs = true } = {}) {
    prisma.profile.findUnique.mockImplementation(({ where }) => {
      if (where.userId) return Promise.resolve(mine ? myProfile : null);
      if (where.id === theirProfile.id) return Promise.resolve(theirs ? theirProfile : null);
      return Promise.resolve(null);
    });
  }

  beforeEach(async () => {
    vi.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [LikesService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(LikesService);
  });

  describe('like', () => {
    it('records the like and reports no match when they have not liked back', async () => {
      givenProfiles();
      prisma.like.findUnique.mockResolvedValue(null);

      await expect(service.like(userId, theirProfile.id)).resolves.toEqual({ matched: false });
      expect(prisma.like.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: { fromProfileId: myProfile.id, toProfileId: theirProfile.id },
        }),
      );
    });

    it('reports a match when they already liked me', async () => {
      givenProfiles();
      prisma.like.findUnique.mockResolvedValue({ id: 'their-like' });

      await expect(service.like(userId, theirProfile.id)).resolves.toEqual({ matched: true });
      expect(prisma.like.findUnique).toHaveBeenCalledWith({
        where: {
          fromProfileId_toProfileId: { fromProfileId: theirProfile.id, toProfileId: myProfile.id },
        },
      });
    });

    it('rejects liking your own profile', async () => {
      givenProfiles();

      await expect(service.like(userId, myProfile.id)).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.like.upsert).not.toHaveBeenCalled();
    });

    it('requires the user to have a profile first', async () => {
      givenProfiles({ mine: false });

      await expect(service.like(userId, theirProfile.id)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('404s for a profile that does not exist', async () => {
      givenProfiles({ theirs: false });

      await expect(service.like(userId, theirProfile.id)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  it('unlike removes only my like', async () => {
    givenProfiles();

    await service.unlike(userId, theirProfile.id);
    expect(prisma.like.deleteMany).toHaveBeenCalledWith({
      where: { fromProfileId: myProfile.id, toProfileId: theirProfile.id },
    });
  });

  it('likedProfileIds returns the ids I liked', async () => {
    givenProfiles();
    prisma.like.findMany.mockResolvedValue([{ toProfileId: theirProfile.id }]);

    await expect(service.likedProfileIds(userId)).resolves.toEqual([theirProfile.id]);
  });

  it('isMatch is true only when likes exist in both directions', async () => {
    prisma.like.count = vi.fn().mockResolvedValueOnce(2).mockResolvedValueOnce(1);

    await expect(service.isMatch(myProfile.id, theirProfile.id)).resolves.toBe(true);
    await expect(service.isMatch(myProfile.id, theirProfile.id)).resolves.toBe(false);
  });

  describe('matches', () => {
    it('queries for profiles where likes go both ways', async () => {
      givenProfiles();
      prisma.profile.findMany.mockResolvedValue([theirProfile]);

      await expect(service.matches(userId)).resolves.toEqual([theirProfile]);
      expect(prisma.profile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            likesReceived: { some: { fromProfileId: myProfile.id } },
            likesGiven: { some: { toProfileId: myProfile.id } },
          },
        }),
      );
    });

    it('returns nothing for a user without a profile', async () => {
      givenProfiles({ mine: false });

      await expect(service.matches(userId)).resolves.toEqual([]);
      expect(prisma.profile.findMany).not.toHaveBeenCalled();
    });
  });
});
