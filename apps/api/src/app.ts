import path from 'node:path';
import express, { Express } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { healthRouter } from './routes/health';
import { authRouter } from './routes/auth';
import { usersRouter } from './routes/users';
import { recommendationsRouter } from './routes/recommendations';
import { destinationsRouter } from './routes/destinations';
import { tripsRouter } from './routes/trips';
import { accommodationsRouter } from './routes/accommodations';
import { discoveryRouter } from './routes/discovery';
import { favouritesRouter } from './routes/favourites';
import { reviewsRouter } from './routes/reviews';
import { adminRouter } from './routes/admin';
import { notFoundHandler } from './middleware/notFoundHandler';
import { errorHandler } from './middleware/errorHandler';

export function createApp(): Express {
  const app = express();

  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  app.use('/health', healthRouter);
  app.use('/auth', authRouter);
  app.use('/users', usersRouter);
  app.use('/recommendations', recommendationsRouter);
  app.use('/destinations', destinationsRouter);
  app.use('/trips', tripsRouter);
  app.use('/accommodations', accommodationsRouter);
  app.use('/discovery', discoveryRouter);
  app.use('/favourites', favouritesRouter);
  app.use('/reviews', reviewsRouter);
  app.use('/admin', adminRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
