import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service.js';
import type { JwtPayload } from './auth.constants.js';
import { AuthCredentialsDto } from './dto/auth-credentials.dto.js';

const BCRYPT_ROUNDS = 12;

// Compared against when the email doesn't exist, so a login attempt takes the
// same time whether or not the account exists (prevents email enumeration).
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', BCRYPT_ROUNDS);

/** What the API exposes about a user: never the password hash. */
export interface PublicUser {
  id: string;
  email: string;
  profileId: string | null;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register({ email, password }: AuthCredentialsDto) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await this.prisma.user.create({ data: { email, passwordHash } });
    return this.issueToken(user.id);
  }

  async login({ email, password }: AuthCredentialsDto) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    const passwordMatches = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);

    // Same message for "no such user" and "wrong password" on purpose.
    if (!user || !passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return this.issueToken(user.id);
  }

  async getMe(userId: string): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: { select: { id: true } } },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return { id: user.id, email: user.email, profileId: user.profile?.id ?? null };
  }

  private async issueToken(userId: string) {
    const payload: JwtPayload = { sub: userId };
    return { userId, token: await this.jwt.signAsync(payload) };
  }
}
