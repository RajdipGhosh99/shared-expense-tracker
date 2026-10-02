import { Router, Response } from 'express';
import { getStorage } from '../storage/index.js';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware.js';
import { generateStatement } from '../services/statementService.js';
import { formatWhatsAppMonthlyDigest } from '@shared-expense-tracker/shared';

const router = Router();

// On-Demand Statement
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const groupId = (req.query.groupId || req.query.flatId) as string;
  const period = (req.query.period as string) || 'current'; // 'current' | 'last' | 'custom'

  if (!groupId) return res.status(400).json({ error: 'groupId query param is required.' });

  const now = new Date();
  let startDate = '';
  let endDate = '';
  let label = '';

  if (period === 'current') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    startDate = start.toISOString().split('T')[0];
    endDate = end.toISOString().split('T')[0];
    label = now.toLocaleString('default', { month: 'long', year: 'numeric' });
  } else if (period === 'last') {
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const start = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
    const end = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);
    startDate = start.toISOString().split('T')[0];
    endDate = end.toISOString().split('T')[0];
    label = lastMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
  } else {
    // Custom Range
    startDate = (req.query.startDate as string) || now.toISOString().split('T')[0];
    endDate = (req.query.endDate as string) || now.toISOString().split('T')[0];
    label = `${startDate} to ${endDate}`;
  }

  const db = getStorage();
  const statement = await generateStatement(
    { flatId: groupId, startDate, endDate, monthLabel: label },
    db
  );

  const whatsappLink = formatWhatsAppMonthlyDigest(statement);

  return res.json({ statement, whatsappLink });
});

// List Archived Statements
router.get('/history', authMiddleware, async (req: AuthRequest, res: Response) => {
  const groupId = (req.query.groupId || req.query.flatId) as string;
  if (!groupId) return res.status(400).json({ error: 'groupId is required.' });

  const db = getStorage();
  const statements = await db.getMonthlyStatements(groupId);
  return res.json({ statements });
});

export default router;
