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
let attendeeId: string;
let organizer1Token: string;
let organizer2Token: string;
let eventId: string;
let bookingId: string;

beforeAll(async () => {
  // 1. Organizer 1 oluştur
  const res1 = await request(app).post('/auth/register').send({
    name: 'Delete Org 1', email: 'deleteorg1@test-delete.com',
    password: 'Test1234!', role: 'ORGANIZER',
  });
  organizer1Id = res1.body.user.id;
  organizer1Token = makeToken('ORGANIZER', organizer1Id);

  // 2. Organizer 2 oluştur (403 testi için)
  const res2 = await request(app).post('/auth/register').send({
    name: 'Delete Org 2', email: 'deleteorg2@test-delete.com',
    password: 'Test1234!', role: 'ORGANIZER',
  });
  organizer2Id = res2.body.user.id;
  organizer2Token = makeToken('ORGANIZER', organizer2Id);

  // 3. Bir Attendee (Katılımcı) oluştur (Booking testi için)
  const res3 = await request(app).post('/auth/register').send({
    name: 'Delete Attendee', email: 'deleteattendee@test-delete.com',
    password: 'Test1234!', role: 'ATTENDEE',
  });
  attendeeId = res3.body.user.id;

  // 4. Organizer 1'e ait bir event oluştur
  const eventRes = await request(app)
    .post('/events')
    .set('Authorization', `Bearer ${organizer1Token}`)
    .send({
      title: 'Event to be deleted',
      description: 'This event will be deleted in tests',
      dateTime: futureDate(5),
      capacity: 50,
    });
  eventId = eventRes.body.event.id;

  // 5. Prisma üzerinden manuel bir Booking oluştur (Cascade delete'i test edeceğiz)
  const booking = await prisma.booking.create({
    data: {
      eventId: eventId,
      userId: attendeeId,
    }
  });
  bookingId = booking.id;
});

afterAll(async () => {
  // Sadece bu test dosyasında oluşturduğumuz sahte verileri temizle (Race Condition'ı önler)
  await prisma.user.deleteMany({
    where: { id: { in: [organizer1Id, organizer2Id, attendeeId] } }
  });
  await prisma.$disconnect();
});

describe('DELETE /events/:id', () => {

  // 1. Token yok → 401
  it('token olmadan 401 döner', async () => {
    const res = await request(app).delete(`/events/${eventId}`);
    expect(res.status).toBe(401);
  });

  // 2. Olmayan event → 404
  it('olmayan event ID ile 404 döner', async () => {
    const res = await request(app)
      .delete('/events/nonexistent-id')
      .set('Authorization', `Bearer ${organizer1Token}`);
    
    expect(res.status).toBe(404);
  });

  // 3. Farklı organizer → 403
  it('farklı organizer ile 403 döner', async () => {
    const res = await request(app)
      .delete(`/events/${eventId}`)
      .set('Authorization', `Bearer ${organizer2Token}`);
    
    expect(res.status).toBe(403);
  });

  // 4. Geçerli silme işlemi ve Cascade Delete kontrolü → 204
  it('owner ile event silinir (204) ve evente ait bookingler DBden kalkar', async () => {
    // API isteği ile eventi sil
    const res = await request(app)
      .delete(`/events/${eventId}`)
      .set('Authorization', `Bearer ${organizer1Token}`);

    expect(res.status).toBe(204);

    // Event DB'den gerçekten silinmiş mi kontrol et
    const deletedEvent = await prisma.event.findUnique({ where: { id: eventId } });
    expect(deletedEvent).toBeNull();

    // Booking DB'den gerçekten silinmiş mi (Cascade Delete çalışmış mı) kontrol et
    const deletedBooking = await prisma.booking.findUnique({ where: { id: bookingId } });
    expect(deletedBooking).toBeNull();
  });

});