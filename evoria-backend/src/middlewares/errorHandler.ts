import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from '../utils/AppError';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
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

  console.error('[Unhandled Error]', err);

  return res.status(500).json({
    error: 'Internal server error.',
  });
}