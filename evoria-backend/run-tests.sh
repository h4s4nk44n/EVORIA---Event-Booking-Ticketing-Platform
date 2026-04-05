#!/bin/bash
# Evoria API Manual Test Script - 23 Test Cases
# Executes all flows and generates TESTING.md

BASE="http://localhost:3000"
JQ="$HOME/bin/jq.exe"
TIMESTAMP=$(date +%s)
PASS=0
FAIL=0
RESULTS=""

# Unique emails for re-runnability
ORG_EMAIL="testorg-${TIMESTAMP}@evoria.com"
ATT_EMAIL="testatt-${TIMESTAMP}@evoria.com"

add_result() {
  local num="$1" endpoint="$2" expected="$3" actual="$4" pass="$5" notes="$6"
  if [ "$pass" = "PASS" ]; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
  fi
  RESULTS="${RESULTS}| ${num} | ${endpoint} | ${expected} | ${actual} | ${pass} | ${notes} |\n"
}

echo "=== Evoria API Test Runner ==="
echo "Base URL: $BASE"
echo "Organizer email: $ORG_EMAIL"
echo "Attendee email: $ATT_EMAIL"
echo ""

# ============================================================
# FLOW 1: ORGANIZER
# ============================================================
echo "--- FLOW 1: ORGANIZER ---"

# Test 1: Register Organizer
echo "Test 1: POST /auth/register (ORGANIZER)"
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Test Organizer\",\"email\":\"$ORG_EMAIL\",\"password\":\"TestOrg1234!\",\"role\":\"ORGANIZER\"}")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
echo "  Status: $HTTP_CODE"
if [ "$HTTP_CODE" = "201" ]; then
  add_result "1" "POST /auth/register (organizer)" "201" "$HTTP_CODE" "PASS" "Organizer registered"
else
  add_result "1" "POST /auth/register (organizer)" "201" "$HTTP_CODE" "FAIL" "$(echo $BODY | $JQ -r '.error // empty')"
fi

# Login to get organizer token
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ORG_EMAIL\",\"password\":\"TestOrg1234!\"}")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
ORG_TOKEN=$(echo "$BODY" | $JQ -r '.token')
echo "  Organizer token obtained: ${ORG_TOKEN:0:20}..."

# Test 2: Create Event
echo "Test 2: POST /events"
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/events" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ORG_TOKEN" \
  -d "{\"title\":\"Test Event\",\"description\":\"A test event for manual testing purposes\",\"dateTime\":\"2027-06-15T14:00:00.000Z\",\"capacity\":10}")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
EVENT_ID=$(echo "$BODY" | $JQ -r '.event.id')
echo "  Status: $HTTP_CODE, Event ID: $EVENT_ID"
if [ "$HTTP_CODE" = "201" ] && [ "$EVENT_ID" != "null" ]; then
  add_result "2" "POST /events" "201" "$HTTP_CODE" "PASS" "Event created: $EVENT_ID"
else
  add_result "2" "POST /events" "201" "$HTTP_CODE" "FAIL" "$(echo $BODY | $JQ -r '.error // empty')"
fi

# Test 3: Get Event by ID
echo "Test 3: GET /events/$EVENT_ID"
RESP=$(curl -s -w "\n%{http_code}" "$BASE/events/$EVENT_ID")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
TITLE=$(echo "$BODY" | $JQ -r '.event.title')
echo "  Status: $HTTP_CODE, Title: $TITLE"
if [ "$HTTP_CODE" = "200" ] && [ "$TITLE" = "Test Event" ]; then
  add_result "3" "GET /events/{id}" "200" "$HTTP_CODE" "PASS" "Title verified: $TITLE"
else
  add_result "3" "GET /events/{id}" "200" "$HTTP_CODE" "FAIL" "Title mismatch or error"
fi

# Test 4: Update Event
echo "Test 4: PUT /events/$EVENT_ID"
RESP=$(curl -s -w "\n%{http_code}" -X PUT "$BASE/events/$EVENT_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ORG_TOKEN" \
  -d "{\"title\":\"Updated Test Event\"}")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
