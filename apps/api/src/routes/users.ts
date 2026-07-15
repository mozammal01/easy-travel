import path from 'node:path';
import { Router } from 'express';
import { updateProfileInputSchema } from '@meghjatra/shared';
import { requireAuth } from '../middleware/requireAuth';
import { validateBody } from '../middleware/validate';
import { asyncHandler } from '../lib/asyncHandler';
import { avatarUpload } from '../lib/upload';
import { HttpError } from '../middleware/errorHandler';
import {
  getCurrentUser,
  setAvatar,
  softDeleteCurrentUser,
  updateProfile,
} from '../services/user.service';

export const usersRouter = Router();

const REFRESH_COOKIE_NAME = 'refreshToken';
const REFRESH_COOKIE_PATH = '/auth';

usersRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await getCurrentUser(req.userId!);
    res.json({ user });
  }),
);

usersRouter.patch(
  '/me',
  requireAuth,
  validateBody(updateProfileInputSchema),
  asyncHandler(async (req, res) => {
    const user = await updateProfile(req.userId!, req.body);
    res.json({ user });
  }),
);

usersRouter.post(
  '/me/avatar',
  requireAuth,
  (req, res, next) => {
    avatarUpload.single('avatar')(req, res, (err: unknown) => {
      if (err) {
        next(new HttpError(400, err instanceof Error ? err.message : 'Upload failed'));
        return;
      }
      next();
    });
  },
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new HttpError(400, 'No file uploaded');
    }
    const avatarUrl = `/uploads/avatars/${path.basename(req.file.path)}`;
    const user = await setAvatar(req.userId!, avatarUrl);
    res.json({ user });
  }),
);

usersRouter.delete(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    await softDeleteCurrentUser(req.userId!);
    res.clearCookie(REFRESH_COOKIE_NAME, { path: REFRESH_COOKIE_PATH });
    res.status(204).send();
  }),
);
