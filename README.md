# Evoria — Event Booking & Ticketing Platform

## Team

| Name                | Student ID | Role                        |
| ------------------- | ---------- | --------------------------- |
| Hasan Kaan Doygun   | 2640464    | Booking, Security & DevOps  |
| Taha Turkay Aktaş   | 2640274    | Auth, Events & Dashboard    |
| Burak Sağbaş        | 2690824    | Foundation & Admin          |

---
## 📦 Tech Stack

- Node.js + npm
- Express
- TypeScript
- Prisma ORM
- PostgreSQL
- Zod (validation)
- JWT (auth)
- Winston (logging)

---

## 📁 Project Structure

```
evoria-backend/
├── src/
│   ├── app.ts            # Express app config
│   ├── server.ts         # Server entry point
│   │
│   ├── routes/           # Route definitions
│   ├── controllers/      # HTTP layer
│   ├── services/         # Business logic
│   ├── middlewares/      # Auth, validation, errors
│   ├── utils/            # Helpers (logger, errors, responses)
│   └── config/           # Env config
│
├── prisma/
│   └── schema.prisma     # DB schema
│
├── .env
├── .env.example
├── package.json
└── tsconfig.json
```

---

## Prerequisites

- Node.js >= 18.x
- PostgreSQL >= 14
- npm >= 9.x

## Setup

Clone the repository and navigate to the project:

```bash
git clone https://github.com/h4s4nk44n/EVORIA---Event-Booking-Ticketing-Platform
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

| Variable               | Description                               | Example                                  |
| ---------------------- | ----------------------------------------- | ---------------------------------------- |
| `DATABASE_URL`         | PostgreSQL connection string              | `postgresql://user:pw@localhost:5432/evoria_db` |
| `JWT_SECRET`           | Secret key for JWT signing (min 32 chars) | `my_very_long_secret_key_here`           |
| `PORT`                 | Server port                               | `3000`                                   |
| `ALLOWED_ORIGIN`       | Frontend URL for CORS                     | `http://localhost:3001`                  |
| `NODE_ENV`             | Application environment                   | `development`                            |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window in milliseconds         | `900000`                                 |
| `RATE_LIMIT_AUTH_MAX`  | Max auth requests per window              | `10`                                     |

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

---

## API Documentation

Base URL: `http://localhost:3000`

All protected endpoints require a JWT token in the `Authorization` header:

```
Authorization: Bearer <token>
```

---

### Authentication

#### POST /auth/register

Register a new user account.

**Auth required:** No

**Request body:**

```json
{
  "name": "Alice Example",
  "email": "alice@example.com",
  "password": "SecurePass1!",
  "role": "ATTENDEE"
}
```

| Field      | Type   | Required | Rules                                |
|------------|--------|----------|--------------------------------------|
| `name`     | string | Yes      | Min 2 characters                     |
| `email`    | string | Yes      | Valid email format                   |
| `password` | string | Yes      | Min 8 chars, uppercase, lowercase, digit, special char |
| `role`     | string | Yes      | `"ATTENDEE"` or `"ORGANIZER"` only   |

**Success response: 201**

```json
{
  "user": {
    "id": "clx1a2b3c...",
    "name": "Alice Example",
    "email": "alice@example.com",
    "role": "ATTENDEE",
    "createdAt": "2025-04-01T10:00:00.000Z"
  }
}
```

**Error responses:**

- `400` Validation failed (missing fields, invalid email, short password, invalid role)
- `409` Email already registered

---

#### POST /auth/login

Authenticate user and receive JWT token.

**Auth required:** No

**Request body:**

```json
{
  "email": "alice@example.com",
  "password": "SecurePass1!"
}
```

