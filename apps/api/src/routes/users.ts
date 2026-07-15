import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { asyncHandler } from '../lib/asyncHandler';
import { softDeleteCurrentUser } from '../services/user.service';

export const usersRouter = Router();

const REFRESH_COOKIE_NAME = 'refreshToken';
const REFRESH_COOKIE_PATH = '/auth';

usersRouter.delete(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    await softDeleteCurrentUser(req.userId!);
    res.clearCookie(REFRESH_COOKIE_NAME, { path: REFRESH_COOKIE_PATH });
    res.status(204).send();
  }),
);
