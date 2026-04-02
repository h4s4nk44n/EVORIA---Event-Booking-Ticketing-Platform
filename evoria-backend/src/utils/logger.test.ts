import winston from 'winston';

describe('Logger', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    jest.resetModules();
  });

  function loadLogger() {
    return require('./logger').logger as winston.Logger;
  }

  it('should be a winston logger instance', () => {
    const logger = loadLogger();
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.http).toBe('function');
  });

  it('should have log level set to http', () => {
    const logger = loadLogger();
    expect(logger.level).toBe('http');
  });

  it('should have a Console transport', () => {
    const logger = loadLogger();
    const consoleTransport = logger.transports.find(
      (t) => t instanceof winston.transports.Console
    );
    expect(consoleTransport).toBeDefined();
  });

  it('should NOT have File transports in non-production', () => {
    process.env.NODE_ENV = 'development';
    const logger = loadLogger();
    const fileTransports = logger.transports.filter(
      (t) => t instanceof winston.transports.File
    );
    expect(fileTransports).toHaveLength(0);
  });

  it('should have File transports in production', () => {
    process.env.NODE_ENV = 'production';
    const logger = loadLogger();
    const fileTransports = logger.transports.filter(
      (t) => t instanceof winston.transports.File
    );
    expect(fileTransports).toHaveLength(2);

    const filenames = fileTransports.map((t) => (t as winston.transports.FileTransportInstance).filename);
    expect(filenames).toContain('error.log');
    expect(filenames).toContain('combined.log');
  });

  it('should have error file transport with error level only', () => {
    process.env.NODE_ENV = 'production';
    const logger = loadLogger();
    const errorTransport = logger.transports.find(
      (t) =>
        t instanceof winston.transports.File &&
        (t as winston.transports.FileTransportInstance).filename === 'error.log'
    );
    expect(errorTransport).toBeDefined();
    expect(errorTransport!.level).toBe('error');
  });

  it('should log without throwing', () => {
    const logger = loadLogger();
    expect(() => logger.info('test info message')).not.toThrow();
    expect(() => logger.error('test error message')).not.toThrow();
    expect(() => logger.http('test http message')).not.toThrow();
  });
});
