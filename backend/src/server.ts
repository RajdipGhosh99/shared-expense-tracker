import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import { getStorage } from './storage/index.js';
import { swaggerSpec } from './docs/swaggerSpec.js';
import authRoutes from './routes/authRoutes.js';
import groupRoutes from './routes/groupRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import receiptRoutes from './routes/receiptRoutes.js';
import settleRoutes from './routes/settleRoutes.js';
import statementRoutes from './routes/statementRoutes.js';
import cronRoutes from './routes/cronRoutes.js';
import inviteRoutes from './routes/inviteRoutes.js';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Initialize Storage (Turso / SQLite database)
const storage = getStorage();
storage
  .init()
  .then(() => {
    console.log('[Storage] Initialized successfully in SQLite/Turso mode');
  })
  .catch((err) => {
    console.error('[Storage] Init warning:', err);
  });

// Swagger Interactive API Documentation
app.get(['/api/docs', '/docs'], (req, res) => {
  res.send(`<!DOCTYPE html>
<html>
<head>
  <title>Shared Expense Tracker - API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
</head>
<body style="margin:0;background:#fafafa;">
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: '/api/docs.json',
      dom_id: '#swagger-ui'
    });
  </script>
</body>
</html>`);
});
app.get('/api/docs.json', (req, res) => {
  res.json(swaggerSpec);
});

// Health check
app.get(['/api/health', '/health'], (req, res) => {
  res.json({
    status: 'ok',
    storageMode: 'turso',
    docs: '/api/docs',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use(['/api/auth', '/auth'], authRoutes);
app.use(['/api/groups', '/groups'], groupRoutes);
app.use(['/api/flats', '/flats'], groupRoutes);
app.use(['/api/expenses', '/expenses'], expenseRoutes);
app.use(['/api/receipts', '/receipts'], receiptRoutes);
app.use(['/api/settlements', '/settlements'], settleRoutes);
app.use(['/api/statements', '/statements'], statementRoutes);
app.use(['/api/cron', '/cron'], cronRoutes);
app.use(['/api/invites', '/invites'], inviteRoutes);
app.use('/api', inviteRoutes);

// 404 Endpoint Not Found fallback
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found', path: req.originalUrl });
});

// Process safety handlers for background sync errors
process.on('unhandledRejection', (reason) => {
  console.warn('[Server] Unhandled background rejection captured:', reason);
});

process.on('uncaughtException', (err) => {
  console.warn('[Server] Uncaught exception captured:', err);
});

// Only listen if not imported for tests and not inside Vercel serverless wrapper
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`🚀 Shared Expense Tracker API running on http://localhost:${port}`);
    console.log(`📖 Swagger API Docs available at http://localhost:${port}/api/docs`);
  });
}

export default app;
