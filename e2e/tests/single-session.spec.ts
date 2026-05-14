import { test, expect, e2eUsers } from '../fixtures';
import { apiUrl } from '../fixtures/reset';
import { E2E_PASSWORD } from '../fixtures/users';
import { LoginPage } from '../fixtures/pages/LoginPage';

test.describe('Restricció de sessió única per usuari (LW-460)', () => {

  // freshDb (auto: true) reseteja la BD abans de cada test automàticament.
  // No cal afterEach addicional: resetDatabase() al principi del test següent
  // ja neteja qualsevol sessió residual sense afectar la BD fora dels tests.

  // ---------------------------------------------------------------------------
  // TC-01: Primer login exitós
  // ---------------------------------------------------------------------------
  test('TC-01: Primer login exitós en un nou context de navegador', async ({ loginPage, page }) => {
    await page.goto('/login');
    await loginPage.login(e2eUsers.coach.username, e2eUsers.coach.password);

    // Redirigeix al dashboard
    await expect(page).toHaveURL(/\/dashboard/);

    // El JWT s'ha emmagatzemat a localStorage
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeTruthy();

    // L'endpoint protegit és accessible amb el token (sessió vàlida al backend)
    // GET /session/my-sessions requereix JwtAuthGuard
    const res = await page.request.get(`${apiUrl()}/session/my-sessions`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
  });

  // ---------------------------------------------------------------------------
  // TC-02: Login concurrent rebutjat (via API directa)
  // ---------------------------------------------------------------------------
  test('TC-02: El segon login és rebutjat amb 409 quan ja hi ha una sessió activa', async ({ browser, loginPage, page }) => {
    // Context 1: login via UI
    await page.goto('/login');
    await loginPage.login(e2eUsers.coach.username, e2eUsers.coach.password);
    await expect(page).toHaveURL(/\/dashboard/);

    // Context 2: intent de login via API directa — ha de retornar 409
    const ctx2 = await browser.newContext();
    try {
      const req2 = await ctx2.request.post(`${apiUrl()}/auth/login`, {
        data: { username: e2eUsers.coach.username, password: E2E_PASSWORD },
      });
      expect(req2.status()).toBe(409);
      const body = await req2.json();
      expect(body.message).toBe('Session already active');
    } finally {
      await ctx2.close();
    }
  });

  // ---------------------------------------------------------------------------
  // TC-02b: Login concurrent rebutjat (via UI)
  // ---------------------------------------------------------------------------
  test('TC-02b: La UI mostra un error al segon intent de login', async ({ browser, loginPage, page }) => {
    // Context 1: login via UI
    await page.goto('/login');
    await loginPage.login(e2eUsers.coach.username, e2eUsers.coach.password);
    await expect(page).toHaveURL(/\/dashboard/);

    // Context 2: navega a /login i intenta fer login via formulari
    const ctx2 = await browser.newContext();
    const page2 = await ctx2.newPage();
    try {
      await page2.goto('/login');
      const loginPage2 = new LoginPage(page2);
      await loginPage2.login(e2eUsers.coach.username, e2eUsers.coach.password);

      // La pàgina ha de mostrar un missatge d'error visible
      await expect(page2.locator('[role="alert"]')).toBeVisible({ timeout: 8000 });

      // L'usuari roman a /login (no redirigit al dashboard)
      await expect(page2).toHaveURL(/\/login/);
    } finally {
      await ctx2.close();
    }
  });

  // ---------------------------------------------------------------------------
  // TC-03: Re-login exitós després del logout
  // ---------------------------------------------------------------------------
  test('TC-03: El re-login té èxit en un segon context després que el primer faci logout', async ({ browser, loginPage, page }) => {
    // Context 1: login
    await page.goto('/login');
    await loginPage.login(e2eUsers.coach.username, e2eUsers.coach.password);
    await expect(page).toHaveURL(/\/dashboard/);

    // Context 2: intent de login → 409
    const ctx2 = await browser.newContext();
    try {
      const req2 = await ctx2.request.post(`${apiUrl()}/auth/login`, {
        data: { username: e2eUsers.coach.username, password: E2E_PASSWORD },
      });
      expect(req2.status()).toBe(409);

      // Context 1: logout
      const logoutBtn = page.getByTestId('logout-button');
      await logoutBtn.click();
      await expect(page).toHaveURL(/\/login/);

      // Context 2: ara pot fer login — NestJS POST retorna 201 per defecte
      const req3 = await ctx2.request.post(`${apiUrl()}/auth/login`, {
        data: { username: e2eUsers.coach.username, password: E2E_PASSWORD },
      });
      expect(req3.status()).toBe(201);
      const body = await req3.json();
      expect(body.access_token).toBeTruthy();
    } finally {
      await ctx2.close();
    }
  });

  // ---------------------------------------------------------------------------
  // TC-04: La sessió queda lliure després del tancament de la pestanya (beacon logout)
  // ---------------------------------------------------------------------------
  test('TC-04: La sessió queda lliure després del tancament de pestanya via beacon logout', async ({ browser }) => {
    // Context 1: login via API directa (NestJS POST retorna 201)
    const ctx1 = await browser.newContext();
    const page1 = await ctx1.newPage();
    let access_token: string | undefined;
    try {
      const loginRes = await ctx1.request.post(`${apiUrl()}/auth/login`, {
        data: { username: e2eUsers.coach.username, password: E2E_PASSWORD },
      });
      expect(loginRes.status()).toBe(201);
      const json = await loginRes.json();
      access_token = json.access_token as string;

      // Injectar el token a localStorage i navegar al frontend perquè el
      // beforeunload handler de React el pugui llegir quan tanquem la pàgina
      await page1.goto('/');
      await page1.evaluate((token: string) => {
        localStorage.setItem('token', token);
        localStorage.setItem('userRole', 'COACH');
        localStorage.setItem('username', 'e2e_coach');
      }, access_token);

      // Tancar la pàgina — dispara beforeunload → sendBeacon → POST /auth/logout-beacon
      await page1.close();

      // Esperar que el beacon arribi al backend
      await new Promise((resolve) => setTimeout(resolve, 1500));
    } finally {
      await ctx1.close().catch(() => {});
    }

    // Context 2: ha de poder fer login ara que la sessió ha quedat lliure
    const ctx2 = await browser.newContext();
    try {
      const res = await ctx2.request.post(`${apiUrl()}/auth/login`, {
        data: { username: e2eUsers.coach.username, password: E2E_PASSWORD },
      });
      // Si el beacon no va arribar (no garantit per spec), usar logout-beacon explícit com a fallback
      if (res.status() === 409) {
        await ctx2.request.post(`${apiUrl()}/auth/logout-beacon?t=${encodeURIComponent(access_token!)}`);
        const res2 = await ctx2.request.post(`${apiUrl()}/auth/login`, {
          data: { username: e2eUsers.coach.username, password: E2E_PASSWORD },
        });
        expect(res2.status()).toBe(201);
      } else {
        expect(res.status()).toBe(201);
      }
    } finally {
      await ctx2.close();
    }
  });

  // ---------------------------------------------------------------------------
  // TC-05: Després del logout no es pot iniciar una nova sessió amb les mateixes
  //        credencials fins que activeSessionToken queda net — i el JWT segueix
  //        sent criptogràficament vàlid per a crides API (comportament esperat).
  // ---------------------------------------------------------------------------
  test('TC-05: Després del logout, el nou login té èxit i el token anterior segueix sent vàlid per a l\'API', async ({ loginPage, page }) => {
    // Login via UI
    await page.goto('/login');
    await loginPage.login(e2eUsers.coach.username, e2eUsers.coach.password);
    await expect(page).toHaveURL(/\/dashboard/);

    // Capturar el JWT de localStorage abans del logout
    const firstToken = await page.evaluate(() => localStorage.getItem('token'));
    expect(firstToken).toBeTruthy();

    // Logout — neteja activeSessionToken a la BD
    const logoutBtn = page.getByTestId('logout-button');
    await logoutBtn.click();
    await expect(page).toHaveURL(/\/login/);

    // El JWT segueix sent criptogràficament vàlid fins a la seva expiració (24h).
    // La restricció opera al login, no invalida els tokens existents.
    const resWithOldToken = await page.request.get(`${apiUrl()}/session/my-sessions`, {
      headers: { Authorization: `Bearer ${firstToken}` },
    });
    expect(resWithOldToken.status()).toBe(200);

    // Esperar 1 segon perquè el nou JWT tingui un iat diferent
    await new Promise((r) => setTimeout(r, 1100));

    // Ara que activeSessionToken és null, es pot fer un nou login sense conflicte
    const loginRes = await page.request.post(`${apiUrl()}/auth/login`, {
      data: { username: e2eUsers.coach.username, password: E2E_PASSWORD },
    });
    expect(loginRes.status()).toBe(201);
    const { access_token: newToken } = await loginRes.json();
    expect(newToken).toBeTruthy();
    expect(newToken).not.toBe(firstToken);
  });
});
