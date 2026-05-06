import { test as base, type Page } from '@playwright/test';
import { e2eUsers, type E2eRole } from './users';
import { loginViaApi } from './auth';
import { resetDatabase } from './reset';

interface Fixtures {
  freshDb: void;
  loginAs: (role: E2eRole) => Promise<Page>;
}

export const test = base.extend<Fixtures>({
  freshDb: [
    async ({}, use) => {
      await resetDatabase();
      await use();
    },
    { auto: true },
  ],
  loginAs: async ({ page }, use) => {
    await use(async (role: E2eRole) => {
      await loginViaApi(page, e2eUsers[role]);
      return page;
    });
  },
});

export { expect } from '@playwright/test';
export { e2eUsers } from './users';
export { resetDatabase } from './reset';
export { loginViaApi } from './auth';
