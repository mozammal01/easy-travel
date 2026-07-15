import { NextFunction, Request, Response } from 'express';
import { ZodTypeAny } from 'zod';
import { HttpError } from './errorHandler';

export function validateBody(schema: ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join('; ');
      next(new HttpError(400, message));
      return;
    }
    req.body = result.data;
    next();
  };
}
