import { test, expect } from '@playwright/test';
import { generateTestEmail, registerUser } from './helpers.js';

test.describe('Vacation Mode, Settlements & Month-End Statements', () => {
  test('Toggles Vacation Mode on the dashboard', async ({ page }) => {
    const email = generateTestEmail('vacationer');
    await registerUser(page, 'Rohan Mehra', email);

    await page.fill('input[name="groupName"]', 'Prestige Silver Crest');
    await page.click('button:has-text("Create Group & Get Invite Code")');
    await expect(page).toHaveURL(/\/dashboard/);

    const vacationBtn = page.locator('button:has-text("At Group (Active)")');
    await expect(vacationBtn).toBeVisible();

    // Toggle away
    await vacationBtn.click();
    await expect(page.locator('button:has-text("Away (Excluded)")')).toBeVisible();

    // Toggle back
    await page.click('button:has-text("Away (Excluded)")');
    await expect(page.locator('button:has-text("At Group (Active)")')).toBeVisible();
  });

  test('Multi-member expense produces suggested settlement with UPI link', async ({ browser }) => {
    // Member 1 (Payer with UPI ID)
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();
    const email1 = generateTestEmail('creditor');
    await registerUser(page1, 'Creditor User', email1, 'Pass123!', 'creditor@upi');

    await page1.fill('input[name="groupName"]', 'Sobha Dream Acres');
    await page1.click('button:has-text("Create Group & Get Invite Code")');
    await expect(page1).toHaveURL(/\/dashboard/);

    const inviteCode = (await page1.locator('span.font-mono').innerText()).trim();

    // Member 2 (Debtor)
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    const email2 = generateTestEmail('debtor');
    await registerUser(page2, 'Debtor User', email2, 'Pass123!');

    await page2.click('button:has-text("Join with Code")');
    await page2.fill('input[name="inviteCode"]', inviteCode);
    await page2.click('button:has-text("Join Group")');
    await expect(page2).toHaveURL(/\/dashboard/);

    // Member 1 (Admin) approves Member 2's join request
    await page1.reload({ waitUntil: 'networkidle' });
    const approveBtn = page1.locator('button:has-text("✓ Approve")').first();
    await expect(approveBtn).toBeVisible();
    await approveBtn.click();
    await expect(page1.locator('button:has-text("✓ Approve")')).toHaveCount(0);

    // Member 1 logs ₹1000 bill split equally
    await page1.click('button:has-text("＋")');
    await page1.fill('input[name="amount"]', '1000.00');
    await page1.fill('input[name="title"]', 'Monthly Electricity');
    await page1.selectOption('select[name="category"]', 'Bills & Utilities');
    await page1.click('button[type="submit"]');

    // Ensure the modal has closed and the expense appears in the feed
    await expect(page1.locator('app-add-expense-modal')).not.toBeVisible({ timeout: 10000 });
    await expect(page1.locator('p:has-text("Monthly Electricity")')).toBeVisible();

    // Member 2 refreshes/checks dashboard
    await page2.reload({ waitUntil: 'networkidle' });
    await expect(page2.locator('text=🔴 You owe')).toBeVisible({ timeout: 10000 });
    await expect(page2.locator('text=500').first()).toBeVisible();

    // Verify suggested settlement card with UPI deep link
    const payUpiBtn = page2.locator('a:has-text("Pay UPI")');
    await expect(payUpiBtn).toBeVisible();
    const href = await payUpiBtn.getAttribute('href');
    expect(href).toContain('upi://pay');
    expect(decodeURIComponent(href || '')).toContain('creditor@upi');

    await context1.close();
    await context2.close();
  });

  test('Monthly Statements page shows breakdown and WhatsApp digest button', async ({ page }) => {
    const email = generateTestEmail('reporter');
    await registerUser(page, 'Report User', email);

    await page.fill('input[name="groupName"]', 'Godrej Woods 504');
    await page.click('button:has-text("Create Group & Get Invite Code")');
    await expect(page).toHaveURL(/\/dashboard/);

    // Log an expense
    await page.click('button:has-text("＋")');
    await page.fill('input[name="amount"]', '600.00');
    await page.fill('input[name="title"]', 'Internet Broadband');
    await page.selectOption('select[name="category"]', 'Bills & Utilities');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Internet Broadband')).toBeVisible();

    // Navigate to Reports / Statements
    await page.click('button:has-text("Reports")');
    await expect(page).toHaveURL(/\/statements/);

    // Verify statement contents
    await expect(page.locator('h1')).toContainText('Monthly Statements');
    await expect(page.locator('text=Total Group Spending')).toBeVisible();
    await expect(page.locator('text=₹600').first()).toBeVisible();

    // Verify WhatsApp share button has valid link
    const whatsappBtn = page.locator('a:has-text("Share on WhatsApp")');
    await expect(whatsappBtn).toBeVisible();
    const waHref = await whatsappBtn.getAttribute('href');
    expect(waHref).toContain('api.whatsapp.com');
  });
});
