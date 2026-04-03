import request from 'supertest';
import app from '../app';
import { prisma } from '../config/prisma';

afterEach(async () => {
  await prisma.user.deleteMany({
    where: { email: { contains: '@test-password.com' } },
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});

const baseBody = {
  name: 'Password Test',
  email: 'user@test-password.com',
  role: 'ATTENDEE',
};

describe('Password validation rules', () => {
  it('rejects password without uppercase letter', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ ...baseBody, password: 'lowercase1!' });

    expect(res.status).toBe(400);
  });

  it('rejects password without lowercase letter', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ ...baseBody, password: 'UPPERCASE1!' });

    expect(res.status).toBe(400);
  });

  it('rejects password without digit', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ ...baseBody, password: 'NoDigits!!' });

    expect(res.status).toBe(400);
  });

  it('rejects password without special character', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ ...baseBody, password: 'NoSpecial1' });

    expect(res.status).toBe(400);
  });

  it('rejects password shorter than 8 characters', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ ...baseBody, password: 'Ab1!' });

    expect(res.status).toBe(400);
  });

  it('accepts a valid strong password', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ ...baseBody, password: 'StrongPass1!' });

    expect(res.status).toBe(201);
    expect(res.body.user).toBeDefined();
  });
});
