import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
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

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Initialize Storage (Turso tables & Google Sheets tabs)
const storage = getStorage();
storage.init().then(() => {
  console.log(`[Storage] Initialized successfully in mode: ${process.env.STORAGE_MODE || 'dual'}`);
}).catch((err) => {
  console.error('[Storage] Init warning:', err);
});

// Swagger Interactive API Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api/docs.json', (req, res) => {
  res.json(swaggerSpec);
});

// Health check
app.get('/api/health', (req, res) => {
  const googleSheetSync = process.env.GOOGLE_SHEET_SYNC !== 'false' && process.env.STORAGE_MODE !== 'turso';
  res.json({
    status: 'ok',
    storageMode: process.env.STORAGE_MODE || 'dual',
    googleSheetSync,
    docs: '/api/docs',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/flats', groupRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/settlements', settleRoutes);
app.use('/api/statements', statementRoutes);
app.use('/api/cron', cronRoutes);

// Only listen if not imported for tests and not inside Vercel serverless wrapper
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`🚀 Shared Expense Tracker API running on http://localhost:${port}`);
    console.log(`📖 Swagger API Docs available at http://localhost:${port}/api/docs`);
  });
}

export default app;
