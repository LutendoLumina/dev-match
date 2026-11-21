// Fills an empty database with example users and profiles: `npm run db:seed`.
// Every example user's password is "password123".
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '../src/generated/prisma/client.js';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const examples = [
  {
    email: 'lutendo@example.com',
    name: 'Lutendo',
    description:
      'Looking for someone who enjoys building projects, learning new technologies, and having meaningful conversations.',
  },
  {
    email: 'thabo@example.com',
    name: 'Thabo',
    description: 'Looking for someone who enjoys coding, gaming, and exploring new places.',
  },
  {
    email: 'sarah@example.com',
    name: 'Sarah',
    description:
      'Looking for someone who is curious, ambitious, and enjoys learning and growing together.',
  },
];

const existing = await prisma.user.count();
if (existing > 0) {
  console.log(`Database already has ${existing} users; skipping seed.`);
} else {
  const passwordHash = await bcrypt.hash('password123', 12);
  for (const { email, name, description } of examples) {
    await prisma.user.create({
      data: { email, passwordHash, profile: { create: { name, description } } },
    });
  }
  console.log(`Seeded ${examples.length} users (password: password123).`);
}

// Demo likes, so there is something to see straight away:
// Thabo and Sarah have matched, and Thabo likes Lutendo (Lutendo can like back to match).
if ((await prisma.like.count()) === 0) {
  const byName = async (name: string) =>
    prisma.profile.findFirst({ where: { name, user: { email: { endsWith: '@example.com' } } } });
  const [lutendo, thabo, sarah] = await Promise.all(['Lutendo', 'Thabo', 'Sarah'].map(byName));

  if (lutendo && thabo && sarah) {
    await prisma.like.createMany({
      data: [
        { fromProfileId: thabo.id, toProfileId: sarah.id },
        { fromProfileId: sarah.id, toProfileId: thabo.id },
        { fromProfileId: thabo.id, toProfileId: lutendo.id },
      ],
    });
    console.log('Seeded demo likes.');
  }
}

await prisma.$disconnect();
