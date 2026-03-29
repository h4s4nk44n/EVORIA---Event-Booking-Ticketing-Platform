import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes';
import { config } from './config/env';
import { errorHandler } from './middlewares/errorHandler';
import { prisma } from './config/prisma';

const app = express();

// Written by Hasan Kaan Doygun
app.use(helmet()); // Sets: X-Frame-Options, X-Content-Type-Options, CSP, etc.

app.use(cors({
  origin: config.ALLOWED_ORIGIN,  // e.g. 'http://localhost:3001'
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));

app.options('/{*path}', cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan(config.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use('/', routes);

app.use(errorHandler);

app.get('/health', async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ status: 'ok', db: 'connected' });
});

export default app;