NEW_TITLE=$(echo "$BODY" | $JQ -r '.event.title')
echo "  Status: $HTTP_CODE, New Title: $NEW_TITLE"
if [ "$HTTP_CODE" = "200" ] && [ "$NEW_TITLE" = "Updated Test Event" ]; then
  add_result "4" "PUT /events/{id}" "200" "$HTTP_CODE" "PASS" "Title updated to: $NEW_TITLE"
else
  add_result "4" "PUT /events/{id}" "200" "$HTTP_CODE" "FAIL" "Update failed"
fi

# Test 5: Get Event Stats (0 tickets sold)
echo "Test 5: GET /events/$EVENT_ID/stats"
RESP=$(curl -s -w "\n%{http_code}" "$BASE/events/$EVENT_ID/stats" \
  -H "Authorization: Bearer $ORG_TOKEN")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
TICKETS_SOLD=$(echo "$BODY" | $JQ -r '.ticketsSold')
echo "  Status: $HTTP_CODE, Tickets Sold: $TICKETS_SOLD"
if [ "$HTTP_CODE" = "200" ] && [ "$TICKETS_SOLD" = "0" ]; then
  add_result "5" "GET /events/{id}/stats" "200" "$HTTP_CODE" "PASS" "ticketsSold=0 verified"
else
  add_result "5" "GET /events/{id}/stats" "200" "$HTTP_CODE" "FAIL" "ticketsSold=$TICKETS_SOLD (expected 0)"
fi

# ============================================================
# FLOW 2: ATTENDEE
# ============================================================
echo ""
echo "--- FLOW 2: ATTENDEE ---"

# Test 6: Register Attendee
echo "Test 6: POST /auth/register (ATTENDEE)"
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Test Attendee\",\"email\":\"$ATT_EMAIL\",\"password\":\"TestAtt1234!\",\"role\":\"ATTENDEE\"}")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
echo "  Status: $HTTP_CODE"
if [ "$HTTP_CODE" = "201" ]; then
  add_result "6" "POST /auth/register (attendee)" "201" "$HTTP_CODE" "PASS" "Attendee registered"
else
  add_result "6" "POST /auth/register (attendee)" "201" "$HTTP_CODE" "FAIL" "$(echo $BODY | $JQ -r '.error // empty')"
fi

# Login to get attendee token
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ATT_EMAIL\",\"password\":\"TestAtt1234!\"}")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
ATT_TOKEN=$(echo "$BODY" | $JQ -r '.token')
echo "  Attendee token obtained: ${ATT_TOKEN:0:20}..."

# Test 7: List Events
echo "Test 7: GET /events"
RESP=$(curl -s -w "\n%{http_code}" "$BASE/events")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
TOTAL=$(echo "$BODY" | $JQ -r '.total')
echo "  Status: $HTTP_CODE, Total events: $TOTAL"
if [ "$HTTP_CODE" = "200" ] && [ "$TOTAL" -gt 0 ] 2>/dev/null; then
  add_result "7" "GET /events" "200" "$HTTP_CODE" "PASS" "Listed $TOTAL events"
else
  add_result "7" "GET /events" "200" "$HTTP_CODE" "FAIL" "No events found"
fi

# Test 8: Book Event
echo "Test 8: POST /bookings"
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/bookings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ATT_TOKEN" \
  -d "{\"eventId\":\"$EVENT_ID\"}")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
BOOKING_ID=$(echo "$BODY" | $JQ -r '.booking.id')
echo "  Status: $HTTP_CODE, Booking ID: $BOOKING_ID"
if [ "$HTTP_CODE" = "201" ] && [ "$BOOKING_ID" != "null" ]; then
  add_result "8" "POST /bookings" "201" "$HTTP_CODE" "PASS" "Booking created: $BOOKING_ID"
else
  add_result "8" "POST /bookings" "201" "$HTTP_CODE" "FAIL" "$(echo $BODY | $JQ -r '.error // empty')"
fi

# Test 9: Get My Bookings
echo "Test 9: GET /bookings/me"
RESP=$(curl -s -w "\n%{http_code}" "$BASE/bookings/me" \
  -H "Authorization: Bearer $ATT_TOKEN")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
BOOKING_COUNT=$(echo "$BODY" | $JQ -r '.total')
echo "  Status: $HTTP_CODE, Bookings: $BOOKING_COUNT"
if [ "$HTTP_CODE" = "200" ] && [ "$BOOKING_COUNT" = "1" ]; then
  add_result "9" "GET /bookings/me" "200" "$HTTP_CODE" "PASS" "1 booking found"
