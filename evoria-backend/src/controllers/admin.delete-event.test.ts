import request from 'supertest';
import app from '../app';
import { prisma } from '../config/prisma';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';

function makeToken(role: 'ATTENDEE' | 'ORGANIZER' | 'ADMIN', userId: string) {
  return jwt.sign(
    { userId, email: `${role.toLowerCase()}@test-admin-del.com`, role },
    config.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

let adminId: string;
let adminToken: string;
let organizerId: string;
let organizerToken: string;
let eventId: string;

beforeAll(async () => {
  const adminRes = await request(app).post('/auth/register').send({
    name: 'Admin Delete Test',
    email: 'admin@test-admin-del.com',
    password: '12345678',
    role: 'ATTENDEE', // register as ATTENDEE, then promote
  });
  adminId = adminRes.body.user.id;

  // Promote to ADMIN directly in DB
  await prisma.user.update({
    where: { id: adminId },
    data: { role: 'ADMIN' },
  });
  adminToken = makeToken('ADMIN', adminId);

  // Create organizer
  const orgRes = await request(app).post('/auth/register').send({
    name: 'Organizer Delete Test',
    email: 'organizer@test-admin-del.com',
    password: '12345678',
    role: 'ORGANIZER',
  });
  organizerId = orgRes.body.user.id;
  organizerToken = makeToken('ORGANIZER', organizerId);

  // Create event to delete
  const ev = await prisma.event.create({
    data: {
      title: 'Admin Delete Test Event',
      description: 'Event for admin delete test',
      dateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      capacity: 10,
      organizerId,
    },
  });
  eventId = ev.id;
});

afterAll(async () => {
  await prisma.event.deleteMany({
    where: { organizerId },
  });
  await prisma.user.deleteMany({
    where: { email: { contains: '@test-admin-del.com' } },
  });
  await prisma.$disconnect();
});

describe('DELETE /admin/events/:id', () => {
  it('should return 204 No Content with empty body', async () => {
    // Create a separate event just for this test
    const ev = await prisma.event.create({
      data: {
        title: 'To Be Deleted',
        description: 'Will be deleted',
        dateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        capacity: 5,
        organizerId,
      },
    });

    const res = await request(app)
      .delete(`/admin/events/${ev.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(204);
    expect(res.body).toEqual({});
  });

  it('should return 404 for non-existent event', async () => {
    const res = await request(app)
      .delete('/admin/events/nonexistent-id')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });

  it('should return 401 without token', async () => {
    const res = await request(app).delete(`/admin/events/${eventId}`);

    expect(res.status).toBe(401);
  });

  it('should return 403 with ORGANIZER token', async () => {
    const res = await request(app)
      .delete(`/admin/events/${eventId}`)
      .set('Authorization', `Bearer ${organizerToken}`);

    expect(res.status).toBe(403);
  });
});
