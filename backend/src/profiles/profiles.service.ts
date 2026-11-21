import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateProfileDto } from './dto/create-profile.dto/create-profile.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto/update-profile.dto.js';

@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.profile.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string) {
    const profile = await this.prisma.profile.findUnique({ where: { id } });
    if (!profile) {
      throw new NotFoundException(`Profile with id ${id} not found`);
    }
    return profile;
  }

  async create(userId: string, createProfileDto: CreateProfileDto) {
    const existing = await this.prisma.profile.findUnique({ where: { userId } });
    if (existing) {
      throw new ConflictException('You already have a profile');
    }
    const { name, description } = createProfileDto;
    return this.prisma.profile.create({ data: { name, description, userId } });
  }

  async update(userId: string, id: string, updateProfileDto: UpdateProfileDto) {
    await this.findOwned(userId, id);
    return this.prisma.profile.update({ where: { id }, data: updateProfileDto });
  }

  async remove(userId: string, id: string) {
    await this.findOwned(userId, id);
    await this.prisma.profile.delete({ where: { id } });
  }

  /** 404 if the profile doesn't exist, 403 if it belongs to someone else. */
  private async findOwned(userId: string, id: string) {
    const profile = await this.findOne(id);
    if (profile.userId !== userId) {
      throw new ForbiddenException('You can only change your own profile');
    }
    return profile;
  }
}
