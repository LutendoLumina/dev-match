// End-to-end tests hit a real database, so they only run when DATABASE_URL is set.
import 'dotenv/config';
import { randomUUID } from 'crypto';
import { Test, TestingModule } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { AppModule } from './../src/app.module.js';
import { configureApp } from './../src/app.setup.js';
import { PrismaService } from './../src/prisma/prisma.service.js';

describe.runIf(process.env.DATABASE_URL)('API (e2e)', () => {
  let app: NestExpressApplication;
  // Unique emails so the test never collides with real data; cleaned up afterwards.
  const runId = randomUUID().slice(0, 8);
  const alice = { email: `e2e-alice-${runId}@example.com`, password: 'password123' };
  const bob = { email: `e2e-bob-${runId}@example.com`, password: 'password123' };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>();
    configureApp(app); // same setup as production (incl. the /api prefix)
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
    await aliceAgent.post('/api/auth/register').send(alice).expect(201);
    await aliceAgent
      .get('/api/auth/me')
      .expect(200)
      .expect((res) => expect(res.body).toMatchObject({ email: alice.email, profileId: null }));
    await aliceAgent.post('/api/auth/register').send(alice).expect(409);

    // Logged-out users can't create profiles
    await anonymous.post('/api/profiles').send({ name: 'Nobody', description: 'x' }).expect(401);

    // Alice creates (only) one profile
    const created = await aliceAgent
      .post('/api/profiles')
      .send({ name: 'Alice', description: 'Created by the e2e test' })
      .expect(201);
    const profileId = created.body.id;
    await aliceAgent.post('/api/profiles').send({ name: 'Alice 2', description: 'x' }).expect(409);

    // Anyone can read it
    await anonymous.get(`/api/profiles/${profileId}`).expect(200);

    // Bob can't change or delete Alice's profile
    await bobAgent.post('/api/auth/register').send(bob).expect(201);
    await bobAgent.put(`/api/profiles/${profileId}`).send({ name: 'Hacked', description: 'x' }).expect(403);
    await bobAgent.delete(`/api/profiles/${profileId}`).expect(403);

    // Alice can
    await aliceAgent
      .put(`/api/profiles/${profileId}`)
      .send({ name: 'Alice Updated', description: 'Updated' })
      .expect(200);
    await aliceAgent.delete(`/api/profiles/${profileId}`).expect(204);

    // Logout clears the session; login brings it back
    await aliceAgent.post('/api/auth/logout').expect(204);
    await aliceAgent.get('/api/auth/me').expect(401);
    await aliceAgent.post('/api/auth/login').send({ ...alice, password: 'wrong-password' }).expect(401);
    await aliceAgent.post('/api/auth/login').send(alice).expect(200);
    await aliceAgent.get('/api/auth/me').expect(200);
  });

  it('matches two users who like each other', async () => {
    const aliceAgent = request.agent(app.getHttpServer());
    const bobAgent = request.agent(app.getHttpServer());

    // Fresh logins (accounts exist from the previous test); create profiles.
    await aliceAgent.post('/api/auth/login').send(alice).expect(200);
    await bobAgent.post('/api/auth/login').send(bob).expect(200);

    // Liking requires a profile of your own
    const bobProfile = await bobAgent
      .post('/api/profiles')
      .send({ name: 'Bob', description: 'Likes e2e tests' })
      .expect(201);
    await aliceAgent.post(`/api/profiles/${bobProfile.body.id}/like`).expect(403);

    const aliceProfile = await aliceAgent
      .post('/api/profiles')
      .send({ name: 'Alice', description: 'Also likes e2e tests' })
      .expect(201);
    const aliceId = aliceProfile.body.id;
    const bobId = bobProfile.body.id;

    // Can't like yourself; logged-out users can't like at all
    await aliceAgent.post(`/api/profiles/${aliceId}/like`).expect(400);
    await request(app.getHttpServer()).post(`/api/profiles/${bobId}/like`).expect(401);

    // One-sided like: no match yet (and liking twice is fine)
    await aliceAgent
      .post(`/api/profiles/${bobId}/like`)
      .expect(200)
      .expect((res) => expect(res.body).toEqual({ matched: false }));
    await aliceAgent.post(`/api/profiles/${bobId}/like`).expect(200);
    await aliceAgent.get('/api/likes').expect((res) => expect(res.body).toEqual([bobId]));
    await aliceAgent.get('/api/matches').expect((res) => expect(res.body).toEqual([]));

    // Bob likes back: it's a match for both of them
    await bobAgent
      .post(`/api/profiles/${aliceId}/like`)
      .expect(200)
      .expect((res) => expect(res.body).toEqual({ matched: true }));
    await aliceAgent
      .get('/api/matches')
      .expect((res) => expect(res.body.map((p: { id: string }) => p.id)).toEqual([bobId]));
    await bobAgent
      .get('/api/matches')
      .expect((res) => expect(res.body.map((p: { id: string }) => p.id)).toEqual([aliceId]));

    // Matched users can chat
    await aliceAgent
      .post(`/api/conversations/${bobId}/messages`)
      .send({ body: '  Hi Bob!  ' })
      .expect(201)
      .expect((res) => expect(res.body.body).toBe('Hi Bob!')); // trimmed
    await aliceAgent.post(`/api/conversations/${bobId}/messages`).send({ body: '   ' }).expect(400);

    // Bob sees one unread message, reads it, and replies
    await bobAgent.get('/api/conversations').expect((res) => {
      expect(res.body).toHaveLength(1);
      expect(res.body[0]).toMatchObject({ unreadCount: 1, lastMessage: { body: 'Hi Bob!' } });
    });
    await bobAgent
      .get(`/api/conversations/${aliceId}/messages`)
      .expect(200)
      .expect((res) => expect(res.body.map((m: { body: string }) => m.body)).toEqual(['Hi Bob!']));
    await bobAgent.post(`/api/conversations/${aliceId}/read`).expect(204);
    await bobAgent
      .get('/api/conversations')
      .expect((res) => expect(res.body[0].unreadCount).toBe(0));
    const reply = await bobAgent
      .post(`/api/conversations/${aliceId}/messages`)
      .send({ body: 'Hey Alice' })
      .expect(201);

    // Polling with ?since only returns newer messages
    await aliceAgent
      .get(`/api/conversations/${bobId}/messages`)
      .query({ since: reply.body.createdAt })
      .expect((res) => expect(res.body.map((m: { body: string }) => m.body)).toEqual(['Hey Alice']));

    // Unliking undoes the match and closes the conversation
    await aliceAgent.delete(`/api/profiles/${bobId}/like`).expect(204);
    await bobAgent.get('/api/matches').expect((res) => expect(res.body).toEqual([]));
    await bobAgent.post(`/api/conversations/${aliceId}/messages`).send({ body: 'Hello?' }).expect(403);
    await bobAgent.get(`/api/conversations/${aliceId}/messages`).expect(403);
  });

  it('rejects invalid input', async () => {
    const server = app.getHttpServer();
    await request(server).post('/api/auth/register').send({ email: 'not-an-email', password: 'short' }).expect(400);
  });
});
