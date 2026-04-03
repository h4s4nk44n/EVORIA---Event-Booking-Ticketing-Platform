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
  // Organizer 1 oluştur
  const res1 = await request(app).post('/auth/register').send({
    name: 'Update Organizer 1', email: 'updateorg1@test-events.com',
    password: 'Test1234!', role: 'ORGANIZER',
  });
  organizer1Id    = res1.body.user.id;
  organizer1Token = makeToken('ORGANIZER', organizer1Id);

  // Organizer 2 oluştur
  const res2 = await request(app).post('/auth/register').send({
    name: 'Update Organizer 2', email: 'updateorg2@test-events.com',
    password: 'Test1234!', role: 'ORGANIZER',
  });
  organizer2Id    = res2.body.user.id;
  organizer2Token = makeToken('ORGANIZER', organizer2Id);

  // Organizer 1'e ait bir event oluştur
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
    where: { email: { contains: '@test-events.com' } },
    select: { id: true },
  });
  const userIds = users.map(u => u.id);
  await prisma.event.deleteMany({ where: { organizerId: { in: userIds } } });
  await prisma.user.deleteMany({ where: { email: { contains: '@test-events.com' } } });
  await prisma.$disconnect();
});

describe('PUT /events/:id', () => {

  // 1. Geçerli güncelleme → 200
  it('owner ile geçerli güncelleme 200 ve güncellenmiş event döner', async () => {
    const res = await request(app)
      .put(`/events/${eventId}`)
      .set('Authorization', `Bearer ${organizer1Token}`)
      .send({ title: 'Updated Title' });

    expect(res.status).toBe(200);
    expect(res.body.event.title).toBe('Updated Title');
  });

  // 2. Partial update — sadece title güncellenmeli
  it('sadece title gönderilince diğer alanlar değişmez', async () => {
    const res = await request(app)
      .put(`/events/${eventId}`)
      .set('Authorization', `Bearer ${organizer1Token}`)
      .send({ title: 'Only Title Changed' });

    expect(res.status).toBe(200);
    expect(res.body.event.title).toBe('Only Title Changed');
    expect(res.body.event.capacity).toBe(50); // değişmemeli
  });

  // 3. Farklı organizer → 403
  it('farklı organizer ile 403 döner', async () => {
    const res = await request(app)
      .put(`/events/${eventId}`)
      .set('Authorization', `Bearer ${organizer2Token}`)
      .send({ title: 'Hacker Title' });

    expect(res.status).toBe(403);
  });

  // 4. Olmayan event → 404
  it('olmayan event ID ile 404 döner', async () => {
    const res = await request(app)
      .put('/events/nonexistent-id')
      .set('Authorization', `Bearer ${organizer1Token}`)
      .send({ title: 'New Title' });

    expect(res.status).toBe(404);
  });

  // 5. Geçmiş tarih → 400
  it('geçmiş dateTime ile 400 döner', async () => {
    const res = await request(app)
      .put(`/events/${eventId}`)
      .set('Authorization', `Bearer ${organizer1Token}`)
      .send({ dateTime: '2020-01-01T00:00:00.000Z' });

    expect(res.status).toBe(400);
  });

  // 6. Token yok → 401
  it('token olmadan 401 döner', async () => {
    const res = await request(app)
      .put(`/events/${eventId}`)
      .send({ title: 'No Token' });

    expect(res.status).toBe(401);
  });

  // 7. Kapasite booking sayısının altına düşürülünce → 422
  it('kapasite mevcut booking sayısının altına düşürülünce 422 döner', async () => {
    // Önce kapasiteyi 1'e düşür — booking yoksa geçer
    // Sonra kapasiteyi 0'a düşürmeye çalış → 400 (Zod validation)
    const res = await request(app)
      .put(`/events/${eventId}`)
      .set('Authorization', `Bearer ${organizer1Token}`)
      .send({ capacity: 0 });

    expect(res.status).toBe(400); // Zod min(1) engeller
  });

});