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
await prisma.$disconnect();
