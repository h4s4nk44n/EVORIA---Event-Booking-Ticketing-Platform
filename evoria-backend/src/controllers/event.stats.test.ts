import request from 'supertest';
import app from '../app';
import { prisma } from '../config/prisma';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';

function makeToken(role: 'ORGANIZER', userId: string) {
  return jwt.sign(
    { userId, email: 'test@example.com', role },
    config.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function futureDate(daysAhead = 7) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString();
}

let organizer1Id: string;
let organizer2Id: string;
let organizer1Token: string;
let organizer2Token: string;
let eventId: string;

beforeAll(async () => {
  // 1. Create organizer 1 (Owner)
  const res1 = await request(app).post('/auth/register').send({
    name: 'Stats Org 1', email: 'statsorg1@test-stats.com',
    password: 'Test1234!', role: 'ORGANIZER',
  });
  organizer1Id = res1.body.user.id;
  organizer1Token = makeToken('ORGANIZER', organizer1Id);

  // 2. Create organizer 2 (Other)
  const res2 = await request(app).post('/auth/register').send({
    name: 'Stats Org 2', email: 'statsorg2@test-stats.com',
    password: 'Test1234!', role: 'ORGANIZER',
  });
  organizer2Id = res2.body.user.id;
  organizer2Token = makeToken('ORGANIZER', organizer2Id);

  // 3. Create an event with organizer 1
  const eventRes = await request(app)
    .post('/events')
    .set('Authorization', `Bearer ${organizer1Token}`)
    .send({
      title: 'Stats Event',
      description: 'Checking statistics logic',
      dateTime: futureDate(5),
      capacity: 100,
    });
  eventId = eventRes.body.event.id;
});

afterAll(async () => {
  await prisma.event.deleteMany({
    where: { organizerId: { in: [organizer1Id, organizer2Id] } },
  });
  await prisma.user.deleteMany({
    where: { id: { in: [organizer1Id, organizer2Id] } },
  });
  await prisma.$disconnect();
});

describe('GET /events/:id/stats', () => {

  // 1. Owner -> 200 ve Stats object
  it('with owner it returns 200 and stats object', async () => {
    const res = await request(app)
      .get(`/events/${eventId}/stats`)
      .set('Authorization', `Bearer ${organizer1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.eventId).toBe(eventId);
    expect(res.body.title).toBe('Stats Event');
    expect(res.body.capacity).toBe(100);
    expect(res.body.ticketsSold).toBe(0); // No bookings yet
    expect(res.body.ticketsRemaining).toBe(100);
  });

  // 2. Different organizer -> 403
  it('with different organizer it returns 403', async () => {
    const res = await request(app)
      .get(`/events/${eventId}/stats`)
      .set('Authorization', `Bearer ${organizer2Token}`);

    expect(res.status).toBe(403);
  });

  // 3. Non-existent event -> 404
  it('with non-existent event it returns 404', async () => {
    const res = await request(app)
      .get('/events/nonexistent-id/stats')
      .set('Authorization', `Bearer ${organizer1Token}`);

    expect(res.status).toBe(404);
  });

});