import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { authorize } from '../middlewares/authorize';
import { validateRequest } from '../middlewares/validateRequest';
import {
  book,
  cancelBooking,
  myBookings,
} from '../controllers/booking.controller';
import { z } from 'zod';

const router = Router();
const bookSchema = z.object({ eventId: z.string().min(1) });

router.post('/', authenticate, authorize('ATTENDEE'), validateRequest(bookSchema), book);
router.delete('/:id', authenticate, authorize('ATTENDEE'), cancelBooking);
router.get('/me', authenticate, authorize('ATTENDEE'), myBookings);

export default router;
