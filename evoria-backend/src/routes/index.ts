import { Router } from 'express';
import { healthCheck } from '../controllers/health.controller';
import authRouter from './auth.routes';
import eventRouter from './event.routes';
import bookingRouter from './booking.routes';
import categoryRouter from './category.routes';
import venueRouter from './venue.routes';
import ticketRouter from './ticket.routes';

const router = Router();

router.get('/health', healthCheck);
router.use('/auth', authRouter);
router.use('/events', eventRouter);
router.use('/bookings', bookingRouter);
router.use('/categories', categoryRouter);
router.use('/venues', venueRouter);
router.use('/tickets', ticketRouter);

export default router;
