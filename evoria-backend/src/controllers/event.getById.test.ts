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

function futureDate(daysAhead = 7) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString();
}

let organizerId: string;
let organizerToken: string;
let eventId: string;

beforeAll(async () => {
  const res = await request(app).post('/auth/register').send({
    name:     'GetEvent Organizer',
    email:    'getevent@test-getbyid.com',
    password: 'Test1234!',
    role:     'ORGANIZER',
  });
  organizerId    = res.body.user.id;
  organizerToken = makeOrganizerToken(organizerId);

  const eventRes = await request(app)
    .post('/events')
    .set('Authorization', `Bearer ${organizerToken}`)
    .send({
      title:       'Specific Event',
      description: 'This is a specific event for testing',
      dateTime:    futureDate(5),
      capacity:    50,
    });
  eventId = eventRes.body.event.id;
});

afterAll(async () => {
  const users = await prisma.user.findMany({
    where: { email: { contains: '@test-getbyid.com' } },
    select: { id: true },
  });
  const userIds = users.map(u => u.id);
  await prisma.event.deleteMany({ where: { organizerId: { in: userIds } } });
  await prisma.user.deleteMany({ where: { email: { contains: '@test-getbyid.com' } } });
  await prisma.$disconnect();
});

describe('GET /events/:id', () => {

  // 1. Valid ID → 200 and event returned
  it('valid ID with 200 and event returned', async () => {
    const res = await request(app).get(`/events/${eventId}`);
    expect(res.status).toBe(200);
    expect(res.body.event).toBeDefined();
    expect(res.body.event.id).toBe(eventId);
  });

  // 2. Event should include organizer info
  it('event includes organizer id and name', async () => {
    const res = await request(app).get(`/events/${eventId}`);
    expect(res.status).toBe(200);
    expect(res.body.event.organizer).toBeDefined();
    expect(res.body.event.organizer.id).toBeDefined();
    expect(res.body.event.organizer.name).toBeDefined();
  });

  // 3. It should include bookedCount and availableSpots
  it('event includes bookedCount and availableSpots', async () => {
    const res = await request(app).get(`/events/${eventId}`);
    expect(res.status).toBe(200);
    expect(res.body.event).toHaveProperty('bookedCount');
    expect(res.body.event).toHaveProperty('availableSpots');
  });

  // 4. It should be able to work without token — public endpoint
  it('It can also returns 200 without token', async () => {
    const res = await request(app).get(`/events/${eventId}`);
    expect(res.status).toBe(200);
  });

  // 5. Non-existent ID → 404
  it('non-existent ID with 404', async () => {
    const res = await request(app).get('/events/nonexistent-id-12345');
    expect(res.status).toBe(404);
  });
});