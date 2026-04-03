// This test created for "EVR-12 / POST/events" test

import request from 'supertest';
import app from '../app';
import { prisma } from '../config/prisma';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';

// Token üretici
function makeToken(role: 'ATTENDEE' | 'ORGANIZER' | 'ADMIN', userId: string) {
  return jwt.sign(
    { userId, email: 'test@example.com', role },
    config.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Gelecekte bir tarih
function futureDate(daysAhead = 7) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString();
}

let organizerId: string;
let organizerToken: string;
let attendeeToken: string;

// Test öncesi bir organizer kullanıcı oluştur
beforeAll(async () => {
  const res = await request(app).post('/auth/register').send({
    name:     'Test Organizer',
    email:    'organizer@test-events.com',
    password: 'Test1234!',
    role:     'ORGANIZER',
  });
  organizerId = res.body.user.id;
  organizerToken = makeToken('ORGANIZER', organizerId);
  attendeeToken  = makeToken('ATTENDEE', 'attendee-id');
});

// Test sonrası temizlik
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

const validBody = {
  title:       'Test Event',
  description: 'This is a test event description',
  dateTime:    futureDate(7),
  capacity:    100,
};

describe('POST /events', () => {

  // 1. ORGANIZER token ile geçerli body → 201
  it('ORGANIZER token ile geçerli body 201 ve event döner', async () => {
    const res = await request(app)
      .post('/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send(validBody);

    expect(res.status).toBe(201);
    expect(res.body.event).toBeDefined();
    expect(res.body.event.title).toBe(validBody.title);
  });

  // 2. Response'da organizer bilgisi var mı
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

  // 3. organizerId body'den değil token'dan geliyor
  it('organizerId token\'daki userId ile eşleşir', async () => {
    const res = await request(app)
      .post('/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send(validBody);

    expect(res.status).toBe(201);
    expect(res.body.event.organizerId).toBe(organizerId);
  });

  // 4. Geçmiş tarih → 400
  it('geçmiş dateTime ile 400 döner', async () => {
    const res = await request(app)
      .post('/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ ...validBody, dateTime: '2020-01-01T00:00:00.000Z' });

    expect(res.status).toBe(400);
  });

  // 5. capacity: 0 → 400
  it('capacity 0 ile 400 döner', async () => {
    const res = await request(app)
      .post('/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ ...validBody, capacity: 0 });

    expect(res.status).toBe(400);
  });

  // 6. Kısa title → 400
  it('çok kısa title ile 400 döner', async () => {
    const res = await request(app)
      .post('/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ ...validBody, title: 'AB' });

    expect(res.status).toBe(400);
  });

  // 7. ATTENDEE token → 403
  it('ATTENDEE token ile 403 döner', async () => {
    const res = await request(app)
      .post('/events')
      .set('Authorization', `Bearer ${attendeeToken}`)
      .send(validBody);

    expect(res.status).toBe(403);
  });

  // 8. Token yok → 401
  it('token olmadan 401 döner', async () => {
    const res = await request(app)
      .post('/events')
      .send(validBody);

    expect(res.status).toBe(401);
  });

});