# Evoria Backend

Backend scaffold for **Evoria**, built with **Express**, **TypeScript**, and **Prisma**, following **MVC + Service Layer architecture**.

---

## Tech Stack

- Node.js + npm
- Express
- TypeScript
- Prisma ORM
- PostgreSQL
- Zod (validation)
- JWT (auth)
- Winston (logging)

---

## Project Structure

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

## Setup

### 1. Clone & install

```bash
git clone <repo-url>
cd evoria-backend
npm install
```

---

### 2. Environment variables

Create `.env`:

```bash
cp .env.example .env
```

Edit:

```env
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/evoria_db
JWT_SECRET=your_secret
PORT=3000
```

---

## Database Setup

Make sure **PostgreSQL is running**.

### Option A — Local PostgreSQL

```bash
sudo systemctl start postgresql
```

Create DB:

```bash
sudo -iu postgres psql
```

```sql
CREATE DATABASE evoria_db;
CREATE USER evoria_user WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE evoria_db TO evoria_user;
\q
```

Update `.env` accordingly.

---

### Option B — Docker (recommended)

```bash
docker run --name evoria-postgres \
  -e POSTGRES_USER=evoria_user \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=evoria_db \
  -p 5432:5432 \
  -d postgres:16
```

---

## Prisma

Generate client:

```bash
npm run prisma:generate
```

Run migrations:

```bash
npm run prisma:migrate -- --name init
```

Open Prisma Studio:

```bash
npm run prisma:studio
```

---

## Running the App

### Development

```bash
npm run dev
```

Server will run at:

```
http://localhost:3000
```

---

### Production

```bash
npm run build
npm start
```

---

## Health Check

```bash
GET /health
```

Response:

```json
{
  "status": "ok",
  "timestamp": "..."
}
```

---

## Scripts

```bash
npm run dev            # Start dev server (nodemon + ts-node)
npm run build          # Compile TypeScript
npm start              # Run compiled app
npm run typecheck      # TypeScript check only

npm run prisma:generate
npm run prisma:migrate
npm run prisma:studio
```

---

## Common Issues

### Prisma P1001 (DB not reachable)
- PostgreSQL not running
- Wrong `DATABASE_URL`

Check:

```bash
ss -ltnp | grep 5432
```

---

### PrismaClient not found
Run:

```bash
npm run prisma:generate
```

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
  "password": "SecurePass1",
  "role": "ATTENDEE"
}
```

| Field      | Type   | Required | Rules                              |
|------------|--------|----------|------------------------------------|
| `name`     | string | Yes      | Min 2 characters                   |
| `email`    | string | Yes      | Valid email format                 |
| `password` | string | Yes      | Min 8 characters                   |
| `role`     | string | Yes      | `"ATTENDEE"` or `"ORGANIZER"` only |

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
  "password": "SecurePass1"
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

| Param    | Type   | Default | Description                          |
|----------|--------|---------|--------------------------------------|
| `page`   | number | 1       | Page number (min 1)                  |
| `limit`  | number | 10      | Items per page (max 50)              |
| `search` | string | —       | Case-insensitive title search        |
| `from`   | string | —       | ISO 8601 datetime (events on/after)  |
| `to`     | string | —       | ISO 8601 datetime (events on/before) |

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

Get a single event by ID.

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
  "capacity": 100
}
```

| Field         | Type   | Required | Rules                             |
|---------------|--------|----------|-----------------------------------|
| `title`       | string | Yes      | 3 – 120 characters                |
| `description` | string | Yes      | 10 – 2000 characters              |
| `dateTime`    | string | Yes      | ISO 8601 format, must be future   |
| `capacity`    | number | Yes      | Integer, min 1, max 100000        |

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

- `400` Validation failed (short title, past date, invalid capacity, etc.)
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
| `capacity`    | number | No       | Integer, min 1, max 100000        |

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
  "eventId": "clx1a2b3c..."
}
```

**Success response: 201**

```json
{
  "booking": {
    "id": "clx5d6e7f...",
    "userId": "clx1a2b3c...",
    "eventId": "clx1a2b3c...",
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
- `422` Event is fully booked (at capacity)

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

Delete any user account. Also deletes all events organized by that user.

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

## Architecture

This project follows:

### MVC + Service Layer

- **Routes** → define endpoints
- **Controllers** → handle HTTP logic
- **Services** → business logic + DB
- **Prisma** → database access

Flow:

```
Request → Route → Controller → Service → Prisma → DB
```

## Team

| Student    | Role   | School Number                                |
|------------|--------|-----------------------------------------------|
| `Hasan Kaan Doygun` | `Booking, Security & DevOps` | `2640464`      | 
| `Burak Sağbaş`    | `Foundation & Admin` | `2690824`      | 
| `Taha Turkay Aktaş` | `Auth, Events & Dashboard` | `2640274`     |
