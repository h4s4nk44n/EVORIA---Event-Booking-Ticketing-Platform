import request from 'supertest';
import app from '../app';
import { prisma } from '../config/prisma';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';

function makeToken(role: 'ATTENDEE' | 'ORGANIZER' | 'ADMIN', userId: string) {
  return jwt.sign(
    { userId, email: `${role.toLowerCase()}@test-category.com`, role },
    config.JWT_SECRET,
    { expiresIn: '7d' },
  );
}

let adminId: string;
let adminToken: string;
let attendeeToken: string;
let categoryId: string;

beforeAll(async () => {
  const adminRes = await request(app).post('/auth/register').send({
    name: 'Category Test Admin',
    email: 'admin@test-category.com',
    password: 'Admin1234!',
    role: 'ATTENDEE', // register as attendee, then manually promote
  });
  adminId = adminRes.body.user.id;
  await prisma.user.update({ where: { id: adminId }, data: { role: 'ADMIN' } });
  adminToken = makeToken('ADMIN', adminId);

  const attRes = await request(app).post('/auth/register').send({
    name: 'Category Test Attendee',
    email: 'attendee@test-category.com',
    password: 'Attendee1234!',
    role: 'ATTENDEE',
  });
  attendeeToken = makeToken('ATTENDEE', attRes.body.user.id);
});

afterAll(async () => {
  await prisma.category.deleteMany({
    where: { name: { contains: 'Test Category' } },
  });
  await prisma.user.deleteMany({
    where: { email: { contains: '@test-category.com' } },
  });
  await prisma.$disconnect();
});

describe('Category CRUD', () => {
  describe('POST /categories', () => {
    it('admin can create a category (201)', async () => {
      const res = await request(app)
        .post('/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Test Category Tech', description: 'Tech events' });

      expect(res.status).toBe(201);
      expect(res.body.category).toBeDefined();
      expect(res.body.category.name).toBe('Test Category Tech');
      categoryId = res.body.category.id;
    });

    it('attendee cannot create a category (403)', async () => {
      const res = await request(app)
        .post('/categories')
        .set('Authorization', `Bearer ${attendeeToken}`)
        .send({ name: 'Test Category Blocked' });

      expect(res.status).toBe(403);
    });

    it('unauthenticated request returns 401', async () => {
      const res = await request(app)
        .post('/categories')
        .send({ name: 'Test Category NoAuth' });

      expect(res.status).toBe(401);
    });

    it('duplicate name returns 409', async () => {
      const res = await request(app)
        .post('/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Test Category Tech' });

      expect(res.status).toBe(409);
    });

    it('invalid body returns 400', async () => {
      const res = await request(app)
        .post('/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'x' }); // too short

      expect(res.status).toBe(400);
    });
  });

  describe('GET /categories', () => {
    it('lists all categories (public, 200)', async () => {
      const res = await request(app).get('/categories');

      expect(res.status).toBe(200);
      expect(res.body.categories).toBeDefined();
      expect(Array.isArray(res.body.categories)).toBe(true);
    });
  });

  describe('GET /categories/:id', () => {
    it('returns a single category (200)', async () => {
      const res = await request(app).get(`/categories/${categoryId}`);

      expect(res.status).toBe(200);
      expect(res.body.category.id).toBe(categoryId);
    });

    it('returns 404 for non-existent category', async () => {
      const res = await request(app).get('/categories/nonexistent-id');

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /categories/:id', () => {
    it('admin can update a category (200)', async () => {
      const res = await request(app)
        .put(`/categories/${categoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ description: 'Updated description' });

      expect(res.status).toBe(200);
      expect(res.body.category.description).toBe('Updated description');
    });

    it('attendee cannot update a category (403)', async () => {
      const res = await request(app)
        .put(`/categories/${categoryId}`)
        .set('Authorization', `Bearer ${attendeeToken}`)
        .send({ description: 'Hacked' });

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /categories/:id', () => {
    it('attendee cannot delete a category (403)', async () => {
      const res = await request(app)
        .delete(`/categories/${categoryId}`)
        .set('Authorization', `Bearer ${attendeeToken}`);

      expect(res.status).toBe(403);
    });

    it('admin can delete a category (204)', async () => {
      const res = await request(app)
        .delete(`/categories/${categoryId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(204);
    });

    it('deleting non-existent category returns 404', async () => {
      const res = await request(app)
        .delete(`/categories/${categoryId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });
});