else
  add_result "9" "GET /bookings/me" "200" "$HTTP_CODE" "FAIL" "Expected 1 booking, got $BOOKING_COUNT"
fi

# Test 10: Stats after booking (ticketsSold: 1)
echo "Test 10: GET /events/$EVENT_ID/stats (as organizer)"
RESP=$(curl -s -w "\n%{http_code}" "$BASE/events/$EVENT_ID/stats" \
  -H "Authorization: Bearer $ORG_TOKEN")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
TICKETS_SOLD=$(echo "$BODY" | $JQ -r '.ticketsSold')
echo "  Status: $HTTP_CODE, Tickets Sold: $TICKETS_SOLD"
if [ "$HTTP_CODE" = "200" ] && [ "$TICKETS_SOLD" = "1" ]; then
  add_result "10" "GET /events/{id}/stats" "200" "$HTTP_CODE" "PASS" "ticketsSold=1 verified"
else
  add_result "10" "GET /events/{id}/stats" "200" "$HTTP_CODE" "FAIL" "ticketsSold=$TICKETS_SOLD (expected 1)"
fi

# Test 11: Get Attendees
echo "Test 11: GET /events/$EVENT_ID/attendees"
RESP=$(curl -s -w "\n%{http_code}" "$BASE/events/$EVENT_ID/attendees" \
  -H "Authorization: Bearer $ORG_TOKEN")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
ATT_COUNT=$(echo "$BODY" | $JQ -r '.total')
echo "  Status: $HTTP_CODE, Attendees: $ATT_COUNT"
if [ "$HTTP_CODE" = "200" ] && [ "$ATT_COUNT" = "1" ]; then
  add_result "11" "GET /events/{id}/attendees" "200" "$HTTP_CODE" "PASS" "1 attendee listed"
else
  add_result "11" "GET /events/{id}/attendees" "200" "$HTTP_CODE" "FAIL" "Expected 1 attendee, got $ATT_COUNT"
fi

# ============================================================
# FLOW 3: OVERBOOKING
# ============================================================
echo ""
echo "--- FLOW 3: OVERBOOKING ---"

# Find Tech Conference ID
TC_RESP=$(curl -s "$BASE/events?search=Tech+Conference")
TC_ID=$(echo "$TC_RESP" | $JQ -r '.data[0].id')
TC_AVAILABLE=$(echo "$TC_RESP" | $JQ -r '.data[0].availableSpots')
echo "Tech Conference ID: $TC_ID (availableSpots: $TC_AVAILABLE)"

# Test 12: Overbook Tech Conference
echo "Test 12: POST /bookings (Tech Conference - expect 422)"
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/bookings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ATT_TOKEN" \
  -d "{\"eventId\":\"$TC_ID\"}")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
echo "  Status: $HTTP_CODE"
if [ "$HTTP_CODE" = "422" ]; then
  add_result "12" "POST /bookings (overbooking)" "422" "$HTTP_CODE" "PASS" "Overbooking correctly rejected"
else
  add_result "12" "POST /bookings (overbooking)" "422" "$HTTP_CODE" "FAIL" "Expected 422, got $HTTP_CODE"
fi

# ============================================================
# FLOW 4: CANCEL
# ============================================================
echo ""
echo "--- FLOW 4: CANCEL ---"

# Test 13: Cancel Booking
echo "Test 13: DELETE /bookings/$BOOKING_ID"
RESP=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE/bookings/$BOOKING_ID" \
  -H "Authorization: Bearer $ATT_TOKEN")
HTTP_CODE=$(echo "$RESP" | tail -1)
echo "  Status: $HTTP_CODE"
if [ "$HTTP_CODE" = "204" ]; then
  add_result "13" "DELETE /bookings/{id}" "204" "$HTTP_CODE" "PASS" "Booking cancelled"
else
  add_result "13" "DELETE /bookings/{id}" "204" "$HTTP_CODE" "FAIL" "Expected 204"
fi

# Test 14: Verify booking gone
echo "Test 14: GET /bookings/me (should be empty)"
RESP=$(curl -s -w "\n%{http_code}" "$BASE/bookings/me" \
  -H "Authorization: Bearer $ATT_TOKEN")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
