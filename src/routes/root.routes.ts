import express from 'express';
import { allRoot } from '../controllers/rootController';
import { welcome } from '../controllers/v1/v1Controller';
import { auth } from '../middleware/auth';
import { stripeSetup } from '../middleware/stripe';
import v1Router from './v1.routes';
import v1sseRouter from './v1sse.routes';

const rootRouter = express.Router({ mergeParams: true });

rootRouter.use("/v1", v1sseRouter);

rootRouter.use(express.json({ limit: '10mb' }));

rootRouter.all('/', allRoot);

rootRouter.all('/v0.1', welcome);
rootRouter.use('/v0.1', auth, stripeSetup, v1Router);

rootRouter.all('/v1', welcome);
rootRouter.use('/v1', auth, stripeSetup, v1Router);

export default rootRouter;
