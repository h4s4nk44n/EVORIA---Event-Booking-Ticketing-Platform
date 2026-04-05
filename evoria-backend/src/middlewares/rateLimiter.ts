import rateLimit from 'express-rate-limit';
import { config } from '../config/env';

const isTest = process.env.NODE_ENV === 'test';

// Auth: 10 requests per 15 minutes per IP (brute-force protection)
export const authLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_AUTH_MAX,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTest,
});

// Booking: 30 requests per minute per IP
export const bookingLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Too many booking requests, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTest,
});
