import { Router, Response } from 'express';
import { getStorage } from '../storage/index.js';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware.js';
import {
  Settlement,
  simplifyDebts,
  generateUPIDeepLink,
} from '@shared-expense-tracker/shared';

const router = Router();

// Calculate Balances & Simplified Debts (Min-Cash-Flow)
router.get('/balances', authMiddleware, async (req: AuthRequest, res: Response) => {
  const flatId = req.query.flatId as string;
  if (!flatId) return res.status(400).json({ error: 'flatId query param is required.' });

  const db = getStorage();
  const members = await db.getMembers(flatId);
  const expenses = await db.getExpenses(flatId);
  const settlements = await db.getSettlements(flatId);

  const memberLookups = members.map((m) => ({
    email: m.userEmail,
    name: m.name,
    upiId: m.upiId,
  }));

  const expenseRecords = expenses.map((e) => ({
    payerEmail: e.payerEmail,
    splits: e.splits,
  }));

  const settlementRecords = settlements.map((s) => ({
    payerEmail: s.payerEmail,
    receiverEmail: s.receiverEmail,
    amountMinorUnits: s.amountMinorUnits,
  }));

  const balanceSheet = simplifyDebts(
    flatId,
    memberLookups,
    expenseRecords,
    settlementRecords
  );

  // Attach dynamic UPI deep links to each simplified transaction
  const transactionsWithUPI = balanceSheet.simplifiedDebts.map((tx) => {
    let upiLink: string | undefined;
    if (tx.receiverUPI) {
      upiLink = generateUPIDeepLink({
        receiverUPI: tx.receiverUPI,
        receiverName: tx.receiverName || tx.toUserEmail,
        amountMinorUnits: tx.amountMinorUnits,
        note: 'Flat Settlement',
      });
    }
    return { ...tx, upiLink };
  });

  return res.json({
    flatId,
    netBalances: balanceSheet.netBalances,
    simplifiedDebts: transactionsWithUPI,
  });
});

// Record Settlement
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { flatId, receiverEmail, amount, notes } = req.body;
  const user = req.user!;

  if (!flatId || !receiverEmail || !amount) {
    return res.status(400).json({ error: 'flatId, receiverEmail, and amount are required.' });
  }

  const amountDisplay = parseFloat(amount);
  const amountMinorUnits = Math.round(amountDisplay * 100);

  const settlement: Settlement = {
    id: `set_${Date.now()}`,
    flatId,
    payerEmail: user.email,
    receiverEmail,
    amountMinorUnits,
    amountDisplay,
    notes,
    settledAt: new Date().toISOString(),
  };

  const db = getStorage();
  const saved = await db.createSettlement(settlement);
  return res.status(201).json({ settlement: saved });
});

// List Settlement History
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const flatId = req.query.flatId as string;
  if (!flatId) return res.status(400).json({ error: 'flatId is required.' });

  const db = getStorage();
  const settlements = await db.getSettlements(flatId);
  return res.json({ settlements });
});

export default router;
