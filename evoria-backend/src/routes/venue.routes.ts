import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { authorize } from '../middlewares/authorize';
import { validateRequest } from '../middlewares/validateRequest';
import { z } from 'zod';
import * as ctrl from '../controllers/venue.controller';

const router = Router();

const venueSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  address: z.string().min(5, 'Address must be at least 5 characters').max(200),
  city: z.string().min(2, 'City must be at least 2 characters').max(100),
  capacity: z.number({ message: 'Capacity must be a number' }).int().min(1).max(100000),
});

router.get('/', ctrl.listVenues);
router.get('/:id', ctrl.getVenue);
router.post('/', authenticate, authorize('ADMIN'), validateRequest(venueSchema), ctrl.createVenue);
router.put('/:id', authenticate, authorize('ADMIN'), validateRequest(venueSchema.partial()), ctrl.updateVenue);
router.delete('/:id', authenticate, authorize('ADMIN'), ctrl.deleteVenue);

export default router;
