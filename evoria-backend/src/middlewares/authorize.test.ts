// This test created for "EVR-10 / authorize RBAC middleware" test

import express, { Request, Response } from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { authenticate } from '../middlewares/auth';
import { authorize } from '../middlewares/authorize';
import { errorHandler } from '../middlewares/errorHandler';
import { config } from '../config/env';

// --- Test app setup ---
const app = express();
app.use(express.json());

// Only ORGANIZER can access
app.get('/organizer-only', authenticate, authorize('ORGANIZER'), (_req: Request, res: Response) => {
  res.json({ ok: true });
});

// only ATTENDEE can access
app.get('/attendee-only', authenticate, authorize('ATTENDEE'), (_req: Request, res: Response) => {
  res.json({ ok: true });
});

// ORGANIZER or ADMIN can access
app.get('/organizer-or-admin', authenticate, authorize('ORGANIZER', 'ADMIN'), (_req: Request, res: Response) => {
  res.json({ ok: true });
});

// only authorize (without authenticate)
app.get('/no-auth', authorize('ORGANIZER'), (_req: Request, res: Response) => {
  res.json({ ok: true });
});

app.use(errorHandler);

// Helper function to create token
function makeToken(role: 'ATTENDEE' | 'ORGANIZER' | 'ADMIN') {
  return jwt.sign(
    { userId: 'test-id', email: 'test@example.com', role },
    config.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

describe('authorize middleware', () => {

  // 1. ORGANIZER → ORGANIZER-only route → 200
  it('with ORGANIZER token, ORGANIZER-only route passes', async () => {
    const res = await request(app)
      .get('/organizer-only')
      .set('Authorization', `Bearer ${makeToken('ORGANIZER')}`);

    expect(res.status).toBe(200);
  });

  // 2. ATTENDEE → ORGANIZER-only route → 403
  it('with ATTENDEE token, ORGANIZER-only route returns 403', async () => {
    const res = await request(app)
      .get('/organizer-only')
      .set('Authorization', `Bearer ${makeToken('ATTENDEE')}`);

    expect(res.status).toBe(403);
  });

  // 3. ORGANIZER → ATTENDEE-only route → 403
  it('with ORGANIZER token, ATTENDEE-only route returns 403', async () => {
    const res = await request(app)
      .get('/attendee-only')
      .set('Authorization', `Bearer ${makeToken('ORGANIZER')}`);

    expect(res.status).toBe(403);
  });

  // 4. ATTENDEE → ATTENDEE-only route → 200
  it('with ATTENDEE token, ATTENDEE-only route passes', async () => {
    const res = await request(app)
      .get('/attendee-only')
      .set('Authorization', `Bearer ${makeToken('ATTENDEE')}`);

    expect(res.status).toBe(200);
  });

  // 5. ADMIN → ORGANIZER or ADMIN route → 200
  it('with ADMIN token, ORGANIZER-or-ADMIN route passes', async () => {
    const res = await request(app)
      .get('/organizer-or-admin')
      .set('Authorization', `Bearer ${makeToken('ADMIN')}`);

    expect(res.status).toBe(200);
  });

  // 6. ATTENDEE → ORGANIZER or ADMIN route → 403
  it('with ATTENDEE token, ORGANIZER-or-ADMIN route returns 403', async () => {
    const res = await request(app)
      .get('/organizer-or-admin')
      .set('Authorization', `Bearer ${makeToken('ATTENDEE')}`);

    expect(res.status).toBe(403);
  });

  // 7. only authorize (req.user undefined) → 401
  it('with no authentication, authorize returns 401', async () => {
    const res = await request(app).get('/no-auth');

    expect(res.status).toBe(401);
  });

});