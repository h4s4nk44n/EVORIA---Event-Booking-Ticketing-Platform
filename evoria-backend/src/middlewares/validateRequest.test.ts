import express, { Request, Response } from 'express';
import request from 'supertest';
import { z } from 'zod';
import { validateRequest } from '../middlewares/validateRequest';

// --- Test app kurulumu ---
const app = express();
app.use(express.json());

const testSchema = z.object({
  name:     z.string().min(2, 'Name must be at least 2 characters'),
  email:    z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role:     z.enum(['ATTENDEE', 'ORGANIZER']),
});

app.post('/test', validateRequest(testSchema), (req: Request, res: Response) => {
  res.status(200).json({ success: true, body: req.body });
});

// --- Testler ---
describe('validateRequest middleware', () => {

  // 1. Tüm alanlar eksikse 400 dönmeli
  it('tüm alanlar eksikse 400 ve hata listesi döner', async () => {
    const res = await request(app).post('/test').send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
    expect(res.body.errors).toBeInstanceOf(Array);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  // 2. Hata formatı { field, message } şeklinde olmalı
  it('hata nesneleri field ve message içerir', async () => {
    const res = await request(app).post('/test').send({});

    res.body.errors.forEach((err: any) => {
      expect(err).toHaveProperty('field');
      expect(err).toHaveProperty('message');
    });
  });

  // 3. Sadece bazı alanlar eksikse yine 400 dönmeli
  it('bazı alanlar eksikse 400 döner', async () => {
    const res = await request(app).post('/test').send({
      name: 'Ali',
      email: 'ali@test.com',
      // password ve role eksik
    });

    expect(res.status).toBe(400);
    const fields = res.body.errors.map((e: any) => e.field);
    expect(fields).toContain('password');
    expect(fields).toContain('role');
  });

  // 4. Geçersiz email formatı hata vermeli
  it('geçersiz email formatı 400 döner', async () => {
    const res = await request(app).post('/test').send({
      name: 'Ali',
      email: 'bu-email-degil',
      password: '12345678',
      role: 'ATTENDEE',
    });

    expect(res.status).toBe(400);
    const emailError = res.body.errors.find((e: any) => e.field === 'email');
    expect(emailError).toBeDefined();
    expect(emailError.message).toBe('Invalid email format');
  });

  // 5. Geçersiz role değeri hata vermeli
  it('geçersiz role değeri 400 döner', async () => {
    const res = await request(app).post('/test').send({
      name: 'Ali',
      email: 'ali@test.com',
      password: '12345678',
      role: 'ADMIN', // enum dışı
    });

    expect(res.status).toBe(400);
    const roleError = res.body.errors.find((e: any) => e.field === 'role');
    expect(roleError).toBeDefined();
  });

  // 6. Geçerli body 200 dönmeli ve controller'a geçmeli
  it('geçerli body ile 200 döner ve body temiz gelir', async () => {
    const res = await request(app).post('/test').send({
      name: 'Ali',
      email: 'ali@test.com',
      password: '12345678',
      role: 'ATTENDEE',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.body.email).toBe('ali@test.com');
  });

  // 7. Kısa isim (min 2 karakter kuralı)
  it('çok kısa isim 400 döner', async () => {
    const res = await request(app).post('/test').send({
      name: 'A', // min 2
      email: 'ali@test.com',
      password: '12345678',
      role: 'ATTENDEE',
    });

    expect(res.status).toBe(400);
    const nameError = res.body.errors.find((e: any) => e.field === 'name');
    expect(nameError.message).toBe('Name must be at least 2 characters');
  });

});