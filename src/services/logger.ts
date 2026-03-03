/**
 * Simple Logger utility for the PowerChart EMR simulation.
 *
 * Provides structured logging with an in-memory buffer (capped at 1 000 entries)
 * and convenience methods for each log level.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  data?: unknown;
}

// ---------------------------------------------------------------------------
// Logger singleton
// ---------------------------------------------------------------------------

const MAX_LOG_ENTRIES = 1000;

const logs: LogEntry[] = [];

function createEntry(level: string, message: string, data?: unknown): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    data,
  };
}

function addEntry(entry: LogEntry): void {
  logs.push(entry);
  if (logs.length > MAX_LOG_ENTRIES) {
    logs.shift();
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const Logger = {
  /**
   * Generic log method. Prefer the level-specific helpers below.
   */
  log(level: string, message: string, data?: unknown): void {
    const entry = createEntry(level, message, data);
    addEntry(entry);
    console.log(`[${entry.level}] ${entry.message}`, data ?? '');
  },

  info(message: string, data?: unknown): void {
    const entry = createEntry('INFO', message, data);
    addEntry(entry);
    console.info(`[INFO] ${message}`, data ?? '');
  },

  warn(message: string, data?: unknown): void {
    const entry = createEntry('WARN', message, data);
    addEntry(entry);
    console.warn(`[WARN] ${message}`, data ?? '');
  },

  error(message: string, data?: unknown): void {
    const entry = createEntry('ERROR', message, data);
    addEntry(entry);
    console.error(`[ERROR] ${message}`, data ?? '');
  },

  debug(message: string, data?: unknown): void {
    const entry = createEntry('DEBUG', message, data);
    addEntry(entry);
    console.debug(`[DEBUG] ${message}`, data ?? '');
  },

  /**
   * Return a copy of the current log buffer.
   */
  exportLogs(): LogEntry[] {
    return [...logs];
  },
} as const;
