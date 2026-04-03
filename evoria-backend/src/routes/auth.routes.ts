import { Router } from 'express';
import { authLimiter } from '../middlewares/rateLimiter';
import { validateRequest } from '../middlewares/validateRequest';
import { register, login } from '../controllers/auth.controller';
import { z } from 'zod';

const router = Router();

const registerSchema = z.object({
  name:     z.string().min(2, 'Name must be at least 2 characters'),
  email:    z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one digit')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  role:     z.enum(['ATTENDEE', 'ORGANIZER']),
});

const loginSchema = z.object({
  email:    z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

router.post('/register', authLimiter, validateRequest(registerSchema), register);
router.post('/login',    authLimiter, validateRequest(loginSchema),    login);

export default router;