import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import DB from './middleware/db';
import logging from './middleware/logging';
import notImplementedRoutes from './routes/notImplemented.routes';
import rootRoutes from './routes/root.routes';
import './types/arrayExtensions';
import './types/express';

const app = express();
const port = process.env.PORT || 3434;

// app.use(logging.requestLogger);
app.use(express.json({ limit: '10mb' }));
app.use(cors());
app.use(DB.init);
app.use(rootRoutes);
app.use(notImplementedRoutes);
// app.use(logging.errorLogger);

process.on('exit', logging.flush);

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

app.listen(port, () => console.log(`mkinf run API 👾 v1 is running on http://localhost:${port}`));
