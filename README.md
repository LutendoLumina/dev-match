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
- [x] **Accounts**: sign up, log in and log out, with sessions stored in an httpOnly JWT cookie
- [x] **Ownership**: each account has one profile, and only its owner can edit or delete it
- [x] **Likes and matching**: like other developers; when two people like each other, it's a match
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
cp .env.example .env      # then fill in DATABASE_URL and JWT_SECRET
npm run db:migrate        # creates the tables
npm run db:seed           # optional: example users (password: password123)
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

Routes marked 🔒 need you to be logged in. Logging in sets an httpOnly `access_token` cookie, which the browser then sends automatically.

| Method | Path                  | Description                        | Success |
| ------ | --------------------- | ---------------------------------- | ------- |
| POST   | `/auth/register`      | Create an account and log in       | 201     |
| POST   | `/auth/login`         | Log in                             | 200     |
| POST   | `/auth/logout`        | Log out                            | 204     |
| GET    | `/auth/me` 🔒         | The logged-in user                 | 200     |
| GET    | `/profiles`           | List all profiles                  | 200     |
| GET    | `/profiles/:id`       | Get one profile                    | 200     |
| POST   | `/profiles` 🔒        | Create your profile (one per user) | 201     |
| PUT    | `/profiles/:id` 🔒    | Update your profile                | 200     |
| DELETE | `/profiles/:id` 🔒    | Delete your profile                | 204     |
| POST   | `/profiles/:id/like` 🔒 | Like a profile; returns `{ "matched": true/false }` | 200 |
| DELETE | `/profiles/:id/like` 🔒 | Remove your like (undoes a match) | 204    |
| GET    | `/likes` 🔒           | Ids of the profiles you've liked   | 200     |
| GET    | `/matches` 🔒         | Profiles that liked you back       | 200     |

Request bodies:

```jsonc
// POST /auth/register and /auth/login
{ "email": "you@example.com", "password": "8–72 characters" }
// POST and PUT /profiles
{ "name": "3–100 characters", "description": "1–1000 characters" }
```

Error codes:

| Code | Meaning |
| ---- | ------- |
| `400` | Invalid request body, or liking your own profile |
| `401` | Not logged in, or wrong email/password |
| `403` | Not your profile, or liking before you've created a profile |
| `404` | Not found |
| `409` | Email already registered, or you already have a profile |

### How matching works

A `likes` table stores "profile A liked profile B", with a unique constraint on the pair, so liking twice has no extra effect. A match isn't stored separately: it's simply two likes pointing at each other, found with one query (`GET /matches`). Because of that, a match can't get out of sync with the likes. Unliking someone undoes the match automatically, and deleting a profile removes its likes (cascade).

### Security notes

- **Passwords:** hashed with bcrypt (12 rounds) and never returned by the API.
- **Login cookie:** the JWT lives in an `httpOnly`, `SameSite=Lax` cookie. Page scripts can't read it, which protects it from XSS. Other sites can't use it to send write requests, which protects against CSRF. In production it is also marked `Secure`, so it is only sent over HTTPS.
- **Login errors:** an unknown email and a wrong password give the same error and take the same time, so attackers can't find out which emails are registered.

## Tests

```bash
cd backend
npm test            # unit tests (no database needed)
npm run test:e2e    # API tests against the database in DATABASE_URL
```
