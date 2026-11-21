import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service.js';
import { ProfilesService } from './profiles.service.js';

const profile = {
  id: '6f1c2c2e-6d3f-4d36-9a0e-3c1f1e2b7a11',
  name: 'Lutendo',
  description: 'Looking for someone who enjoys building projects.',
  createdAt: new Date(),
  updatedAt: new Date(),
};

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

  it('findOne returns the matching profile', async () => {
    prisma.profile.findUnique.mockResolvedValue(profile);

    await expect(service.findOne(profile.id)).resolves.toEqual(profile);
  });

  it('findOne throws NotFoundException for an unknown id', async () => {
    prisma.profile.findUnique.mockResolvedValue(null);

    await expect(service.findOne(profile.id)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('create stores the profile', async () => {
    const input = { name: profile.name, description: profile.description };
    prisma.profile.create.mockResolvedValue(profile);

    await expect(service.create(input)).resolves.toEqual(profile);
    expect(prisma.profile.create).toHaveBeenCalledWith({ data: input });
  });

  it('update changes an existing profile', async () => {
    const input = { name: 'Lumina', description: 'Updated' };
    prisma.profile.findUnique.mockResolvedValue(profile);
    prisma.profile.update.mockResolvedValue({ ...profile, ...input });

    await expect(service.update(profile.id, input)).resolves.toMatchObject(input);
    expect(prisma.profile.update).toHaveBeenCalledWith({ where: { id: profile.id }, data: input });
  });

  it('update throws NotFoundException and does not write for an unknown id', async () => {
    prisma.profile.findUnique.mockResolvedValue(null);

    await expect(service.update(profile.id, { name: 'abc', description: 'x' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.profile.update).not.toHaveBeenCalled();
  });

  it('remove deletes an existing profile', async () => {
    prisma.profile.findUnique.mockResolvedValue(profile);

    await service.remove(profile.id);
    expect(prisma.profile.delete).toHaveBeenCalledWith({ where: { id: profile.id } });
  });

  it('remove throws NotFoundException for an unknown id', async () => {
    prisma.profile.findUnique.mockResolvedValue(null);

    await expect(service.remove(profile.id)).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.profile.delete).not.toHaveBeenCalled();
  });
});
