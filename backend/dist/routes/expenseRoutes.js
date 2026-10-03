import { Router } from 'express';
import { getStorage } from '../storage/index.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { DuplicateValidator } from '../validators/duplicateValidator.js';
import { AiCategoryService } from '../services/aiCategoryService.js';
import { calculateSplits, } from '@shared-expense-tracker/shared';
const router = Router();
// Add or Overwrite Expense
router.post('/', authMiddleware, async (req, res) => {
    const { groupId: reqGroupId, flatId: reqFlatId, title, amount, date, category: reqCategory, subCategory: reqSubCategory, notes, splitType, splits: customSplits, utrNumber, allowOverwrite, overwriteTargetId, } = req.body;
    const groupId = reqGroupId || reqFlatId;
    const user = req.user;
    const db = getStorage();
    if (!groupId || !title || !amount) {
        return res.status(400).json({ error: 'Group ID, title, and amount are required.' });
    }
    const expenseDate = date && typeof date === 'string' && date.trim().length > 0
        ? date.trim().slice(0, 10)
        : new Date().toISOString().slice(0, 10);
    const amountDisplay = parseFloat(amount);
    const amountMinorUnits = Math.round(amountDisplay * 100);
    let finalCategory = reqCategory;
    let finalSubCategory = reqSubCategory;
    if (!finalCategory || !finalSubCategory) {
        const aiPred = await AiCategoryService.predict(title);
        if (!finalCategory)
            finalCategory = aiPred.category;
        if (!finalSubCategory)
            finalSubCategory = aiPred.subCategory;
    }
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
    // 2. Calculate Splits (tenancy-aware based on expenseDate)
    const eligibleMembers = await db.getEligibleMembers(groupId, expenseDate);
    const activeEligible = eligibleMembers.filter((m) => m.eligibilityStatus === 'ACTIVE' || m.eligibilityStatus === 'PENDING_INVITE');
    const memberEmails = activeEligible.map((m) => m.userEmail);
    const absentEmails = activeEligible.filter((m) => m.isAway).map((m) => m.userEmail);
    let finalSplits = {};
    if (splitType === 'EXACT' && customSplits) {
        finalSplits = customSplits;
    }
    else {
        const splitCalc = calculateSplits({
            totalAmountMinorUnits: amountMinorUnits,
            splitType: splitType || 'EQUAL',
            payerEmail: user.email,
            memberEmails,
            absentMemberEmails: absentEmails,
        });
        if (!splitCalc.isValid) {
            return res.status(400).json({ error: splitCalc.errorMessage });
        }
        finalSplits = splitCalc.splits;
    }
    const isExpense = req.body.isExpense !== undefined
        ? Boolean(req.body.isExpense)
        : finalCategory !== 'Transfers & Adjustments' && finalCategory !== 'Transfers & Settlements';
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
            date: expenseDate,
            totalAmountMinorUnits: amountMinorUnits,
            totalAmountDisplay: amountDisplay,
            category: finalCategory || target.category,
            subCategory: finalSubCategory || target.subCategory,
            notes: notes !== undefined ? notes : target.notes,
            isExpense,
            splitType: splitType || target.splitType,
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
    const newExpense = {
        id: expenseId,
        groupId,
        flatId: groupId,
        payerEmail: user.email,
        title: title.trim(),
        date: expenseDate,
        expenseDate,
        billingPeriodStart: req.body.billingPeriodStart || req.body.billing_period_start || undefined,
        billingPeriodEnd: req.body.billingPeriodEnd || req.body.billing_period_end || undefined,
        totalAmountMinorUnits: amountMinorUnits,
        totalAmountDisplay: amountDisplay,
        category: finalCategory || 'Other',
        subCategory: finalSubCategory || (finalCategory === 'Other' ? 'Other' : undefined),
        notes: notes ? String(notes).trim() : undefined,
        isExpense,
        splitType: splitType || 'EQUAL',
        splits: finalSplits,
        utrNumber: utrNumber ? utrNumber.trim() : undefined,
        overwrittenFlag: 'NO',
        sheetSyncStatus: 'SYNCED',
        createdAt: `${expenseDate}T12:00:00.000Z`,
        updatedAt: new Date().toISOString(),
    };
    const created = await db.createExpense(newExpense);
    return res.status(201).json({ status: 'CREATED', expense: created });
});
// Batch / Multiple Expense Entry (Spreadsheet Grid)
router.post('/batch', authMiddleware, async (req, res) => {
    const { groupId: reqGroupId, flatId: reqFlatId, items } = req.body;
    const groupId = reqGroupId || reqFlatId;
    const user = req.user;
    const db = getStorage();
    if (!groupId || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Group ID and non-empty items array are required.' });
    }
    const allMembers = await db.getMembers(groupId);
    const members = allMembers.filter((m) => (m.status || 'ACTIVE') === 'ACTIVE');
    const memberEmails = members.map((m) => m.userEmail);
    const absentEmails = members.filter((m) => m.isAway).map((m) => m.userEmail);
    const createdExpenses = [];
    const errors = [];
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item.title || !item.title.trim() || item.amount === undefined || item.amount === null) {
            continue; // Skip empty rows
        }
        const amountDisplay = parseFloat(item.amount);
        if (isNaN(amountDisplay) || amountDisplay <= 0) {
            errors.push({ index: i, title: item.title, error: 'Invalid amount' });
            continue;
        }
        const amountMinorUnits = Math.round(amountDisplay * 100);
        const expenseDate = item.date && typeof item.date === 'string' && item.date.trim().length > 0
            ? item.date.trim().slice(0, 10)
            : new Date().toISOString().slice(0, 10);
        const eligibleMembers = await db.getEligibleMembers(groupId, expenseDate);
        const activeEligible = eligibleMembers.filter((m) => m.eligibilityStatus === 'ACTIVE' || m.eligibilityStatus === 'PENDING_INVITE');
        const itemMemberEmails = activeEligible.map((m) => m.userEmail);
        const itemAbsentEmails = activeEligible.filter((m) => m.isAway).map((m) => m.userEmail);
        const splitCalc = calculateSplits({
            totalAmountMinorUnits: amountMinorUnits,
            splitType: item.splitType || 'EQUAL',
            payerEmail: user.email,
            memberEmails: itemMemberEmails,
            absentMemberEmails: itemAbsentEmails,
        });
        if (!splitCalc.isValid) {
            errors.push({ index: i, title: item.title, error: splitCalc.errorMessage || 'Split failed' });
            continue;
        }
        const expenseId = `exp_${Date.now()}_${i}`;
        const newExpense = {
            id: expenseId,
            groupId,
            flatId: groupId,
            payerEmail: user.email,
            title: item.title.trim(),
            date: expenseDate,
            expenseDate,
            totalAmountMinorUnits: amountMinorUnits,
            totalAmountDisplay: amountDisplay,
            category: item.category || 'Household',
            splitType: item.splitType || 'EQUAL',
            splits: splitCalc.splits,
            utrNumber: item.utrNumber ? item.utrNumber.trim() : undefined,
            overwrittenFlag: 'NO',
            sheetSyncStatus: 'SYNCED',
            createdAt: `${expenseDate}T12:00:00.000Z`,
            updatedAt: new Date().toISOString(),
        };
        const created = await db.createExpense(newExpense);
        createdExpenses.push(created);
    }
    return res.status(201).json({
        status: 'BATCH_CREATED',
        count: createdExpenses.length,
        expenses: createdExpenses,
        errors,
    });
});
// List Expenses for Group
router.get('/', authMiddleware, async (req, res) => {
    const groupId = (req.query.groupId || req.query.flatId);
    if (!groupId)
        return res.status(400).json({ error: 'groupId query param is required.' });
    const db = getStorage();
    const expenses = await db.getExpenses(groupId);
    return res.json({ groupId, flatId: groupId, expenses });
});
// Delete Expense
router.delete('/:id', authMiddleware, async (req, res) => {
    const db = getStorage();
    const id = req.params.id;
    const deleted = await db.deleteExpense(id);
    return res.json({ success: deleted });
});
// AI Expense Categorization
router.post('/ai-categorize', authMiddleware, async (req, res) => {
    const { title } = req.body;
    if (!title || typeof title !== 'string') {
        return res.status(400).json({ error: 'Title is required' });
    }
    const prediction = await AiCategoryService.predictCategory(title);
    return res.json(prediction);
});
export default router;
//# sourceMappingURL=expenseRoutes.js.map