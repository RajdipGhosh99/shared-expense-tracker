import { test, expect } from '@playwright/test';
import { generateTestEmail, registerUser } from './helpers.js';

test.describe('Expenses, Splits & Deduplication Protection', () => {
  test('Add grocery bill, split equally and verify net standing calculation', async ({ page }) => {
    const email = generateTestEmail('payer');
    await registerUser(page, 'Payer One', email);

    // Create group
    await page.fill('input[name="flatName"]', 'CyberCity Flat 2B');
    await page.click('button:has-text("Create Flat & Get Invite Code")');
    await expect(page).toHaveURL(/\/dashboard/);

    // Open Add Expense Modal via center + button
    await page.click('button:has-text("＋")');
    await expect(page.locator('h3:has-text("Add Flat Expense")')).toBeVisible();

    // Fill expense details
    await page.fill('input[name="amount"]', '840.00');
    await page.fill('input[name="title"]', 'Blinkit Groceries');
    await page.selectOption('select[name="category"]', 'Groceries');

    // Submit expense
    await page.click('button[type="submit"]');

    // Modal closes and expense card appears in Recent Expenses
    await expect(page.locator('text=Blinkit Groceries')).toBeVisible();
    await expect(page.locator('text=₹840')).toBeVisible();

    // Verify Net Standing displays positive amount (user paid full bill)
    await expect(page.locator('text=You get back')).toBeVisible();
  });

  test('Submitting duplicate payment UTR triggers conflict modal and allows overwrite', async ({ page }) => {
    const email = generateTestEmail('dedup');
    await registerUser(page, 'Dedup User', email);

    // Create group
    await page.fill('input[name="flatName"]', 'Orchid Residency');
    await page.click('button:has-text("Create Flat & Get Invite Code")');
    await expect(page).toHaveURL(/\/dashboard/);

    const utr = `UTR${Date.now()}`;

    // 1. Log first expense with UTR
    await page.click('button:has-text("＋")');
    await page.fill('input[name="amount"]', '500.00');
    await page.fill('input[name="title"]', 'WiFi Bill');
    await page.fill('input[name="utrNumber"]', utr);
    await page.click('button[type="submit"]');
    await expect(page.locator('text=WiFi Bill')).toBeVisible();

    // 2. Attempt logging duplicate expense with exact same UTR
    await page.click('button:has-text("＋")');
    await page.fill('input[name="amount"]', '500.00');
    await page.fill('input[name="title"]', 'WiFi Bill Duplicate');
    await page.fill('input[name="utrNumber"]', utr);
    await page.click('button[type="submit"]');

    // 3. Conflict modal should pop up
    await expect(page.locator('text=Duplicate Payment Detected')).toBeVisible();

    // 4. Overwrite existing record
    const overwriteBtn = page.locator('button:has-text("Overwrite")');
    await expect(overwriteBtn).toBeVisible();
    await overwriteBtn.click();

    // Modal should close and overwritten title should be present
    await expect(page.locator('text=Duplicate Payment Detected')).not.toBeVisible();
    await expect(page.locator('text=WiFi Bill Duplicate')).toBeVisible();
  });
});
