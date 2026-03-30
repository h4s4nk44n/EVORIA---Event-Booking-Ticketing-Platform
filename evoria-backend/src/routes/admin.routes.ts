import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { authorize } from '../middlewares/authorize';
import {
  listUsers,
  listAllEvents,
  deleteUser,
  deleteAnyEvent,
} from '../controllers/admin.controller';

const router = Router();

router.use(authenticate as any, authorize('ADMIN'));

router.get('/users', listUsers);
router.get('/events', listAllEvents);
router.delete('/users/:id', deleteUser);
router.delete('/events/:id', deleteAnyEvent);

export default router;