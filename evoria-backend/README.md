<!-- This markdown file is written by Claude - Hasan Kaan Doygun -->
# Evoria — Event Booking & Ticketing Platform

## Team

| Name                | Student ID | Role                        |
| ------------------- | ---------- | --------------------------- |
| Hasan Kaan Doygun   | 2640464    | Booking, Security & DevOps  |
| Taha Turkay Aktaş   | 2640274    | Auth, Events & Dashboard    |
| Burak Sağbaş        | 2690824    | Foundation & Admin          |

## Tech Stack

Node.js · Express 5 · TypeScript · PostgreSQL · Prisma ORM · Zod · JWT · bcryptjs · Winston · Helmet · Docker

## Prerequisites

- Node.js >= 18.x
- PostgreSQL >= 14
- npm >= 9.x

## Setup

```bash
# Clone and navigate
git clone <repo-url>
cd evoria-backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Fill in DATABASE_URL and JWT_SECRET

# Create database and run migrations
createdb evoria_db
npx prisma migrate dev

# Seed sample data
npx prisma db seed

# Start development server
npm run dev
```

## Environment Variables

| Variable              | Description                               | Default                |
| --------------------- | ----------------------------------------- | ---------------------- |
| `DATABASE_URL`        | PostgreSQL connection string              | *(required)*           |
| `JWT_SECRET`          | Secret key for JWT signing (min 32 chars) | *(required)*           |
| `PORT`                | Server port                               | `3000`                 |
| `NODE_ENV`            | Application environment                   | `development`          |
| `ALLOWED_ORIGIN`      | Frontend URL for CORS                     | `http://localhost:3001` |
| `RATE_LIMIT_WINDOW_MS`| Rate limit window in milliseconds         | `900000`               |
| `RATE_LIMIT_AUTH_MAX`  | Max auth requests per window              | `10`                   |

## API Documentation

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | None | Register a new user |
| POST | `/auth/login` | None | Login and receive JWT token |

**POST /auth/register**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "John1234!",
  "role": "ATTENDEE"
}
```
- Password: min 8 chars, must include uppercase, lowercase, digit, and special character
- Role: `ATTENDEE` or `ORGANIZER`
- Returns: `201` with user object

**POST /auth/login**
```json
{
  "email": "john@example.com",
  "password": "John1234!"
}
```
- Returns: `200` with `{ token, user }`

---

### Events

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/events` | None | List events (paginated, filterable) |
| GET | `/events/:id` | None | Get single event with tickets |
| POST | `/events` | ORGANIZER | Create a new event |
| PUT | `/events/:id` | ORGANIZER (owner) | Update an event |
| DELETE | `/events/:id` | ORGANIZER (owner) | Delete an event |
| GET | `/events/:id/stats` | ORGANIZER (owner) | Get ticket sales stats |
| GET | `/events/:id/attendees` | ORGANIZER (owner) | Get attendee list |

**GET /events** query params: `search`, `from`, `to`, `categoryId`, `venueId`, `page`, `limit`

**POST /events**
```json
{
  "title": "Tech Conference",
  "description": "Annual tech summit covering latest trends",
  "dateTime": "2025-06-15T09:00:00.000Z",
  "capacity": 200,
  "categoryId": "optional-category-id",
  "venueId": "optional-venue-id"
}
```

---

### Bookings

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/bookings` | ATTENDEE | Book a ticket |
| GET | `/bookings/me` | ATTENDEE | List user's bookings (paginated) |
| DELETE | `/bookings/:id` | ATTENDEE (owner) | Cancel a booking |

**POST /bookings**
```json
{
  "eventId": "event-id-here",
  "ticketId": "optional-ticket-type-id"
}
```
- Prevents overbooking, duplicate bookings, and booking past events
- Rate limited: 30 requests per 60 seconds

---

### Categories

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/categories` | None | List all categories |
| GET | `/categories/:id` | None | Get category by ID |
| POST | `/categories` | ADMIN | Create a category |
| PUT | `/categories/:id` | ADMIN | Update a category |
| DELETE | `/categories/:id` | ADMIN | Delete a category |

**POST /categories**
```json
{
  "name": "Technology",
  "description": "Tech events and conferences"
}
```

---

### Venues

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/venues` | None | List all venues (filterable by city) |
| GET | `/venues/:id` | None | Get venue by ID |
| POST | `/venues` | ADMIN | Create a venue |
| PUT | `/venues/:id` | ADMIN | Update a venue |
| DELETE | `/venues/:id` | ADMIN | Delete a venue |

**GET /venues** query params: `city`

**POST /venues**
```json
{
  "name": "Grand Hall",
  "address": "123 Main St",
  "city": "Istanbul",
  "capacity": 500
}
```

---

### Tickets

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/tickets/event/:eventId` | None | Get ticket types for an event |
| POST | `/tickets` | ORGANIZER | Create a ticket type for an event |
| PUT | `/tickets/:id` | ORGANIZER (owner) | Update a ticket type |
| DELETE | `/tickets/:id` | ORGANIZER (owner) | Delete a ticket type |

**POST /tickets**
```json
{
  "type": "VIP",
  "price": 150,
  "quantity": 50,
  "eventId": "event-id-here"
}
```
- Type: `GENERAL`, `VIP`, or `EARLY_BIRD`

---

### Admin

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/admin/users` | ADMIN | List all users (paginated) |
| GET | `/admin/events` | ADMIN | List all events (paginated) |
| DELETE | `/admin/users/:id` | ADMIN | Delete a user (cascade) |
| DELETE | `/admin/events/:id` | ADMIN | Delete any event |

---

### Health Check

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | None | Server + DB health check |

## Architecture

```
Request → Route → Middleware (auth, RBAC, validation) → Controller → Service → Prisma → PostgreSQL
```

## Project Structure

```
src/
  config/        env.ts (typed config), prisma.ts (singleton client)
  controllers/   Parse requests, call services, send responses
  middlewares/    authenticate, authorize, validateRequest, rateLimiter, errorHandler
  routes/        Wire up middleware and controllers
  services/      Business logic and database operations
  types/         TypeScript type definitions
  utils/         AppError, logger

prisma/
  schema.prisma  Database schema (6 models)
  seed.ts        Sample data seeder
  migrations/    Database migrations
```

## Database Models

- **User** — id, name, email, password, role (ATTENDEE/ORGANIZER/ADMIN)
- **Event** — id, title, description, dateTime, capacity, organizerId, categoryId, venueId
- **Booking** — id, userId, eventId, ticketId
- **Category** — id, name, description
- **Venue** — id, name, address, city, capacity
- **Ticket** — id, type (GENERAL/VIP/EARLY_BIRD), price, quantity, eventId

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Run production build |
| `npm test` | Run test suite |
| `npm run typecheck` | TypeScript type checking |
| `npx prisma studio` | Open Prisma database GUI |

## Docker

```bash
# Build and run with Docker Compose
docker compose up --build

# Or build manually
docker build -t evoria-backend .
docker run -p 3000:3000 --env-file .env evoria-backend
```

## Seed Data Credentials

| Email | Password | Role |
|-------|----------|------|
| admin@evoria.com | Admin1234! | ADMIN |
| alice@evoria.com | Alice1234! | ORGANIZER |
| bob@evoria.com | Bob1234! | ORGANIZER |
| carol@evoria.com | Carol1234! | ATTENDEE |
| dave@evoria.com | Dave1234! | ATTENDEE |
