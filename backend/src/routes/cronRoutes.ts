import { Router, Request, Response } from 'express';
import { getStorage } from '../storage/index.js';
import { generateStatement } from '../services/statementService.js';

const router = Router();

// Endpoint triggered by GitHub Actions Cron
router.post('/month-end-statement', async (req: Request, res: Response) => {
  const cronSecret = process.env.CRON_SECRET || 'github_actions_cron_secret_token_12345';
  const authHeader = req.headers.authorization;

  if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized: Invalid CRON_SECRET token' });
  }

  const db = getStorage();
  const flats = await db.getAllFlats();

  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const startDate = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1)
    .toISOString()
    .split('T')[0];
  const endDate = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0)
    .toISOString()
    .split('T')[0];
  const monthLabel = lastMonth.toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });

  const results: any[] = [];

  for (const flat of flats) {
    try {
      const statement = await generateStatement(
        { flatId: flat.id, startDate, endDate, monthLabel },
        db
      );

      // Save immutable snapshot to Turso & Google Sheet
      await db.saveMonthlyStatement(statement);
      results.push({ flatId: flat.id, flatName: flat.name, status: 'ARCHIVED' });
    } catch (err: any) {
      console.error(`[Cron] Failed to archive statement for flat ${flat.id}:`, err);
      results.push({ flatId: flat.id, status: 'ERROR', message: err.message });
    }
  }

  return res.json({
    success: true,
    month: monthLabel,
    flatsProcessed: results.length,
    results,
  });
});

export default router;
