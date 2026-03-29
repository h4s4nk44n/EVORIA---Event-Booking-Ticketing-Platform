import { NextFunction, Request, Response } from 'express';
import { ZodError, ZodObject } from 'zod';

export const validate =
  (schema: ZodObject<any>) =>
    (req: Request, _res: Response, next: NextFunction): void => {
      try {
        schema.parse({
          body: req.body,
          query: req.query,
          params: req.params,
        });
        next();
      } catch (error) {
        if (error instanceof ZodError) {
          next(error);
          return;
        }
        next(error);
      }
    };