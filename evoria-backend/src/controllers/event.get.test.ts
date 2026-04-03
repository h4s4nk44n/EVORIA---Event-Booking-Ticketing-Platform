import request from 'supertest';
import app from '../app';
import { prisma } from '../config/prisma';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';

function makeToken(role: 'ATTENDEE' | 'ORGANIZER' | 'ADMIN', userId: string) {
  return jwt.sign(
    { userId, email: `${role.toLowerCase()}@test-event-get.com`, role },
    config.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

let organizerId: string;
let attendeeId: string;
let attendeeToken: string;
let eventId: string;

beforeAll(async () => {
  const orgRes = await request(app).post('/auth/register').send({
    name: 'Event Get Test Organizer',
    email: 'organizer@test-event-get.com',
    password: 'Test1234!',
    role: 'ORGANIZER',
  });
  organizerId = orgRes.body.user.id;

  const attRes = await request(app).post('/auth/register').send({
    name: 'Event Get Test Attendee',
    email: 'attendee@test-event-get.com',
    password: 'Test1234!',
    role: 'ATTENDEE',
  });
  attendeeId = attRes.body.user.id;
  attendeeToken = makeToken('ATTENDEE', attendeeId);

  const d = new Date();
  d.setDate(d.getDate() + 30);

  const ev = await prisma.event.create({
    data: {
      title: 'Event Get Test Event',
      description: 'Test event for GET /events/:id',
      dateTime: d,
      capacity: 5,
      organizerId,
    },
  });
  eventId = ev.id;

  // Create one booking so bookedCount = 1
  await prisma.booking.create({
    data: { userId: attendeeId, eventId },
  });
});

afterAll(async () => {
  await prisma.booking.deleteMany({ where: { eventId } });
  await prisma.event.deleteMany({ where: { id: eventId } });
  await prisma.user.deleteMany({
    where: { email: { contains: '@test-event-get.com' } },
  });
  await prisma.$disconnect();
});

describe('GET /events/:id', () => {
  it('should return event with availableSpots and organizer', async () => {
    const res = await request(app).get(`/events/${eventId}`);

    expect(res.status).toBe(200);
    expect(res.body.event).toBeDefined();
    expect(res.body.event.id).toBe(eventId);
    expect(res.body.event.title).toBe('Event Get Test Event');
    expect(res.body.event.capacity).toBe(5);
    expect(res.body.event.bookedCount).toBe(1);
    expect(res.body.event.availableSpots).toBe(4);
    expect(res.body.event.organizer).toBeDefined();
    expect(res.body.event.organizer.name).toBe('Event Get Test Organizer');
  });

  it('should return 404 for non-existent event', async () => {
    const res = await request(app).get('/events/nonexistent-event-id');

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });
});
