import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validation'; // validation middleware imported
import { createEvent, updateEvent, listEvents, getEvent, deleteEvent, getStats, getAttendees} from '../controllers/event.controller';
import { createEventSchema, updateEventSchema } from '../middlewares/event.validators'; // Importing new validators

const router = Router();

// Public routes — no auth required
router.get('/',    listEvents);
router.get('/:id', getEvent);
router.get('/:id/stats', authenticate, authorize('ORGANIZER'), getStats);
router.get('/:id/attendees', authenticate, authorize('ORGANIZER'), getAttendees);

// Protected routes — require authentication and authorization
router.post('/', authenticate, authorize('ORGANIZER'), validate(createEventSchema), createEvent);
router.put('/:id', authenticate, authorize('ORGANIZER'), validate(updateEventSchema), updateEvent);
router.delete('/:id', authenticate, authorize('ORGANIZER'), deleteEvent);

export default router;