import { Router } from 'express';
import {
  listFlaggedReviewsQuerySchema,
  listUsersQuerySchema,
  updateUserRoleInputSchema,
  type ListFlaggedReviewsQuery,
  type ListUsersQuery,
} from '@meghjatra/shared';
import { requireAuth } from '../middleware/requireAuth';
import { requireRole } from '../middleware/requireRole';
import { validateBody, validateQuery } from '../middleware/validate';
import { asyncHandler } from '../lib/asyncHandler';
import { toAdminUserDto, toReviewDto } from '../lib/dto';
import {
  listFlaggedReviews,
  listUsers,
  removeReview,
  resolveFlaggedReview,
  setUserActiveStatus,
  updateUserRole,
} from '../services/admin.service';

export const adminRouter = Router();

adminRouter.get(
  '/users',
  requireAuth,
  requireRole('ADMIN'),
  validateQuery(listUsersQuerySchema),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as ListUsersQuery;
    const { items, nextCursor } = await listUsers(query);
    res.json({ users: items.map(toAdminUserDto), nextCursor });
  }),
);

adminRouter.patch(
  '/users/:id/role',
  requireAuth,
  requireRole('ADMIN'),
  validateBody(updateUserRoleInputSchema),
  asyncHandler(async (req, res) => {
    const user = await updateUserRole(req.userId!, req.params.id, req.body);
    res.json({ user: toAdminUserDto(user) });
  }),
);

adminRouter.post(
  '/users/:id/deactivate',
  requireAuth,
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const user = await setUserActiveStatus(req.userId!, req.params.id, false);
    res.json({ user: toAdminUserDto(user) });
  }),
);

adminRouter.post(
  '/users/:id/reactivate',
  requireAuth,
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const user = await setUserActiveStatus(req.userId!, req.params.id, true);
    res.json({ user: toAdminUserDto(user) });
  }),
);

adminRouter.get(
  '/reviews/flagged',
  requireAuth,
  requireRole('ADMIN', 'MODERATOR'),
  validateQuery(listFlaggedReviewsQuerySchema),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as ListFlaggedReviewsQuery;
    const { items, nextCursor } = await listFlaggedReviews(query);
    res.json({ reviews: items.map(toReviewDto), nextCursor });
  }),
);

adminRouter.post(
  '/reviews/:id/resolve',
  requireAuth,
  requireRole('ADMIN', 'MODERATOR'),
  asyncHandler(async (req, res) => {
    const review = await resolveFlaggedReview(req.params.id);
    res.json({ review: toReviewDto(review) });
  }),
);

adminRouter.delete(
  '/reviews/:id',
  requireAuth,
  requireRole('ADMIN', 'MODERATOR'),
  asyncHandler(async (req, res) => {
    await removeReview(req.params.id);
    res.status(204).send();
  }),
);
