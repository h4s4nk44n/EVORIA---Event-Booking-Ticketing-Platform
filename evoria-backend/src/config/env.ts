import 'dotenv/config';

export const config = {
  PORT: Number(process.env.PORT) || 3000,
  DATABASE_URL: process.env.DATABASE_URL!,
  JWT_SECRET: process.env.JWT_SECRET!,
  NODE_ENV: process.env.NODE_ENV || 'development',
  ALLOWED_ORIGIN: process.env.ALLOWED_ORIGIN || 'http://localhost:3001',
  RATE_LIMIT_WINDOW_MS: Number(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  RATE_LIMIT_AUTH_MAX: Number(process.env.RATE_LIMIT_AUTH_MAX) || 10,
};

if (!config.DATABASE_URL) throw new Error('DATABASE_URL is not set');
if (!config.JWT_SECRET) throw new Error('JWT_SECRET is not set');
