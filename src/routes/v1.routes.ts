import express from 'express';
import { listToolsOnce, runActionOnce } from '../controllers/v1/runController';
import { messages, sse } from '../controllers/v1/sseController';

const v1Router = express.Router({ mergeParams: true });

// SSE
v1Router.get('/:owner/:repo/sse', sse);

// List Tools Once
v1Router.get('/:owner/:repo', listToolsOnce);
// Run Action Once
v1Router.post('/:owner/:repo/:action', runActionOnce);


export default v1Router;
