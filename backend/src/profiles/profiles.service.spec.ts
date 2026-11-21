import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service.js';
import { ProfilesService } from './profiles.service.js';

const ownerId = '11111111-1111-4111-8111-111111111111';
const strangerId = '22222222-2222-4222-8222-222222222222';
const profile = {
  id: '6f1c2c2e-6d3f-4d36-9a0e-3c1f1e2b7a11',
  userId: ownerId,
  name: 'Lutendo',
  description: 'Looking for someone who enjoys building projects.',
  createdAt: new Date(),
  updatedAt: new Date(),
};
const input = { name: 'Lumina', description: 'Updated' };

describe('ProfilesService', () => {
  let service: ProfilesService;
  // A fake Prisma client: unit tests never touch a real database.
  const prisma = {
    profile: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  };

  beforeEach(async () => {
    vi.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProfilesService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(ProfilesService);
  });

  it('findAll returns profiles newest first', async () => {
    prisma.profile.findMany.mockResolvedValue([profile]);

    await expect(service.findAll()).resolves.toEqual([profile]);
    expect(prisma.profile.findMany).toHaveBeenCalledWith({ orderBy: { createdAt: 'desc' } });
  });

  it('findOne throws NotFoundException for an unknown id', async () => {
    prisma.profile.findUnique.mockResolvedValue(null);

    await expect(service.findOne(profile.id)).rejects.toBeInstanceOf(NotFoundException);
  });

  describe('create', () => {
    it('creates a profile owned by the user', async () => {
      prisma.profile.findUnique.mockResolvedValue(null);
      prisma.profile.create.mockResolvedValue(profile);

      await expect(service.create(ownerId, input)).resolves.toEqual(profile);
      expect(prisma.profile.create).toHaveBeenCalledWith({ data: { ...input, userId: ownerId } });
    });

    it('rejects a second profile for the same user', async () => {
      prisma.profile.findUnique.mockResolvedValue(profile);

      await expect(service.create(ownerId, input)).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.profile.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('lets the owner update their profile', async () => {
      prisma.profile.findUnique.mockResolvedValue(profile);
      prisma.profile.update.mockResolvedValue({ ...profile, ...input });

      await expect(service.update(ownerId, profile.id, input)).resolves.toMatchObject(input);
    });

    it("forbids updating someone else's profile", async () => {
      prisma.profile.findUnique.mockResolvedValue(profile);

      await expect(service.update(strangerId, profile.id, input)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(prisma.profile.update).not.toHaveBeenCalled();
    });

    it('throws NotFoundException for an unknown id', async () => {
      prisma.profile.findUnique.mockResolvedValue(null);

      await expect(service.update(ownerId, profile.id, input)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('lets the owner delete their profile', async () => {
      prisma.profile.findUnique.mockResolvedValue(profile);

      await service.remove(ownerId, profile.id);
      expect(prisma.profile.delete).toHaveBeenCalledWith({ where: { id: profile.id } });
    });

    it("forbids deleting someone else's profile", async () => {
      prisma.profile.findUnique.mockResolvedValue(profile);

      await expect(service.remove(strangerId, profile.id)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(prisma.profile.delete).not.toHaveBeenCalled();
    });
  });
});
