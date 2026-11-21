import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { LikesService } from '../likes/likes.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { MessagesService } from './messages.service.js';

const userId = '11111111-1111-4111-8111-111111111111';
const me = { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', userId, name: 'Me' };
const them = { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', userId: 'other', name: 'Them' };

describe('MessagesService', () => {
  let service: MessagesService;
  const prisma = {
    profile: { findUnique: vi.fn() },
    message: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
  };
  const likes = { isMatch: vi.fn(), matches: vi.fn() };

  /** By default: I have a profile, they exist, and we're matched. */
  function given({ hasProfile = true, theyExist = true, matched = true } = {}) {
    prisma.profile.findUnique.mockImplementation(({ where }) => {
      if (where.userId) return Promise.resolve(hasProfile ? me : null);
      if (where.id === them.id) return Promise.resolve(theyExist ? them : null);
      return Promise.resolve(null);
    });
    likes.isMatch.mockResolvedValue(matched);
  }

  beforeEach(async () => {
    vi.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        { provide: PrismaService, useValue: prisma },
        { provide: LikesService, useValue: likes },
      ],
    }).compile();

    service = module.get(MessagesService);
  });

  describe('send', () => {
    it('stores a message between matches', async () => {
      given();
      prisma.message.create.mockResolvedValue({ id: 'm1' });

      await expect(service.send(userId, them.id, 'Hi!')).resolves.toEqual({ id: 'm1' });
      expect(prisma.message.create).toHaveBeenCalledWith({
        data: { senderProfileId: me.id, recipientProfileId: them.id, body: 'Hi!' },
      });
    });

    it('refuses to message someone you have not matched with', async () => {
      given({ matched: false });

      await expect(service.send(userId, them.id, 'Hi!')).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.message.create).not.toHaveBeenCalled();
    });

    it('refuses when you have no profile', async () => {
      given({ hasProfile: false });

      await expect(service.send(userId, them.id, 'Hi!')).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('404s for an unknown profile', async () => {
      given({ theyExist: false });

      await expect(service.send(userId, them.id, 'Hi!')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('list', () => {
    it('returns the latest page oldest-first on first load', async () => {
      given();
      prisma.message.findMany.mockResolvedValue([{ id: 'newer' }, { id: 'older' }]);

      await expect(service.list(userId, them.id)).resolves.toEqual([{ id: 'older' }, { id: 'newer' }]);
      expect(prisma.message.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { createdAt: 'desc' } }),
      );
    });

    it('only returns newer messages when polling with `since`', async () => {
      given();
      const since = new Date('2026-01-01T00:00:00Z');
      prisma.message.findMany.mockResolvedValue([]);

      await service.list(userId, them.id, since);
      expect(prisma.message.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ createdAt: { gte: since } }),
          orderBy: { createdAt: 'asc' },
        }),
      );
    });
  });

  it('markRead only marks messages they sent me', async () => {
    given();

    await service.markRead(userId, them.id);
    expect(prisma.message.updateMany).toHaveBeenCalledWith({
      where: { senderProfileId: them.id, recipientProfileId: me.id, readAt: null },
      data: { readAt: expect.any(Date) },
    });
  });

  it('conversations sorts by latest activity and includes unread counts', async () => {
    given();
    const quiet = { ...them, id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', name: 'Quiet' };
    likes.matches.mockResolvedValue([quiet, them]);
    prisma.message.findFirst.mockImplementation(({ where }) =>
      Promise.resolve(
        where.OR[0].recipientProfileId === them.id
          ? { body: 'latest', createdAt: new Date('2026-05-01') }
          : null,
      ),
    );
    prisma.message.count.mockImplementation(({ where }) =>
      Promise.resolve(where.senderProfileId === them.id ? 3 : 0),
    );

    const result = await service.conversations(userId);
    expect(result.map((c) => [c.profile.name, c.unreadCount])).toEqual([
      ['Them', 3],
      ['Quiet', 0],
    ]);
  });
});