**Success response: 200**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "clx1a2b3c...",
    "name": "Alice Example",
    "email": "alice@example.com",
    "role": "ATTENDEE"
  }
}
```

**Error responses:**

- `400` Validation failed (missing fields, invalid email format)
- `401` Invalid credentials (wrong email or password)

---

### Events

#### GET /events

List all events with optional search, date filtering, and pagination.

**Auth required:** No

**Query parameters:**

| Param        | Type   | Default | Description                          |
|--------------|--------|---------|--------------------------------------|
| `page`       | number | 1       | Page number (min 1)                  |
| `limit`      | number | 10      | Items per page (max 50)              |
| `search`     | string | —       | Case-insensitive title search        |
| `from`       | string | —       | ISO 8601 datetime (events on/after)  |
| `to`         | string | —       | ISO 8601 datetime (events on/before) |
| `categoryId` | string | —       | Filter by category                   |
| `venueId`    | string | —       | Filter by venue                      |

**Success response: 200**

```json
{
  "data": [
    {
      "id": "clx1a2b3c...",
      "title": "React Workshop",
      "description": "Hands-on React workshop for beginners",
      "dateTime": "2025-06-15T14:00:00.000Z",
      "capacity": 100,
      "organizer": {
        "id": "clx9z8y7w...",
        "name": "Bob Organizer"
      },
      "category": {
        "id": "clxcat1...",
        "name": "Technology"
      },
      "venue": {
        "id": "clxven1...",
        "name": "Tech Hub"
      },
      "bookedCount": 45,
      "availableSpots": 55
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 10,
  "totalPages": 3
}
```

**Error responses:**

- None (returns empty `data` array if no events match)

---

#### GET /events/:id

Get a single event by ID, including ticket types.

**Auth required:** No

**Success response: 200**

```json
{
  "event": {
    "id": "clx1a2b3c...",
    "title": "React Workshop",
    "description": "Hands-on React workshop for beginners",
    "dateTime": "2025-06-15T14:00:00.000Z",
    "capacity": 100,
    "organizer": {
      "id": "clx9z8y7w...",
      "name": "Bob Organizer"
    },
    "tickets": [
      {
        "id": "clxtkt1...",
        "type": "GENERAL",
        "price": 50,
        "quantity": 80
      }
    ],
    "bookedCount": 45,
    "availableSpots": 55
  }
}
```

**Error responses:**

- `404` Event not found

---

#### POST /events

Create a new event.

**Auth required:** Yes (ORGANIZER)

**Request body:**

```json
{
  "title": "React Workshop",
  "description": "Hands-on React workshop for beginners",
  "dateTime": "2025-06-15T14:00:00.000Z",
  "capacity": 100,
  "categoryId": "optional-category-id",
  "venueId": "optional-venue-id"
}
```

| Field         | Type   | Required | Rules                             |
|---------------|--------|----------|-----------------------------------|
| `title`       | string | Yes      | 3 – 120 characters                |
| `description` | string | Yes      | 10 – 2000 characters              |
| `dateTime`    | string | Yes      | ISO 8601 format, must be future   |
| `capacity`    | number | Yes      | Integer, min 1, max 100 000       |
| `categoryId`  | string | No       | Existing category ID              |
| `venueId`     | string | No       | Existing venue ID                 |

**Success response: 201**

```json
{
  "event": {
    "id": "clx1a2b3c...",
    "title": "React Workshop",
    "description": "Hands-on React workshop for beginners",
    "dateTime": "2025-06-15T14:00:00.000Z",
    "capacity": 100,
    "organizerId": "clx9z8y7w...",
    "organizer": {
      "id": "clx9z8y7w...",
      "name": "Bob Organizer"
    },
    "createdAt": "2025-04-01T10:00:00.000Z",
    "updatedAt": "2025-04-01T10:00:00.000Z"
  }
}
```

**Error responses:**

- `400` Validation failed (short title, past date, invalid capacity)
- `401` No token or invalid token
- `403` User is not an ORGANIZER

---

#### PUT /events/:id

Update an existing event (organizer must own the event).

**Auth required:** Yes (ORGANIZER, owner only)

**Request body (all fields optional):**

```json
{
  "title": "Updated Workshop Title",
  "capacity": 150
}
```

| Field         | Type   | Required | Rules                             |
|---------------|--------|----------|-----------------------------------|
| `title`       | string | No       | 3 – 120 characters                |
| `description` | string | No       | 10 – 2000 characters              |
| `dateTime`    | string | No       | ISO 8601 format, must be future   |
| `capacity`    | number | No       | Integer, min 1, max 100 000       |

**Success response: 200**

```json
{
  "event": {
    "id": "clx1a2b3c...",
    "title": "Updated Workshop Title",
    "description": "Hands-on React workshop for beginners",
    "dateTime": "2025-06-15T14:00:00.000Z",
    "capacity": 150,
    "organizerId": "clx9z8y7w...",
    "createdAt": "2025-04-01T10:00:00.000Z",
    "updatedAt": "2025-04-01T12:00:00.000Z"
  }
}
```

**Error responses:**

- `400` Validation failed
- `401` No token or invalid token
- `403` Not the event owner
- `404` Event not found
- `422` Cannot reduce capacity below current booking count

---

#### DELETE /events/:id

Delete an event (organizer must own the event). All bookings are cascade-deleted.

**Auth required:** Yes (ORGANIZER, owner only)

**Success response: 204 No Content**

**Error responses:**

- `401` No token or invalid token
- `403` Not the event owner
- `404` Event not found

---

#### GET /events/:id/stats

Get ticket sales statistics for an event.

**Auth required:** Yes (ORGANIZER, owner only)

**Success response: 200**

```json
{
  "eventId": "clx1a2b3c...",
  "title": "React Workshop",
  "capacity": 100,
  "ticketsSold": 45,
  "ticketsRemaining": 55
}
```

**Error responses:**

- `401` No token or invalid token
- `403` Not the event owner
- `404` Event not found

---

#### GET /events/:id/attendees

Get paginated list of attendees who booked an event.

**Auth required:** Yes (ORGANIZER, owner only)

**Query parameters:**

| Param   | Type   | Default | Description             |
|---------|--------|---------|-------------------------|
| `page`  | number | 1       | Page number (min 1)     |
| `limit` | number | 10      | Items per page (max 50) |

**Success response: 200**

```json
{
  "data": [
    {
      "bookingId": "clx5d6e7f...",
      "bookedAt": "2025-04-02T08:30:00.000Z",
      "user": {
        "id": "clx1a2b3c...",
        "name": "Alice Example",
        "email": "alice@example.com"
      }
    }
  ],
  "total": 45,
  "page": 1,
  "limit": 10,
  "totalPages": 5
}
```

**Error responses:**

- `401` No token or invalid token
- `403` Not the event owner
- `404` Event not found

---

### Bookings

#### POST /bookings

Book a ticket for an event. Uses database-level locking to prevent overbooking.

**Auth required:** Yes (ATTENDEE)

**Request body:**

```json
{
  "eventId": "clx1a2b3c...",
  "ticketId": "optional-ticket-type-id"
}
```

| Field      | Type   | Required | Rules                    |
|------------|--------|----------|--------------------------|
| `eventId`  | string | Yes      | Existing event ID        |
| `ticketId` | string | No       | Existing ticket type ID  |

**Success response: 201**

```json
{
  "booking": {
    "id": "clx5d6e7f...",
    "userId": "clx1a2b3c...",
    "eventId": "clx1a2b3c...",
    "ticketId": null,
    "createdAt": "2025-04-02T08:30:00.000Z",
    "event": {
      "id": "clx1a2b3c...",
      "title": "React Workshop",
      "dateTime": "2025-06-15T14:00:00.000Z"
    },
    "user": {
      "id": "clx1a2b3c...",
      "name": "Alice Example",
      "email": "alice@example.com"
    }
  }
}
```

**Error responses:**

- `400` Missing or empty eventId
- `401` No token or invalid token
- `403` User is not an ATTENDEE
- `404` Event not found
- `409` Already booked this event
- `422` Event is fully booked or event is in the past

---

#### GET /bookings/me

Get the authenticated user's bookings.

**Auth required:** Yes (ATTENDEE)

**Query parameters:**

| Param   | Type   | Default | Description             |
|---------|--------|---------|-------------------------|
| `page`  | number | 1       | Page number (min 1)     |
| `limit` | number | 10      | Items per page (max 50) |

**Success response: 200**

```json
{
  "data": [
    {
      "id": "clx5d6e7f...",
      "userId": "clx1a2b3c...",
      "eventId": "clx1a2b3c...",
      "ticketId": null,
      "createdAt": "2025-04-02T08:30:00.000Z",
      "event": {
        "id": "clx1a2b3c...",
        "title": "React Workshop",
        "dateTime": "2025-06-15T14:00:00.000Z",
        "capacity": 100,
        "organizer": {
          "name": "Bob Organizer"
        },
        "_count": {
          "bookings": 45
        }
      }
    }
  ],
  "total": 3,
  "page": 1,
  "limit": 10
}
```

**Error responses:**

- `401` No token or invalid token
- `403` User is not an ATTENDEE

---

#### DELETE /bookings/:id

Cancel a booking. Only the booking owner can cancel.

**Auth required:** Yes (ATTENDEE, booking owner only)

**Success response: 204 No Content**

**Error responses:**

- `401` No token or invalid token
- `403` Not the booking owner
- `404` Booking not found

---

### Admin

All admin endpoints require ADMIN role.

#### GET /admin/users

List all users with pagination.

**Auth required:** Yes (ADMIN)

**Query parameters:**

| Param   | Type   | Default | Description              |
|---------|--------|---------|--------------------------|
| `page`  | number | 1       | Page number (min 1)      |
| `limit` | number | 20      | Items per page (max 100) |

**Success response: 200**

```json
{
  "data": [
    {
      "id": "clx1a2b3c...",
      "name": "Alice Example",
      "email": "alice@example.com",
      "role": "ATTENDEE",
      "createdAt": "2025-04-01T10:00:00.000Z"
    }
  ],
  "total": 8,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

**Error responses:**

- `401` No token or invalid token
- `403` User is not an ADMIN

---

#### GET /admin/events

List all events across all organizers with pagination.

**Auth required:** Yes (ADMIN)

**Query parameters:**

| Param   | Type   | Default | Description              |
|---------|--------|---------|--------------------------|
| `page`  | number | 1       | Page number (min 1)      |
| `limit` | number | 20      | Items per page (max 100) |

**Success response: 200**

```json
{
  "data": [
    {
      "id": "clx1a2b3c...",
      "title": "React Workshop",
      "description": "Hands-on React workshop for beginners",
      "dateTime": "2025-06-15T14:00:00.000Z",
      "capacity": 100,
      "organizerId": "clx9z8y7w...",
      "bookedCount": 45,
      "availableSpots": 55,
      "organizer": {
        "id": "clx9z8y7w...",
        "name": "Bob Organizer",
        "email": "bob@example.com"
      },
      "createdAt": "2025-04-01T10:00:00.000Z",
      "updatedAt": "2025-04-01T10:00:00.000Z"
    }
  ],
  "total": 10,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

**Error responses:**

- `401` No token or invalid token
- `403` User is not an ADMIN

---

#### DELETE /admin/users/:id

Delete any user account. Also cascade-deletes all events organized by that user.

**Auth required:** Yes (ADMIN)

**Success response: 204 No Content**

**Error responses:**

- `401` No token or invalid token
- `403` User is not an ADMIN, or attempting to delete own admin account
- `404` User not found

---

#### DELETE /admin/events/:id

Delete any event regardless of organizer. All bookings are cascade-deleted.

**Auth required:** Yes (ADMIN)

**Success response: 204 No Content**

**Error responses:**

- `401` No token or invalid token
- `403` User is not an ADMIN
- `404` Event not found

---

### Utility

#### GET /health

Health check endpoint.

**Auth required:** No

**Success response: 200**

```json
{
  "status": "ok",
  "timestamp": "2025-04-01T10:00:00.000Z"
}
```

---

### Error Response Format

All errors follow a consistent format:

**Standard error:**

```json
{
  "error": "Human-readable error message"
}
```

**Validation error (400):**

```json
{
  "error": "Validation failed",
  "errors": [
    { "field": "email", "message": "Invalid email format" },
    { "field": "password", "message": "Password must be at least 8 characters" }
  ]
}
```

---

## Scripts

| Script                    | Description                          |
|---------------------------|--------------------------------------|
| `npm run dev`             | Start dev server (nodemon + ts-node) |
| `npm run build`           | Compile TypeScript to JavaScript     |
| `npm start`               | Run compiled production build        |
| `npm test`                | Run test suite                       |
| `npm run typecheck`       | TypeScript type checking             |
| `npx prisma studio`       | Open Prisma database GUI             |
| `npx prisma migrate dev`  | Run database migrations              |

## Docker

```bash
# Build and run with Docker Compose
docker compose up --build

# Or build manually
docker build -t evoria-backend .
docker run -p 3000:3000 --env-file .env evoria-backend
```

## Seed Data Credentials

| Email              | Password    | Role      |
|--------------------|-------------|-----------|
| admin@evoria.com   | Admin1234!  | ADMIN     |
| alice@evoria.com   | Alice1234!  | ORGANIZER |
| bob@evoria.com     | Bob1234!    | ORGANIZER |
| carol@evoria.com   | Carol1234!  | ATTENDEE  |
| dave@evoria.com    | Dave1234!   | ATTENDEE  |
