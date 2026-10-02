import { Router, Response } from 'express';
import { getStorage } from '../storage/index.js';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware.js';
import { DuplicateValidator } from '../validators/duplicateValidator.js';
import {
  Expense,
  calculateSplits,
  SplitType,
  ExpenseCategory,
} from '@shared-expense-tracker/shared';

const router = Router();

// Add or Overwrite Expense
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const {
    groupId: reqGroupId,
    flatId: reqFlatId,
    title,
    amount,
    category,
    splitType,
    splits: customSplits,
    utrNumber,
    allowOverwrite,
    overwriteTargetId,
  } = req.body;

  const groupId = reqGroupId || reqFlatId;
  const user = req.user!;
  const db = getStorage();

  if (!groupId || !title || !amount) {
    return res.status(400).json({ error: 'Group ID, title, and amount are required.' });
  }

  const amountDisplay = parseFloat(amount);
  const amountMinorUnits = Math.round(amountDisplay * 100);

  // 1. Deduplication Validation
  const validator = new DuplicateValidator(db);
  const validation = await validator.validate({
    groupId,
    flatId: groupId,
    payerEmail: user.email,
    title: title.trim(),
    amountMinorUnits,
    amountDisplay,
    utrNumber,
    allowOverwrite: Boolean(allowOverwrite),
    overwriteTargetId,
  });

  if (!validation.canProceed) {
    // 409 Conflict with Linked IDs and Google Sheet direct links
    return res.status(409).json(validation.conflict);
  }

  // 2. Calculate Splits
  const members = await db.getMembers(groupId);
  const memberEmails = members.map((m) => m.userEmail);
  const absentEmails = members.filter((m) => m.isAway).map((m) => m.userEmail);

  let finalSplits: Record<string, number> = {};

  if (splitType === 'EXACT' && customSplits) {
    finalSplits = customSplits;
  } else {
    const splitCalc = calculateSplits({
      totalAmountMinorUnits: amountMinorUnits,
      splitType: (splitType as SplitType) || 'EQUAL',
      payerEmail: user.email,
      memberEmails,
      absentMemberEmails: absentEmails,
    });

    if (!splitCalc.isValid) {
      return res.status(400).json({ error: splitCalc.errorMessage });
    }
    finalSplits = splitCalc.splits;
  }

  // 3. Overwrite vs New Insert
  if (validation.isOverwrite && validation.targetExpense) {
    const target = validation.targetExpense;
    const historyEntry = {
      previousAmount: target.totalAmountDisplay,
      previousTitle: target.title,
      overwrittenAt: new Date().toISOString(),
      overwrittenBy: user.email,
    };

    const updated = await db.updateExpense(target.id, {
      title: title.trim(),
      totalAmountMinorUnits: amountMinorUnits,
      totalAmountDisplay: amountDisplay,
      category: (category as ExpenseCategory) || target.category,
      splitType: (splitType as SplitType) || target.splitType,
      splits: finalSplits,
      utrNumber: utrNumber || target.utrNumber,
      overwrittenFlag: 'YES',
      historyLog: JSON.stringify(historyEntry),
    });

    return res.json({
      status: 'OVERWRITTEN',
      expense: updated,
      message: `Successfully updated #${target.id}.`,
    });
  }

  // Fresh Insert
  const expenseId = `exp_${Date.now()}`;
  const newExpense: Expense = {
    id: expenseId,
    groupId,
    flatId: groupId,
    payerEmail: user.email,
    title: title.trim(),
    totalAmountMinorUnits: amountMinorUnits,
    totalAmountDisplay: amountDisplay,
    category: (category as ExpenseCategory) || 'Household',
    splitType: (splitType as SplitType) || 'EQUAL',
    splits: finalSplits,
    utrNumber: utrNumber ? utrNumber.trim() : undefined,
    overwrittenFlag: 'NO',
    sheetSyncStatus: 'PENDING',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const created = await db.createExpense(newExpense);
  return res.status(201).json({ status: 'CREATED', expense: created });
});

// List Expenses for Group
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const groupId = (req.query.groupId || req.query.flatId) as string;
  if (!groupId) return res.status(400).json({ error: 'groupId query param is required.' });

  const db = getStorage();
  const expenses = await db.getExpenses(groupId);
  return res.json({ groupId, flatId: groupId, expenses });
});

// Delete Expense
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const db = getStorage();
  const id = req.params.id as string;
  const deleted = await db.deleteExpense(id);
  return res.json({ success: deleted });
});

export default router;
