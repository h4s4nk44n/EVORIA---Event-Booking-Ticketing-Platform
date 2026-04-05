// This test created for "EVR-8 / POST/auth/login" test

import request from 'supertest';
import app from '../app';
import { prisma } from '../config/prisma';
import jwt from 'jsonwebtoken';

const testUser = {
  name:     'Login Test User',
  email:    'user@test-login.com',
  password: 'Test1234!',
  role:     'ATTENDEE' as const,
};

// Before every test, we create a fresh user
beforeEach(async () => {
  await request(app).post('/auth/register').send(testUser);
});

// After each test, we clean up the user
afterEach(async () => {
  await prisma.user.deleteMany({
    where: { email: { contains: '@test-login.com' } },
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('POST /auth/login', () => {

  // 1. Correct credentials should return 200 and { token, user }
  it('Correct credentials should return 200 and token + user', async () => {
    const res = await request(app).post('/auth/login').send({
      email:    testUser.email,
      password: testUser.password,
    });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user).toBeDefined();
  });

  // 2. There shouldn't be a password field in the response user object
  it("There shouldn't be a password field in the response user object", async () => {
    const res = await request(app).post('/auth/login').send({
      email:    testUser.email,
      password: testUser.password,
    });

    expect(res.status).toBe(200);
    expect(res.body.user.password).toBeUndefined();
  });

  // 3. User object should contain id, name, email, role fields
  it('user object should contain id, name, email, role fields', async () => {
    const res = await request(app).post('/auth/login').send({
      email:    testUser.email,
      password: testUser.password,
    });

    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user).toHaveProperty('name');
    expect(res.body.user).toHaveProperty('email');
    expect(res.body.user).toHaveProperty('role');
  });

  // 4. JWT payload should containt correct fields
  it('JWT payload should contain correct fields', async () => {
    const res = await request(app).post('/auth/login').send({
      email:    testUser.email,
      password: testUser.password,
    });

    const decoded = jwt.decode(res.body.token) as any;
    expect(decoded).toHaveProperty('userId');
    expect(decoded).toHaveProperty('email');
    expect(decoded).toHaveProperty('role');
    expect(decoded).toHaveProperty('iat');
    expect(decoded).toHaveProperty('exp');
  });

  // 5. Wrong password → 401 and 'Invalid credentials'
  it("wrong password with 401 and 'Invalid credentials' response", async () => {
    const res = await request(app).post('/auth/login').send({
      email:    testUser.email,
      password: 'wrong_password',
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });

  // 6. Non-existent email → 401 and same message (user enumeration prevention)
  it("non-existent email with 401 and 'Invalid credentials' response", async () => {
    const res = await request(app).post('/auth/login').send({
      email:    'non@test-login.com',
      password: testUser.password,
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });

  // 7. Missing body → 400
  it('missing body with 400 response', async () => {
    const res = await request(app).post('/auth/login').send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });

  // 8. Invalid email format → 400
  it('invalid email format with 400 response', async () => {
    const res = await request(app).post('/auth/login').send({
      email:    'it-is-not-an-email',
      password: testUser.password,
    });

    expect(res.status).toBe(400);
  });

});