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
let _attendeeToken: string;
let eventId: string;

beforeAll(async () => {
  // Create Organizer 1
  const res1 = await request(app).post('/auth/register').send({
    name: 'Attendees Org 1', email: 'attendeesorg1@test-attendees.com',
    password: 'Test1234!', role: 'ORGANIZER',
  });
  organizer1Id    = res1.body.user.id;
  organizer1Token = makeToken('ORGANIZER', organizer1Id);

  // Create Organizer 2
  const res2 = await request(app).post('/auth/register').send({
    name: 'Attendees Org 2', email: 'attendeesorg2@test-attendees.com',
    password: 'Test1234!', role: 'ORGANIZER',
  });
  organizer2Id    = res2.body.user.id;
  organizer2Token = makeToken('ORGANIZER', organizer2Id);

  // Create Attendee
  const res3 = await request(app).post('/auth/register').send({
    name: 'Test Attendee', email: 'attendee@test-attendees.com',
    password: 'Test1234!', role: 'ATTENDEE',
  });
  attendeeId    = res3.body.user.id;
  _attendeeToken = makeToken('ATTENDEE', attendeeId);

  // Create event for Organizer 1
  const eventRes = await request(app)
    .post('/events')
    .set('Authorization', `Bearer ${organizer1Token}`)
    .send({
      title:       'Attendees Test Event',
      description: 'Event for testing attendees endpoint',
      dateTime:    futureDate(5),
      capacity:    50,
    });
  eventId = eventRes.body.event.id;

  // Save attendee directly to event using Prisma (bypass booking endpoint)
  await prisma.booking.create({
    data: { userId: attendeeId, eventId },
  });
});

afterAll(async () => {
  await prisma.booking.deleteMany({ where: { eventId } });
  const userIds = [organizer1Id, organizer2Id, attendeeId];
  await prisma.event.deleteMany({ where: { organizerId: { in: userIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  await prisma.$disconnect();
});

describe('GET /events/:id/attendees', () => {

  // 1. Owner → 200 and paginated liste 
  it('It returns 200, owner and{ data, total, page, limit, totalPages }', async () => {
    const res = await request(app)
      .get(`/events/${eventId}/attendees`)
      .set('Authorization', `Bearer ${organizer1Token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('page');
    expect(res.body).toHaveProperty('limit');
    expect(res.body).toHaveProperty('totalPages');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  // 2. Every record should contain bookingId, bookedAt and user
  it('Every record should contain bookingId, bookedAt and user', async () => {
    const res = await request(app)
      .get(`/events/${eventId}/attendees`)
      .set('Authorization', `Bearer ${organizer1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    res.body.data.forEach((item: any) => {
      expect(item).toHaveProperty('bookingId');
      expect(item).toHaveProperty('bookedAt');
      expect(item).toHaveProperty('user');
      expect(item.user).toHaveProperty('id');
      expect(item.user).toHaveProperty('name');
      expect(item.user).toHaveProperty('email');
    });
  });

  // 3. The user object should not contain password field
  it('The user object should not contain password field', async () => {
    const res = await request(app)
      .get(`/events/${eventId}/attendees`)
      .set('Authorization', `Bearer ${organizer1Token}`);

    expect(res.status).toBe(200);
    res.body.data.forEach((item: any) => {
      expect(item.user.password).toBeUndefined();
    });
  });

  // 4. Different organizer → 403
  it('It returns 403 and different organizer', async () => {
    const res = await request(app)
      .get(`/events/${eventId}/attendees`)
      .set('Authorization', `Bearer ${organizer2Token}`);

    expect(res.status).toBe(403);
  });

  // 5. No token → 401
  it('It returns 401 and no token', async () => {
    const res = await request(app)
      .get(`/events/${eventId}/attendees`);

    expect(res.status).toBe(401);
  });

  // 6. Nonexistent event → 404
  it('It returns 404 and nonexistent event ID', async () => {
    const res = await request(app)
      .get('/events/nonexistent-id/attendees')
      .set('Authorization', `Bearer ${organizer1Token}`);

    expect(res.status).toBe(404);
  });

  // 7. Is pagination working?
  it('It returns 1 record with ?page=1&limit=1', async () => {
    const res = await request(app)
      .get(`/events/${eventId}/attendees?page=1&limit=1`)
      .set('Authorization', `Bearer ${organizer1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeLessThanOrEqual(1);
    expect(res.body.limit).toBe(1);
  });

});