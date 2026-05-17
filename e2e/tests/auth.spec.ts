import { test, expect, e2eUsers } from '../fixtures';
import { generateUniqueUsername } from '../fixtures/auth';
import { E2E_PASSWORD } from '../fixtures/users';

test.describe('Autenticació (LW-441)', () => {

  test.beforeEach(async ({ page }) => {
    // La fixture freshDb ja es encarga de resetear la DB antes de cada test (auto: true)
    await page.goto('/login');
  });

  test.describe('Login', () => {
    test('Login exitós com a COACH', async ({ loginPage, page }) => {
      await loginPage.login(e2eUsers.coach.username, e2eUsers.coach.password);

      await expect(page).toHaveURL(/\/dashboard/);
      await expect(page.locator('text=Sessió iniciada correctament')).toBeVisible();

      const token = await page.evaluate(() => localStorage.getItem('token'));
      expect(token).toBeTruthy();
    });

    test('Login exitós com a CLIENT', async ({ loginPage, page }) => {
      await loginPage.login(e2eUsers.clientLinked.username, e2eUsers.clientLinked.password);

      await expect(page).toHaveURL(/\/client-home/);
      await expect(page.locator('text=Sessió iniciada correctament')).toBeVisible();
    });

    test('Login fallit amb contrasenya incorrecta', async ({ loginPage, page }) => {
      await loginPage.login(e2eUsers.coach.username, 'wrong_password');

      await expect(page.locator('[role="alert"]:has-text("Usuari o contrasenya invàlids")')).toBeVisible();
      await expect(page).toHaveURL(/\/login/);

      const token = await page.evaluate(() => localStorage.getItem('token'));
      expect(token).toBeNull();
    });

    test('Login fallit amb usuari inexistent', async ({ loginPage, page }) => {
      await loginPage.login('non_existent_user', 'any_password');

      await expect(page.locator('[role="alert"]:has-text("Usuari o contrasenya invàlids")')).toBeVisible();
      await expect(page).toHaveURL(/\/login/);
    });

    test('El formulari de login mostra tots els camps requerits', async ({ page }) => {
      await expect(page.getByTestId('username-input')).toBeVisible();
      await expect(page.getByTestId('password-input')).toBeVisible();
      await expect(page.getByTestId('login-submit')).toBeVisible();
    });

    test("El formulari de login s'envia via tecla Enter", async ({ loginPage, page }) => {
      await loginPage.fillUsername(e2eUsers.coach.username);
      await loginPage.fillPassword(e2eUsers.coach.password);
      await loginPage.passwordInput.press('Enter');

      await expect(page).toHaveURL(/\/dashboard/);
    });

    test("El missatge d'error es mostra en espanyol quan la llengua és 'es'", async ({ page }) => {
      // Override language to Spanish (runs after fixture's 'ca' init script)
      await page.addInitScript(() => localStorage.setItem('language', 'es'));
      await page.reload();

      await page.getByTestId('username-input').fill(e2eUsers.coach.username);
      await page.getByTestId('password-input').fill('wrong_password');
      await page.getByTestId('login-submit').click();

      await expect(page.locator('[role="alert"]')).toContainText('inválidos');
    });

    test('Múltiples intents de login fallits no bloquegen el compte', async ({ loginPage, page }) => {
      for (let i = 0; i < 5; i++) {
        await loginPage.login(e2eUsers.coach.username, 'wrong_password');
        await expect(page).toHaveURL(/\/login/);
      }

      // El 6è intent amb credencials correctes ha de funcionar
      await loginPage.login(e2eUsers.coach.username, e2eUsers.coach.password);
      await expect(page).toHaveURL(/\/dashboard/);
    });
  });

  test.describe('Registre', () => {
    test('Registre exitós de nou usuari COACH', async ({ registerPage, page }) => {
      await registerPage.goto();
      const newUser = generateUniqueUsername('new_coach');

      await registerPage.register({
        role: 'COACH',
        username: newUser,
        email: `${newUser}@example.com`,
        password: E2E_PASSWORD,
      });

      await expect(page.locator('text=Compte creat correctament')).toBeVisible();
      await expect(page).toHaveURL(/\/login/);

      // Provar que el nou usuari pot fer login
      const { LoginPage } = await import('../fixtures/pages/LoginPage');
      const loginPage = new LoginPage(page);
      await loginPage.login(newUser, E2E_PASSWORD);
      await expect(page).toHaveURL(/\/dashboard/);
    });

    test('Registre amb usuari duplicat mostra error', async ({ registerPage, page }) => {
      await registerPage.goto();
      await registerPage.register({
        username: e2eUsers.coach.username, // Ja existeix
        email: 'duplicate@example.com',
        password: E2E_PASSWORD,
      });

      await expect(page.locator('text=Aquest usuari ja existeix')).toBeVisible();
    });

    test('Registre amb contrasenyes no coincidents', async ({ registerPage, page }) => {
      await registerPage.goto();
      await registerPage.usernameInput.fill('testuser');
      await registerPage.emailInput.fill('test@example.com');
      await registerPage.passwordInput.fill(E2E_PASSWORD);
      await registerPage.confirmPasswordInput.fill(`different_${E2E_PASSWORD}`);
      await registerPage.registerButton.click();

      await expect(page.locator('text=Les contrasenyes no coincideixen')).toBeVisible();
    });

    test('Registre amb correu electrònic invàlid no envia el formulari', async ({ registerPage, page }) => {
      await registerPage.goto();
      await registerPage.usernameInput.fill('testuser_email');
      await registerPage.emailInput.fill('not-an-email');
      await registerPage.passwordInput.fill(E2E_PASSWORD);
      await registerPage.confirmPasswordInput.fill(E2E_PASSWORD);
      await registerPage.registerButton.click();

      // La validació HTML5 evita l'enviament — romanem a /register
      await expect(page).toHaveURL(/\/register/);
      const isValid = await page.evaluate(
        () => (document.querySelector('[data-testid="email-input"]') as HTMLInputElement)?.validity.valid,
      );
      expect(isValid).toBe(false);
    });

    test('Registre amb camps requerits buits no envia el formulari', async ({ registerPage, page }) => {
      await registerPage.goto();
      // The submit button is disabled by React until required fields are filled
      await expect(registerPage.registerButton).toBeDisabled();
      await expect(page).toHaveURL(/\/register/);
    });
  });

  test.describe('Logout i Persistència', () => {
    test('Logout exitós des del dashboard del coach', async ({ loginPage, page }) => {
      await loginPage.login(e2eUsers.coach.username, e2eUsers.coach.password);
      await expect(page).toHaveURL(/\/dashboard/);

      const logoutBtn = page.getByTestId('logout-button');
      await logoutBtn.click();

      await expect(page).toHaveURL(/\/login/);
      const token = await page.evaluate(() => localStorage.getItem('token'));
      expect(token).toBeNull();
    });

    test('La sessió persisteix després de recarregar la pàgina', async ({ loginPage, page }) => {
      await loginPage.login(e2eUsers.coach.username, e2eUsers.coach.password);
      await expect(page).toHaveURL(/\/dashboard/);

      await page.reload();

      await expect(page).toHaveURL(/\/dashboard/);
      const username = await page.evaluate(() => localStorage.getItem('username'));
      expect(username).toBe(e2eUsers.coach.username);
    });

    test('Logout exitós des del dashboard del client', async ({ loginAs, page }) => {
      await loginAs('clientLinked');
      await page.goto('/client-home');
      await expect(page).toHaveURL(/\/client-home/);

      const logoutBtn = page.getByTestId('logout-button');
      await logoutBtn.click();

      await expect(page).toHaveURL(/\/login/);
      const token = await page.evaluate(() => localStorage.getItem('token'));
      expect(token).toBeNull();
    });

    test('La ruta protegida és inaccessible després de logout', async ({ loginPage, page }) => {
      await loginPage.login(e2eUsers.coach.username, e2eUsers.coach.password);
      await expect(page).toHaveURL(/\/dashboard/);

      const logoutBtn = page.getByTestId('logout-button');
      await logoutBtn.click();
      await expect(page).toHaveURL(/\/login/);

      // Intent de navegació directa a ruta protegida
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/\/login/);
    });

    test('Les crides API retornen 401 i el interceptor redirigeix a login', async ({ page }) => {
      // Use a syntactically valid but expired JWT — ProtectedRoute sees a token (passes),
      // but the backend rejects it with 401, triggering the axios interceptor redirect.
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjk5OTk5LCJ1c2VybmFtZSI6ImZha2UiLCJyb2xlIjoiQ09BQ0giLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MTYwMDAwMDAwMX0.invalid_signature';
      await page.evaluate((token) => {
        localStorage.setItem('token', token);
        localStorage.setItem('userRole', 'COACH');
        localStorage.setItem('username', 'fake');
        localStorage.setItem('userId', '99999');
      }, expiredToken);

      // Dashboard makes real API call → backend returns 401 → axios interceptor → /login
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
    });

    test('La sessió persista en múltiples navegacions de pàgina', async ({ loginAs, page }) => {
      await loginAs('coach');

      const getToken = () => page.evaluate(() => localStorage.getItem('token'));
      const initialToken = await getToken();
      expect(initialToken).toBeTruthy();

      await page.goto('/dashboard');
      await expect(page).toHaveURL(/\/dashboard/);
      expect(await getToken()).toBe(initialToken);

      await page.goto('/clients');
      await expect(page).toHaveURL(/\/clients/);
      expect(await getToken()).toBe(initialToken);

      await page.reload();
      await expect(page).toHaveURL(/\/clients/);
      expect(await getToken()).toBe(initialToken);
    });

    test("La sessió s'invalida quan el token es neteja de localStorage", async ({ loginAs, page }) => {
      await loginAs('coach');
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/\/dashboard/);

      // Simulate a browser extension or dev tools clearing localStorage
      await page.evaluate(() => localStorage.clear());
      await page.reload();

      await expect(page).toHaveURL(/\/login/);
    });
  });
});
