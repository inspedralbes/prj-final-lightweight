import { type Page, type Locator, expect } from '@playwright/test';

// Selectors use data-testid attributes defined in src/front/src/features/auth/pages/Login.tsx.
// This keeps tests decoupled from CSS classes or DOM structure.
export class LoginPage {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorToast: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.getByTestId('username-input');
    this.passwordInput = page.getByTestId('password-input');
    this.loginButton = page.getByTestId('login-submit');
    this.errorToast = page.locator('.toast-error');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async fillUsername(username: string) {
    await this.usernameInput.fill(username);
  }

  async fillPassword(password: string) {
    await this.passwordInput.fill(password);
  }

  async clickSubmit() {
    await this.loginButton.click();
  }

  async expectErrorVisible() {
    // Verificamos que aparezca un mensaje de error (usualmente en un toast)
    // En nuestro caso, el ToastContainer usa clases de tailwind o similares.
    // Buscaremos por texto si el toast no tiene un selector fácil.
    await expect(this.page.locator('text=Error')).toBeVisible();
  }
}
