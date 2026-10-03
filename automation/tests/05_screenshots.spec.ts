import { test, expect } from '@playwright/test';
import { generateTestEmail, registerUser } from './helpers.js';

test('Capture Taxonomy Screenshots', async ({ page }) => {
  const email = generateTestEmail('taxo');
  await registerUser(page, 'Taxonomy Reviewer', email);

  // Create group
  await page.fill('input[name="groupName"]', 'Prestige Palms 301');
  await page.click('button:has-text("Create Group & Get Invite Code")');
  await expect(page).toHaveURL(/\/dashboard/);

  // Open Add Bill modal
  await page.click('button:has-text("＋")');
  await expect(page.locator('h3:has-text("Add Group Expense")')).toBeVisible();

  // Screen 1: Real-time AI auto-detection of new category (Cult.fit -> Health & Wellness -> Fitness & Gym)
  await page.fill('input[name="title"]', 'Cult.fit annual gym membership');
  await expect(page.locator('text=AI Suggested:')).toBeVisible();
  await page.screenshot({
    path: '/Users/rajdip/.gemini/antigravity/brain/ee6fed17-f194-4c25-9c37-7ce14535d647/screen_ai_cultfit_wellness.png',
  });

  // Screen 2: Transfers & Adjustments with isExpense: false notice
  await page.selectOption('select[name="category"]', 'Transfers & Adjustments');
  await expect(page.locator('text=Transfers & Adjustments are debt settlements')).toBeVisible();
  await page.screenshot({
    path: '/Users/rajdip/.gemini/antigravity/brain/ee6fed17-f194-4c25-9c37-7ce14535d647/screen_transfers_adjustments_notice.png',
  });

  // Screen 3: Fallback to Other for unidentified expense
  await page.fill('input[name="title"]', 'Totally unknown expense random 9988');
  await page.selectOption('select[name="category"]', 'Other');
  await expect(page.locator('select[name="subCategory"]')).toContainText('Other');
  await page.screenshot({
    path: '/Users/rajdip/.gemini/antigravity/brain/ee6fed17-f194-4c25-9c37-7ce14535d647/screen_fallback_other_category.png',
  });
});
