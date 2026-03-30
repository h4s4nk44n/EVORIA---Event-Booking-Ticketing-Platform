// This test created for "EVR-8 / POST/auth/login" test

import request from 'supertest';
import app from '../app';
import { prisma } from '../config/prisma';
import jwt from 'jsonwebtoken';

const testUser = {
  name:     'Login Test User',
  email:    'user@test-login.com',
  password: '12345678',
  role:     'ATTENDEE' as const,
};

// Her test öncesinde temiz bir kullanıcı oluştur
beforeEach(async () => {
  await request(app).post('/auth/register').send(testUser);
});

// Her test sonrasında kullanıcıyı temizle
afterEach(async () => {
  await prisma.user.deleteMany({
    where: { email: { contains: '@test-login.com' } },
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('POST /auth/login', () => {

  // 1. Doğru credentials → 200 ve { token, user } dönmeli
  it('doğru credentials ile 200 ve token + user döner', async () => {
    const res = await request(app).post('/auth/login').send({
      email:    testUser.email,
      password: testUser.password,
    });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user).toBeDefined();
  });

  // 2. Response'da password olmamalı
  it("response'da password field'ı bulunmaz", async () => {
    const res = await request(app).post('/auth/login').send({
      email:    testUser.email,
      password: testUser.password,
    });

    expect(res.status).toBe(200);
    expect(res.body.user.password).toBeUndefined();
  });

  // 3. User objesi doğru field'ları içermeli
  it('user objesi id, name, email, role içerir', async () => {
    const res = await request(app).post('/auth/login').send({
      email:    testUser.email,
      password: testUser.password,
    });

    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user).toHaveProperty('name');
    expect(res.body.user).toHaveProperty('email');
    expect(res.body.user).toHaveProperty('role');
  });

  // 4. JWT payload doğru field'ları içermeli
  it('JWT payload userId, email, role, iat, exp içerir', async () => {
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

  // 5. Yanlış şifre → 401 ve 'Invalid credentials'
  it("yanlış şifre ile 401 ve 'Invalid credentials' döner", async () => {
    const res = await request(app).post('/auth/login').send({
      email:    testUser.email,
      password: 'yanlis_sifre',
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });

  // 6. Olmayan email → 401 ve aynı mesaj (user enumeration önlemi)
  it("olmayan email ile 401 ve 'Invalid credentials' döner", async () => {
    const res = await request(app).post('/auth/login').send({
      email:    'yok@test-login.com',
      password: testUser.password,
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });

  // 7. Eksik body → 400
  it('body boş gönderilince 400 döner', async () => {
    const res = await request(app).post('/auth/login').send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });

  // 8. Geçersiz email formatı → 400
  it('geçersiz email formatı 400 döner', async () => {
    const res = await request(app).post('/auth/login').send({
      email:    'bu-email-degil',
      password: testUser.password,
    });

    expect(res.status).toBe(400);
  });

});