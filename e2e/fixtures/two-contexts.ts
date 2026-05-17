import type { Browser, BrowserContext, Page } from '@playwright/test';
import { loginViaApi } from './auth';
import { e2eUsers } from './users';

export interface TwoContexts {
  coachContext: BrowserContext;
  coachPage: Page;
  clientContext: BrowserContext;
  clientPage: Page;
}

export async function buildTwoContexts(browser: Browser): Promise<TwoContexts> {
  const coachContext = await browser.newContext();
  const coachPage = await coachContext.newPage();
  await loginViaApi(coachPage, e2eUsers.clientLinked);

  const clientContext = await browser.newContext();
  const clientPage = await clientContext.newPage();
  await loginViaApi(clientPage, e2eUsers.clientUnlinked);

  return { coachContext, coachPage, clientContext, clientPage };
}
