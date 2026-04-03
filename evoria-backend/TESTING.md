# Evoria API - Manual Test Results

**Date:** 2026-04-04
**Base URL:** http://localhost:3000
**Environment:** Development (seeded database)
**Branch:** hasan-booking-security-devops

## Summary

- **Total Tests:** 23
- **Passed:** 23
- **Failed:** 0

## Test Results

| # | Endpoint | Expected | Actual | Pass? | Notes |
|---|----------|----------|--------|-------|-------|
| 1 | POST /auth/register (organizer) | 201 | 201 | PASS | Organizer registered |
| 2 | POST /events | 201 | 201 | PASS | Event created: cmnjeefil0008ut8szog176gw |
| 3 | GET /events/{id} | 200 | 200 | PASS | Title verified: Test Event |
| 4 | PUT /events/{id} | 200 | 200 | PASS | Title updated to: Updated Test Event |
| 5 | GET /events/{id}/stats | 200 | 200 | PASS | ticketsSold=0 verified |
| 6 | POST /auth/register (attendee) | 201 | 201 | PASS | Attendee registered |
| 7 | GET /events | 200 | 200 | PASS | Listed 11 events |
| 8 | POST /bookings | 201 | 201 | PASS | Booking created: cmnjeeh13000but8sf4eidc51 |
| 9 | GET /bookings/me | 200 | 200 | PASS | 1 booking found |
| 10 | GET /events/{id}/stats | 200 | 200 | PASS | ticketsSold=1 verified |
| 11 | GET /events/{id}/attendees | 200 | 200 | PASS | 1 attendee listed |
| 12 | POST /bookings (overbooking) | 422 | 422 | PASS | Overbooking correctly rejected |
| 13 | DELETE /bookings/{id} | 204 | 204 | PASS | Booking cancelled |
| 14 | GET /bookings/me | 200 | 200 | PASS | No bookings (cancelled) |
| 15 | GET /events/{id} | 200 | 200 | PASS | availableSpots=10 restored to capacity |
| 16 | POST /auth/login (admin) | 200 | 200 | PASS | Admin token obtained |
| 17 | GET /admin/users | 200 | 200 | PASS | 10 users listed |
| 18 | GET /admin/events | 200 | 200 | PASS | 11 events listed |
| 19 | GET /events/{id}/stats (ATTENDEE) | 403 | 403 | PASS | Forbidden for attendee |
| 20 | POST /bookings (ORGANIZER) | 403 | 403 | PASS | Forbidden for organizer |
| 21 | GET /admin/users (ORGANIZER) | 403 | 403 | PASS | Forbidden for organizer |
| 22 | GET /events/{id}/stats (no token) | 401 | 401 | PASS | Unauthorized without token |
| 23 | DELETE /admin/events/{id} | 204 | 204 | PASS | Event deleted by admin |


## Test Flows

### Flow 1: Organizer (Tests 1-5)
Register organizer, create event, verify event data, update event, check stats show 0 tickets.

### Flow 2: Attendee (Tests 6-11)
Register attendee, list events, book event, verify booking, check stats show 1 ticket, verify attendee listed.

### Flow 3: Overbooking (Test 12)
Attempt to book a fully booked event (Tech Conference 2025, capacity 3/3). Expect 422 rejection.

### Flow 4: Cancel (Tests 13-15)
Cancel booking, verify booking removed, verify available spots restored to full capacity.

### Flow 5: Admin (Tests 16-18)
Admin login, list all users, list all events.

### Flow 6: Auth Guards (Tests 19-22)
Verify role-based access control: attendee cannot access organizer stats (403), organizer cannot create bookings (403), organizer cannot access admin endpoints (403), unauthenticated request returns 401.

### Admin Delete (Test 23)
Admin deletes the test event (204).
