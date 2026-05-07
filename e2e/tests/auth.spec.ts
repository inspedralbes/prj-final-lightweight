import { test, expect, e2eUsers } from '../fixtures';
import { generateUniqueUsername } from '../fixtures/auth';

test.describe('Autenticació (LW-441)', () => {
  
  test.beforeEach(async ({ page }) => {
    // La fixture freshDb ya se encarga de resetear la DB antes de cada test (auto: true)
    await page.goto('/login');
  });

  test.describe('Login', () => {
    test('Login exitós com a COACH', async ({ loginPage, page }) => {
      await loginPage.login(e2eUsers.coach.username, e2eUsers.coach.password);
      
      // Verificacions
      await expect(page).toHaveURL(/\/dashboard/);
      await expect(page.locator('text=Sessió iniciada correctament')).toBeVisible();
      
      // Verificar persistència a localStorage
      const token = await page.evaluate(() => localStorage.getItem('token'));
      expect(token).toBeTruthy();
    });

    test('Login exitós com a CLIENT', async ({ loginPage, page }) => {
      await loginPage.login(e2eUsers.clientLinked.username, e2eUsers.clientLinked.password);
      
      // Verificacions
      await expect(page).toHaveURL(/\/client-home/);
      await expect(page.locator('text=Sessió iniciada correctament')).toBeVisible();
    });

    test('Login fallit amb contrasenya incorrecta', async ({ loginPage, page }) => {
      await loginPage.login(e2eUsers.coach.username, 'wrong_password');
      
      // Verificacions
      await expect(page.locator('text=Usuari o contrasenya invàlids')).toBeVisible();
      await expect(page).toHaveURL(/\/login/);
      
      const token = await page.evaluate(() => localStorage.getItem('token'));
      expect(token).toBeNull();
    });

    test('Login fallit amb usuari inexistent', async ({ loginPage, page }) => {
      await loginPage.login('non_existent_user', 'any_password');
      
      await expect(page.locator('text=Usuari o contrasenya invàlids')).toBeVisible();
      await expect(page).toHaveURL(/\/login/);
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
        password: 'Password123!',
      });

      // Redirecció a login després de registre exitós
      await expect(page.locator('text=Compte creat correctament')).toBeVisible();
      await expect(page).toHaveURL(/\/login/);

      // Provar que el nou usuari pot fer login
      const { LoginPage } = await import('../fixtures/pages/LoginPage');
      const loginPage = new LoginPage(page);
      await loginPage.login(newUser, 'Password123!');
      await expect(page).toHaveURL(/\/dashboard/);
    });

    test('Registre amb usuari duplicat mostra error', async ({ registerPage, page }) => {
      await registerPage.goto();
      await registerPage.register({
        username: e2eUsers.coach.username, // Ja existeix
        email: 'duplicate@example.com',
        password: 'Password123!',
      });

      await expect(page.locator('text=Aquest usuari ja existeix')).toBeVisible();
    });

    test('Registre amb contrasenyes no coincidents', async ({ registerPage, page }) => {
      await registerPage.goto();
      await registerPage.usernameInput.fill('testuser');
      await registerPage.emailInput.fill('test@example.com');
      await registerPage.passwordInput.fill('Password123!');
      await registerPage.confirmPasswordInput.fill('DifferentPassword123!');
      await registerPage.registerButton.click();

      await expect(page.locator('text=Les contrasenyes no coincideixen')).toBeVisible();
    });
  });

  test.describe('Logout i Persistència', () => {
    test('Logout exitós des del dashboard', async ({ loginPage, page }) => {
      await loginPage.login(e2eUsers.coach.username, e2eUsers.coach.password);
      await expect(page).toHaveURL(/\/dashboard/);

      // Clic a logout (botó de la sidebar/navbar)
      // Busquem el botó que contingui el text de tancar sessió o icona
      const logoutBtn = page.locator('button:has-text("Tancar sessió"), a:has-text("Tancar sessió")');
      await logoutBtn.click();

      await expect(page).toHaveURL(/\/login/);
      const token = await page.evaluate(() => localStorage.getItem('token'));
      expect(token).toBeNull();
    });

    test('La sessió persisteix després de recarregar la pàgina', async ({ loginPage, page }) => {
      await loginPage.login(e2eUsers.coach.username, e2eUsers.coach.password);
      await expect(page).toHaveURL(/\/dashboard/);

      await page.reload();
      
      // Seguim al dashboard sense haver de fer login de nou
      await expect(page).toHaveURL(/\/dashboard/);
      const username = await page.evaluate(() => localStorage.getItem('username'));
      expect(username).toBe(e2eUsers.coach.username);
    });
  });
});
