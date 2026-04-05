// This test created for "EVR-15 / GET/events" test

import request from 'supertest';
import app from '../app';
import { prisma } from '../config/prisma';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';

function makeOrganizerToken(userId: string) {
  return jwt.sign(
    { userId, email: 'org@test.com', role: 'ORGANIZER' },
    config.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function futureDate(daysAhead: number) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString();
}

let organizerId: string;
let organizerToken: string;

beforeAll(async () => {
  // Create an organizer user
  const res = await request(app).post('/auth/register').send({
    name:     'List Test Organizer',
    email:    'listorg@test-list.com',
    password: 'Test1234!',
    role:     'ORGANIZER',
  });
  organizerId   = res.body.user.id;
  organizerToken = makeOrganizerToken(organizerId);

  // Create test events
  await request(app).post('/events')
    .set('Authorization', `Bearer ${organizerToken}`)
    .send({ title: 'React Workshop', description: 'A workshop about React hooks and state', dateTime: futureDate(5),  capacity: 30 });

  await request(app).post('/events')
    .set('Authorization', `Bearer ${organizerToken}`)
    .send({ title: 'Vue Conference', description: 'A conference about Vue.js ecosystem',   dateTime: futureDate(10), capacity: 50 });

  await request(app).post('/events')
    .set('Authorization', `Bearer ${organizerToken}`)
    .send({ title: 'Angular Summit',  description: 'A summit about Angular framework',    dateTime: futureDate(15), capacity: 20 });

  await request(app).post('/events')
    .set('Authorization', `Bearer ${organizerToken}`)
    .send({ title: 'React Native Bootcamp', description: 'Mobile development with React Native', dateTime: futureDate(20), capacity: 25 });
});

afterAll(async () => {
  const users = await prisma.user.findMany({
    where: { email: { contains: '@test-list.com' } },
    select: { id: true },
  });
  const userIds = users.map(u => u.id);
  await prisma.event.deleteMany({ where: { organizerId: { in: userIds } } });
  await prisma.user.deleteMany({ where: { email: { contains: '@test-list.com' } } });
  await prisma.$disconnect();
});

describe('GET /events', () => {

  // 1. Without token 200 → public endpoint 
  it('It returns { data, total, page, limit, totalPages } and 200 without token', async () => {
    const res = await request(app).get('/events');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('page');
    expect(res.body).toHaveProperty('limit');
    expect(res.body).toHaveProperty('totalPages');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  // 2. Every event should include bookedCount and availableSpots
  it('Every event includes bookedCount and availableSpots', async () => {
    const res = await request(app).get('/events');

    expect(res.status).toBe(200);
    res.body.data.forEach((event: any) => {
      expect(event).toHaveProperty('bookedCount');
      expect(event).toHaveProperty('availableSpots');
    });
  });

  // 3. ?search=react → only React related events returned (case-insensitive)
  it('?search=react → only React related events returned', async () => {
    const res = await request(app).get('/events?search=react');

    expect(res.status).toBe(200);
    res.body.data.forEach((event: any) => {
      expect(event.title.toLowerCase()).toContain('react');
    });
  });

  // 4. ?page=1&limit=2 → max 2 event returnes
  it('?page=1&limit=2 → only 2 events returned', async () => {
    const res = await request(app).get('/events?page=1&limit=2');

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeLessThanOrEqual(2);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(2);
  });

  // 5. limit can't be greater than 50
  it('limit cannot be greater than 50', async () => {
    const res = await request(app).get('/events?limit=100');

    expect(res.status).toBe(200);
    expect(res.body.limit).toBe(50);
  });

  // 6. Date filter with ?from and ?to
  it('Date filter with ?from and ?to works', async () => {
    const from = new Date();
    from.setDate(from.getDate() + 3);

    const to = new Date();
    to.setDate(to.getDate() + 12);

    const res = await request(app)
      .get(`/events?from=${from.toISOString()}&to=${to.toISOString()}`);

    expect(res.status).toBe(200);
    res.body.data.forEach((event: any) => {
      const dt = new Date(event.dateTime);
      expect(dt >= from).toBe(true);
      expect(dt <= to).toBe(true);
    });
  });

  // 7. totalPages should be calculated correctly
  it('totalPages should be calculated correctly', async () => {
    const res = await request(app).get('/events?limit=2');

    expect(res.status).toBe(200);
    expect(res.body.totalPages).toBe(Math.ceil(res.body.total / res.body.limit));
  });

});