import { NextFunction, Response } from 'express';
import { AppError } from '../utils/AppError';
import { AuthenticatedRequest } from './auth';

export const authorize = (...allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Unauthorized', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError('Forbidden', 403));
    }

    return next();
  };
};
