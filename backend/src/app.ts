import express, { Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import routes from './routes';
import { errorHandler } from './core/middleware/error.middleware';

export const createApp = (): Application => {
  const app = express();

  // Middleware
  app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:4200',
    credentials: true
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Routes
  app.use('/api', routes);

  // Error handling
  app.use(errorHandler);

  return app;
};
