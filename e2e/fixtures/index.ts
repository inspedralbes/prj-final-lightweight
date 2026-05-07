import { test as base, type Page } from '@playwright/test';
import { e2eUsers, type E2eRole } from './users';
import { loginViaApi } from './auth';
import { resetDatabase, baseUrl } from './reset';
import { buildTwoContexts, type TwoContexts } from './two-contexts';

interface Fixtures {
  freshDb: void;
  loginAs: (role: E2eRole) => Promise<Page>;
  twoContexts: TwoContexts;
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
  twoContexts: async ({ browser }, use) => {
    const contexts = await buildTwoContexts(browser);
    await use(contexts);
    await contexts.coachContext.close();
    await contexts.clientContext.close();
  },
});

export { expect } from '@playwright/test';
export { e2eUsers } from './users';
export { resetDatabase, baseUrl } from './reset';
export { loginViaApi } from './auth';
export type { TwoContexts } from './two-contexts';
