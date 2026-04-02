import request from 'supertest';
import app from '../app';
import { prisma } from '../config/prisma';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';

function makeToken(role: 'ATTENDEE' | 'ORGANIZER' | 'ADMIN', userId: string) {
  return jwt.sign(
    { userId, email: `${role.toLowerCase()}@test-booking.com`, role },
    config.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function futureDate(days = 7) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

let attendeeId: string;
let attendeeToken: string;
let secondAttendeeId: string;
let secondAttendeeToken: string;
let organizerToken: string;
let organizerId: string;
let eventId: string;
let fullEventId: string;

beforeAll(async () => {
  // Create an organizer
  const orgRes = await request(app).post('/auth/register').send({
    name: 'Booking Test Organizer',
    email: 'organizer@test-booking.com',
    password: '12345678',
    role: 'ORGANIZER',
  });
  organizerId = orgRes.body.user.id;
  organizerToken = makeToken('ORGANIZER', organizerId);

  // Create attendee 1
  const attRes = await request(app).post('/auth/register').send({
    name: 'Booking Test Attendee',
    email: 'attendee1@test-booking.com',
    password: '12345678',
    role: 'ATTENDEE',
  });
  attendeeId = attRes.body.user.id;
  attendeeToken = makeToken('ATTENDEE', attendeeId);

  // Create attendee 2
  const att2Res = await request(app).post('/auth/register').send({
    name: 'Booking Test Attendee 2',
    email: 'attendee2@test-booking.com',
    password: '12345678',
    role: 'ATTENDEE',
  });
  secondAttendeeId = att2Res.body.user.id;
  secondAttendeeToken = makeToken('ATTENDEE', secondAttendeeId);

  // Create a normal event with capacity 2
  const ev = await prisma.event.create({
    data: {
      title: 'Booking Test Event',
      description: 'Test event for booking',
      dateTime: new Date(futureDate(30)),
      capacity: 2,
      organizerId,
    },
  });
  eventId = ev.id;

  // Create a fully booked event (capacity 1, 1 booking)
  const fullEv = await prisma.event.create({
    data: {
      title: 'Full Test Event',
      description: 'Already full',
      dateTime: new Date(futureDate(30)),
      capacity: 1,
      organizerId,
    },
  });
  fullEventId = fullEv.id;

  // Fill it up with second attendee's booking
  await prisma.booking.create({
    data: { userId: secondAttendeeId, eventId: fullEventId },
  });
});

afterAll(async () => {
  await prisma.booking.deleteMany({
    where: { eventId: { in: [eventId, fullEventId] } },
  });
  await prisma.event.deleteMany({
    where: { id: { in: [eventId, fullEventId] } },
  });
  await prisma.user.deleteMany({
    where: { email: { contains: '@test-booking.com' } },
  });
  await prisma.$disconnect();
});

describe('POST /bookings', () => {
  it('should create a booking with ATTENDEE token and return 201', async () => {
    const res = await request(app)
      .post('/bookings')
      .set('Authorization', `Bearer ${attendeeToken}`)
      .send({ eventId });

    expect(res.status).toBe(201);
    expect(res.body.booking).toBeDefined();
    expect(res.body.booking.event).toBeDefined();
    expect(res.body.booking.event.id).toBe(eventId);
    expect(res.body.booking.event.title).toBe('Booking Test Event');
    expect(res.body.booking.user).toBeDefined();
    expect(res.body.booking.user.id).toBe(attendeeId);
  });

  it('should return 409 when booking the same event twice', async () => {
    const res = await request(app)
      .post('/bookings')
      .set('Authorization', `Bearer ${attendeeToken}`)
      .send({ eventId });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already/i);
  });

  it('should return 422 when event is fully booked', async () => {
    const res = await request(app)
      .post('/bookings')
      .set('Authorization', `Bearer ${attendeeToken}`)
      .send({ eventId: fullEventId });

    expect(res.status).toBe(422);
    expect(res.body.error).toMatch(/fully booked/i);
  });

  it('should return 404 for non-existent eventId', async () => {
    const res = await request(app)
      .post('/bookings')
      .set('Authorization', `Bearer ${attendeeToken}`)
      .send({ eventId: 'nonexistent-event-id' });

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });

  it('should return 403 with ORGANIZER token', async () => {
    const res = await request(app)
      .post('/bookings')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ eventId });

    expect(res.status).toBe(403);
  });

  it('should return 401 without token', async () => {
    const res = await request(app)
      .post('/bookings')
      .send({ eventId });

    expect(res.status).toBe(401);
  });

  it('should return 400 with missing eventId', async () => {
    const res = await request(app)
      .post('/bookings')
      .set('Authorization', `Bearer ${attendeeToken}`)
      .send({});

    expect(res.status).toBe(400);
  });
});

describe('DELETE /bookings/:id', () => {
  let bookingToDeleteId: string;

  beforeAll(async () => {
    // Create a booking to delete (second attendee books the normal event)
    const b = await prisma.booking.create({
      data: { userId: secondAttendeeId, eventId },
    });
    bookingToDeleteId = b.id;
  });

  it('should cancel own booking and return 200', async () => {
    const res = await request(app)
      .delete(`/bookings/${bookingToDeleteId}`)
      .set('Authorization', `Bearer ${secondAttendeeToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/cancelled/i);
  });

  it('should return 404 for non-existent booking', async () => {
    const res = await request(app)
      .delete('/bookings/nonexistent-booking-id')
      .set('Authorization', `Bearer ${attendeeToken}`);

    expect(res.status).toBe(404);
  });
});

describe('GET /bookings/me', () => {
  it('should return the current user bookings', async () => {
    const res = await request(app)
      .get('/bookings/me')
      .set('Authorization', `Bearer ${attendeeToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.bookings)).toBe(true);
    expect(res.body.bookings.length).toBeGreaterThanOrEqual(1);
    expect(res.body.bookings[0].event).toBeDefined();
  });
});
