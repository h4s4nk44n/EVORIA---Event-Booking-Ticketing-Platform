import { Router } from 'express';
import { authLimiter } from '../middlewares/rateLimiter';
import { validateRequest } from '../middlewares/validateRequest';
import { register, login } from '../controllers/auth.controller';
import { z } from 'zod';

const router = Router();

const registerSchema = z.object({
  name:     z.string().min(2, 'Name must be at least 2 characters'),
  email:    z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role:     z.enum(['ATTENDEE', 'ORGANIZER']),
});

const loginSchema = z.object({
  email:    z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

router.post('/register', authLimiter, validateRequest(registerSchema), register);
router.post('/login',    authLimiter, validateRequest(loginSchema),    login);

export default router;