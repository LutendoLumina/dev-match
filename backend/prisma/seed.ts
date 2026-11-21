// Fills an empty database with a few example profiles: `npm run db:seed`.
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const profiles = [
  {
    name: 'Lutendo',
    description:
      'Looking for someone who enjoys building projects, learning new technologies, and having meaningful conversations.',
  },
  {
    name: 'Thabo',
    description: 'Looking for someone who enjoys coding, gaming, and exploring new places.',
  },
  {
    name: 'Sarah',
    description:
      'Looking for someone who is curious, ambitious, and enjoys learning and growing together.',
  },
];

const existing = await prisma.profile.count();
if (existing > 0) {
  console.log(`Database already has ${existing} profiles; skipping seed.`);
} else {
  await prisma.profile.createMany({ data: profiles });
  console.log(`Seeded ${profiles.length} profiles.`);
}
await prisma.$disconnect();
