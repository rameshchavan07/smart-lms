import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { invalidCsrfTokenError } from './csrf';

export const globalErrorHandler = (err: unknown, req: Request, res: Response, next: NextFunction): void => {
  if (err === invalidCsrfTokenError) {
    res.status(403).json({ message: 'Invalid CSRF token' });
    return;
  }
  
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: 'error',
      message: err.message
    });
    return;
  }

  const errObj = err as any;

  // Known 3rd party errors
  if (errObj && errObj.name === 'MulterError') {
    const statusCode = 400;
    const message = errObj.code === 'LIMIT_FILE_SIZE' 
      ? 'File size is too large. Please upload a smaller file.'
      : `Upload error: ${errObj.message}`;
    res.status(statusCode).json({ status: 'error', message });
    return;
  } 

  if (err instanceof Error && err.message && (err.message.includes('Invalid file type') || err.message.includes('Only'))) {
    res.status(400).json({ status: 'error', message: err.message });
    return;
  }

  console.error('Unhandled Error:', err);
  res.status(500).json({
    status: 'error',
    message: (err instanceof Error ? err.message : null) || 'Internal Server Error'
  });
};
