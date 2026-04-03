import request from 'supertest';
import app from '../app';
import { prisma } from '../config/prisma';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';

function makeToken(role: 'ATTENDEE' | 'ORGANIZER' | 'ADMIN', userId: string) {
  return jwt.sign(
    { userId, email: `${role.toLowerCase()}@test-venue.com`, role },
    config.JWT_SECRET,
    { expiresIn: '7d' },
  );
}

let adminId: string;
let adminToken: string;
let attendeeToken: string;
let venueId: string;

beforeAll(async () => {
  const adminRes = await request(app).post('/auth/register').send({
    name: 'Venue Test Admin',
    email: 'admin@test-venue.com',
    password: 'Admin1234!',
    role: 'ATTENDEE',
  });
  adminId = adminRes.body.user.id;
  await prisma.user.update({ where: { id: adminId }, data: { role: 'ADMIN' } });
  adminToken = makeToken('ADMIN', adminId);

  const attRes = await request(app).post('/auth/register').send({
    name: 'Venue Test Attendee',
    email: 'attendee@test-venue.com',
    password: 'Attendee1234!',
    role: 'ATTENDEE',
  });
  attendeeToken = makeToken('ATTENDEE', attRes.body.user.id);
});

afterAll(async () => {
  await prisma.venue.deleteMany({
    where: { name: { contains: 'Test Venue' } },
  });
  await prisma.user.deleteMany({
    where: { email: { contains: '@test-venue.com' } },
  });
  await prisma.$disconnect();
});

describe('Venue CRUD', () => {
  describe('POST /venues', () => {
    it('admin can create a venue (201)', async () => {
      const res = await request(app)
        .post('/venues')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Venue Hall',
          address: '123 Test Street',
          city: 'Istanbul',
          capacity: 500,
        });

      expect(res.status).toBe(201);
      expect(res.body.venue).toBeDefined();
      expect(res.body.venue.name).toBe('Test Venue Hall');
      expect(res.body.venue.city).toBe('Istanbul');
      venueId = res.body.venue.id;
    });

    it('attendee cannot create a venue (403)', async () => {
      const res = await request(app)
        .post('/venues')
        .set('Authorization', `Bearer ${attendeeToken}`)
        .send({
          name: 'Test Venue Blocked',
          address: '456 Blocked Ave',
          city: 'Ankara',
          capacity: 100,
        });

      expect(res.status).toBe(403);
    });

    it('invalid body returns 400', async () => {
      const res = await request(app)
        .post('/venues')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'X' }); // missing required fields

      expect(res.status).toBe(400);
    });
  });

  describe('GET /venues', () => {
    it('lists all venues (public, 200)', async () => {
      const res = await request(app).get('/venues');

      expect(res.status).toBe(200);
      expect(res.body.venues).toBeDefined();
      expect(Array.isArray(res.body.venues)).toBe(true);
    });

    it('filters by city', async () => {
      const res = await request(app).get('/venues?city=Istanbul');

      expect(res.status).toBe(200);
      for (const venue of res.body.venues) {
        expect(venue.city.toLowerCase()).toContain('istanbul');
      }
    });
  });

  describe('GET /venues/:id', () => {
    it('returns a single venue (200)', async () => {
      const res = await request(app).get(`/venues/${venueId}`);

      expect(res.status).toBe(200);
      expect(res.body.venue.id).toBe(venueId);
    });

    it('returns 404 for non-existent venue', async () => {
      const res = await request(app).get('/venues/nonexistent-id');

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /venues/:id', () => {
    it('admin can update a venue (200)', async () => {
      const res = await request(app)
        .put(`/venues/${venueId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ capacity: 600 });

      expect(res.status).toBe(200);
      expect(res.body.venue.capacity).toBe(600);
    });

    it('attendee cannot update a venue (403)', async () => {
      const res = await request(app)
        .put(`/venues/${venueId}`)
        .set('Authorization', `Bearer ${attendeeToken}`)
        .send({ capacity: 999 });

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /venues/:id', () => {
    it('attendee cannot delete a venue (403)', async () => {
      const res = await request(app)
        .delete(`/venues/${venueId}`)
        .set('Authorization', `Bearer ${attendeeToken}`);

      expect(res.status).toBe(403);
    });

    it('admin can delete a venue (204)', async () => {
      const res = await request(app)
        .delete(`/venues/${venueId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(204);
    });

    it('deleting non-existent venue returns 404', async () => {
      const res = await request(app)
        .delete(`/venues/${venueId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });
});
