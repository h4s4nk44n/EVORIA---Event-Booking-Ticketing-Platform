import { Router } from 'express';
import { healthCheck } from '../controllers/health.controller';
import authRouter from './auth.routes';
import eventRouter from './event.routes';

const router = Router();

router.get('/health', healthCheck);
router.use('/auth', authRouter);
router.use('/events', eventRouter);

export default router;
