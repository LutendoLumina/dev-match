import { Injectable, NotFoundException } from '@nestjs/common';
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

  create(createProfileDto: CreateProfileDto) {
    return this.prisma.profile.create({ data: createProfileDto });
  }

  async update(id: string, updateProfileDto: UpdateProfileDto) {
    await this.findOne(id); // 404 if it doesn't exist
    return this.prisma.profile.update({ where: { id }, data: updateProfileDto });
  }

  async remove(id: string) {
    await this.findOne(id); // 404 if it doesn't exist
    await this.prisma.profile.delete({ where: { id } });
  }
}
