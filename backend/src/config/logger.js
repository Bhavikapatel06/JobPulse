const { createLogger, format, transports } = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure logs/ directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

const { combine, timestamp, printf, colorize, errors } = format;

// Custom log line format
const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    logFormat
  ),
  transports: [
    // Coloured console output
    new transports.Console({
      format: combine(
        colorize({ all: true }),
        timestamp({ format: 'HH:mm:ss' }),
        printf(({ level, message, timestamp, stack }) => {
          return `${timestamp} [${level}]: ${stack || message}`;
        })
      ),
    }),
    // Plain file output
    new transports.File({
      filename: path.join(logsDir, 'app.log'),
      maxsize: 5 * 1024 * 1024, // 5 MB
      maxFiles: 3,
    }),
    // Separate error log
    new transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
    }),
  ],
  exitOnError: false,
});

module.exports = logger;
