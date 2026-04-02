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
    email:    'getevent@test-events.com',
    password: '12345678',
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
    where: { email: { contains: '@test-events.com' } },
    select: { id: true },
  });
  const userIds = users.map(u => u.id);
  await prisma.event.deleteMany({ where: { organizerId: { in: userIds } } });
  await prisma.user.deleteMany({ where: { email: { contains: '@test-events.com' } } });
  await prisma.$disconnect();
});

describe('GET /events/:id', () => {

  // 1. Geçerli ID → 200 ve event döner
  it('geçerli ID ile 200 ve event döner', async () => {
    const res = await request(app).get(`/events/${eventId}`);

    expect(res.status).toBe(200);
    expect(res.body.event).toBeDefined();
    expect(res.body.event.id).toBe(eventId);
  });

  // 2. Event organizer bilgisi içermeli
  it('event organizer id ve name içerir', async () => {
    const res = await request(app).get(`/events/${eventId}`);

    expect(res.status).toBe(200);
    expect(res.body.event.organizer).toBeDefined();
    expect(res.body.event.organizer.id).toBeDefined();
    expect(res.body.event.organizer.name).toBeDefined();
  });

  // 3. bookedCount ve availableSpots içermeli
  it('event bookedCount ve availableSpots içerir', async () => {
    const res = await request(app).get(`/events/${eventId}`);

    expect(res.status).toBe(200);
    expect(res.body.event).toHaveProperty('bookedCount');
    expect(res.body.event).toHaveProperty('availableSpots');
  });

  // 4. Token olmadan da çalışmalı — public endpoint
  it('token olmadan da 200 döner', async () => {
    const res = await request(app).get(`/events/${eventId}`);

    expect(res.status).toBe(200);
  });

  // 5. Olmayan ID → 404
  it('olmayan ID ile 404 döner', async () => {
    const res = await request(app).get('/events/nonexistent-id-12345');

    expect(res.status).toBe(404);
  });

});