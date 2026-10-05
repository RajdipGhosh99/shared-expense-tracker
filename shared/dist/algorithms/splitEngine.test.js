import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { calculateSplits } from './splitEngine.js';
import { simplifyDebts } from './debtEngine.js';
describe('SplitEngine (Zero-Drift Integer Minor Units)', () => {
    test('EQUAL split allocates odd remainder paise to first members and balances perfectly', () => {
        // ₹100.00 = 10,000 paise split 3 ways
        const result = calculateSplits({
            totalAmountMinorUnits: 10000,
            splitType: 'EQUAL',
            payerEmail: 'rahul@group.com',
            memberEmails: ['rahul@group.com', 'amit@group.com', 'priya@group.com'],
        });
        assert.equal(result.isValid, true);
        assert.equal(result.splits['rahul@group.com'], 3334);
        assert.equal(result.splits['amit@group.com'], 3333);
        assert.equal(result.splits['priya@group.com'], 3333);
        const sum = Object.values(result.splits).reduce((a, b) => a + b, 0);
        assert.equal(sum, 10000, 'Sum must equal 10,000 paise exactly');
    });
    test('EQUAL split respects absentMemberEmails (Vacation Mode)', () => {
        // ₹90.00 = 9,000 paise split between 2 active members (priya is away)
        const result = calculateSplits({
            totalAmountMinorUnits: 9000,
            splitType: 'EQUAL',
            payerEmail: 'rahul@group.com',
            memberEmails: ['rahul@group.com', 'amit@group.com', 'priya@group.com'],
            absentMemberEmails: ['priya@group.com'],
        });
        assert.equal(result.isValid, true);
        assert.equal(result.splits['rahul@group.com'], 4500);
        assert.equal(result.splits['amit@group.com'], 4500);
        assert.equal(result.splits['priya@group.com'], undefined);
    });
    test('EXACT split validates sum mismatch error', () => {
        const result = calculateSplits({
            totalAmountMinorUnits: 5000, // ₹50.00
            splitType: 'EXACT',
            payerEmail: 'rahul@group.com',
            memberEmails: ['rahul@group.com', 'amit@group.com'],
            exactAmountsMinorUnits: {
                'rahul@group.com': 2000,
                'amit@group.com': 2500, // Sum = 4500 != 5000
            },
        });
        assert.equal(result.isValid, false);
        assert.match(result.errorMessage || '', /does not match total bill/);
    });
    test('EXACT split without explicit mapping falls back to even exact allocation', () => {
        const result = calculateSplits({
            totalAmountMinorUnits: 10000,
            splitType: 'EXACT',
            payerEmail: 'rahul@group.com',
            memberEmails: ['rahul@group.com', 'amit@group.com'],
        });
        assert.equal(result.isValid, true);
        assert.equal(result.splits['rahul@group.com'], 5000);
        assert.equal(result.splits['amit@group.com'], 5000);
    });
    test('PERSONAL split allocates 100% to payer and 0 to other flatmates', () => {
        const result = calculateSplits({
            totalAmountMinorUnits: 15000, // ₹150.00
            splitType: 'PERSONAL',
            payerEmail: 'rahul@group.com',
            memberEmails: ['rahul@group.com', 'amit@group.com', 'priya@group.com'],
        });
        assert.equal(result.isValid, true);
        assert.equal(result.splits['rahul@group.com'], 15000);
        assert.equal(result.splits['amit@group.com'], 0);
        assert.equal(result.splits['priya@group.com'], 0);
        // Verify it produces 0 debt transactions in DebtEngine
        const members = [
            { email: 'rahul@group.com', name: 'Rahul' },
            { email: 'amit@group.com', name: 'Amit' },
            { email: 'priya@group.com', name: 'Priya' },
        ];
        const expenses = [{ payerEmail: 'rahul@group.com', splits: result.splits }];
        const debtResult = simplifyDebts('group-1', members, expenses, []);
        assert.equal(debtResult.simplifiedDebts.length, 0, 'Personal expense creates 0 debts');
    });
});
describe('DebtEngine (Min-Cash-Flow Simplification)', () => {
    test('Resolves circular debts to 0 transactions', () => {
        // Rahul paid 3000 for Amit
        // Amit paid 3000 for Priya
        // Priya paid 3000 for Rahul
        const members = [
            { email: 'rahul@group.com', name: 'Rahul', upiId: 'rahul@upi' },
            { email: 'amit@group.com', name: 'Amit', upiId: 'amit@upi' },
            { email: 'priya@group.com', name: 'Priya', upiId: 'priya@upi' },
        ];
        const expenses = [
            { payerEmail: 'rahul@group.com', splits: { 'rahul@group.com': 0, 'amit@group.com': 3000 } },
            { payerEmail: 'amit@group.com', splits: { 'amit@group.com': 0, 'priya@group.com': 3000 } },
            { payerEmail: 'priya@group.com', splits: { 'priya@group.com': 0, 'rahul@group.com': 3000 } },
        ];
        const result = simplifyDebts('group-1', members, expenses, []);
        assert.equal(result.netBalances['rahul@group.com'], 0);
        assert.equal(result.netBalances['amit@group.com'], 0);
        assert.equal(result.netBalances['priya@group.com'], 0);
        assert.equal(result.simplifiedDebts.length, 0, 'Circular debt collapses to 0 transfers');
    });
    test('Simplifies 3-party asymmetric debt into minimum 1 transaction', () => {
        const members = [
            { email: 'rahul@group.com', name: 'Rahul', upiId: 'rahul@upi' },
            { email: 'amit@group.com', name: 'Amit', upiId: 'amit@upi' },
            { email: 'priya@group.com', name: 'Priya', upiId: 'priya@upi' },
        ];
        // Rahul paid ₹60 (6000 paise) split equally 3 ways (2000 each)
        const expenses = [
            {
                payerEmail: 'rahul@group.com',
                splits: {
                    'rahul@group.com': 2000,
                    'amit@group.com': 2000,
                    'priya@group.com': 2000,
                },
            },
        ];
        const result = simplifyDebts('group-1', members, expenses, []);
        assert.equal(result.netBalances['rahul@group.com'], 4000); // Gets 4000
        assert.equal(result.netBalances['amit@group.com'], -2000); // Owes 2000
        assert.equal(result.netBalances['priya@group.com'], -2000); // Owes 2000
        assert.equal(result.simplifiedDebts.length, 2);
    });
});
//# sourceMappingURL=splitEngine.test.js.map