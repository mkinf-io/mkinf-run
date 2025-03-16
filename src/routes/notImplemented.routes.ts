import express from 'express';
import { notImplemented } from '../controllers/notImplementedController';

const notImplementedRouter = express.Router({ mergeParams: true });

notImplementedRouter.all('*', notImplemented);

export default notImplementedRouter;
