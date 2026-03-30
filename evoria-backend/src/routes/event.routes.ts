import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middlewares/auth';
import { authorize } from '../middlewares/authorize';
import { validateRequest } from '../middlewares/validateRequest';
import { createEvent, updateEvent, listEvents, getEvent, deleteEvent } from '../controllers/event.controller';

const router = Router();

const createEventSchema = z.object({
  title:       z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  dateTime:    z.string().datetime().refine(
    d => new Date(d) > new Date(),
    { message: 'Event date must be in the future' }
  ),
  capacity:    z.number().int().min(1, 'Capacity must be at least 1'),
});

const updateEventSchema = z.object({
  title:       z.string().min(3, 'Title must be at least 3 characters').optional(),
  description: z.string().min(10, 'Description must be at least 10 characters').optional(),
  dateTime:    z.string().datetime().refine(
    d => new Date(d) > new Date(),
    { message: 'Event date must be in the future' }
  ).optional(),
  capacity:    z.number().int().min(1, 'Capacity must be at least 1').optional(),
});

// Public routes — no auth required
router.get('/',    listEvents);
router.get('/:id', getEvent);

router.post('/',     authenticate, authorize('ORGANIZER'), validateRequest(createEventSchema), createEvent);
router.put('/:id',  authenticate, authorize('ORGANIZER'), validateRequest(updateEventSchema), updateEvent);
router.delete('/:id', authenticate, authorize('ORGANIZER'), deleteEvent);

export default router;