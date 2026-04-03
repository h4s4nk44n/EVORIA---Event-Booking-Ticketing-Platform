import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { authorize } from '../middlewares/authorize';
import { validateRequest } from '../middlewares/validateRequest';
import { z } from 'zod';
import * as ctrl from '../controllers/ticket.controller';

const router = Router();

const ticketSchema = z.object({
  type: z.enum(['GENERAL', 'VIP', 'EARLY_BIRD']),
  price: z.number({ message: 'Price must be a number' }).min(0),
  quantity: z.number({ message: 'Quantity must be a number' }).int().min(1),
  eventId: z.string().min(1, 'Event ID is required'),
});

const updateTicketSchema = z.object({
  type: z.enum(['GENERAL', 'VIP', 'EARLY_BIRD']).optional(),
  price: z.number().min(0).optional(),
  quantity: z.number().int().min(1).optional(),
});

router.get('/event/:eventId', ctrl.getTicketsByEvent);
router.post('/', authenticate, authorize('ORGANIZER'), validateRequest(ticketSchema), ctrl.createTicket);
router.put('/:id', authenticate, authorize('ORGANIZER'), validateRequest(updateTicketSchema), ctrl.updateTicket);
router.delete('/:id', authenticate, authorize('ORGANIZER'), ctrl.deleteTicket);

export default router;
