# dev-match

A full-stack matchmaking app for developers. People create profiles describing who they'd like to meet, and others can browse them.

| Layer    | Tech                                                         |
| -------- | ------------------------------------------------------------ |
| Frontend | React 19, TypeScript, Vite, React Router                     |
| Backend  | NestJS 12, TypeScript, class-validator                       |
| Database | PostgreSQL (hosted on [Neon](https://neon.tech)), Prisma ORM |
| Testing  | Vitest, Supertest                                            |

```
dev-match/
├── backend/    NestJS REST API + Prisma schema and migrations
└── frontend/   React single-page app
```

## Features

- [x] **Profiles**: list, view, create, edit and delete developer profiles
- [ ] Accounts and login (JWT)
- [ ] Likes and matching
- [ ] Messaging between matches

## Running locally

Requirements: Node.js 22+ and a free PostgreSQL database (Neon is the easiest, since nothing has to be installed).

### 1. Database

1. Sign up at [neon.tech](https://neon.tech) and create a project.
2. On the project dashboard, click **Connect** and copy the connection string.

### 2. Backend (http://localhost:3000)

```bash
cd backend
npm install
cp .env.example .env      # then paste your connection string into DATABASE_URL
npm run db:migrate        # creates the tables
npm run db:seed           # optional: adds example profiles
npm run start:dev
```

### 3. Frontend (http://localhost:5173)

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

In development, the frontend forwards any `/api/*` request to the backend (see `frontend/vite.config.ts`).

## API

| Method | Path            | Description          | Success |
| ------ | --------------- | -------------------- | ------- |
| GET    | `/profiles`     | List all profiles    | 200     |
| GET    | `/profiles/:id` | Get one profile      | 200     |
| POST   | `/profiles`     | Create a profile     | 201     |
| PUT    | `/profiles/:id` | Replace a profile    | 200     |
| DELETE | `/profiles/:id` | Delete a profile     | 204     |

Request body for POST and PUT:

```json
{ "name": "3–100 characters", "description": "1–1000 characters" }
```

If the body is invalid, the API returns `400` with the validation messages. If no profile has that id, it returns `404`.

## Tests

```bash
cd backend
npm test            # unit tests (no database needed)
npm run test:e2e    # API tests against the database in DATABASE_URL
```
