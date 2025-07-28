// Уровни логирования
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Структура лога
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  data?: any;
  error?: Error;
}

// Логгер
class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private logLevel: LogLevel = 'info'; // По умолчанию

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const configIndex = levels.indexOf(this.logLevel);
    const currentIndex = levels.indexOf(level);
    
    return currentIndex >= configIndex;
  }

  private addLog(entry: LogEntry): void {
    this.logs.push(entry);
    
    // Ограничиваем количество логов
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
    
    // Выводим в консоль
    if (true) { // Всегда включено
      const prefix = `[${entry.context || 'UserFace'}]`;
      // const timestamp = new Date(entry.timestamp).toISOString();
      
      switch (entry.level) {
        case 'debug':
          console.debug(`${prefix} ${entry.message}`, entry.data);
          break;
        case 'info':
          console.info(`${prefix} ${entry.message}`, entry.data);
          break;
        case 'warn':
          console.warn(`${prefix} ${entry.message}`, entry.data);
          break;
        case 'error':
          console.error(`${prefix} ${entry.message}`, entry.error || entry.data);
          break;
      }
    }
  }

  debug(message: string, context?: string, data?: any): void {
    if (this.shouldLog('debug')) {
      this.addLog({
        timestamp: new Date().toISOString(),
        level: 'debug',
        message,
        context,
        data
      });
    }
  }

  info(message: string, context?: string, data?: any): void {
    if (this.shouldLog('info')) {
      this.addLog({
        timestamp: new Date().toISOString(),
        level: 'info',
        message,
        context,
        data
      });
    }
  }

  warn(message: string, context?: string, data?: any): void {
    if (this.shouldLog('warn')) {
      this.addLog({
        timestamp: new Date().toISOString(),
        level: 'warn',
        message,
        context,
        data
      });
    }
  }

  error(message: string, context?: string, error?: Error, data?: any): void {
    if (this.shouldLog('error')) {
      this.addLog({
        timestamp: new Date().toISOString(),
        level: 'error',
        message,
        context,
        data,
        error
      });
    }
  }

  // Получение логов
  getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter(log => log.level === level);
    }
    return [...this.logs];
  }

  // Очистка логов
  clear(): void {
    this.logs = [];
  }

  // Экспорт логов
  export(): LogEntry[] {
    return [...this.logs];
  }
}

// Синглтон логгера
export const logger = new Logger(); 