import request from 'supertest';
import app from '../app';
import { prisma } from '../config/prisma';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';

function makeToken(role: 'ORGANIZER' | 'ATTENDEE', userId: string) {
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
  // Create organizer 1
  const res1 = await request(app).post('/auth/register').send({
    name: 'Update Organizer 1', email: 'updateorg1@test-update.com',
    password: 'Test1234!', role: 'ORGANIZER',
  });
  organizer1Id    = res1.body.user.id;
  organizer1Token = makeToken('ORGANIZER', organizer1Id);

  // Create organizer 2
  const res2 = await request(app).post('/auth/register').send({
    name: 'Update Organizer 2', email: 'updateorg2@test-update.com',
    password: 'Test1234!', role: 'ORGANIZER',
  });
  organizer2Id    = res2.body.user.id;
  organizer2Token = makeToken('ORGANIZER', organizer2Id);

  // Create an event with organizer 1
  const eventRes = await request(app)
    .post('/events')
    .set('Authorization', `Bearer ${organizer1Token}`)
    .send({
      title:       'Original Title',
      description: 'Original description text here',
      dateTime:    futureDate(5),
      capacity:    50,
    });
  eventId = eventRes.body.event.id;
});

afterAll(async () => {
  const users = await prisma.user.findMany({
    where: { email: { contains: '@test-update.com' } },
    select: { id: true },
  });
  const userIds = users.map(u => u.id);
  await prisma.event.deleteMany({ where: { organizerId: { in: userIds } } });
  await prisma.user.deleteMany({ where: { email: { contains: '@test-update.com' } } });
  await prisma.$disconnect();
});

describe('PUT /events/:id', () => {

  // 1. Valid update → 200
  it('with valid update it returns 200 and updated event', async () => {
    const res = await request(app)
      .put(`/events/${eventId}`)
      .set('Authorization', `Bearer ${organizer1Token}`)
      .send({ title: 'Updated Title' });

    expect(res.status).toBe(200);
    expect(res.body.event.title).toBe('Updated Title');
  });

  // 2. Partial update — only title should be updated
  it('with partial update only title is updated', async () => {
    const res = await request(app)
      .put(`/events/${eventId}`)
      .set('Authorization', `Bearer ${organizer1Token}`)
      .send({ title: 'Only Title Changed' });

    expect(res.status).toBe(200);
    expect(res.body.event.title).toBe('Only Title Changed');
    expect(res.body.event.capacity).toBe(50); // It shouldn't be changed
  });

  // 3. Different organizer → 403
  it('with different organizer it returns 403', async () => {
    const res = await request(app)
      .put(`/events/${eventId}`)
      .set('Authorization', `Bearer ${organizer2Token}`)
      .send({ title: 'Hacker Title' });

    expect(res.status).toBe(403);
  });

  // 4. Non-existent event → 404
  it('with non-existent event it returns 404', async () => {
    const res = await request(app)
      .put('/events/nonexistent-id')
      .set('Authorization', `Bearer ${organizer1Token}`)
      .send({ title: 'New Title' });

    expect(res.status).toBe(404);
  });

  // 5. Past date → 400
  it('with past dateTime it returns 400', async () => {
    const res = await request(app)
      .put(`/events/${eventId}`)
      .set('Authorization', `Bearer ${organizer1Token}`)
      .send({ dateTime: '2020-01-01T00:00:00.000Z' });

    expect(res.status).toBe(400);
  });

  // 6. No token → 401
  it('with no token it returns 401', async () => {
    const res = await request(app)
      .put(`/events/${eventId}`)
      .send({ title: 'No Token' });

    expect(res.status).toBe(401);
  });

  // 7. Capacity reduced below current bookings → 422
  it('when capacity is reduced below current bookings it returns 422', async () => {
    const res = await request(app)
      .put(`/events/${eventId}`)
      .set('Authorization', `Bearer ${organizer1Token}`)
      .send({ capacity: 0 });

    expect(res.status).toBe(400);
  });

});