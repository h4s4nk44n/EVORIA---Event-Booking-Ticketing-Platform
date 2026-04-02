import request from 'supertest';
import app from '../app';
import { prisma } from '../config/prisma';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';

function makeToken(role: 'ATTENDEE' | 'ORGANIZER', userId: string) {
  return jwt.sign(
    { userId, email: `${role.toLowerCase()}@test-concurrency.com`, role },
    config.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function futureDate(days = 30) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

// Track all created IDs for cleanup
const createdUserIds: string[] = [];
const createdEventIds: string[] = [];
let organizerId: string;

beforeAll(async () => {
  // Create an organizer for all events
  const orgRes = await request(app).post('/auth/register').send({
    name: 'Concurrency Test Organizer',
    email: 'organizer@test-concurrency.com',
    password: '12345678',
    role: 'ORGANIZER',
  });
  organizerId = orgRes.body.user.id;
  createdUserIds.push(organizerId);
});

afterAll(async () => {
  // Clean up in correct order (bookings → events → users)
  if (createdEventIds.length > 0) {
    await prisma.booking.deleteMany({
      where: { eventId: { in: createdEventIds } },
    });
    await prisma.event.deleteMany({
      where: { id: { in: createdEventIds } },
    });
  }
  await prisma.user.deleteMany({
    where: { email: { contains: '@test-concurrency.com' } },
  });
  await prisma.$disconnect();
});

async function createAttendee(index: number) {
  const res = await request(app).post('/auth/register').send({
    name: `Concurrency Attendee ${index}`,
    email: `attendee${index}@test-concurrency.com`,
    password: '12345678',
    role: 'ATTENDEE',
  });
  const id = res.body.user.id;
  createdUserIds.push(id);
  return { id, token: makeToken('ATTENDEE', id) };
}

async function createEvent(capacity: number, label: string) {
  const ev = await prisma.event.create({
    data: {
      title: `Concurrency Test - ${label}`,
      description: `Concurrency test event (${label})`,
      dateTime: new Date(futureDate()),
      capacity,
      organizerId,
    },
  });
  createdEventIds.push(ev.id);
  return ev;
}

describe('Concurrent Overbooking Prevention (EVR-18)', () => {
  describe('capacity=1, two simultaneous requests', () => {
    let eventId: string;
    let attendeeA: { id: string; token: string };
    let attendeeB: { id: string; token: string };
    let results: request.Response[];

    beforeAll(async () => {
      attendeeA = await createAttendee(1);
      attendeeB = await createAttendee(2);
      const ev = await createEvent(1, 'cap1');
      eventId = ev.id;

      // Fire both requests simultaneously
      results = await Promise.all([
        request(app)
          .post('/bookings')
          .set('Authorization', `Bearer ${attendeeA.token}`)
          .send({ eventId }),
        request(app)
          .post('/bookings')
          .set('Authorization', `Bearer ${attendeeB.token}`)
          .send({ eventId }),
      ]);
    });

    it('should return exactly one 201 and one rejection (422 or 409)', () => {
      const statuses = results.map((r) => r.status).sort();
      expect(statuses).toHaveLength(2);

      const successes = statuses.filter((s) => s === 201);
      const rejections = statuses.filter((s) => s === 422 || s === 409);

      expect(successes).toHaveLength(1);
      expect(rejections).toHaveLength(1);
    });

    it('should have exactly 1 booking in the database', async () => {
      const count = await prisma.booking.count({ where: { eventId } });
      expect(count).toBe(1);
    });

    it('should not produce any 500 errors', () => {
      for (const res of results) {
        expect(res.status).not.toBe(500);
      }
    });
  });

  describe('capacity=3, four simultaneous requests', () => {
    let eventId: string;
    let attendees: { id: string; token: string }[];
    let results: request.Response[];

    beforeAll(async () => {
      attendees = await Promise.all([
        createAttendee(10),
        createAttendee(11),
        createAttendee(12),
        createAttendee(13),
      ]);
      const ev = await createEvent(3, 'cap3');
      eventId = ev.id;

      // Fire all 4 requests simultaneously
      results = await Promise.all(
        attendees.map((a) =>
          request(app)
            .post('/bookings')
            .set('Authorization', `Bearer ${a.token}`)
            .send({ eventId })
        )
      );
    });

    it('should return exactly 3 successes and 1 rejection', () => {
      const successes = results.filter((r) => r.status === 201);
      const rejections = results.filter(
        (r) => r.status === 422 || r.status === 409
      );

      expect(successes).toHaveLength(3);
      expect(rejections).toHaveLength(1);
    });

    it('should have exactly 3 bookings in the database', async () => {
      const count = await prisma.booking.count({ where: { eventId } });
      expect(count).toBe(3);
    });

    it('should not produce any 500 errors', () => {
      for (const res of results) {
        expect(res.status).not.toBe(500);
      }
    });
  });

  describe('duplicate user booking under concurrency', () => {
    let eventId: string;
    let attendee: { id: string; token: string };
    let results: request.Response[];

    beforeAll(async () => {
      attendee = await createAttendee(20);
      const ev = await createEvent(10, 'dup-check');
      eventId = ev.id;

      // Same user fires 2 concurrent requests for the same event
      results = await Promise.all([
        request(app)
          .post('/bookings')
          .set('Authorization', `Bearer ${attendee.token}`)
          .send({ eventId }),
        request(app)
          .post('/bookings')
          .set('Authorization', `Bearer ${attendee.token}`)
          .send({ eventId }),
      ]);
    });

    it('should return exactly one 201 and one 409', () => {
      const statuses = results.map((r) => r.status).sort();
      const successes = statuses.filter((s) => s === 201);
      const duplicates = statuses.filter((s) => s === 409);

      expect(successes).toHaveLength(1);
      expect(duplicates).toHaveLength(1);
    });

    it('should have exactly 1 booking for the user', async () => {
      const count = await prisma.booking.count({
        where: { eventId, userId: attendee.id },
      });
      expect(count).toBe(1);
    });

    it('should not produce any 500 errors', () => {
      for (const res of results) {
        expect(res.status).not.toBe(500);
      }
    });
  });
});
