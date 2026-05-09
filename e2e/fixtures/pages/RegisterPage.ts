import { type Page, type Locator, expect } from '@playwright/test';

// Selectors use data-testid attributes defined in src/front/src/features/auth/pages/Register.tsx.

export class RegisterPage {
  readonly page: Page;
  readonly roleClientButton: Locator;
  readonly roleCoachButton: Locator;
  readonly usernameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly registerButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.roleClientButton = page.getByTestId('role-client');
    this.roleCoachButton = page.getByTestId('role-coach');
    this.usernameInput = page.getByTestId('username-input');
    this.emailInput = page.getByTestId('email-input');
    this.passwordInput = page.getByTestId('password-input');
    this.confirmPasswordInput = page.getByTestId('confirm-password-input');
    this.registerButton = page.getByTestId('register-submit');
  }

  async goto() {
    await this.page.goto('/register');
  }

  async selectRole(role: 'CLIENT' | 'COACH') {
    if (role === 'CLIENT') {
      await this.roleClientButton.click();
    } else {
      await this.roleCoachButton.click();
    }
  }

  async register(data: {
    username: string;
    email: string;
    password: string;
    confirmPassword?: string;
    role?: 'CLIENT' | 'COACH';
  }) {
    if (data.role) await this.selectRole(data.role);
    await this.usernameInput.fill(data.username);
    await this.emailInput.fill(data.email);
    await this.passwordInput.fill(data.password);
    await this.confirmPasswordInput.fill(data.confirmPassword ?? data.password);
    await this.registerButton.click();
  }
}
