
import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await authService.registerUser(req.body);
    res.status(201).json({ user });
  } catch (e) {
    next(e);
  }
};

// login controller — implement in POST /auth/login task
export const login = async (_req: Request, _res: Response, next: NextFunction) => {
  try {
    // TODO: implement in login task
    next();
  } catch (e) {
    next(e);
  }
};