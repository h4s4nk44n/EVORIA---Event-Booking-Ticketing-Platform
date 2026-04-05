// This test created for "EVR-12 / POST/events" test

import request from 'supertest';
import app from '../app';
import { prisma } from '../config/prisma';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';

// Token generator function
function makeToken(role: 'ATTENDEE' | 'ORGANIZER' | 'ADMIN', userId: string) {
  return jwt.sign(
    { userId, email: 'test@example.com', role },
    config.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Future date generator function
function futureDate(daysAhead = 7) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString();
}

let organizerId: string;
let organizerToken: string;
let attendeeToken: string;

// Create an organizer user before tests
beforeAll(async () => {
  const res = await request(app).post('/auth/register').send({
    name:     'Test Organizer',
    email:    'organizer@test-create.com',
    password: 'Test1234!',
    role:     'ORGANIZER',
  });
  organizerId = res.body.user.id;
  organizerToken = makeToken('ORGANIZER', organizerId);
  attendeeToken  = makeToken('ATTENDEE', 'attendee-id');
});

// Cleanup test users after all tests
afterAll(async () => {
  const users = await prisma.user.findMany({
    where: { email: { contains: '@test-create.com' } },
    select: { id: true },
  });
  const userIds = users.map(u => u.id);
  await prisma.event.deleteMany({ where: { organizerId: { in: userIds } } });
  await prisma.user.deleteMany({ where: { email: { contains: '@test-create.com' } } });
  await prisma.$disconnect();
});

const validBody = {
  title:       'Test Event',
  description: 'This is a test event description',
  dateTime:    futureDate(7),
  capacity:    100,
};

describe('POST /events', () => {

  // 1. ORGANIZER token and valid body → 201 
  it('It returns ORGANIZER token and valid body (201)', async () => {
    const res = await request(app)
      .post('/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send(validBody);

    expect(res.status).toBe(201);
    expect(res.body.event).toBeDefined();
    expect(res.body.event.title).toBe(validBody.title);
  });

  // 2. Is the organizer info included in the response event?
  it('response event içinde organizer id ve name içerir', async () => {
    const res = await request(app)
      .post('/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send(validBody);

    expect(res.status).toBe(201);
    expect(res.body.event.organizer).toBeDefined();
    expect(res.body.event.organizer.id).toBeDefined();
    expect(res.body.event.organizer.name).toBeDefined();
  });

  // 3. organizerId comes from token, not body
  it('organizerId matches with userId which is inside the token', async () => {
    const res = await request(app)
      .post('/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send(validBody);

    expect(res.status).toBe(201);
    expect(res.body.event.organizerId).toBe(organizerId);
  });

  // 4. Past date → 400 
  it('past dateTime with 400', async () => {
    const res = await request(app)
      .post('/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ ...validBody, dateTime: '2020-01-01T00:00:00.000Z' });

    expect(res.status).toBe(400);
  });

  // 5. capacity: 0 → 400
  it('capacity 0 returns 400', async () => {
    const res = await request(app)
      .post('/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ ...validBody, capacity: 0 });

    expect(res.status).toBe(400);
  });

  // 6. Short title → 400
  it('short title with 400', async () => {
    const res = await request(app)
      .post('/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ ...validBody, title: 'AB' });

    expect(res.status).toBe(400);
  });

  // 7. ATTENDEE token → 403
  it('ATTENDEE token with 403', async () => {
    const res = await request(app)
      .post('/events')
      .set('Authorization', `Bearer ${attendeeToken}`)
      .send(validBody);

    expect(res.status).toBe(403);
  });

  // 8. No token → 401
  it('No token with 401', async () => {
    const res = await request(app)
      .post('/events')
      .send(validBody);

    expect(res.status).toBe(401);
  });

});