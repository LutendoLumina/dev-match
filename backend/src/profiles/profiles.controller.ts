import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import { CurrentUserId } from '../auth/current-user.decorator.js';
import { CreateProfileDto } from './dto/create-profile.dto/create-profile.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto/update-profile.dto.js';
import { ProfilesService } from './profiles.service.js';

@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  // GET /profiles (public)
  @Get()
  findAll() {
    return this.profilesService.findAll();
  }

  // GET /profiles/:id (public)
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.profilesService.findOne(id);
  }

  // POST /profiles: create the logged-in user's profile
  @Post()
  @UseGuards(AuthGuard)
  create(@CurrentUserId() userId: string, @Body() createProfileDto: CreateProfileDto) {
    return this.profilesService.create(userId, createProfileDto);
  }

  // PUT /profiles/:id (owner only)
  @Put(':id')
  @UseGuards(AuthGuard)
  update(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.profilesService.update(userId, id, updateProfileDto);
  }

  // DELETE /profiles/:id (owner only)
  @Delete(':id')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUserId() userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.profilesService.remove(userId, id);
  }
}
