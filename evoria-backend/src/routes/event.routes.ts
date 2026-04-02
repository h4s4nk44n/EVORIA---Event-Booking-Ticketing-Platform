import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validation'; // Senin middleware'in
import { createEvent, updateEvent, listEvents, getEvent, deleteEvent } from '../controllers/event.controller';

// Yeni validator'ları import ediyoruz!
import { createEventSchema, updateEventSchema } from '../middlewares/event.validators';

const router = Router();

// Public routes — no auth required
router.get('/',    listEvents);
router.get('/:id', getEvent);

// Protected routes (Şemaları middleware'e pasladık)
router.post('/', authenticate, authorize('ORGANIZER'), validate(createEventSchema), createEvent);
router.put('/:id', authenticate, authorize('ORGANIZER'), validate(updateEventSchema), updateEvent);
router.delete('/:id', authenticate, authorize('ORGANIZER'), deleteEvent);

export default router;