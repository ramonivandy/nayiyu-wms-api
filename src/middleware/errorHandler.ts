import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';
import { isDevelopment } from '../config';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = err;
  let statusCode = 500;
  let message = 'Internal Server Error';

  // Handle different error types
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
  } else if (error instanceof ZodError) {
    statusCode = 400;
    message = 'Validation error';
    const errors = error.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    logger.warn('Validation error:', errors);
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
    });
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      statusCode = 409;
      message = 'Duplicate entry found';
    } else if (error.code === 'P2025') {
      statusCode = 404;
      message = 'Record not found';
    } else if (error.code === 'P2003') {
      statusCode = 400;
      message = 'Foreign key constraint failed';
    }
  } else if (error instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = 'Invalid data provided';
  }

  // Log error
  if (statusCode >= 500) {
    logger.error('Server error:', error);
  } else {
    logger.warn('Client error:', error.message);
  }

  // Send response
  res.status(statusCode).json({
    success: false,
    message,
    ...(isDevelopment && { stack: error.stack }),
  });
};