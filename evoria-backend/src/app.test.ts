import express from 'express';
import morgan from 'morgan';
import request from 'supertest';

jest.mock('./utils/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    http: jest.fn(),
    warn: jest.fn(),
  },
}));

import { logger } from './utils/logger';
import { errorHandler } from './middlewares/errorHandler';

const mockLogger = logger as unknown as {
  error: jest.Mock;
  info: jest.Mock;
  http: jest.Mock;
  warn: jest.Mock;
};

function createTestApp() {
  const app = express();
  const morganStream = { write: (message: string) => logger.http(message.trim()) };
  app.use(morgan('dev', { stream: morganStream }));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/throw', () => {
    throw new Error('test crash');
  });

  app.use(errorHandler);
  return app;
}

describe('Morgan + Winston integration', () => {
  let app: express.Express;

  beforeEach(() => {
    jest.clearAllMocks();
    app = createTestApp();
  });

  it('should pipe morgan output to logger.http', async () => {
    await request(app).get('/health');

    expect(mockLogger.http).toHaveBeenCalled();
    const loggedMessage = mockLogger.http.mock.calls[0][0];
    expect(loggedMessage).toContain('GET');
    expect(loggedMessage).toContain('/health');
  });

  it('should include status code in morgan log', async () => {
    await request(app).get('/health');

    const loggedMessage = mockLogger.http.mock.calls[0][0];
    expect(loggedMessage).toContain('200');
  });

  it('should log 404 for unknown routes', async () => {
    await request(app).get('/nonexistent');

    expect(mockLogger.http).toHaveBeenCalled();
    const loggedMessage = mockLogger.http.mock.calls[0][0];
    expect(loggedMessage).toContain('404');
  });

  it('should pass unhandled errors to errorHandler which logs via winston', async () => {
    const res = await request(app).get('/throw');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Internal server error.' });
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Unhandled error',
      expect.objectContaining({
        error: expect.any(Error),
        stack: expect.any(String),
      })
    );
  });

  it('should trim whitespace from morgan messages', async () => {
    await request(app).get('/health');

    const loggedMessage = mockLogger.http.mock.calls[0][0];
    expect(loggedMessage).toBe(loggedMessage.trim());
  });
});
