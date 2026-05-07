import { test as base, type Page } from '@playwright/test';
import { e2eUsers, type E2eRole } from './users';
import { loginViaApi } from './auth';
import { resetDatabase } from './reset';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

interface Fixtures {
  freshDb: void;
  loginAs: (role: E2eRole) => Promise<Page>;
  loginPage: LoginPage;
  registerPage: RegisterPage;
}

export const test = base.extend<Fixtures>({
  freshDb: [
    async ({}, use) => {
      await resetDatabase();
      await use();
    },
    { auto: true },
  ],
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      localStorage.setItem('language', 'ca');
    });
    await use(page);
  },
  loginAs: async ({ page }, use) => {
    await use(async (role: E2eRole) => {
      await loginViaApi(page, e2eUsers[role]);
      return page;
    });
  },
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  registerPage: async ({ page }, use) => {
    await use(new RegisterPage(page));
  },
});

export { expect } from '@playwright/test';
export { e2eUsers } from './users';
export { resetDatabase } from './reset';
export { loginViaApi } from './auth';
