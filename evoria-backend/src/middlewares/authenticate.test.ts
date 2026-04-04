// This test created for "EVR-9 / authenticate middleware" test

import express, { Request, Response } from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { authenticate } from '../middlewares/auth';
import { errorHandler } from '../middlewares/errorHandler';
import { config } from '../config/env';

// --- Test app setup ---
const app = express();
app.use(express.json());

// Protected test route
app.get('/protected', authenticate, (req: Request, res: Response) => {
  res.json({ user: req.user });
});

app.use(errorHandler);

// Helper function to create a valid token
function makeToken(payload: object, expiresIn: string | number = '7d') {
  return jwt.sign(payload, config.JWT_SECRET, { expiresIn } as any);
}

const validPayload = {
  userId: 'test-user-id',
  email:  'test@example.com',
  role:   'ATTENDEE' as const,
};

describe('authenticate middleware', () => {

  // 1. valid token → req.user populate edilmeli
  it('with valid token req.user is populated and next() is called', async () => {
    const token = makeToken(validPayload);

    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.userId).toBe(validPayload.userId);
    expect(res.body.user.email).toBe(validPayload.email);
    expect(res.body.user.role).toBe(validPayload.role);
  });

  // 2. Authorization header is missing → 401
  it('with no Authorization header it returns 401', async () => {
    const res = await request(app).get('/protected');

    expect(res.status).toBe(401);
  });

  // 3. Without Bearer prefix → 401
  it("without 'Bearer ' prefix it returns 401", async () => {
    const token = makeToken(validPayload);

    const res = await request(app)
      .get('/protected')
      .set('Authorization', token); // Without Bearer prefix

    expect(res.status).toBe(401);
  });

  // 4. Expired token → 401
  it('with expired token it returns 401', async () => {
    const token = makeToken(validPayload, -1); // expired token

    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(401);
  });

  // 5. Token that is signed with a different secret → 401
  it('with token signed with different secret it returns 401', async () => {
    const token = jwt.sign(validPayload, 'wrong_secret', { expiresIn: '7d' });

    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(401);
  });

  // 6. Completely malformed token → 401
  it('with completely malformed token it returns 401', async () => {
    const res = await request(app)
      .get('/protected')
      .set('Authorization', 'Bearer malformed.token.value');

    expect(res.status).toBe(401);
  });

});