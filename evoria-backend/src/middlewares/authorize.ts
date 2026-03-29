import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

type Role = 'ATTENDEE' | 'ORGANIZER' | 'ADMIN';

export function authorize(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw new AppError('Unauthenticated', 401);
    if (!allowedRoles.includes(req.user.role as Role)) {
      throw new AppError('Forbidden: insufficient permissions', 403);
    }
    next();
  };
}