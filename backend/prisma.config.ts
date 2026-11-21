import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Optional here so `prisma generate` (run on `npm install`) works without a
    // database. Commands that talk to the database will fail clearly if unset.
    url: process.env.DATABASE_URL ?? '',
  },
});
