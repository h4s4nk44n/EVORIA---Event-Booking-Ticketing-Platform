import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { authorize } from '../middlewares/authorize';
import { validateRequest } from '../middlewares/validateRequest';
import { z } from 'zod';
import * as ctrl from '../controllers/category.controller';

const router = Router();

const categorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  description: z.string().max(500).optional(),
});

router.get('/', ctrl.listCategories);
router.get('/:id', ctrl.getCategory);
router.post('/', authenticate, authorize('ADMIN'), validateRequest(categorySchema), ctrl.createCategory);
router.put('/:id', authenticate, authorize('ADMIN'), validateRequest(categorySchema.partial()), ctrl.updateCategory);
router.delete('/:id', authenticate, authorize('ADMIN'), ctrl.deleteCategory);

export default router;
