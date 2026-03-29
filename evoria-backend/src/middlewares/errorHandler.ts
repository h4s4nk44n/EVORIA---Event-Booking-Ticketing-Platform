import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  logger.error({ message: err.message, stack: err.stack });

   // Prisma P2002 — unique constraint (duplicate email)
  if (err?.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: 'Email already in use',
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  return res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
};
