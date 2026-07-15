import type { Role } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { HttpError } from './errorHandler';

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.userId) {
      next(new HttpError(401, 'Authentication required'));
      return;
    }

    prisma.user
      .findUnique({ where: { id: req.userId } })
      .then((user) => {
        if (!user || user.deletedAt) {
          next(new HttpError(401, 'Authentication required'));
          return;
        }

        if (!roles.includes(user.role)) {
          next(new HttpError(403, 'Insufficient permissions'));
          return;
        }

        next();
      })
      .catch(next);
  };
}
