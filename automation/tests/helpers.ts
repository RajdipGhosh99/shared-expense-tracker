import { Page, expect } from '@playwright/test';

export function generateTestEmail(prefix: string = 'user'): string {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}@test.com`;
}

export async function registerUser(
  page: Page,
  name: string,
  email: string,
  password: string = 'Password@123',
  upiId?: string,
) {
  await page.goto('/auth');
  await page.click('button:has-text("Sign Up")');
  await page.fill('input[name="name"]', name);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  if (upiId) {
    await page.fill('input[name="upiId"]', upiId);
  }
  await page.click('button[type="submit"]');
  // Wait for redirect to onboarding or dashboard
  await expect(page).toHaveURL(/\/(onboarding|dashboard)/);
}

export async function loginUser(page: Page, email: string, password: string = 'Password@123') {
  await page.goto('/auth');
  await page.click('button:has-text("Log In")');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/(onboarding|dashboard)/);
}
