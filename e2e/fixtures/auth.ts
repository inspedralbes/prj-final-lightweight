import type { Page } from '@playwright/test';
import { apiUrl, baseUrl } from './reset';
import type { E2eUser } from './users';

interface LoginResponse {
  access_token: string;
  user: {
    id: number;
    username: string;
    role: 'COACH' | 'CLIENT';
    coachId?: number;
  };
}

export async function loginViaApi(page: Page, user: E2eUser): Promise<void> {
  const url = `${apiUrl()}/testing/login`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: user.username }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`POST ${url} failed (${res.status}): ${text}`);
  }
  const { access_token, user: u } = (await res.json()) as LoginResponse;

  // Visit the front origin first so localStorage maps to the right origin.
  await page.goto(baseUrl());
  await page.waitForLoadState('networkidle');
  await page.evaluate(
    ({ access_token, u }) => {
      localStorage.setItem('token', access_token);
      localStorage.setItem('userRole', u.role);
      localStorage.setItem('username', u.username);
      localStorage.setItem('userId', String(u.id));
      if (typeof u.coachId === 'number') {
        localStorage.setItem('coachId', String(u.coachId));
      } else {
        localStorage.removeItem('coachId');
      }
    },
    { access_token, u },
  );
}

export async function registerNewUser(data: {
  username: string;
  email: string;
  password?: string;
  role: 'COACH' | 'CLIENT';
}): Promise<LoginResponse> {
  const url = `${apiUrl()}/auth/register`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: data.username,
      email: data.email,
      password: data.password || 'E2eP@ss123!',
      role: data.role,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`POST ${url} failed (${res.status}): ${text}`);
  }
  return (await res.json()) as LoginResponse;
}

export function generateUniqueUsername(prefix: string = 'user'): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}_${timestamp}_${random}`;
}
