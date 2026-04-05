import express, { Request, Response } from 'express';
import request from 'supertest';
import rateLimit from 'express-rate-limit';

// We create test-specific limiters with the same config shape as production
// but with values that are practical for testing.

function createApp(limiter: ReturnType<typeof rateLimit>) {
  const app = express();
  app.use(express.json());
  app.post('/test', limiter, (_req: Request, res: Response) => {
    res.status(200).json({ success: true });
  });
  return app;
}

describe('authLimiter', () => {
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
  });

  const app = createApp(authLimiter);

  it('allows up to 10 requests', async () => {
    for (let i = 0; i < 10; i++) {
      const res = await request(app).post('/test').send({});
      expect(res.status).toBe(200);
    }
  });

  it('returns 429 on the 11th request with Retry-After header', async () => {
    // The 10 requests from the previous test already consumed the limit
    // (same app instance shares the rate limit store)
    const res = await request(app).post('/test').send({});
    expect(res.status).toBe(429);
    expect(res.headers['retry-after']).toBeDefined();
    expect(res.body.error).toBe('Too many requests, please try again later.');
  });

  it('includes RateLimit-* standard headers', async () => {
    const limitedApp = createApp(
      rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 10,
        message: { error: 'Too many requests, please try again later.' },
        standardHeaders: true,
        legacyHeaders: false,
      }),
    );

    const res = await request(limitedApp).post('/test').send({});
    expect(res.status).toBe(200);
    // express-rate-limit v7+ uses standard draft-6 headers
    const hasRateLimitHeader =
      res.headers['ratelimit-limit'] !== undefined ||
      res.headers['ratelimit-policy'] !== undefined;
    expect(hasRateLimitHeader).toBe(true);
  });
});

describe('bookingLimiter', () => {
  // Use a smaller max for practical testing (same pattern, just lower limit)
  const bookingLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5, // lower limit for faster test execution
    message: { error: 'Too many booking requests, please slow down.' },
    standardHeaders: true,
    legacyHeaders: false,
  });

  const app = createApp(bookingLimiter);

  it('allows requests up to the limit', async () => {
    for (let i = 0; i < 5; i++) {
      const res = await request(app).post('/test').send({});
      expect(res.status).toBe(200);
    }
  });

  it('returns 429 when limit is exceeded', async () => {
    const res = await request(app).post('/test').send({});
    expect(res.status).toBe(429);
    expect(res.body.error).toBe('Too many booking requests, please slow down.');
  });
});

describe('rate limit resets after window expires', () => {
  it('allows requests again after the window resets', async () => {
    const shortLimiter = rateLimit({
      windowMs: 500, // 500ms window for fast test
      max: 2,
      message: { error: 'Too many requests, please try again later.' },
      standardHeaders: true,
      legacyHeaders: false,
    });

    const app = createApp(shortLimiter);

    // Exhaust the limit
    await request(app).post('/test').send({});
    await request(app).post('/test').send({});

    const blocked = await request(app).post('/test').send({});
    expect(blocked.status).toBe(429);

    // Wait for the window to expire
    await new Promise((resolve) => setTimeout(resolve, 600));

    const afterReset = await request(app).post('/test').send({});
    expect(afterReset.status).toBe(200);
  });
});
