// This test created for "EVR-7 / POST/auth/register" test

import request from 'supertest';
import app from '../app';
import { prisma } from '../config/prisma';

// Cleanup test users after each test
afterEach(async () => {
  await prisma.user.deleteMany({
    where: { email: { contains: '@test-register.com' } },
  });
});

// When all tests are done, disconnect Prisma
afterAll(async () => {
  await prisma.$disconnect();
});

const validBody = {
  name:     'Test User',
  email:    'user@test-register.com',
  password: 'Test1234!',
  role:     'ATTENDEE',
};

describe('POST /auth/register', () => {

  // 1. It should return 201 and user object with valid body
  it('should return 201 and user object with valid body', async () => {
    const res = await request(app).post('/auth/register').send(validBody);

    expect(res.status).toBe(201);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe(validBody.email);
    expect(res.body.user.name).toBe(validBody.name);
    expect(res.body.user.role).toBe('ATTENDEE');
  });

  // 2. There shouldn't be a password field in the response user object
  it("There shouldn't be a password field in the response user object", async () => {
    const res = await request(app).post('/auth/register').send(validBody);

    expect(res.status).toBe(201);
    expect(res.body.user.password).toBeUndefined();
  });

  // 3. Is the response user object contain expected fields?
  it('user object should contain id, name, email, role, createdAt fields', async () => {
    const res = await request(app).post('/auth/register').send(validBody);

    expect(res.status).toBe(201);
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user).toHaveProperty('name');
    expect(res.body.user).toHaveProperty('email');
    expect(res.body.user).toHaveProperty('role');
    expect(res.body.user).toHaveProperty('createdAt');
  });

  // 4. Duplicate email → 409
  it('should return 409 for duplicate email', async () => {
    // First registiration
    await request(app).post('/auth/register').send(validBody);

    // Same email with second registration
    const res = await request(app).post('/auth/register').send(validBody);

    expect(res.status).toBe(409);
  });

  // 5. role: 'ADMIN' → 400
  it("should return 400 for role: 'ADMIN'", async () => {
    const res = await request(app).post('/auth/register').send({
      ...validBody,
      email: 'admin@test-register.com',
      role: 'ADMIN',
    });

    expect(res.status).toBe(400);
  });

  // 6. Should return 400 and field error for password shorter than 8 characters
  it('should return 400 and field error for password shorter than 8 characters', async () => {
    const res = await request(app).post('/auth/register').send({
      ...validBody,
      email: 'short@test-register.com',
      password: '1234567', // 7 characters
    });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
    const passError = res.body.errors.find((e: any) => e.field === 'password');
    expect(passError).toBeDefined();
  });

  // 7. Missing body → 400
  it('should return 400 for missing body', async () => {
    const res = await request(app).post('/auth/register').send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
    expect(res.body.errors).toBeInstanceOf(Array);
  });

  // 8. Invalid email format → 400
  it('should return 400 for invalid email format', async () => {
    const res = await request(app).post('/auth/register').send({
      ...validBody,
      email: 'this-is-not-an-email',
    });

    expect(res.status).toBe(400);
    const emailError = res.body.errors.find((e: any) => e.field === 'email');
    expect(emailError).toBeDefined();
  });

});