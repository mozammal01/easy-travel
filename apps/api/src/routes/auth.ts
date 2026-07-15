import { Response, Router } from 'express';
import { loginInputSchema, registerInputSchema } from '@meghjatra/shared';
import { validateBody } from '../middleware/validate';
import { asyncHandler } from '../lib/asyncHandler';
import { loginUser, refreshSession, registerUser } from '../services/auth.service';
import { verifyRefreshToken } from '../lib/jwt';
import { HttpError } from '../middleware/errorHandler';
import { env } from '../config/env';

export const authRouter = Router();

const REFRESH_COOKIE_NAME = 'refreshToken';
const REFRESH_COOKIE_PATH = '/auth';
const REFRESH_COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: REFRESH_COOKIE_PATH,
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
  });
}

authRouter.post(
  '/register',
  validateBody(registerInputSchema),
  asyncHandler(async (req, res) => {
    const { user, accessToken, refreshToken } = await registerUser(req.body);
    setRefreshCookie(res, refreshToken);
    res.status(201).json({ user, accessToken });
  }),
);

authRouter.post(
  '/login',
  validateBody(loginInputSchema),
  asyncHandler(async (req, res) => {
    const { user, accessToken, refreshToken } = await loginUser(req.body);
    setRefreshCookie(res, refreshToken);
    res.json({ user, accessToken });
  }),
);

authRouter.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const token = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!token) {
      throw new HttpError(401, 'Missing refresh token');
    }

    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      throw new HttpError(401, 'Invalid or expired refresh token');
    }

    const { user, accessToken, refreshToken } = await refreshSession(payload.sub);
    setRefreshCookie(res, refreshToken);
    res.json({ user, accessToken });
  }),
);

authRouter.post('/logout', (_req, res) => {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: REFRESH_COOKIE_PATH });
  res.status(204).send();
});
