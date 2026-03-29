// This test created for "EVR-10 / authorize RBAC middleware" test

import express, { Request, Response } from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { authenticate } from '../middlewares/auth';
import { authorize } from '../middlewares/authorize';
import { errorHandler } from '../middlewares/errorHandler';
import { config } from '../config/env';

// --- Test app kurulumu ---
const app = express();
app.use(express.json());

// Sadece ORGANIZER erişebilir
app.get('/organizer-only', authenticate, authorize('ORGANIZER'), (_req: Request, res: Response) => {
  res.json({ ok: true });
});

// Sadece ATTENDEE erişebilir
app.get('/attendee-only', authenticate, authorize('ATTENDEE'), (_req: Request, res: Response) => {
  res.json({ ok: true });
});

// ORGANIZER veya ADMIN erişebilir
app.get('/organizer-or-admin', authenticate, authorize('ORGANIZER', 'ADMIN'), (_req: Request, res: Response) => {
  res.json({ ok: true });
});

// authorize tek başına (authenticate olmadan)
app.get('/no-auth', authorize('ORGANIZER'), (_req: Request, res: Response) => {
  res.json({ ok: true });
});

app.use(errorHandler);

// Token üretici yardımcı
function makeToken(role: 'ATTENDEE' | 'ORGANIZER' | 'ADMIN') {
  return jwt.sign(
    { userId: 'test-id', email: 'test@example.com', role },
    config.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

describe('authorize middleware', () => {

  // 1. ORGANIZER → ORGANIZER-only route → 200
  it('ORGANIZER token ile ORGANIZER-only route geçer', async () => {
    const res = await request(app)
      .get('/organizer-only')
      .set('Authorization', `Bearer ${makeToken('ORGANIZER')}`);

    expect(res.status).toBe(200);
  });

  // 2. ATTENDEE → ORGANIZER-only route → 403
  it('ATTENDEE token ile ORGANIZER-only route 403 döner', async () => {
    const res = await request(app)
      .get('/organizer-only')
      .set('Authorization', `Bearer ${makeToken('ATTENDEE')}`);

    expect(res.status).toBe(403);
  });

  // 3. ORGANIZER → ATTENDEE-only route → 403
  it('ORGANIZER token ile ATTENDEE-only route 403 döner', async () => {
    const res = await request(app)
      .get('/attendee-only')
      .set('Authorization', `Bearer ${makeToken('ORGANIZER')}`);

    expect(res.status).toBe(403);
  });

  // 4. ATTENDEE → ATTENDEE-only route → 200
  it('ATTENDEE token ile ATTENDEE-only route geçer', async () => {
    const res = await request(app)
      .get('/attendee-only')
      .set('Authorization', `Bearer ${makeToken('ATTENDEE')}`);

    expect(res.status).toBe(200);
  });

  // 5. ADMIN → ORGANIZER veya ADMIN route → 200
  it('ADMIN token ile ORGANIZER-or-ADMIN route geçer', async () => {
    const res = await request(app)
      .get('/organizer-or-admin')
      .set('Authorization', `Bearer ${makeToken('ADMIN')}`);

    expect(res.status).toBe(200);
  });

  // 6. ATTENDEE → ORGANIZER veya ADMIN route → 403
  it('ATTENDEE token ile ORGANIZER-or-ADMIN route 403 döner', async () => {
    const res = await request(app)
      .get('/organizer-or-admin')
      .set('Authorization', `Bearer ${makeToken('ATTENDEE')}`);

    expect(res.status).toBe(403);
  });

  // 7. authorize tek başına (req.user yok) → 401
  it('authenticate olmadan authorize 401 döner', async () => {
    const res = await request(app).get('/no-auth');

    expect(res.status).toBe(401);
  });

});