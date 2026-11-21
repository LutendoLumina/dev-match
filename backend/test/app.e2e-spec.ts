// End-to-end tests hit a real database, so they only run when DATABASE_URL is set.
import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';

describe.runIf(process.env.DATABASE_URL)('Profiles API (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates, reads, updates and deletes a profile', async () => {
    const server = app.getHttpServer();

    const created = await request(server)
      .post('/profiles')
      .send({ name: 'E2E Tester', description: 'Created by the e2e test' })
      .expect(201);
    const id = created.body.id;

    await request(server).get(`/profiles/${id}`).expect(200);
    await request(server)
      .put(`/profiles/${id}`)
      .send({ name: 'E2E Updated', description: 'Updated' })
      .expect(200)
      .expect((res) => expect(res.body.name).toBe('E2E Updated'));
    await request(server).delete(`/profiles/${id}`).expect(204);
    await request(server).get(`/profiles/${id}`).expect(404);
  });

  it('rejects invalid input', () => {
    return request(app.getHttpServer())
      .post('/profiles')
      .send({ name: 'Na', description: '' })
      .expect(400);
  });
});
