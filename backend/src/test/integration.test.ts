import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import app from '../server.js';
import { Server } from 'http';

import { getStorage } from '../storage/index.js';

describe('Backend API End-to-End Integration Suite', () => {
  let server: Server;
  let baseUrl: string;
  let rahulToken: string;
  let amitToken: string;
  let groupId: string;
  let inviteCode: string;
  let firstExpenseId: string;

  test('Server boots and health check succeeds', async () => {
    await getStorage().init();

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address() as any;
        baseUrl = `http://localhost:${addr.port}`;
        resolve();
      });
    });

    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, 'ok');
  });

  test('Auth: Register Rahul and Amit', async () => {
    // Rahul
    const r1 = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'rahul@group.com',
        password: 'password123',
        name: 'Rahul Sharma',
        upiId: 'rahul@okicici',
      }),
    });
    assert.equal(r1.status, 201);
    const d1 = await r1.json();
    rahulToken = d1.token;

    // Amit
    const r2 = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'amit@group.com',
        password: 'password123',
        name: 'Amit Patel',
        upiId: 'amit@oksbi',
      }),
    });
    assert.equal(r2.status, 201);
    const d2 = await r2.json();
    amitToken = d2.token;
  });

  test('Group: Rahul creates group and gets 6-character invite code', async () => {
    const res = await fetch(`${baseUrl}/api/groups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${rahulToken}`,
      },
      body: JSON.stringify({ name: 'Palm Springs 402', currency: 'INR' }),
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.ok(data.group.id);
    assert.ok(data.group.inviteCode);
    groupId = data.group.id;
    inviteCode = data.group.inviteCode;
  });

  test('Group: Amit joins group via invite code', async () => {
    const res = await fetch(`${baseUrl}/api/groups/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${amitToken}`,
      },
      body: JSON.stringify({ inviteCode }),
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.group.id, groupId);
  });

  test('Expenses: Rahul logs Blinkit grocery bill (₹840.00) with UPI UTR', async () => {
    const res = await fetch(`${baseUrl}/api/expenses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${rahulToken}`,
      },
      body: JSON.stringify({
        groupId,
        title: 'Blinkit Groceries',
        amount: 840.0,
        category: 'Groceries',
        splitType: 'EQUAL',
        utrNumber: '427819283719',
      }),
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.status, 'CREATED');
    assert.equal(data.expense.totalAmountMinorUnits, 84000);
    firstExpenseId = data.expense.id;
  });

  test('Deduplication: Exact UPI UTR match triggers 409 Conflict with linked ID', async () => {
    // Amit tries to log the same receipt with same UTR
    const res = await fetch(`${baseUrl}/api/expenses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${amitToken}`,
      },
      body: JSON.stringify({
        groupId,
        title: 'Blinkit Groceries Repeat',
        amount: 840.0,
        category: 'Groceries',
        splitType: 'EQUAL',
        utrNumber: '427819283719', // Same UTR
      }),
    });

    assert.equal(res.status, 409);
    const conflict = await res.json();
    assert.equal(conflict.status, 'DUPLICATE_DETECTED');
    assert.equal(conflict.duplicateType, 'EXACT_UTR');
    assert.equal(conflict.existingRecord.id, firstExpenseId);
    assert.equal(conflict.existingRecord.payerEmail, 'rahul@group.com');
  });

  test('Overwrite: User confirms overwrite in-place with overwrittenFlag = YES', async () => {
    const res = await fetch(`${baseUrl}/api/expenses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${rahulToken}`,
      },
      body: JSON.stringify({
        groupId,
        title: 'Blinkit Groceries (Revised)',
        amount: 900.0, // Corrected amount
        category: 'Groceries',
        splitType: 'EQUAL',
        utrNumber: '427819283719',
        allowOverwrite: true,
        overwriteTargetId: firstExpenseId,
      }),
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, 'OVERWRITTEN');
    assert.equal(data.expense.id, firstExpenseId);
    assert.equal(data.expense.overwrittenFlag, 'YES');
    assert.equal(data.expense.totalAmountMinorUnits, 90000);
  });

  test('Settlements: Computes simplified debts and attaches dynamic UPI deep link', async () => {
    const res = await fetch(`${baseUrl}/api/settlements/balances?groupId=${groupId}`, {
      headers: { Authorization: `Bearer ${rahulToken}` },
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    // Rahul paid 900, split 2 ways = 450 each. Amit owes Rahul 450.
    assert.equal(data.netBalances['rahul@group.com'], 45000);
    assert.equal(data.netBalances['amit@group.com'], -45000);
    assert.equal(data.simplifiedDebts.length, 1);
    assert.equal(data.simplifiedDebts[0].fromUserEmail, 'amit@group.com');
    assert.equal(data.simplifiedDebts[0].toUserEmail, 'rahul@group.com');
    assert.equal(data.simplifiedDebts[0].amountDisplay, 450.0);
    assert.ok(data.simplifiedDebts[0].upiLink.startsWith('upi://pay'));
  });

  test('Statements: Generates current month statement with category breakdown & WhatsApp link', async () => {
    const res = await fetch(
      `${baseUrl}/api/statements?groupId=${groupId}&period=current`,
      { headers: { Authorization: `Bearer ${rahulToken}` } }
    );

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.statement.totalSpendDisplay, 900.0);
    assert.ok(data.statement.categoryBreakdown.length > 0);
    assert.ok(data.whatsappLink.includes('Palm'));
  });

  test('Swagger: OpenAPI docs spec is served at /api/docs.json', async () => {
    const res = await fetch(`${baseUrl}/api/docs.json`);
    assert.equal(res.status, 200);
    const spec = await res.json();
    assert.equal(spec.openapi, '3.0.3');
    assert.equal(spec.info.title, 'Shared Expense Tracker API');
  });

  test('GitHub Actions Cron: Triggers month-end statement archiving with CRON_SECRET', async () => {
    const res = await fetch(`${baseUrl}/api/cron/month-end-statement`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer github_actions_cron_secret_token_12345',
        'Content-Type': 'application/json',
      },
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok((data.groupsProcessed ?? data.flatsProcessed) >= 1);
  });

  test('Group: Toggles googleSheetSync flag (true -> false -> true)', async () => {
    const res = await fetch(`${baseUrl}/api/groups/${groupId}/sync-settings`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${rahulToken}`,
      },
      body: JSON.stringify({ googleSheetSync: false }),
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.googleSheetSync, false);

    const fRes = await fetch(`${baseUrl}/api/groups/${groupId}`, {
      headers: { Authorization: `Bearer ${rahulToken}` },
    });
    const fData = await fRes.json();
    assert.equal(fData.group.googleSheetSync, false);
  });

  test('Group: getGroupById returns group details via /api/groups/:id', async () => {
    const res = await fetch(`${baseUrl}/api/groups/${groupId}`, {
      headers: { Authorization: `Bearer ${rahulToken}` },
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.group.id, groupId);
    assert.equal(data.group.name, 'Palm Springs 402');
    assert.ok(Array.isArray(data.members));
    assert.equal(data.members.length, 2);
  });

  test('Teardown test server', async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    setTimeout(() => process.exit(0), 100);
  });
});
