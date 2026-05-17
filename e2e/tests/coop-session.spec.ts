/**
 * E2E tests for the FriendSession / VirtualGymRoom co-op flow (LW-443).
 *
 * Prerequisites:
 *   - Backend running with E2E_TESTING=true
 *   - Frontend running on PLAYWRIGHT_BASE_URL (default http://localhost:5173)
 *   - VITE_BACK_URL set on the frontend dev server (default http://localhost:3000)
 *
 * These tests are serial: each one builds on the state left by the previous.
 */
import { test as baseTest, expect, type Browser, type BrowserContext, type Page } from '@playwright/test';
import { resetDatabase, loginViaApi, e2eUsers, baseUrl } from '../fixtures';

async function buildTwoClientContexts(browser: Browser) {
  const ctx1 = await browser.newContext();
  const page1 = await ctx1.newPage();
  await loginViaApi(page1, e2eUsers.clientLinked);

  const ctx2 = await browser.newContext();
  const page2 = await ctx2.newPage();
  await loginViaApi(page2, e2eUsers.clientUnlinked);

  return { coachContext: ctx1, coachPage: page1, clientContext: ctx2, clientPage: page2 };
}

/**
 * Complete one set for the current exercise:
 *   fill weight + reps → click the action button.
 */
async function completeOneSet(page: Page): Promise<void> {
  await page.locator('input[step="0.1"]').fill('20');
  await page.locator('input[type="number"]').nth(1).fill('10');
  const btn = page.locator('button').filter({ hasText: /Complete Set|Finish Routine|Finish Session/i });
  await btn.click();
}

// ─────────────────────────────────────────────────────────────────────────────
// Block 1: Full co-op session lifecycle (serial, shared contexts)
// ─────────────────────────────────────────────────────────────────────────────

