import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;
  let errorDetails = {};

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    statusCode = 404;
    message = 'Resource not found';
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    statusCode = 400;
    const key = Object.keys(err.keyValue)[0];
    message = `Duplicate field value entered for: ${key}`;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((val: any) => val.message).join(', ');
    errorDetails = Object.keys(err.errors).reduce((acc: any, key) => {
      acc[key] = err.errors[key].message;
      return acc;
    }, {});
  }

  // Custom operational errors mapping from service layer
  if (statusCode === 500 && message) {
    const msg = message.toLowerCase();
    if (msg.includes('already exists') || msg.includes('invalid email') || msg.includes('invalid or expired')) {
      statusCode = 400;
    } else if (msg.includes('not found') || msg.includes('no user with that email')) {
      statusCode = 404;
    } else if (msg.includes('not authorized') || msg.includes('not permit')) {
      statusCode = 403;
    }
  }

  res.status(statusCode).json({
    error: message,
    details: Object.keys(errorDetails).length > 0 ? errorDetails : undefined,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};
