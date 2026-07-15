import { Request, Response } from 'express';

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: { message: `Not found: ${req.method} ${req.originalUrl}`, status: 404 },
  });
}