baseTest.describe.skip('co-op session — full lifecycle', () => {
  baseTest.describe.configure({ mode: 'serial' });

  let coachContext: BrowserContext;
  let coachPage: Page;
  let clientContext: BrowserContext;
  let clientPage: Page;
  let sessionCode: string;

  baseTest.beforeAll(async ({ browser }) => {
    await resetDatabase();
    const ctx = await buildTwoClientContexts(browser);
    coachContext = ctx.coachContext;
    coachPage = ctx.coachPage;
    clientContext = ctx.clientContext;
    clientPage = ctx.clientPage;
  });

  baseTest.afterAll(async () => {
    await coachContext?.close();
    await clientContext?.close();
  });

  // ── Test 1 ────────────────────────────────────────────────────────────────

  baseTest('coach generates a FriendSession code via the UI', async () => {
    await coachPage.goto(`${baseUrl()}/friend-session`);

    // Click "Generate session code"
    await coachPage.getByRole('button', { name: /Generate session code/i }).click();

    // Wait for the code to appear (the mono font code card)
    const codeEl = coachPage.locator('.font-mono.break-all');
    await expect(codeEl).toBeVisible({ timeout: 5_000 });
    sessionCode = (await codeEl.innerText()).trim();
    expect(sessionCode).toBeTruthy();
    expect(sessionCode.length).toBeGreaterThan(4);

    // "Enter Virtual Gym" button should be visible
    await expect(
      coachPage.getByRole('button', { name: /Enter Virtual Gym/i }),
    ).toBeVisible();

    // Navigate to the room as host
    await coachPage.getByRole('button', { name: /Enter Virtual Gym/i }).click();
    await expect(coachPage).toHaveURL(new RegExp(`/room/${sessionCode}`), {
      timeout: 5_000,
    });
  });

  // ── Test 2 ────────────────────────────────────────────────────────────────

  baseTest('both users join the room and see each other', async () => {
    // Coach should already be in the room (from test 1) — wait for connection
    await expect(coachPage.getByText(/Connected/i)).toBeVisible({ timeout: 8_000 });

    // Client: navigate to friend-session, enter the code, join
    await clientPage.goto(`${baseUrl()}/friend-session`);
    await clientPage.locator('input[type="text"]').fill(sessionCode);
    await clientPage.getByRole('button', { name: /^Join$/i }).click();

    // Both pages should show "2 online"
    await expect(coachPage.getByText(/2 online/i)).toBeVisible({ timeout: 8_000 });
    await expect(clientPage.getByText(/2 online/i)).toBeVisible({ timeout: 8_000 });

    // Role badges
    await expect(coachPage.getByText(/^Host$/i)).toBeVisible();
    await expect(clientPage.getByText(/^Guest$/i)).toBeVisible();

    // Start session button visible only for coach (and enabled with 2 users)
    await expect(
      coachPage.getByRole('button', { name: /START SESSION/i }),
    ).toBeEnabled();
    await expect(
      clientPage.getByRole('button', { name: /START SESSION/i }),
    ).not.toBeVisible();
  });

  // ── Test 3 ────────────────────────────────────────────────────────────────

  baseTest('coach starts the session and both contexts transition to active workout', async () => {
    // Click START SESSION
    await coachPage.getByRole('button', { name: /START SESSION/i }).click();

    // Routine selection modal appears
    await expect(coachPage.getByText(/Select a Routine/i)).toBeVisible({ timeout: 5_000 });

    // Select the seeded routine
    await coachPage.getByText('e2e_routine_basic').click();

    // Confirm by clicking the "Start Session" button inside the modal.
    // .last() disambiguates from the lobby's "START SESSION" button behind the modal.
    await coachPage.getByRole('button', { name: /^Start Session$/i }).last().click();

    // Both contexts should transition out of lobby (lobby title disappears, active session renders)
    // The lobby shows "Connected" status; active session shows weight/reps inputs
    await expect(coachPage.locator('input[step="0.1"]')).toBeVisible({ timeout: 10_000 });
    await expect(clientPage.locator('input[step="0.1"]')).toBeVisible({ timeout: 10_000 });
  });

  // ── Test 4 ────────────────────────────────────────────────────────────────

  baseTest('coach progress update appears in client view', async () => {
    // Coach completes set 1 — this emits updateProgress
    await completeOneSet(coachPage);

    // Client should see the "Room progress" section update
    // The partner progress section shows coach's progress bar
    await expect(clientPage.getByText(/Room progress/i)).toBeVisible({ timeout: 5_000 });

    // The progress percentage of the coach (>0) should be reflected —
    // we check that the room progress section exists and the page stays on active session
    await expect(clientPage.locator('input[step="0.1"]')).toBeVisible();
  });

  // ── Test 5 ────────────────────────────────────────────────────────────────

  baseTest('session completes and both contexts show SessionSummary', async () => {
    // Coach: complete remaining sets (set 2 and the last set)
    await completeOneSet(coachPage); // set 2
    await completeOneSet(coachPage); // set 3 → Finish Routine → coach finishes

    // Client: complete all 3 sets
    await completeOneSet(clientPage); // set 1
    await completeOneSet(clientPage); // set 2
    await completeOneSet(clientPage); // set 3 → client finishes

    // Both should show the SessionSummary (session completed title)
    await expect(coachPage.getByText(/Session Completed/i)).toBeVisible({ timeout: 10_000 });
    await expect(clientPage.getByText(/Session Completed/i)).toBeVisible({ timeout: 10_000 });

    // NOTE: The VirtualGymRoom co-op flow is socket-only — it does NOT create a
    // LiveSession DB record. Therefore there is no API endpoint to verify
    // status=COMPLETED for coop sessions. DB persistence is tracked in a follow-up.
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Block 2: Host disconnection (separate serial block, fresh setup)
// ─────────────────────────────────────────────────────────────────────────────

baseTest.describe.skip('co-op session — host disconnection', () => {
  baseTest.describe.configure({ mode: 'serial' });

  let coachContext: BrowserContext;
  let coachPage: Page;
  let clientContext: BrowserContext;
  let clientPage: Page;

  baseTest.beforeAll(async ({ browser }) => {
    await resetDatabase();
    const ctx = await buildTwoClientContexts(browser);
    coachContext = ctx.coachContext;
    coachPage = ctx.coachPage;
    clientContext = ctx.clientContext;
    clientPage = ctx.clientPage;

    // Coach generates a code and enters the room
    await coachPage.goto(`${baseUrl()}/friend-session`);
    await coachPage.getByRole('button', { name: /Generate session code/i }).click();
    const codeEl = coachPage.locator('.font-mono.break-all');
    await expect(codeEl).toBeVisible({ timeout: 5_000 });
    const code = (await codeEl.innerText()).trim();
    await coachPage.getByRole('button', { name: /Enter Virtual Gym/i }).click();
    await expect(coachPage.getByText(/Connected/i)).toBeVisible({ timeout: 8_000 });

    // Client joins the room
    await clientPage.goto(`${baseUrl()}/friend-session`);
    await clientPage.locator('input[type="text"]').fill(code);
    await clientPage.getByRole('button', { name: /^Join$/i }).click();
    await expect(clientPage.getByText(/2 online/i)).toBeVisible({ timeout: 8_000 });
  });

  baseTest.afterAll(async () => {
    await clientContext?.close();
    // coachContext may already be closed by the test
    try { await coachContext?.close(); } catch { /* already closed */ }
  });

  baseTest('client sees host-disconnected state when coach closes context', async () => {
    // Close the coach's browser context — simulates a crash/disconnect
    await coachContext.close();

    // Client should receive hostDisconnected and navigate back to /friend-session
    await expect(clientPage).toHaveURL(new RegExp('/friend-session'), { timeout: 8_000 });
  });
});
