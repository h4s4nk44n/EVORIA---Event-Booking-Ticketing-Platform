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
  // 1. Create organizer 1
  const res1 = await request(app).post('/auth/register').send({
    name: 'Delete Org 1', email: 'deleteorg1@test-delete.com',
    password: 'Test1234!', role: 'ORGANIZER',
  });
  organizer1Id = res1.body.user.id;
  organizer1Token = makeToken('ORGANIZER', organizer1Id);

  // 2. Create organizer 2 for testing 403 case
  const res2 = await request(app).post('/auth/register').send({
    name: 'Delete Org 2', email: 'deleteorg2@test-delete.com',
    password: 'Test1234!', role: 'ORGANIZER',
  });
  organizer2Id = res2.body.user.id;
  organizer2Token = makeToken('ORGANIZER', organizer2Id);

  // 3. Create an Attendee for Booking test
  const res3 = await request(app).post('/auth/register').send({
    name: 'Delete Attendee', email: 'deleteattendee@test-delete.com',
    password: 'Test1234!', role: 'ATTENDEE',
  });
  attendeeId = res3.body.user.id;

  // 4. Create an event with organizer 1
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

  // 5. Create a booking for the event with the attendee user
  const booking = await prisma.booking.create({
    data: {
      eventId: eventId,
      userId: attendeeId,
    }
  });
  bookingId = booking.id;
});

afterAll(async () => {
  // Cleanup only the test data created in this test suite
  await prisma.user.deleteMany({
    where: { id: { in: [organizer1Id, organizer2Id, attendeeId] } }
  });
  await prisma.$disconnect();
});

describe('DELETE /events/:id', () => {

  // 1. No token → 401
  it('No token with 401', async () => {
    const res = await request(app).delete(`/events/${eventId}`);
    expect(res.status).toBe(401);
  });

  // 2. Non-existent event → 404
  it('Non-existent event ID with 404', async () => {
    const res = await request(app)
      .delete('/events/nonexistent-id')
      .set('Authorization', `Bearer ${organizer1Token}`);
    
    expect(res.status).toBe(404);
  });

  // 3. Different organizer → 403
  it('different organizer with 403', async () => {
    const res = await request(app)
      .delete(`/events/${eventId}`)
      .set('Authorization', `Bearer ${organizer2Token}`);
    
    expect(res.status).toBe(403);
  });

  // 4. Valid delete operation and Cascade Delete control → 204
  it('owner and event become deleted (204) and bookings that belong to event deleted from DB', async () => {
    // Delete API request to delete the event
    const res = await request(app)
      .delete(`/events/${eventId}`)
      .set('Authorization', `Bearer ${organizer1Token}`);

    expect(res.status).toBe(204);

    // Check if the event is really deleted from DB
    const deletedEvent = await prisma.event.findUnique({ where: { id: eventId } });
    expect(deletedEvent).toBeNull();

    // Check if the booking is really deleted from DB (Cascade Delete works)
    const deletedBooking = await prisma.booking.findUnique({ where: { id: bookingId } });
    expect(deletedBooking).toBeNull();
  });

});