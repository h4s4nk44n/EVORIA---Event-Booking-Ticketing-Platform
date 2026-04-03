// This test created for "EVR-7 / POST/auth/register" test

import request from 'supertest';
import app from '../app';
import { prisma } from '../config/prisma';

// Her testten sonra oluşturulan test kullanıcılarını temizle
afterEach(async () => {
  await prisma.user.deleteMany({
    where: { email: { contains: '@test-register.com' } },
  });
});

// Tüm testler bitince Prisma bağlantısını kapat
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

  // 1. Geçerli body → 201 ve user objesi dönmeli
  it('geçerli body ile 201 ve user objesi döner', async () => {
    const res = await request(app).post('/auth/register').send(validBody);

    expect(res.status).toBe(201);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe(validBody.email);
    expect(res.body.user.name).toBe(validBody.name);
    expect(res.body.user.role).toBe('ATTENDEE');
  });

  // 2. Response'da password field'ı asla olmamalı
  it('response\'da password field\'ı bulunmaz', async () => {
    const res = await request(app).post('/auth/register').send(validBody);

    expect(res.status).toBe(201);
    expect(res.body.user.password).toBeUndefined();
  });

  // 3. Response'da beklenen field'lar var mı
  it('user objesi id, name, email, role, createdAt içerir', async () => {
    const res = await request(app).post('/auth/register').send(validBody);

    expect(res.status).toBe(201);
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user).toHaveProperty('name');
    expect(res.body.user).toHaveProperty('email');
    expect(res.body.user).toHaveProperty('role');
    expect(res.body.user).toHaveProperty('createdAt');
  });

  // 4. Duplicate email → 409
  it('aynı email ile ikinci kayıt 409 döner', async () => {
    // İlk kayıt
    await request(app).post('/auth/register').send(validBody);

    // Aynı email ile ikinci kayıt
    const res = await request(app).post('/auth/register').send(validBody);

    expect(res.status).toBe(409);
  });

  // 5. role: 'ADMIN' → 400
  it("role: 'ADMIN' gönderilince 400 döner", async () => {
    const res = await request(app).post('/auth/register').send({
      ...validBody,
      email: 'admin@test-register.com',
      role: 'ADMIN',
    });

    expect(res.status).toBe(400);
  });

  // 6. Şifre 8 karakterden kısa → 400 ve field hatası
  it('password 8 karakterden kısaysa 400 ve field hatası döner', async () => {
    const res = await request(app).post('/auth/register').send({
      ...validBody,
      email: 'short@test-register.com',
      password: '1234567', // 7 karakter
    });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
    const passError = res.body.errors.find((e: any) => e.field === 'password');
    expect(passError).toBeDefined();
  });

  // 7. Eksik body → 400
  it('body boş gönderilince 400 döner', async () => {
    const res = await request(app).post('/auth/register').send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
    expect(res.body.errors).toBeInstanceOf(Array);
  });

  // 8. Geçersiz email formatı → 400
  it('geçersiz email formatı 400 döner', async () => {
    const res = await request(app).post('/auth/register').send({
      ...validBody,
      email: 'bu-email-degil',
    });

    expect(res.status).toBe(400);
    const emailError = res.body.errors.find((e: any) => e.field === 'email');
    expect(emailError).toBeDefined();
  });

});