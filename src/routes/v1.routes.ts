import express from 'express';
import { listToolsOnce, runActionOnce } from '../controllers/v1/runController';

const v1Router = express.Router({ mergeParams: true });

// List Tools Once
v1Router.get('/:owner/:repo', listToolsOnce);
// Run Action Once
v1Router.post('/:owner/:repo/:action', runActionOnce);

// SSE
v1Router.get('/:owner/:repo/:action/sse', );

export default v1Router;
