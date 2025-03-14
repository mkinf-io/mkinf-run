import express from 'express';
import { allRoot } from '../controllers/rootController';
import { messages } from '../controllers/v1/sseController';
import { welcome } from '../controllers/v1/v1Controller';
import { auth } from '../middleware/auth';
import { stripeSetup } from '../middleware/stripe';
import v1Router from './v1.routes';

const rootRouter = express.Router({ mergeParams: true });

rootRouter.all('/', allRoot);

rootRouter.all('/v0.1', welcome);
rootRouter.use('/v0.1', auth, stripeSetup, v1Router);

rootRouter.all('/v1', welcome);
rootRouter.post('/v1/:owner/:repo/messages', messages);
rootRouter.use('/v1', auth, stripeSetup, v1Router);

export default rootRouter;
