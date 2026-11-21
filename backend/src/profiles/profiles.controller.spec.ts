import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ProfilesController } from './profiles.controller.js';
import { ProfilesService } from './profiles.service.js';

describe('ProfilesController', () => {
  let controller: ProfilesController;
  const service = {
    findAll: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  };

  beforeEach(async () => {
    vi.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfilesController],
      providers: [
        { provide: ProfilesService, useValue: service },
        { provide: JwtService, useValue: {} }, // needed by AuthGuard
      ],
    }).compile();

    controller = module.get(ProfilesController);
  });

  it('passes the logged-in user id through to the service', async () => {
    const userId = '11111111-1111-4111-8111-111111111111';
    const id = '6f1c2c2e-6d3f-4d36-9a0e-3c1f1e2b7a11';
    const body = { name: 'Lutendo', description: 'Hi' };

    await controller.findAll();
    await controller.findOne(id);
    await controller.create(userId, body);
    await controller.update(userId, id, body);
    await controller.remove(userId, id);

    expect(service.findAll).toHaveBeenCalled();
    expect(service.findOne).toHaveBeenCalledWith(id);
    expect(service.create).toHaveBeenCalledWith(userId, body);
    expect(service.update).toHaveBeenCalledWith(userId, id, body);
    expect(service.remove).toHaveBeenCalledWith(userId, id);
  });
});