BOOKING_COUNT=$(echo "$BODY" | $JQ -r '.total')
echo "  Status: $HTTP_CODE, Bookings: $BOOKING_COUNT"
if [ "$HTTP_CODE" = "200" ] && [ "$BOOKING_COUNT" = "0" ]; then
  add_result "14" "GET /bookings/me" "200" "$HTTP_CODE" "PASS" "No bookings (cancelled)"
else
  add_result "14" "GET /bookings/me" "200" "$HTTP_CODE" "FAIL" "Expected 0 bookings, got $BOOKING_COUNT"
fi

# Test 15: Available spots restored
echo "Test 15: GET /events/$EVENT_ID (spots restored)"
RESP=$(curl -s -w "\n%{http_code}" "$BASE/events/$EVENT_ID")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
AVAILABLE=$(echo "$BODY" | $JQ -r '.event.availableSpots')
CAPACITY=$(echo "$BODY" | $JQ -r '.event.capacity')
echo "  Status: $HTTP_CODE, Available: $AVAILABLE, Capacity: $CAPACITY"
if [ "$HTTP_CODE" = "200" ] && [ "$AVAILABLE" = "$CAPACITY" ]; then
  add_result "15" "GET /events/{id}" "200" "$HTTP_CODE" "PASS" "availableSpots=$AVAILABLE restored to capacity"
else
  add_result "15" "GET /events/{id}" "200" "$HTTP_CODE" "FAIL" "availableSpots=$AVAILABLE != capacity=$CAPACITY"
fi

# ============================================================
# FLOW 5: ADMIN
# ============================================================
echo ""
echo "--- FLOW 5: ADMIN ---"

# Test 16: Admin Login
echo "Test 16: POST /auth/login (admin)"
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@evoria.com","password":"Admin1234!"}')
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
ADMIN_TOKEN=$(echo "$BODY" | $JQ -r '.token')
echo "  Status: $HTTP_CODE"
if [ "$HTTP_CODE" = "200" ] && [ "$ADMIN_TOKEN" != "null" ]; then
  add_result "16" "POST /auth/login (admin)" "200" "$HTTP_CODE" "PASS" "Admin token obtained"
else
  add_result "16" "POST /auth/login (admin)" "200" "$HTTP_CODE" "FAIL" "Login failed"
fi

