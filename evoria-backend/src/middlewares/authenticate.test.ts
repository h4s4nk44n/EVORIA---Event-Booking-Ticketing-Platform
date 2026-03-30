// This test created for "EVR-9 / authenticate middleware" test

import express, { Request, Response } from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { authenticate } from '../middlewares/auth';
import { errorHandler } from '../middlewares/errorHandler';
import { config } from '../config/env';

// --- Test app kurulumu ---
const app = express();
app.use(express.json());

// Korumalı test route'u
app.get('/protected', authenticate, (req: Request, res: Response) => {
  res.json({ user: req.user });
});

app.use(errorHandler);

// Geçerli bir token üretmek için yardımcı fonksiyon
function makeToken(payload: object, expiresIn: string | number = '7d') {
  return jwt.sign(payload, config.JWT_SECRET, { expiresIn } as any);
}

const validPayload = {
  userId: 'test-user-id',
  email:  'test@example.com',
  role:   'ATTENDEE' as const,
};

describe('authenticate middleware', () => {

  // 1. Geçerli token → req.user populate edilmeli
  it('geçerli token ile req.user populate edilir ve next() çağrılır', async () => {
    const token = makeToken(validPayload);

    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.userId).toBe(validPayload.userId);
    expect(res.body.user.email).toBe(validPayload.email);
    expect(res.body.user.role).toBe(validPayload.role);
  });

  // 2. Authorization header eksik → 401
  it('Authorization header olmadan 401 döner', async () => {
    const res = await request(app).get('/protected');

    expect(res.status).toBe(401);
  });

  // 3. Bearer prefix'i olmadan → 401
  it("'Bearer ' prefix'i olmayan token 401 döner", async () => {
    const token = makeToken(validPayload);

    const res = await request(app)
      .get('/protected')
      .set('Authorization', token); // Bearer olmadan

    expect(res.status).toBe(401);
  });

  // 4. Süresi dolmuş token → 401
  it('süresi dolmuş token 401 döner', async () => {
    const token = makeToken(validPayload, -1); // geçmişte expire olmuş

    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(401);
  });

  // 5. Farklı secret ile imzalanmış token → 401
  it('yanlış secret ile imzalanmış token 401 döner', async () => {
    const token = jwt.sign(validPayload, 'yanlis_secret', { expiresIn: '7d' });

    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(401);
  });

  // 6. Tamamen bozuk token → 401
  it('tamamen bozuk token 401 döner', async () => {
    const res = await request(app)
      .get('/protected')
      .set('Authorization', 'Bearer bozuk.token.degeri');

    expect(res.status).toBe(401);
  });

});