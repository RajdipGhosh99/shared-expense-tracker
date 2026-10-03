import { test, expect } from '@playwright/test';
import { generateTestEmail, registerUser } from './helpers.js';

test.describe('Expenses, Splits & Deduplication Protection', () => {
  test('Add grocery bill, split equally and verify net standing calculation', async ({ page }) => {
    const email = generateTestEmail('payer');
    await registerUser(page, 'Payer One', email);

    // Create group
    await page.fill('input[name="groupName"]', 'CyberCity Group 2B');
    await page.click('button:has-text("Create Group & Get Invite Code")');
    await expect(page).toHaveURL(/\/dashboard/);

    // Open Add Expense Modal via center + button
    await page.click('button:has-text("＋")');
    await expect(page.locator('h3:has-text("Add Group Expense")')).toBeVisible();

    // Fill expense details
    await page.fill('input[name="amount"]', '840.00');
    await page.fill('input[name="title"]', 'Blinkit Groceries');
    await page.selectOption('select[name="category"]', 'Food & Dining');

    // Submit expense
    await page.click('button[type="submit"]');

    // Modal closes and expense card appears in Recent Expenses
    await expect(page.locator('text=Blinkit Groceries')).toBeVisible();
    await expect(page.locator('text=₹840')).toBeVisible();

    // Verify Net Standing displays positive amount (user paid full bill)
    await expect(page.locator('text=You get back')).toBeVisible();
  });

  test('Submitting duplicate payment UTR triggers conflict modal and allows overwrite', async ({
    page,
  }) => {
    const email = generateTestEmail('dedup');
    await registerUser(page, 'Dedup User', email);

    // Create group
    await page.fill('input[name="groupName"]', 'Orchid Residency');
    await page.click('button:has-text("Create Group & Get Invite Code")');
    await expect(page).toHaveURL(/\/dashboard/);

    // 1. Log first expense
    await page.click('button:has-text("＋")');
    await page.fill('input[name="amount"]', '500.00');
    await page.fill('input[name="title"]', 'WiFi Bill');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=WiFi Bill')).toBeVisible();

    // 2. Attempt logging duplicate expense with matching fingerprint
    await page.click('button:has-text("＋")');
    await page.fill('input[name="amount"]', '500.00');
    await page.fill('input[name="title"]', 'WiFi Bill');
    await page.click('button[type="submit"]');

    // 3. Conflict modal should pop up
    await expect(page.locator('text=Duplicate Payment Detected')).toBeVisible();

    // 4. Overwrite existing record
    const overwriteBtn = page.locator('button:has-text("Overwrite")');
    await expect(overwriteBtn).toBeVisible();
    await overwriteBtn.click();

    // Modal should close and overwritten title should be present
    await expect(page.locator('text=Duplicate Payment Detected')).not.toBeVisible();
    await expect(page.locator('text=WiFi Bill')).toBeVisible();
  });

  test('Admin manages group entry form controls and verifies subcategory mapping', async ({
    page,
  }) => {
    const email = generateTestEmail('admincontrols');
    await registerUser(page, 'Admin Configurer', email);

    await page.fill('input[name="groupName"]', 'Controls Test Flat');
    await page.click('button:has-text("Create Group & Get Invite Code")');
    await expect(page).toHaveURL(/\/dashboard/);

    // Form Controls card is visible for Admin
    await expect(page.locator('text=Entry Form Controls (Admin)')).toBeVisible();

    // Admin clicks Save Form Controls
    await page.click('button:has-text("Save Form Controls")');
    await expect(page.locator('text=Controls saved!')).toBeVisible();

    // Open Add Bill Modal
    await page.click('button:has-text("＋")');
    await expect(page.locator('h3:has-text("Add Group Expense")')).toBeVisible();

    // Verify Subcategory selector is visible and manual UPI Ref input is absent
    await expect(page.locator('select[name="subCategory"]')).toBeVisible();
    await expect(page.locator('input[name="utrNumber"]')).toHaveCount(0);
  });

  test('Real-time AI automatically detects category even when keywords are misspelled', async ({
    page,
  }) => {
    const email = generateTestEmail('typo');
    await registerUser(page, 'Typo Tester', email);

    // Create group
    await page.fill('input[name="groupName"]', 'Typo Test Flat');
    await page.click('button:has-text("Create Group & Get Invite Code")');
    await expect(page).toHaveURL(/\/dashboard/);

    // Open Add Expense Modal
    await page.click('button:has-text("＋")');
    await expect(page.locator('h3:has-text("Add Group Expense")')).toBeVisible();

    // 1. Type misspelled "blnkit milk and veggies"
    await page.fill('input[name="title"]', 'blnkit milk and veggies');
    await expect(page.locator('text=AI Suggested:')).toBeVisible();
    await expect(page.locator('select[name="category"]')).toHaveValue('Food & Dining');

    // 2. Type misspelled "swigy dinner meal"
    await page.fill('input[name="title"]', 'swigy dinner meal');
    await expect(page.locator('text=AI Suggested:')).toBeVisible();
    await expect(page.locator('select[name="category"]')).toHaveValue('Food & Dining');

    // 3. Type misspelled "electrcity power bill"
    await page.fill('input[name="title"]', 'electrcity power bill');
    await expect(page.locator('text=AI Suggested:')).toBeVisible();
    await expect(page.locator('select[name="category"]')).toHaveValue('Bills & Utilities');

    // 4. Type misspelled "wifii broadband"
    await page.fill('input[name="title"]', 'wifii broadband');
    await expect(page.locator('text=AI Suggested:')).toBeVisible();
    await expect(page.locator('select[name="category"]')).toHaveValue('Bills & Utilities');
  });
});
