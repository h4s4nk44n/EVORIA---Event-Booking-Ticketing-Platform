import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes';
import { config } from './config/env';
import { errorHandler } from './middlewares/errorHandler';
import { prisma } from './config/prisma';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: config.ALLOWED_ORIGIN,
    credentials: true,
  }),
);
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
