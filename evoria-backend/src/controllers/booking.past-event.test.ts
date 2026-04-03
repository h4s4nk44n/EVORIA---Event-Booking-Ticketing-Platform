import request from 'supertest';
import app from '../app';
import { prisma } from '../config/prisma';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';

function makeToken(role: 'ATTENDEE' | 'ORGANIZER', userId: string) {
  return jwt.sign(
    { userId, email: `${role.toLowerCase()}@test-past-booking.com`, role },
    config.JWT_SECRET,
    { expiresIn: '7d' },
  );
}

let attendeeId: string;
let attendeeToken: string;
let organizerId: string;
let pastEventId: string;

beforeAll(async () => {
  const orgRes = await request(app).post('/auth/register').send({
    name: 'Past Booking Organizer',
    email: 'organizer@test-past-booking.com',
    password: 'Organizer1234!',
    role: 'ORGANIZER',
  });
  organizerId = orgRes.body.user.id;

  const attRes = await request(app).post('/auth/register').send({
    name: 'Past Booking Attendee',
    email: 'attendee@test-past-booking.com',
    password: 'Attendee1234!',
    role: 'ATTENDEE',
  });
  attendeeId = attRes.body.user.id;
  attendeeToken = makeToken('ATTENDEE', attendeeId);

  // Create an event with a past date directly via Prisma (bypasses API validation)
  const pastEvent = await prisma.event.create({
    data: {
      title: 'Past Event Test',
      description: 'This event already happened',
      dateTime: new Date('2020-01-01T00:00:00.000Z'),
      capacity: 100,
      organizerId,
    },
  });
  pastEventId = pastEvent.id;
});

afterAll(async () => {
  await prisma.booking.deleteMany({ where: { eventId: pastEventId } });
  await prisma.event.deleteMany({ where: { id: pastEventId } });
  await prisma.user.deleteMany({
    where: { email: { contains: '@test-past-booking.com' } },
  });
  await prisma.$disconnect();
});

describe('Booking past event prevention', () => {
  it('should return 422 when trying to book a past event', async () => {
    const res = await request(app)
      .post('/bookings')
      .set('Authorization', `Bearer ${attendeeToken}`)
      .send({ eventId: pastEventId });

    expect(res.status).toBe(422);
    expect(res.body.error).toMatch(/past/i);
  });
});
