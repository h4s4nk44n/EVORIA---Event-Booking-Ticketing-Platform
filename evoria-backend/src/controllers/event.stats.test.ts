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
  // 1. Organizer 1 (Owner) oluştur
  const res1 = await request(app).post('/auth/register').send({
    name: 'Stats Org 1', email: 'statsorg1@test-events.com',
    password: 'password123', role: 'ORGANIZER',
  });
  organizer1Id = res1.body.user.id;
  organizer1Token = makeToken('ORGANIZER', organizer1Id);

  // 2. Organizer 2 (Other) oluştur
  const res2 = await request(app).post('/auth/register').send({
    name: 'Stats Org 2', email: 'statsorg2@test-events.com',
    password: 'password123', role: 'ORGANIZER',
  });
  organizer2Id = res2.body.user.id;
  organizer2Token = makeToken('ORGANIZER', organizer2Id);

  // 3. Organizer 1'e ait bir event oluştur
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

  // Not: Eğer istersen Prisma üzerinden birkaç Booking ekleyip ticketsSold 
  // değerinin artıp artmadığını da test edebilirsin. Şu an 0 olması bekleniyor.
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

  // 1. Owner -> 200 ve Stats objesi
  it('owner ile çağrıldığında 200 ve istatistikleri döner', async () => {
    const res = await request(app)
      .get(`/events/${eventId}/stats`)
      .set('Authorization', `Bearer ${organizer1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.eventId).toBe(eventId);
    expect(res.body.title).toBe('Stats Event');
    expect(res.body.capacity).toBe(100);
    expect(res.body.ticketsSold).toBe(0); // Henüz rezervasyon yok
    expect(res.body.ticketsRemaining).toBe(100);
  });

  // 2. Different organizer -> 403
  it('farklı organizer ile çağrıldığında 403 döner', async () => {
    const res = await request(app)
      .get(`/events/${eventId}/stats`)
      .set('Authorization', `Bearer ${organizer2Token}`);

    expect(res.status).toBe(403);
  });

  // 3. Non-existent event -> 404
  it('olmayan event ID ile çağrıldığında 404 döner', async () => {
    const res = await request(app)
      .get('/events/nonexistent-id/stats')
      .set('Authorization', `Bearer ${organizer1Token}`);

    expect(res.status).toBe(404);
  });

});