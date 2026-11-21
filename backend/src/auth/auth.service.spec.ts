import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthService } from './auth.service.js';

const credentials = { email: 'me@example.com', password: 'correct-horse' };

describe('AuthService', () => {
  let service: AuthService;
  const prisma = { user: { findUnique: vi.fn(), create: vi.fn() } };
  const jwt = { signAsync: vi.fn().mockResolvedValue('signed.jwt.token') };

  beforeEach(async () => {
    prisma.user.findUnique.mockReset();
    prisma.user.create.mockReset();
    jwt.signAsync.mockClear();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  describe('register', () => {
    it('stores a bcrypt hash and returns the public user, without logging in', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ id: 'user-1', email: credentials.email });

      await expect(service.register(credentials)).resolves.toEqual({
        id: 'user-1',
        email: credentials.email,
        profileId: null,
      });
      expect(jwt.signAsync).not.toHaveBeenCalled();

      const { passwordHash } = prisma.user.create.mock.calls[0][0].data;
      expect(passwordHash).not.toBe(credentials.password);
      expect(await bcrypt.compare(credentials.password, passwordHash)).toBe(true);
    });

    it('rejects an email that is already registered', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1' });

      await expect(service.register(credentials)).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('returns a token for the right password', async () => {
      const passwordHash = await bcrypt.hash(credentials.password, 4);
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1', passwordHash });

      await expect(service.login(credentials)).resolves.toMatchObject({ userId: 'user-1' });
    });

    it('rejects a wrong password', async () => {
      const passwordHash = await bcrypt.hash('something-else', 4);
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1', passwordHash });

      await expect(service.login(credentials)).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects an unknown email with the same error', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login(credentials)).rejects.toThrow('Invalid email or password');
    });
  });
});
