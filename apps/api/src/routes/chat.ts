import { Router } from 'express';
import { chatRequestSchema, type ChatRequest } from '@meghjatra/shared';
import { requireAuth } from '../middleware/requireAuth';
import { validateBody } from '../middleware/validate';
import { asyncHandler } from '../lib/asyncHandler';
import { getChatReply } from '../services/chat.service';

export const chatRouter = Router();

chatRouter.post(
  '/',
  requireAuth,
  validateBody(chatRequestSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as ChatRequest;
    const content = await getChatReply(body);
    res.json({ message: { role: 'assistant', content } });
  }),
);
