import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export function errorHandler(
  err: Error & { status?: number; code?: string },
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const status = err.status || 500;
  const message = process.env.NODE_ENV === 'production' && status === 500
    ? 'An internal server error occurred'
    : err.message;

  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    status,
  });

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}
