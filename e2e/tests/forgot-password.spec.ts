import { test, expect, e2eUsers } from '../fixtures';
import { apiUrl } from '../fixtures/reset';

async function injectResetToken(email: string): Promise<string> {
  const res = await fetch(`${apiUrl()}/testing/inject-reset-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    throw new Error(
      `inject-reset-token failed for ${email}: HTTP ${res.status}`,
    );
  }
  const data = (await res.json()) as { rawToken: string };
  return data.rawToken;
}

test.describe('Recuperació de contrasenya (LW-454)', () => {
  test.describe('ForgotPassword — pàgina de sol·licitud', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/forgot-password');
    });

    test('flux complet: sol·licitar reset → nova contrasenya → login exitós', async ({
      page,
    }) => {
      const coachEmail = e2eUsers.coach.email;

      // 1. Submit forgot-password form
      await page.getByTestId('forgot-password-email').fill(coachEmail);
      await page.getByTestId('forgot-password-submit').click();

      // 2. Wait for redirect or success indication (API call completes → toast → redirect)
      // The page redirects to /login after ~2s on success
      await expect(page).toHaveURL(/\/login/, { timeout: 8000 });

      // 3. Inject a known raw token via test helper (bypasses SMTP)
      const rawToken = await injectResetToken(coachEmail);

      // 4. Navigate to reset-password page with the token
      await page.goto(`/reset-password?token=${rawToken}`);
      await expect(page.getByTestId('reset-password-new')).toBeVisible({ timeout: 5000 });

      // 5. Fill in new password
      const newPassword = 'NewE2ePass123!';
      await page.getByTestId('reset-password-new').fill(newPassword);
      await page.getByTestId('reset-password-confirm').fill(newPassword);
      await page.getByTestId('reset-password-submit').click();

      // 6. Redirect to /login after success
      await expect(page).toHaveURL(/\/login/, { timeout: 8000 });

      // 7. Login with new password
      await page.getByTestId('username-input').fill(e2eUsers.coach.username);
      await page.getByTestId('password-input').fill(newPassword);
      await page.getByTestId('login-submit').click();

      await expect(page).toHaveURL(/\/dashboard/, { timeout: 8000 });
    });

    test("el botó d'enviament es deshabilita mentre la petició és en vol", async ({
      page,
    }) => {
      let resolveRequest!: () => void;
      const requestStarted = new Promise<void>((resolve) => {
        resolveRequest = resolve;
      });

      await page.route('**/auth/forgot-password', async (route) => {
        resolveRequest();
        // Hold the request to observe the disabled state
        await new Promise<void>((res) => setTimeout(res, 1500));
        await route.continue();
      });

      await page.getByTestId('forgot-password-email').fill(e2eUsers.coach.email);
      await page.getByTestId('forgot-password-submit').click();

      await requestStarted;

      await expect(page.getByTestId('forgot-password-submit')).toBeDisabled();
    });

    test("email no registrat mostra error en línia, sense redirecció a /login", async ({
      page,
    }) => {
      await page.getByTestId('forgot-password-email').fill('notreal@example.com');
      await page.getByTestId('forgot-password-submit').click();

      await expect(page.getByTestId('forgot-password-error')).toBeVisible({
        timeout: 5000,
      });
      await expect(page).toHaveURL(/\/forgot-password/);
    });
  });

  test.describe('ResetPassword — pàgina de nova contrasenya', () => {
    test("les contrasenyes no coincidents mostren error al client, sense crida a la API", async ({
      page,
    }) => {
      const rawToken = await injectResetToken(e2eUsers.coach.email);
      await page.goto(`/reset-password?token=${rawToken}`);
      await expect(page.getByTestId('reset-password-new')).toBeVisible({ timeout: 5000 });

      let apiCalled = false;
      await page.route('**/auth/reset-password', () => {
        apiCalled = true;
      });

      await page.getByTestId('reset-password-new').fill('Pass1234!');
      await page.getByTestId('reset-password-confirm').fill('Diferente!');
      await page.getByTestId('reset-password-submit').click();

      await expect(page.getByTestId('reset-password-validation-error')).toBeVisible({
        timeout: 3000,
      });
      expect(apiCalled).toBe(false);
    });

    test("contrasenya massa curta mostra error al client, sense crida a la API", async ({
      page,
    }) => {
      const rawToken = await injectResetToken(e2eUsers.coach.email);
      await page.goto(`/reset-password?token=${rawToken}`);
      await expect(page.getByTestId('reset-password-new')).toBeVisible({ timeout: 5000 });

      let apiCalled = false;
      await page.route('**/auth/reset-password', () => {
        apiCalled = true;
      });

      await page.getByTestId('reset-password-new').fill('short');
      await page.getByTestId('reset-password-confirm').fill('short');
      await page.getByTestId('reset-password-submit').click();

      await expect(page.getByTestId('reset-password-validation-error')).toBeVisible({
        timeout: 3000,
      });
      expect(apiCalled).toBe(false);
    });

    test('token ja usat: el backend retorna 400 i es mostra error amb enllaç a /forgot-password', async ({
      page,
    }) => {
      const rawToken = await injectResetToken(e2eUsers.coach.email);

      // Consume the token once via API
      const consumeRes = await fetch(`${apiUrl()}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: rawToken, password: 'FirstUse123!' }),
      });
      expect(consumeRes.ok).toBe(true);

      // Try again with the used token in the browser
      await page.goto(`/reset-password?token=${rawToken}`);
      await expect(page.getByTestId('reset-password-new')).toBeVisible({ timeout: 5000 });

      await page.getByTestId('reset-password-new').fill('SecondUse123!');
      await page.getByTestId('reset-password-confirm').fill('SecondUse123!');
      await page.getByTestId('reset-password-submit').click();

      await expect(page.getByTestId('reset-token-error')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('a[href*="/forgot-password"]')).toBeVisible();
    });

    test('la pàgina /reset-password és pública: accessible sense JWT a localStorage', async ({
      page,
    }) => {
      await page.addInitScript(() => localStorage.clear());
      await page.goto('/reset-password?token=abc');

      // Form renders — no redirect to /login
      await expect(page).toHaveURL(/\/reset-password/);
      await expect(page.getByTestId('reset-password-new')).toBeVisible({ timeout: 5000 });
    });
  });
});
