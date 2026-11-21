// End-to-end tests hit a real database, so they only run when DATABASE_URL is set.
import 'dotenv/config';
import { randomUUID } from 'crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { PrismaService } from './../src/prisma/prisma.service.js';

describe.runIf(process.env.DATABASE_URL)('API (e2e)', () => {
  let app: INestApplication<App>;
  // Unique emails so the test never collides with real data; cleaned up afterwards.
  const runId = randomUUID().slice(0, 8);
  const alice = { email: `e2e-alice-${runId}@example.com`, password: 'password123' };
  const bob = { email: `e2e-bob-${runId}@example.com`, password: 'password123' };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app
      .get(PrismaService)
      .user.deleteMany({ where: { email: { in: [alice.email, bob.email] } } });
    await app.close();
  });

  it('runs the full account and profile flow with ownership rules', async () => {
    // request.agent keeps cookies between requests, like a browser.
    const aliceAgent = request.agent(app.getHttpServer());
    const bobAgent = request.agent(app.getHttpServer());
    const anonymous = request(app.getHttpServer());

    // Register and check who we are
    await aliceAgent.post('/auth/register').send(alice).expect(201);
    await aliceAgent
      .get('/auth/me')
      .expect(200)
      .expect((res) => expect(res.body).toMatchObject({ email: alice.email, profileId: null }));
    await aliceAgent.post('/auth/register').send(alice).expect(409);

    // Logged-out users can't create profiles
    await anonymous.post('/profiles').send({ name: 'Nobody', description: 'x' }).expect(401);

    // Alice creates (only) one profile
    const created = await aliceAgent
      .post('/profiles')
      .send({ name: 'Alice', description: 'Created by the e2e test' })
      .expect(201);
    const profileId = created.body.id;
    await aliceAgent.post('/profiles').send({ name: 'Alice 2', description: 'x' }).expect(409);

    // Anyone can read it
    await anonymous.get(`/profiles/${profileId}`).expect(200);

    // Bob can't change or delete Alice's profile
    await bobAgent.post('/auth/register').send(bob).expect(201);
    await bobAgent.put(`/profiles/${profileId}`).send({ name: 'Hacked', description: 'x' }).expect(403);
    await bobAgent.delete(`/profiles/${profileId}`).expect(403);

    // Alice can
    await aliceAgent
      .put(`/profiles/${profileId}`)
      .send({ name: 'Alice Updated', description: 'Updated' })
      .expect(200);
    await aliceAgent.delete(`/profiles/${profileId}`).expect(204);

    // Logout clears the session; login brings it back
    await aliceAgent.post('/auth/logout').expect(204);
    await aliceAgent.get('/auth/me').expect(401);
    await aliceAgent.post('/auth/login').send({ ...alice, password: 'wrong-password' }).expect(401);
    await aliceAgent.post('/auth/login').send(alice).expect(200);
    await aliceAgent.get('/auth/me').expect(200);
  });

  it('rejects invalid input', async () => {
    const server = app.getHttpServer();
    await request(server).post('/auth/register').send({ email: 'not-an-email', password: 'short' }).expect(400);
  });
});