# Test 17: Admin List Users
echo "Test 17: GET /admin/users"
RESP=$(curl -s -w "\n%{http_code}" "$BASE/admin/users" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
USER_COUNT=$(echo "$BODY" | $JQ -r '.total')
echo "  Status: $HTTP_CODE, Users: $USER_COUNT"
if [ "$HTTP_CODE" = "200" ] && [ "$USER_COUNT" -gt 0 ] 2>/dev/null; then
  add_result "17" "GET /admin/users" "200" "$HTTP_CODE" "PASS" "$USER_COUNT users listed"
else
  add_result "17" "GET /admin/users" "200" "$HTTP_CODE" "FAIL" "No users or error"
fi

# Test 18: Admin List Events
echo "Test 18: GET /admin/events"
RESP=$(curl -s -w "\n%{http_code}" "$BASE/admin/events" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
EVENT_COUNT=$(echo "$BODY" | $JQ -r '.total')
echo "  Status: $HTTP_CODE, Events: $EVENT_COUNT"
if [ "$HTTP_CODE" = "200" ] && [ "$EVENT_COUNT" -gt 0 ] 2>/dev/null; then
  add_result "18" "GET /admin/events" "200" "$HTTP_CODE" "PASS" "$EVENT_COUNT events listed"
else
  add_result "18" "GET /admin/events" "200" "$HTTP_CODE" "FAIL" "No events or error"
fi

# ============================================================
# FLOW 6: AUTH GUARDS (run before admin delete)
# ============================================================
echo ""
echo "--- FLOW 6: AUTH GUARDS ---"

# Test 19 (orig 20): Stats with ATTENDEE token → 403
echo "Test 19: GET /events/$EVENT_ID/stats (ATTENDEE token → 403)"
RESP=$(curl -s -w "\n%{http_code}" "$BASE/events/$EVENT_ID/stats" \
  -H "Authorization: Bearer $ATT_TOKEN")
HTTP_CODE=$(echo "$RESP" | tail -1)
echo "  Status: $HTTP_CODE"
if [ "$HTTP_CODE" = "403" ]; then
  add_result "19" "GET /events/{id}/stats (ATTENDEE)" "403" "$HTTP_CODE" "PASS" "Forbidden for attendee"
else
  add_result "19" "GET /events/{id}/stats (ATTENDEE)" "403" "$HTTP_CODE" "FAIL" "Expected 403"
fi

# Test 20 (orig 21): Book with ORGANIZER token → 403
echo "Test 20: POST /bookings (ORGANIZER token → 403)"
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/bookings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ORG_TOKEN" \
  -d "{\"eventId\":\"$EVENT_ID\"}")
HTTP_CODE=$(echo "$RESP" | tail -1)
echo "  Status: $HTTP_CODE"
if [ "$HTTP_CODE" = "403" ]; then
  add_result "20" "POST /bookings (ORGANIZER)" "403" "$HTTP_CODE" "PASS" "Forbidden for organizer"
else
  add_result "20" "POST /bookings (ORGANIZER)" "403" "$HTTP_CODE" "FAIL" "Expected 403"
fi

# Test 21 (orig 22): Admin endpoint with ORGANIZER token → 403
echo "Test 21: GET /admin/users (ORGANIZER token → 403)"
RESP=$(curl -s -w "\n%{http_code}" "$BASE/admin/users" \
  -H "Authorization: Bearer $ORG_TOKEN")
HTTP_CODE=$(echo "$RESP" | tail -1)
echo "  Status: $HTTP_CODE"
if [ "$HTTP_CODE" = "403" ]; then
  add_result "21" "GET /admin/users (ORGANIZER)" "403" "$HTTP_CODE" "PASS" "Forbidden for organizer"
else
  add_result "21" "GET /admin/users (ORGANIZER)" "403" "$HTTP_CODE" "FAIL" "Expected 403"
fi

# Test 22 (orig 23): Stats with NO token → 401
echo "Test 22: GET /events/$EVENT_ID/stats (no token → 401)"
RESP=$(curl -s -w "\n%{http_code}" "$BASE/events/$EVENT_ID/stats")
HTTP_CODE=$(echo "$RESP" | tail -1)
echo "  Status: $HTTP_CODE"
if [ "$HTTP_CODE" = "401" ]; then
  add_result "22" "GET /events/{id}/stats (no token)" "401" "$HTTP_CODE" "PASS" "Unauthorized without token"
else
  add_result "22" "GET /events/{id}/stats (no token)" "401" "$HTTP_CODE" "FAIL" "Expected 401"
fi

# ============================================================
# ADMIN DELETE (originally test 19, now last)
# ============================================================
echo ""
echo "--- ADMIN DELETE ---"

# Test 23 (orig 19): Admin Delete Event
echo "Test 23: DELETE /admin/events/$EVENT_ID"
RESP=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE/admin/events/$EVENT_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
HTTP_CODE=$(echo "$RESP" | tail -1)
echo "  Status: $HTTP_CODE"
if [ "$HTTP_CODE" = "204" ]; then
  add_result "23" "DELETE /admin/events/{id}" "204" "$HTTP_CODE" "PASS" "Event deleted by admin"
else
  add_result "23" "DELETE /admin/events/{id}" "204" "$HTTP_CODE" "FAIL" "Expected 204"
fi

# ============================================================
# GENERATE TESTING.md
# ============================================================
echo ""
echo "=== RESULTS: $PASS passed, $FAIL failed out of 23 ==="

TESTING_FILE="$(dirname "$0")/TESTING.md"

cat > "$TESTING_FILE" << HEADER
# Evoria API - Manual Test Results

**Date:** $(date +%Y-%m-%d)
**Base URL:** $BASE
**Environment:** Development (seeded database)
**Branch:** hasan-booking-security-devops

## Summary

- **Total Tests:** 23
- **Passed:** $PASS
- **Failed:** $FAIL

## Test Results

| # | Endpoint | Expected | Actual | Pass? | Notes |
|---|----------|----------|--------|-------|-------|
HEADER

echo -e "$RESULTS" >> "$TESTING_FILE"

cat >> "$TESTING_FILE" << 'FOOTER'

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
FOOTER

echo ""
echo "TESTING.md generated at $TESTING_FILE"
