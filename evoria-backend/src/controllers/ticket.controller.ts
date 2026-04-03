import { Request, Response, NextFunction } from 'express';
import * as ticketService from '../services/ticket.service';

export const createTicket = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ticket = await ticketService.createTicket(req.user.userId, req.body);
    res.status(201).json({ ticket });
  } catch (e) {
    next(e);
  }
};

export const getTicketsByEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tickets = await ticketService.getTicketsByEvent(req.params.eventId as string);
    res.json({ tickets });
  } catch (e) {
    next(e);
  }
};

export const updateTicket = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ticket = await ticketService.updateTicket(
      req.user.userId,
      req.params.id as string,
      req.body
    );
    res.json({ ticket });
  } catch (e) {
    next(e);
  }
};

export const deleteTicket = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await ticketService.deleteTicket(req.user.userId, req.params.id as string);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
};
