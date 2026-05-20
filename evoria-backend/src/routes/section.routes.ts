import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { authorize } from '../middlewares/authorize';
import { validateRequest } from '../middlewares/validateRequest';
import { z } from 'zod';
import * as ctrl from '../controllers/section.controller';

const router = Router();

const sectionSchema = z.object({
  name: z.string().min(1).max(100),
  tier: z.enum(['vip', 'premium', 'standard', 'budget']),
  price: z.number().min(0),
  capacity: z.number().int().min(1).max(100000),
  sortOrder: z.number().int().min(0).optional(),
});

// Section CRUD — scoped under /venues/:venueId/sections
router.get('/venues/:venueId/sections', ctrl.listSections);
router.post('/venues/:venueId/sections', authenticate, authorize('ADMIN'), validateRequest(sectionSchema), ctrl.createSection);
router.get('/sections/:id', ctrl.getSection);
router.put('/sections/:id', authenticate, authorize('ADMIN'), validateRequest(sectionSchema.partial()), ctrl.updateSection);
router.delete('/sections/:id', authenticate, authorize('ADMIN'), ctrl.deleteSection);

// Seatmap availability — public endpoint for event detail page
router.get('/events/:id/seatmap', ctrl.getSeatmapAvailability);

export default router;
