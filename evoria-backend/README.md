# Evoria — Event Booking & Ticketing Platform

## Team

| Name                | Student ID | Role                        |
| ------------------- | ---------- | --------------------------- |
| Hasan Kaan Doygun   | 2640464    | Booking, Security & DevOps  |
| Taha Turkay Aktaş   | 2640274    | Auth, Events & Dashboard    |
| Burak Sağbaş        | 2690824    | Foundation & Admin          |

## Prerequisites

- Node.js >= 18.x
- PostgreSQL >= 14
- npm >= 9.x

## Setup

Clone the repository and navigate to the project:

```bash
git clone <repo-url>
cd evoria-backend
```

Install dependencies:

```bash
npm install
```

Set up environment variables:

```bash
cp .env.example .env
```

Fill in database credentials and `JWT_SECRET`.

Create the PostgreSQL database:

```bash
createdb evoria_db
```

Run database migrations:

```bash
npx prisma migrate dev
```

Seed the database:

```bash
npx prisma db seed
```

Start the development server:

```bash
npm run dev
```

## Environment Variables

| Variable              | Description                               | Example                              |
| --------------------- | ----------------------------------------- | ------------------------------------ |
| `DATABASE_URL`        | PostgreSQL connection string              | `postgresql://user:pw@localhost/db`  |
| `JWT_SECRET`          | Secret key for JWT signing (min 32 chars) | `my_very_long_secret_key_here`       |
| `PORT`                | Server port                               | `3000`                               |
| `ALLOWED_ORIGIN`      | Frontend URL for CORS                     | `http://localhost:3001`              |
| `NODE_ENV`            | Application environment                   | `development`                        |
| `RATE_LIMIT_WINDOW_MS`| Rate limit window in milliseconds         | `900000`                             |
| `RATE_LIMIT_AUTH_MAX`  | Max auth requests per window              | `10`                                 |

## Architecture

```
Request → Route → Middleware (auth, RBAC, validation) → Controller → Service → Prisma → PostgreSQL
```

## Project Structure

```
src/
  routes/        Wire up middleware and controllers
  controllers/   Parse requests, call services, send responses
  services/      Business logic and database operations
  middlewares/   authenticate, authorize, validateRequest, rateLimiter, errorHandler
  utils/         AppError, logger
  config/        env.ts (typed config), prisma.ts (singleton client)
```

## Tech Stack

Node.js · Express · TypeScript · PostgreSQL · Prisma ORM · Zod · JWT · bcryptjs · Winston · Docker (Part 2)
