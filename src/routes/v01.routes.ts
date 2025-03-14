import express from 'express';
import { listToolsOnce, runActionOnce } from '../controllers/v1/runController';

const v01Router = express.Router({ mergeParams: true });

// List Tools Once
v01Router.get('/:owner/:repo', listToolsOnce);
// Run Action Once
v01Router.post('/:owner/:repo/:action', runActionOnce);


export default v01Router;
