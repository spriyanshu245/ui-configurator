import { logger } from '../logger';

describe('logger', () => {
  let originalConsoleLog: any;
  let originalConsoleWarn: any;
  let originalConsoleError: any;
  let logOutput: string[] = [];
  let warnOutput: string[] = [];
  let errorOutput: string[] = [];

  beforeEach(() => {
    // Capture console output
    originalConsoleLog = console.log;
    originalConsoleWarn = console.warn;
    originalConsoleError = console.error;

    logOutput = [];
    warnOutput = [];
    errorOutput = [];

    console.log = jest.fn((msg) => logOutput.push(msg));
    console.warn = jest.fn((msg) => warnOutput.push(msg));
    console.error = jest.fn((msg) => errorOutput.push(msg));

    // Reset environment
    delete (process.env as any).LOG_LEVEL;
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
  });

  describe('redaction', () => {
    it('should redact authorization key', () => {
      logger.info('test message', { authorization: 'Bearer token123' });
      const logged = JSON.parse(logOutput[0]);
      expect(logged.authorization).toBe('[REDACTED]');
    });

    it('should redact cookie key', () => {
      logger.info('test', { cookie: 'sessionId=abc123' });
      const logged = JSON.parse(logOutput[0]);
      expect(logged.cookie).toBe('[REDACTED]');
    });

    it('should redact token key', () => {
      logger.info('test', { token: 'secret-token' });
      const logged = JSON.parse(logOutput[0]);
      expect(logged.token).toBe('[REDACTED]');
    });

    it('should redact accessToken key', () => {
      logger.info('test', { accessToken: 'secret-access' });
      const logged = JSON.parse(logOutput[0]);
      expect(logged.accessToken).toBe('[REDACTED]');
    });

    it('should redact password key', () => {
      logger.info('test', { password: 'my-password' });
      const logged = JSON.parse(logOutput[0]);
      expect(logged.password).toBe('[REDACTED]');
    });

    it('should redact secret key', () => {
      logger.info('test', { secret: 'secret-value' });
      const logged = JSON.parse(logOutput[0]);
      expect(logged.secret).toBe('[REDACTED]');
    });

    it('should redact messages key', () => {
      logger.info('test', { messages: [{ role: 'user', content: 'hello' }] });
      const logged = JSON.parse(logOutput[0]);
      expect(logged.messages).toBe('[REDACTED]');
    });

    it('should redact content key', () => {
      logger.info('test', { content: 'sensitive content' });
      const logged = JSON.parse(logOutput[0]);
      expect(logged.content).toBe('[REDACTED]');
    });

    it('should redact body key', () => {
      logger.info('test', { body: 'request body' });
      const logged = JSON.parse(logOutput[0]);
      expect(logged.body).toBe('[REDACTED]');
    });

    it('should redact patch key', () => {
      logger.info('test', { patch: [{ op: 'replace', path: '/', value: {} }] });
      const logged = JSON.parse(logOutput[0]);
      expect(logged.patch).toBe('[REDACTED]');
    });

    it('should redact dsl key', () => {
      logger.info('test', { dsl: { type: 'page', components: [] } });
      const logged = JSON.parse(logOutput[0]);
      expect(logged.dsl).toBe('[REDACTED]');
    });

    it('should be case-insensitive', () => {
      logger.info('test', { Authorization: 'Bearer token', COOKIE: 'session' });
      const logged = JSON.parse(logOutput[0]);
      expect(logged.Authorization).toBe('[REDACTED]');
      expect(logged.COOKIE).toBe('[REDACTED]');
    });

    it('should preserve non-sensitive keys', () => {
      logger.info('test', { userId: '123', action: 'update' });
      const logged = JSON.parse(logOutput[0]);
      expect(logged.userId).toBe('123');
      expect(logged.action).toBe('update');
    });

    it('should handle undefined metadata', () => {
      logger.info('test');
      const logged = JSON.parse(logOutput[0]);
      expect(logged.msg).toBe('test');
      expect(logged.level).toBe('info');
    });
  });

  describe('level gating', () => {
    it('should suppress debug at info level (default)', () => {
      logger.debug('debug msg');
      logger.info('info msg');
      expect(logOutput.length).toBe(1);
      const logged = JSON.parse(logOutput[0]);
      expect(logged.msg).toBe('info msg');
    });

    it('should show debug at debug level', () => {
      process.env.LOG_LEVEL = 'debug';
      logger.debug('debug msg');
      logger.info('info msg');
      expect(logOutput.length).toBe(2);
    });

    it('should suppress debug and info at warn level', () => {
      process.env.LOG_LEVEL = 'warn';
      logger.debug('debug msg');
      logger.info('info msg');
      logger.warn('warn msg');
      expect(warnOutput.length).toBe(1);
      const logged = JSON.parse(warnOutput[0]);
      expect(logged.msg).toBe('warn msg');
    });

    it('should only show error at error level', () => {
      process.env.LOG_LEVEL = 'error';
      logger.debug('debug');
      logger.info('info');
      logger.warn('warn');
      logger.error('error msg');
      expect(errorOutput.length).toBe(1);
      const logged = JSON.parse(errorOutput[0]);
      expect(logged.msg).toBe('error msg');
    });
  });

  describe('output format', () => {
    it('should output valid single-line JSON', () => {
      logger.info('test message', { foo: 'bar' });
      expect(() => JSON.parse(logOutput[0])).not.toThrow();
    });

    it('should include timestamp', () => {
      logger.info('test');
      const logged = JSON.parse(logOutput[0]);
      expect(logged.ts).toBeDefined();
      expect(typeof logged.ts).toBe('string');
      // Check it's a valid ISO string
      expect(() => new Date(logged.ts)).not.toThrow();
    });

    it('should include level', () => {
      logger.info('test');
      const logged = JSON.parse(logOutput[0]);
      expect(logged.level).toBe('info');
    });

    it('should include message', () => {
      logger.info('test message');
      const logged = JSON.parse(logOutput[0]);
      expect(logged.msg).toBe('test message');
    });

    it('should include metadata', () => {
      logger.info('test', { userId: '123', action: 'create' });
      const logged = JSON.parse(logOutput[0]);
      expect(logged.userId).toBe('123');
      expect(logged.action).toBe('create');
    });

    it('debug should use console.log', () => {
      process.env.LOG_LEVEL = 'debug';
      logger.debug('debug msg');
      expect(console.log).toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalled();
    });

    it('info should use console.log', () => {
      logger.info('info msg');
      expect(console.log).toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalled();
    });

    it('warn should use console.warn', () => {
      logger.warn('warn msg');
      expect(console.warn).toHaveBeenCalled();
      expect(console.log).not.toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalled();
    });

    it('error should use console.error', () => {
      logger.error('error msg');
      expect(console.error).toHaveBeenCalled();
      expect(console.log).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
    });
  });

  describe('all sensitive keys together', () => {
    it('should redact all sensitive keys in one log', () => {
      logger.info('request', {
        authorization: 'Bearer token',
        cookie: 'session=abc',
        token: 'xyz',
        accessToken: 'access',
        password: 'pass123',
        secret: 'secret123',
        messages: [{ role: 'user' }],
        content: 'user content',
        body: '{"data":"value"}',
        patch: [{ op: 'add' }],
        dsl: { type: 'page' },
        userId: '123',
      });
      const logged = JSON.parse(logOutput[0]);
      expect(logged.authorization).toBe('[REDACTED]');
      expect(logged.cookie).toBe('[REDACTED]');
      expect(logged.token).toBe('[REDACTED]');
      expect(logged.accessToken).toBe('[REDACTED]');
      expect(logged.password).toBe('[REDACTED]');
      expect(logged.secret).toBe('[REDACTED]');
      expect(logged.messages).toBe('[REDACTED]');
      expect(logged.content).toBe('[REDACTED]');
      expect(logged.body).toBe('[REDACTED]');
      expect(logged.patch).toBe('[REDACTED]');
      expect(logged.dsl).toBe('[REDACTED]');
      expect(logged.userId).toBe('123');
    });
  });
});
