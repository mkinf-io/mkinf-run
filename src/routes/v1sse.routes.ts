import express from 'express';
import { messages, sse } from '../controllers/v1/sseController';
import { auth } from '../middleware/auth';
import { stripeSetup } from '../middleware/stripe';

const v1sseRouter = express.Router({ mergeParams: true });

// SSE
v1sseRouter.post('/:owner/:repo/messages', messages);
v1sseRouter.get('/:owner/:repo/sse', auth, stripeSetup, sse);

export default v1sseRouter;
