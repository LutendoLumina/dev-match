import { Test, TestingModule } from '@nestjs/testing';
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
      providers: [{ provide: ProfilesService, useValue: service }],
    }).compile();

    controller = module.get(ProfilesController);
  });

  it('delegates each route to the service', async () => {
    const id = '6f1c2c2e-6d3f-4d36-9a0e-3c1f1e2b7a11';
    const body = { name: 'Lutendo', description: 'Hi' };

    await controller.findAll();
    await controller.findOne(id);
    await controller.create(body);
    await controller.update(id, body);
    await controller.remove(id);

    expect(service.findAll).toHaveBeenCalled();
    expect(service.findOne).toHaveBeenCalledWith(id);
    expect(service.create).toHaveBeenCalledWith(body);
    expect(service.update).toHaveBeenCalledWith(id, body);
    expect(service.remove).toHaveBeenCalledWith(id);
  });
});
