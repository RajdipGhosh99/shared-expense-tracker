import { test, expect } from '@playwright/test';
import { generateTestEmail, registerUser, loginUser } from './helpers.js';

test.describe('Authentication & Session Management', () => {
  test('Unauthenticated user is redirected to /auth', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/auth/);
    await expect(page.locator('h1')).toContainText('Shared Expense Tracker');
  });

  test('User can register with name, email, password, and UPI ID', async ({ page }) => {
    const email = generateTestEmail('rahul');
    await registerUser(page, 'Rahul Sharma', email, 'Pass1234!', 'rahul@okhdfc');

    // Should land on onboarding
    await expect(page).toHaveURL(/\/onboarding/);
    await expect(page.locator('h2')).toContainText('Welcome, Rahul Sharma!');
  });

  test('User can log out and log back in', async ({ page }) => {
    const email = generateTestEmail('amit');
    await registerUser(page, 'Amit Patel', email, 'Pass1234!');

    // Create a quick flat to get to dashboard
    await page.fill('input[name="flatName"]', 'Skyline Tower 102');
    await page.click('button:has-text("Create Flat & Get Invite Code")');
    await expect(page).toHaveURL(/\/dashboard/);

    // Logout
    await page.click('button:has-text("Log out")');
    await expect(page).toHaveURL(/\/auth/);

    // Login
    await loginUser(page, email, 'Pass1234!');
    await expect(page).toHaveURL(/\/(onboarding|dashboard)/);
    await expect(page.locator('body')).toContainText('Welcome, Amit');
  });
});
