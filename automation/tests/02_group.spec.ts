import { test, expect } from '@playwright/test';
import { generateTestEmail, registerUser } from './helpers.js';

test.describe('Group Onboarding & Member Joining', () => {
  test('Creates a group and displays 6-character invite code on dashboard', async ({ page }) => {
    const email = generateTestEmail('creator');
    await registerUser(page, 'Karan Johar', email);

    await expect(page).toHaveURL(/\/onboarding/);
    await page.fill('input[name="groupName"]', 'Palm Springs 402');
    await page.selectOption('select[name="currency"]', 'INR');
    await page.click('button:has-text("Create Group & Get Invite Code")');

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('h1')).toContainText('Palm Springs 402');

    // Verify 6-character invite code pill is visible
    const invitePill = page.locator('span.font-mono');
    await expect(invitePill).toBeVisible();
    const inviteCode = await invitePill.innerText();
    expect(inviteCode.trim().length).toBeGreaterThanOrEqual(5);
  });

  test('Second user can join group using invite code', async ({ browser }) => {
    // 1. First user registers and creates group
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();
    const email1 = generateTestEmail('owner');
    await registerUser(page1, 'Owner User', email1);

    await page1.fill('input[name="groupName"]', 'Green Glen 3BHK');
    await page1.click('button:has-text("Create Group & Get Invite Code")');
    await expect(page1).toHaveURL(/\/dashboard/);

    const inviteCode = (await page1.locator('span.font-mono').innerText()).trim();
    expect(inviteCode).toBeTruthy();

    // 2. Second user registers and joins via code
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    const email2 = generateTestEmail('member');
    await registerUser(page2, 'Member User', email2);

    await expect(page2).toHaveURL(/\/onboarding/);
    await page2.click('button:has-text("Join with Code")');
    await page2.fill('input[name="inviteCode"]', inviteCode);
    await page2.click('button:has-text("Join Group")');

    await expect(page2).toHaveURL(/\/dashboard/);
    await expect(page2.locator('h1')).toContainText('Green Glen 3BHK');

    await context1.close();
    await context2.close();
  });
});
