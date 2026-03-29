import { Request, Response } from 'express';
import { getHealthStatus } from '../services/health.service';

export const healthCheck = (_req: Request, res: Response) => {
  const data = getHealthStatus();
  return res.status(200).json(data);
};
