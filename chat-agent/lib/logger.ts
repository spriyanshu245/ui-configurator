/**
 * Structured, leveled logger for the chat agent.
 * Outputs single-line JSON with redaction of sensitive keys.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type LogMeta = Record<string, unknown>;

// Log level order: lower index = lower priority (printed at higher log levels)
const LOG_LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const SENSITIVE_KEYS = new Set([
  'authorization',
  'cookie',
  'token',
  'accesstoken',
  'password',
  'secret',
  'messages',
  'content',
  'body',
  'patch',
  'dsl',
]);

/**
 * Redact sensitive keys from metadata object.
 * Strips/masks keys matching SENSITIVE_KEYS (case-insensitive).
 */
function redact(meta?: LogMeta): LogMeta {
  if (!meta || typeof meta !== 'object') {
    return meta || {};
  }

  const redacted = { ...meta };

  for (const key in redacted) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      redacted[key] = '[REDACTED]';
    }
  }

  return redacted;
}

/**
 * Get current log level from environment or default to 'info'.
 */
function getCurrentLogLevel(): LogLevel {
  const envLevel = process.env.LOG_LEVEL?.toLowerCase();
  if (envLevel && envLevel in LOG_LEVEL_ORDER) {
    return envLevel as LogLevel;
  }
  return 'info';
}

/**
 * Check if a message should be logged at the current level.
 */
function shouldLog(messageLevel: LogLevel): boolean {
  const currentLevel = getCurrentLogLevel();
  return LOG_LEVEL_ORDER[messageLevel] >= LOG_LEVEL_ORDER[currentLevel];
}

/**
 * Format a single-line JSON log entry.
 */
function formatLogEntry(level: LogLevel, msg: string, meta?: LogMeta): string {
  const entry = {
    ts: new Date().toISOString(),
    level,
    msg,
    ...redact(meta),
  };
  return JSON.stringify(entry);
}

/**
 * Singleton logger instance.
 */
const logger = {
  debug(msg: string, meta?: LogMeta): void {
    if (shouldLog('debug')) {
      console.log(formatLogEntry('debug', msg, meta));
    }
  },

  info(msg: string, meta?: LogMeta): void {
    if (shouldLog('info')) {
      console.log(formatLogEntry('info', msg, meta));
    }
  },

  warn(msg: string, meta?: LogMeta): void {
    if (shouldLog('warn')) {
      console.warn(formatLogEntry('warn', msg, meta));
    }
  },

  error(msg: string, meta?: LogMeta): void {
    if (shouldLog('error')) {
      console.error(formatLogEntry('error', msg, meta));
    }
  },
};

export { logger };
export default logger;
