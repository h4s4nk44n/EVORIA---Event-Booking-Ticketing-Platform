import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';
import { ZodError } from 'zod';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  // 2. ZOD VALIDASYON HATALARI İÇİN BU BLOĞU EKLEDİK (400 Bad Request döner)
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation error',
      details: err.flatten().fieldErrors, // Hangi alanların hatalı olduğunu dönmek frontend için hayat kurtarır
    });
  }
  if (err instanceof AppError) {
    logger.error({ message: err.message, stack: err.stack });
    return res.status(err.statusCode).json({
      error: err.message,
      ...(err.errors && { errors: err.errors }),
    });
  }

  if (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === 'P2002'
  ) {
    return res.status(409).json({
      error: 'A record with this value already exists.',
    });
  }

  if (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === 'P2025'
  ) {
    return res.status(404).json({
      error: 'Record not found.',
    });
  }

  logger.error('Unhandled error', { error: err, stack: err instanceof Error ? err.stack : undefined });

  return res.status(500).json({
    error: 'Internal server error.',
  });
}
