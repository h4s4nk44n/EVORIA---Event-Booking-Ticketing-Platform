# Evoria Backend - Test Report

**Date:** 2026-04-04
**Node.js:** v18.20.5
**Test Runner:** Jest 30
**Branch:** hasan-booking-security-devops

---

## Automated Test Results

| Metric        | Value  |
|---------------|--------|
| Test Suites   | 27     |
| Tests         | 227    |
| Passing       | 227    |
| Failing       | 0      |
| Time          | ~25s   |

### Authentication (19 tests)
| File | Tests | Description |
|------|-------|-------------|
| `auth.register.test.ts` | 7 | User registration, duplicate email, missing fields, password rules |
| `auth.login.test.ts` | 6 | Login, wrong credentials, token response, no password leak |
| `auth.password-validation.test.ts` | 6 | Uppercase, lowercase, digit, special char, min length rules |

### Events (49 tests)
| File | Tests | Description |
|------|-------|-------------|
| `event.create.test.ts` | 8 | Create event, validation, auth, past date prevention |
| `event.get.test.ts` | 5 | Public event list, pagination, search |
| `event.getById.test.ts` | 5 | Get single event, organizer info, bookedCount, public access |
| `event.list.test.ts` | 9 | Listing with sorting, search, pagination, date filter |
| `event.update.test.ts` | 9 | Update event, ownership check, partial update, validation |
| `event.delete.test.ts` | 4 | Delete event, cascade booking delete, auth, ownership |
| `event.stats.test.ts` | 3 | Event statistics, ownership check, not found |
| `event.attendees.test.ts` | 6 | Attendee list, ownership check, no password leak |

### Bookings (21 tests)
| File | Tests | Description |
|------|-------|-------------|
| `booking.test.ts` | 18 | Create/cancel booking, duplicate prevention, capacity check |
| `booking.concurrency.test.ts` | 2 | Concurrent booking race condition prevention (SELECT FOR UPDATE) |
| `booking.past-event.test.ts` | 1 | Past event booking returns 422 |

### Categories (13 tests)
| File | Tests | Description |
|------|-------|-------------|
| `category.test.ts` | 13 | CRUD, admin-only write, duplicate name (409), validation |

### Venues (13 tests)
| File | Tests | Description |
|------|-------|-------------|
| `venue.test.ts` | 13 | CRUD, admin-only write, city filter, validation |

### Tickets (14 tests)
| File | Tests | Description |
|------|-------|-------------|
| `ticket.test.ts` | 14 | CRUD, organizer ownership, event association, validation |

### Admin (5 tests)
| File | Tests | Description |
|------|-------|-------------|
| `admin.delete-event.test.ts` | 5 | Admin delete any event, role check |

### Middleware (14 tests)
| File | Tests | Description |
|------|-------|-------------|
| `authenticate.test.ts` | 5 | JWT verification, expired token, wrong secret |
| `authorize.test.ts` | 4 | Role-based access control |
| `validateRequest.test.ts` | 5 | Zod schema validation, error formatting |

### Security (10 tests)
| File | Tests | Description |
|------|-------|-------------|
| `xss.test.ts` | 10 | XSS sanitization on event and user inputs |

### Infrastructure (18 tests)
| File | Tests | Description |
|------|-------|-------------|
| `app.test.ts` | 2 | Health check, 404 handling |
| `logger.test.ts` | 6 | Winston logger config, transports, log levels |
| `readme.test.ts` | 10 | README file existence and content validation |

---

## ESLint Results

```
0 errors, 16 warnings (all @typescript-eslint/no-explicit-any in test files)
```

---

## Manual API Test Results

**Base URL:** http://localhost:3000
**Environment:** Development (seeded database)

| # | Endpoint | Expected | Actual | Pass? | Notes |
|---|----------|----------|--------|-------|-------|
| 1 | POST /auth/register (organizer) | 201 | 201 | PASS | Organizer registered |
| 2 | POST /events | 201 | 201 | PASS | Event created |
| 3 | GET /events/{id} | 200 | 200 | PASS | Title verified |
| 4 | PUT /events/{id} | 200 | 200 | PASS | Title updated |
| 5 | GET /events/{id}/stats | 200 | 200 | PASS | ticketsSold=0 verified |
| 6 | POST /auth/register (attendee) | 201 | 201 | PASS | Attendee registered |
| 7 | GET /events | 200 | 200 | PASS | Listed 11 events |
| 8 | POST /bookings | 201 | 201 | PASS | Booking created |
| 9 | GET /bookings/me | 200 | 200 | PASS | 1 booking found |
| 10 | GET /events/{id}/stats | 200 | 200 | PASS | ticketsSold=1 verified |
| 11 | GET /events/{id}/attendees | 200 | 200 | PASS | 1 attendee listed |
| 12 | POST /bookings (overbooking) | 422 | 422 | PASS | Overbooking correctly rejected |
| 13 | DELETE /bookings/{id} | 204 | 204 | PASS | Booking cancelled |
| 14 | GET /bookings/me | 200 | 200 | PASS | No bookings (cancelled) |
| 15 | GET /events/{id} | 200 | 200 | PASS | availableSpots restored |
| 16 | POST /auth/login (admin) | 200 | 200 | PASS | Admin token obtained |
| 17 | GET /admin/users | 200 | 200 | PASS | 10 users listed |
| 18 | GET /admin/events | 200 | 200 | PASS | 11 events listed |
| 19 | GET /events/{id}/stats (ATTENDEE) | 403 | 403 | PASS | Forbidden for attendee |
| 20 | POST /bookings (ORGANIZER) | 403 | 403 | PASS | Forbidden for organizer |
| 21 | GET /admin/users (ORGANIZER) | 403 | 403 | PASS | Forbidden for organizer |
| 22 | GET /events/{id}/stats (no token) | 401 | 401 | PASS | Unauthorized without token |
| 23 | DELETE /admin/events/{id} | 204 | 204 | PASS | Event deleted by admin |

---

## How to Run

```bash
# Run all tests
npm test

# Run a specific test file
npx jest -- "booking.test"

# Lint
npm run lint
```
