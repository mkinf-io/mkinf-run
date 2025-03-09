import express from 'express';
import { closeRunSession, listTools, listToolsOnce, runAction, runActionOnce, startRunSession } from '../controllers/v1/runController';

const v1Router = express.Router({ mergeParams: true });

// Session List Tools
v1Router.get('/sessions/:sessionId', listTools);
// Session Run Action
v1Router.post('/sessions/:sessionId/:action', runAction);
// Close Session
v1Router.delete('/sessions/:sessionId', closeRunSession);
// Start Session
v1Router.post('/:owner/:repo', startRunSession);
v1Router.post('/:owner/:repo@:version', startRunSession);
// List Tools Once
v1Router.get('/:owner/:repo', listToolsOnce);
// Run Action Once
v1Router.post('/:owner/:repo/:action', runActionOnce);

export default v1Router;
