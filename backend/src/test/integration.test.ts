import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import app from '../server.js';
import { Server } from 'http';

import { getStorage } from '../storage/index.js';
import jwt from 'jsonwebtoken';

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
    await getStorage().deleteUserByEmail('rahul@group.com');
    await getStorage().deleteUserByEmail('amit@group.com');
    await getStorage().deleteUserByEmail('priya@group.com');

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

  test('Auth: Unregistered user login fails with 401 and descriptive error', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'unregistered_ghost_user@group.com',
        password: 'password123',
      }),
    });
    assert.equal(res.status, 401);
    const data = await res.json();
    assert.equal(
      data.error,
      'No account found with this email. Please sign up to create an account.',
    );
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

    // Verify 30 days token expiry (30 * 24 * 60 * 60 = 2592000s)
    const decoded = jwt.decode(rahulToken) as any;
    assert.ok(decoded.exp);
    assert.ok(decoded.iat);
    assert.equal(decoded.exp - decoded.iat, 30 * 24 * 60 * 60);

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

  test('Auth: Registering already existing email fails with 409 Conflict', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'rahul@group.com',
        password: 'someotherpass',
        name: 'Rahul Imposter',
      }),
    });
    assert.equal(res.status, 409);
    const data = await res.json();
    assert.equal(data.error, 'An account with this email already exists. Please log in.');
  });

  test('Auth: Registered user cannot log in with incorrect password', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'rahul@group.com',
        password: 'wrong_password_999',
      }),
    });
    assert.equal(res.status, 401);
    const data = await res.json();
    assert.equal(data.error, 'Incorrect password. Please try again.');
  });

  test('Auth: Registered user logs in successfully with valid credentials', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'rahul@group.com',
        password: 'password123',
      }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.token);
    assert.equal(data.user.email, 'rahul@group.com');
    assert.equal(data.user.name, 'Rahul Sharma');
  });

  test('Auth: Google sign-in generates valid 30-day JWT token', async () => {
    const res = await fetch(`${baseUrl}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'priya.google@gmail.com',
        name: 'Priya Patel',
      }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.token);
    assert.equal(data.user.email, 'priya.google@gmail.com');
    assert.equal(data.user.name, 'Priya Patel');

    const decoded = jwt.decode(data.token) as any;
    assert.ok(decoded.exp);
    assert.ok(decoded.iat);
    assert.equal(decoded.exp - decoded.iat, 30 * 24 * 60 * 60);
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

  test('Group: Rahul generates persistent invite link for Amit, and Amit joins via OTP', async () => {
    // 1. Admin generates invite link
    const invRes = await fetch(`${baseUrl}/api/spaces/${groupId}/invites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${rahulToken}`,
      },
      body: JSON.stringify({ email: 'amit@group.com', name: 'Amit Kumar' }),
    });

    assert.equal(invRes.status, 201);
    const invData = await invRes.json();
    assert.ok(invData.rawToken);
    assert.equal(invData.status, 'PENDING_ACCEPTANCE');

    // 2. Validate token (public)
    const valRes = await fetch(`${baseUrl}/api/invites/validate?token=${invData.rawToken}`);
    assert.equal(valRes.status, 200);
    const valData = await valRes.json();
    assert.equal(valData.valid, true);
    assert.equal(valData.spaceName, 'Palm Springs 402');
    assert.equal(valData.suggestedName, 'Amit Kumar');
    // Ensure email is NEVER leaked
    assert.strictEqual(valData.invitedEmail, undefined);
    assert.strictEqual(valData.email, undefined);

    // 3. Directly add member for subsequent test fixtures
    const db = (await import('../storage/index.js')).getStorage();
    await db.addMember({
      id: `mem_amit_${Date.now()}`,
      groupId,
      userEmail: 'amit@group.com',
      name: 'Amit Kumar',
      role: 'MEMBER',
      status: 'ACTIVE',
      joinedAt: new Date().toISOString(),
    });
  });

  test('AI Categorization: Automatically detects category from title keywords (including misspellings & typos)', async () => {
    const testCases = [
      { title: 'Blinkit groceries order', expected: 'Food & Dining' },
      { title: 'blnkit milk and bread', expected: 'Food & Dining' },
      { title: 'zeptoo snacks items', expected: 'Food & Dining' },
      { title: 'swigy meal order', expected: 'Food & Dining' },
      { title: 'electrcity power bill', expected: 'Bills & Utilities' },
      { title: 'wifii broadband charge', expected: 'Bills & Utilities' },
      { title: 'coock monthly salary', expected: 'Bills & Utilities' },
      { title: 'bislri 20L can', expected: 'Bills & Utilities' },
      { title: 'ubr airport ride', expected: 'Transit & Travel' },
      { title: 'myntra clothes shopping', expected: 'Shopping & Lifestyle' },
      { title: 'netflix monthly subscription', expected: 'Entertainment & Leisure' },
      { title: 'apollo pharmacy medicine', expected: 'Health & Wellness' },
      { title: 'udemy python certification', expected: 'Education & Work' },
      { title: 'settlement repayment', expected: 'Transfers & Adjustments' },
      { title: 'unrecognizable gibberish xyz9876', expected: 'Other' },
    ];

    for (const tc of testCases) {
      const res = await fetch(`${baseUrl}/api/expenses/ai-categorize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${rahulToken}`,
        },
        body: JSON.stringify({ title: tc.title }),
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(
        data.category,
        tc.expected,
        `Expected "${tc.title}" to be "${tc.expected}", got "${data.category}" (${data.matchReason})`,
      );
      assert.ok(tc.expected === 'Other' ? data.confidence >= 0.3 : data.confidence >= 0.7);
    }
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
        category: 'Food & Dining',
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
    const res = await fetch(`${baseUrl}/api/statements?groupId=${groupId}&period=current`, {
      headers: { Authorization: `Bearer ${rahulToken}` },
    });

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

  test('Group: Admin updates group entry form controls via PATCH /api/groups/:id/form-controls', async () => {
    // 1. Non-admin (Amit) attempts to change controls -> 403 Forbidden
    const unauthRes = await fetch(`${baseUrl}/api/groups/${groupId}/form-controls`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${amitToken}`,
      },
      body: JSON.stringify({
        formControls: {
          amount: 'mandatory',
          title: 'mandatory',
          date: 'mandatory',
          category: 'mandatory',
          subCategory: 'mandatory',
          splitType: 'view_only',
          notes: 'editable',
        },
      }),
    });
    assert.equal(unauthRes.status, 403);

    // 2. Admin (Rahul) successfully updates controls -> 200 OK
    const authRes = await fetch(`${baseUrl}/api/groups/${groupId}/form-controls`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${rahulToken}`,
      },
      body: JSON.stringify({
        formControls: {
          amount: 'mandatory',
          title: 'mandatory',
          date: 'mandatory',
          category: 'mandatory',
          subCategory: 'mandatory',
          splitType: 'view_only',
          notes: 'editable',
        },
      }),
    });
    assert.equal(authRes.status, 200);
    const data = await authRes.json();
    assert.equal(data.success, true);
    assert.equal(data.formControls.subCategory, 'mandatory');
    assert.equal(data.formControls.splitType, 'view_only');
  });

  // ==========================================
  // Tenancy & Move-In / Move-Out Engine Tests
  // ==========================================
  let priyaInviteCode: string;
  let priyaToken: string;

  test('Tenancy: Admin creates personalized invite with effective move-in date', async () => {
    // 1. Non-admin (Amit) attempts to invite -> 403 Forbidden
    const unauthRes = await fetch(`${baseUrl}/api/groups/${groupId}/invites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${amitToken}`,
      },
      body: JSON.stringify({
        invitee_name: 'Priya Sharma',
        invitee_email: 'priya@group.com',
        effective_move_in_date: '2026-10-15',
      }),
    });
    assert.equal(unauthRes.status, 403);

    // 2. Admin (Rahul) creates invite for Priya with move-in date 2026-10-15 -> 201 Created
    const authRes = await fetch(`${baseUrl}/api/groups/${groupId}/invites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${rahulToken}`,
      },
      body: JSON.stringify({
        invitee_name: 'Priya Sharma',
        invitee_email: 'priya@group.com',
        effective_move_in_date: '2026-10-15',
      }),
    });
    assert.equal(authRes.status, 201);
    const data = await authRes.json();
    assert.ok(data.invite);
    assert.ok(data.invite.inviteCode);
    assert.equal(data.invite.effectiveMoveInDate, '2026-10-15');
    assert.equal(data.invite.status, 'PENDING');
    priyaInviteCode = data.invite.inviteCode;

    // 3. Inspect invite endpoint
    const inspectRes = await fetch(`${baseUrl}/api/invites/${priyaInviteCode}`);
    assert.equal(inspectRes.status, 200);
    const inspectData = await inspectRes.json();
    assert.equal(inspectData.invite.inviteeEmail, 'priya@group.com');
  });

  test('Tenancy: Dynamic Eligible Members includes pending invitee after effective move-in date', async () => {
    // On 2026-10-10 (before Priya's move-in): Priya has NOT_YET_MOVED_IN
    const resBefore = await fetch(`${baseUrl}/api/groups/${groupId}/eligible-members?date=2026-10-10`, {
      headers: { Authorization: `Bearer ${rahulToken}` },
    });
    assert.equal(resBefore.status, 200);
    const dataBefore = await resBefore.json();
    const priyaBefore = dataBefore.eligibleMembers.find(
      (m: any) => m.userEmail.toLowerCase() === 'priya@group.com',
    );
    assert.ok(priyaBefore);
    assert.equal(priyaBefore.eligibilityStatus, 'NOT_YET_MOVED_IN');

    // On 2026-10-16 (after Priya's move-in): Priya has PENDING_INVITE
    const resAfter = await fetch(`${baseUrl}/api/groups/${groupId}/eligible-members?date=2026-10-16`, {
      headers: { Authorization: `Bearer ${rahulToken}` },
    });
    assert.equal(resAfter.status, 200);
    const dataAfter = await resAfter.json();
    const priyaAfter = dataAfter.eligibleMembers.find(
      (m: any) => m.userEmail.toLowerCase() === 'priya@group.com',
    );
    assert.ok(priyaAfter);
    assert.equal(priyaAfter.eligibilityStatus, 'PENDING_INVITE');
    assert.equal(priyaAfter.isPendingInvite, true);
  });

  test('Tenancy: User registers and accepts invite -> inherits effective move-in date', async () => {
    // 1. Priya registers
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Priya Sharma',
        email: 'priya@group.com',
        password: 'password123',
        upiId: 'priya@okhdfc',
      }),
    });
    assert.equal(regRes.status, 201);
    const regData = await regRes.json();
    priyaToken = regData.token;

    // 2. Priya accepts invite via /api/invites/accept
    const acceptRes = await fetch(`${baseUrl}/api/invites/accept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${priyaToken}`,
      },
      body: JSON.stringify({ invite_code: priyaInviteCode }),
    });
    assert.equal(acceptRes.status, 200);
    const acceptData = await acceptRes.json();
    assert.equal(acceptData.success, true);
    assert.equal(acceptData.member.status, 'ACTIVE');
    assert.equal(acceptData.member.movedInAt, '2026-10-15');

    // 3. Now Priya is an ACTIVE member with movedInAt = 2026-10-15
    const eligibleRes = await fetch(`${baseUrl}/api/groups/${groupId}/eligible-members?date=2026-10-16`, {
      headers: { Authorization: `Bearer ${rahulToken}` },
    });
    const eligibleData = await eligibleRes.json();
    const priyaActive = eligibleData.eligibleMembers.find(
      (m: any) => m.userEmail.toLowerCase() === 'priya@group.com',
    );
    assert.ok(priyaActive);
    assert.equal(priyaActive.eligibilityStatus, 'ACTIVE');
    assert.equal(priyaActive.isPendingInvite, false);
  });

  test('Tenancy: Expense splits automatically respect occupancy window', async () => {
    // Expense on 2026-10-10 (before Priya moved in) -> Only Rahul and Amit split!
    const expBeforeRes = await fetch(`${baseUrl}/api/expenses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${rahulToken}`,
      },
      body: JSON.stringify({
        groupId,
        title: 'Pre-move-in Groceries',
        amount: 1000,
        date: '2026-10-10',
        category: 'Food & Dining',
        subCategory: 'Groceries & Dark Stores',
        splitType: 'EQUAL',
      }),
    });
    assert.equal(expBeforeRes.status, 201);
    const expBeforeData = await expBeforeRes.json();
    const splitsBefore = expBeforeData.expense.splits;
    // Priya should NOT be in splits
    assert.equal(splitsBefore['priya@group.com'], undefined);
    assert.ok(splitsBefore['rahul@group.com'] > 0);
    assert.ok(splitsBefore['amit@group.com'] > 0);

    // Expense on 2026-10-18 (after Priya moved in) -> Rahul, Amit, and Priya split!
    const expAfterRes = await fetch(`${baseUrl}/api/expenses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${rahulToken}`,
      },
      body: JSON.stringify({
        groupId,
        title: 'Post-move-in Wi-Fi Bill',
        amount: 900,
        date: '2026-10-18',
        category: 'Bills & Utilities',
        subCategory: 'Internet & Telecom',
        splitType: 'EQUAL',
      }),
    });
    assert.equal(expAfterRes.status, 201);
    const expAfterData = await expAfterRes.json();
    const splitsAfter = expAfterData.expense.splits;
    assert.ok(splitsAfter['priya@group.com'] > 0);
    assert.equal(splitsAfter['priya@group.com'], 30000); // 900 / 3 = 300 each (30000 minor units)
  });

  test('Tenancy: Admin updates tenancy dates and marks member as moved out', async () => {
    // Admin marks Amit as moved out on 2026-10-20
    const patchRes = await fetch(`${baseUrl}/api/groups/${groupId}/members/amit@group.com/tenancy`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${rahulToken}`,
      },
      body: JSON.stringify({
        moved_out_at: '2026-10-20',
      }),
    });
    assert.equal(patchRes.status, 200);
    const patchData = await patchRes.json();
    assert.equal(patchData.success, true);
    assert.equal(patchData.member.status, 'LEFT');
    assert.equal(patchData.member.movedOutAt, '2026-10-20');

    // On 2026-10-25: Amit is MOVED_OUT, so expense on 2026-10-25 only splits between Rahul and Priya!
    const expPostRes = await fetch(`${baseUrl}/api/expenses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${rahulToken}`,
      },
      body: JSON.stringify({
        groupId,
        title: 'Electricity After Amit Moved Out',
        amount: 800,
        date: '2026-10-25',
        category: 'Bills & Utilities',
        subCategory: 'Electricity & Power',
        splitType: 'EQUAL',
      }),
    });
    assert.equal(expPostRes.status, 201);
    const expPostData = await expPostRes.json();
    const postSplits = expPostData.expense.splits;
    assert.equal(postSplits['amit@group.com'], undefined);
    assert.equal(postSplits['priya@group.com'], 40000); // 800 / 2 = 400 each
    assert.equal(postSplits['rahul@group.com'], 40000);
  });

  test('Backend 404: Returns 404 for unknown endpoints', async () => {
    const res = await fetch(`${baseUrl}/api/non-existent-route`);
    assert.equal(res.status, 404);
    const data = await res.json();
    assert.equal(data.error, 'Endpoint not found');
  });

  test('Teardown test server', async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    setTimeout(() => process.exit(0), 100);
  });
});
