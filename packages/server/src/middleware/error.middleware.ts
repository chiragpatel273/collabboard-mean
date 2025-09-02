import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { configService } from '../config/config';

export class AppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const globalErrorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  error.statusCode = error.statusCode || 500;
  error.status = error.status || 'error';

  // Log error
  logger.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
  });

  // Send error response
  if (configService.isProduction()) {
    // Production: Don't leak error details
    if (error.isOperational) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        timestamp: new Date().toISOString(),
      });
    }
  } else {
    // Development: Send full error details
    return res.status(error.statusCode).json({
      status: error.status,
      error: error,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
  }
};

export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const err = new AppError(`Can't find ${req.originalUrl} on this server!`, 404);
  next(err);
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
