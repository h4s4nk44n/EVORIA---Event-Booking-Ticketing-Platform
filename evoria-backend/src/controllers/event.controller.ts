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

export const listEvents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await eventService.listEvents({
      search: req.query.search as string,
      from:   req.query.from   as string,
      to:     req.query.to     as string,
      page:   Number(req.query.page)  || undefined,
      limit:  Number(req.query.limit) || undefined,
    });
    res.json(result);
  } catch (e) {
    next(e);
  }
};

export const getEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const event = await eventService.getEventById(req.params.id as string);
    res.json({ event });
  } catch (e) {
    next(e);
  }
};

// Placeholder — implement in PUT /events/:id task
export const updateEvent = async (req: Request, res: Response, next: NextFunction) => {
    try {
    const event = await eventService.updateEvent(
      req.user.userId,
      req.params.id as string,
      req.body
    );
    res.json({ event });
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