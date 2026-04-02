import { Request, Response, NextFunction } from 'express';
import { errorHandler } from './errorHandler';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';

jest.mock('../utils/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    http: jest.fn(),
  },
}));

const mockLogger = logger as jest.Mocked<typeof logger>;

function createMockRes(): Response {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

function createMockReq(): Request {
  return {} as Request;
}

const mockNext: NextFunction = jest.fn();

describe('errorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when error is an AppError', () => {
    it('should return the AppError statusCode and message', () => {
      const err = new AppError('Not found', 404);
      const req = createMockReq();
      const res = createMockRes();

      errorHandler(err, req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Not found',
      });
    });

    it('should log the AppError with message and stack', () => {
      const err = new AppError('Bad request', 400);
      const req = createMockReq();
      const res = createMockRes();

      errorHandler(err, req, res, mockNext);

      expect(mockLogger.error).toHaveBeenCalledWith({
        message: 'Bad request',
        stack: expect.any(String),
      });
    });

    it('should handle default 500 status AppError', () => {
      const err = new AppError('Server error', 500);
      const req = createMockReq();
      const res = createMockRes();

      errorHandler(err, req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Server error',
      });
    });
  });

  describe('when error is an unknown Error', () => {
    it('should return 500 with generic message', () => {
      const err = new Error('something broke');
      const req = createMockReq();
      const res = createMockRes();

      errorHandler(err, req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal server error.',
      });
    });

    it('should log as Unhandled error with error and stack', () => {
      const err = new Error('unexpected failure');
      const req = createMockReq();
      const res = createMockRes();

      errorHandler(err, req, res, mockNext);

      expect(mockLogger.error).toHaveBeenCalledWith('Unhandled error', {
        error: err,
        stack: err.stack,
      });
    });
  });

  describe('when error is a non-Error object', () => {
    it('should return 500 and log with undefined stack', () => {
      const err = { message: 'not a real error' } as unknown as Error;
      const req = createMockReq();
      const res = createMockRes();

      errorHandler(err, req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal server error.',
      });
      expect(mockLogger.error).toHaveBeenCalledWith('Unhandled error', {
        error: err,
        stack: undefined,
      });
    });
  });
});
