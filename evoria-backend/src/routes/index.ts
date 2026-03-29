import { Router } from 'express';
import { healthCheck } from '../controllers/health.controller';
import authRouter from './auth.routes';

const router = Router();

router.get('/health', healthCheck);
router.use('/auth', authRouter);

export default router;
