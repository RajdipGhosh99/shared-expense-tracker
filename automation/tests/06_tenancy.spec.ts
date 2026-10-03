import { test, expect } from '@playwright/test';
import { generateTestEmail, registerUser } from './helpers.js';

test.describe('Physical Tenancy & Move-In/Move-Out Effective Date Engine', () => {
  test('Admin invites flatmate with effective move-in date and verifies date-driven split roster', async ({
    page,
  }) => {
    const adminEmail = generateTestEmail('admin_tenancy');
    await registerUser(page, 'Rohit Admin', adminEmail);

    // Create group
    await page.fill('input[name="groupName"]', 'Palm Grove 402');
    await page.click('button:has-text("Create Group & Get Invite Code")');
    await expect(page).toHaveURL(/\/dashboard/);

    // Verify "+ Invite Roommate" button is visible for admin
    const inviteBtn = page.locator('button:has-text("＋ Invite Roommate")');
    await expect(inviteBtn).toBeVisible();
    await inviteBtn.click();

    // Fill in personalized invite modal
    await expect(page.locator('h3:has-text("Invite Roommate")')).toBeVisible();
    await page.fill('input[name="inviteName"]', 'Simran Kaur');
    await page.fill('input[name="inviteEmail"]', 'simran@test.com');
    await page.fill('input[name="inviteMoveInDate"]', '2026-10-15');
    await page.click('button:has-text("Generate Personalized Invite")');

    // Verify invite created with code
    await expect(page.locator('text=Invite Created!')).toBeVisible();
    await page.click('button:has-text("✕")');

    // Open Add Bill Modal
    await page.click('button:has-text("＋")');
    await expect(page.locator('h3:has-text("Add Group Expense")')).toBeVisible();

    // Set expense date to 2026-10-10 (BEFORE Simran's move-in)
    await page.fill('input[name="date"]', '2026-10-10');
    // Simran should show "Joined on 2026-10-15" and not be residing
    await expect(page.locator('text=Simran Kaur')).toBeVisible();
    await expect(page.locator('text=Joined on 2026-10-15')).toBeVisible();

    // Change expense date to 2026-10-16 (AFTER Simran's move-in)
    await page.fill('input[name="date"]', '2026-10-16');
    // Simran should now show the pending invite badge and be eligible
    await expect(page.locator('text=[Pending Invite - Effective 2026-10-15]')).toBeVisible();

    // Fill amount and see live per-person split recalculation
    await page.fill('input[name="amount"]', '1200.00');
    await page.fill('input[name="title"]', 'Move-in WiFi Router');

    // Take screenshot of the tenancy roommate roster
    await page.screenshot({
      path: '/Users/rajdip/.gemini/antigravity/brain/ee6fed17-f194-4c25-9c37-7ce14535d647/screen_tenancy_roommate_roster.png',
      fullPage: true,
    });

    // Save expense
    await page.click('button[type="submit"]:has-text("Save & Split Bill")');

    // Verify expense appears on dashboard
    await expect(page.locator('text=Move-in WiFi Router')).toBeVisible();
  });
});
