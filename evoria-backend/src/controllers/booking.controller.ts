import { Request, Response, NextFunction } from 'express';
import * as bookingService from '../services/booking.service';

export const book = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const booking = await bookingService.createBooking(
      req.user.userId,
      req.body.eventId
    );
    res.status(201).json({ booking });
  } catch (e) {
    next(e);
  }
};

export const cancelBooking = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await bookingService.cancelBooking(
      req.user.userId,
      req.params.id as string
    );
    res.json(result);
  } catch (e) {
    next(e);
  }
};

export const myBookings = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const result = await bookingService.getMyBookings(req.user.userId, page, limit);
    res.json(result);
  } catch (e) {
    next(e);
  }
};
