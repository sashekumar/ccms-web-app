import { Request, Response, NextFunction } from 'express';
import { ResponseUtil } from '../utils/response.util';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error:', error);

  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  const message = error.message || 'Internal server error';
  const errorDetails = process.env.NODE_ENV === 'development' ? error.stack : undefined;

  ResponseUtil.error(res, message, statusCode, errorDetails);
};
