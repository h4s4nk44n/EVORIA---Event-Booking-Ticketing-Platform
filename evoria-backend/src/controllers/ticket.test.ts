import request from 'supertest';
import app from '../app';
import { prisma } from '../config/prisma';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';

function makeToken(role: 'ATTENDEE' | 'ORGANIZER' | 'ADMIN', userId: string) {
  return jwt.sign(
    { userId, email: `${role.toLowerCase()}@test-ticket.com`, role },
    config.JWT_SECRET,
    { expiresIn: '7d' },
  );
}

function futureDate(days = 30) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

let organizerId: string;
let organizerToken: string;
let attendeeToken: string;
let otherOrgToken: string;
let eventId: string;
let ticketId: string;

beforeAll(async () => {
  // Create organizer
  const orgRes = await request(app).post('/auth/register').send({
    name: 'Ticket Test Organizer',
    email: 'organizer@test-ticket.com',
    password: 'Organizer1234!',
    role: 'ORGANIZER',
  });
  organizerId = orgRes.body.user.id;
  organizerToken = makeToken('ORGANIZER', organizerId);

  // Create another organizer (for ownership tests)
  const otherOrgRes = await request(app).post('/auth/register').send({
    name: 'Other Ticket Organizer',
    email: 'other-org@test-ticket.com',
    password: 'OtherOrg1234!',
    role: 'ORGANIZER',
  });
  otherOrgToken = makeToken('ORGANIZER', otherOrgRes.body.user.id);

  // Create attendee
  const attRes = await request(app).post('/auth/register').send({
    name: 'Ticket Test Attendee',
    email: 'attendee@test-ticket.com',
    password: 'Attendee1234!',
    role: 'ATTENDEE',
  });
  attendeeToken = makeToken('ATTENDEE', attRes.body.user.id);

  // Create event
  const ev = await prisma.event.create({
    data: {
      title: 'Ticket Test Event',
      description: 'Test event for ticket tests',
      dateTime: new Date(futureDate(30)),
      capacity: 100,
      organizerId,
    },
  });
  eventId = ev.id;
});

afterAll(async () => {
  await prisma.booking.deleteMany({ where: { eventId } });
  await prisma.ticket.deleteMany({ where: { eventId } });
  await prisma.event.deleteMany({ where: { id: eventId } });
  await prisma.user.deleteMany({
    where: { email: { contains: '@test-ticket.com' } },
  });
  await prisma.$disconnect();
});

describe('Ticket CRUD', () => {
  describe('POST /tickets', () => {
    it('organizer can create a ticket type (201)', async () => {
      const res = await request(app)
        .post('/tickets')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          type: 'GENERAL',
          price: 50,
          quantity: 80,
          eventId,
        });

      expect(res.status).toBe(201);
      expect(res.body.ticket).toBeDefined();
      expect(res.body.ticket.type).toBe('GENERAL');
      expect(res.body.ticket.price).toBe(50);
      ticketId = res.body.ticket.id;
    });

    it('organizer can create VIP ticket (201)', async () => {
      const res = await request(app)
        .post('/tickets')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          type: 'VIP',
          price: 150,
          quantity: 20,
          eventId,
        });

      expect(res.status).toBe(201);
      expect(res.body.ticket.type).toBe('VIP');
    });

    it('attendee cannot create a ticket (403)', async () => {
      const res = await request(app)
        .post('/tickets')
        .set('Authorization', `Bearer ${attendeeToken}`)
        .send({
          type: 'GENERAL',
          price: 10,
          quantity: 50,
          eventId,
        });

      expect(res.status).toBe(403);
    });

    it('other organizer cannot create ticket for event they do not own (403)', async () => {
      const res = await request(app)
        .post('/tickets')
        .set('Authorization', `Bearer ${otherOrgToken}`)
        .send({
          type: 'EARLY_BIRD',
          price: 30,
          quantity: 10,
          eventId,
        });

      expect(res.status).toBe(403);
    });

    it('invalid body returns 400', async () => {
      const res = await request(app)
        .post('/tickets')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({ type: 'INVALID_TYPE', price: -5, quantity: 0 });

      expect(res.status).toBe(400);
    });

    it('non-existent event returns 404', async () => {
      const res = await request(app)
        .post('/tickets')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          type: 'GENERAL',
          price: 10,
          quantity: 10,
          eventId: 'nonexistent-event-id',
        });

      expect(res.status).toBe(404);
    });
  });

  describe('GET /tickets/event/:eventId', () => {
    it('lists ticket types for an event (public, 200)', async () => {
      const res = await request(app).get(`/tickets/event/${eventId}`);

      expect(res.status).toBe(200);
      expect(res.body.tickets).toBeDefined();
      expect(Array.isArray(res.body.tickets)).toBe(true);
      expect(res.body.tickets.length).toBeGreaterThanOrEqual(2);
    });

    it('non-existent event returns 404', async () => {
      const res = await request(app).get('/tickets/event/nonexistent-event-id');

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /tickets/:id', () => {
    it('organizer can update their ticket (200)', async () => {
      const res = await request(app)
        .put(`/tickets/${ticketId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({ price: 60 });

      expect(res.status).toBe(200);
      expect(res.body.ticket.price).toBe(60);
    });

    it('other organizer cannot update ticket (403)', async () => {
      const res = await request(app)
        .put(`/tickets/${ticketId}`)
        .set('Authorization', `Bearer ${otherOrgToken}`)
        .send({ price: 999 });

      expect(res.status).toBe(403);
    });

    it('non-existent ticket returns 404', async () => {
      const res = await request(app)
        .put('/tickets/nonexistent-ticket-id')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({ price: 10 });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /tickets/:id', () => {
    it('other organizer cannot delete ticket (403)', async () => {
      const res = await request(app)
        .delete(`/tickets/${ticketId}`)
        .set('Authorization', `Bearer ${otherOrgToken}`);

      expect(res.status).toBe(403);
    });

    it('organizer can delete their ticket (204)', async () => {
      const res = await request(app)
        .delete(`/tickets/${ticketId}`)
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(res.status).toBe(204);
    });

    it('deleting non-existent ticket returns 404', async () => {
      const res = await request(app)
        .delete(`/tickets/${ticketId}`)
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(res.status).toBe(404);
    });
  });
});
