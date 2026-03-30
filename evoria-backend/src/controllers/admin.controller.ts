import { Request, Response, NextFunction } from 'express';
import * as adminService from '../services/admin.service';

export const listUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));

    const result = await adminService.getAllUsers(page, limit);
    res.json(result);
  } catch (e) {
    next(e);
  }
};

// placeholders so the route file compiles
export const listAllEvents = async (
  _req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const result = await adminService.getAllEvents();
    _res.json(result);
  } catch (e) {
    next(e);
  }
};

export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await adminService.deleteUserById(req.params.id as any);
    res.json({ message: 'User deleted successfully.' });
  } catch (e) {
    next(e);
  }
};

export const deleteAnyEvent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await adminService.deleteEventById(req.params.id as any);
    res.json({ message: 'Event deleted successfully.' });
  } catch (e) {
    next(e);
  }
};