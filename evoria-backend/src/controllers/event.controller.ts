import { Request, Response, NextFunction } from 'express';
import * as eventService from '../services/event.service';

export const createEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const event = await eventService.createEvent(req.user.userId, req.body);
    res.status(201).json({ event });
  } catch (e) {
    next(e);
  }
};

// Placeholder — implement in PUT /events/:id task
export const updateEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: implement
    next();
  } catch (e) {
    next(e);
  }
};

// Placeholder — implement in DELETE /events/:id task
export const deleteEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: implement
    next();
  } catch (e) {
    next(e);
  }
};