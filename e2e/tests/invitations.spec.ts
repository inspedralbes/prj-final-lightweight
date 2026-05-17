import { test, expect, e2eUsers, loginViaApi } from '../fixtures';
import { apiUrl } from '../fixtures/reset';
import type { Page } from '@playwright/test';

// freshDb s'executa automàticament (auto: true) abans de cada test.
// mode: 'serial' evita la race condition entre workers paral·lels que
// comparteixin la mateixa BD de testing.
test.describe.configure({ mode: 'serial' });

// Estableix l'idioma català a localStorage perquè els selectors de text coincideixin
async function setLangCa(page: Page): Promise<void> {
  await page.evaluate(() => localStorage.setItem('language', 'ca'));
}

test.describe('Flux d\'invitacions i notificacions', () => {

  // ─── El coach envia una invitació; el client rep la notificació via socket ──

  test('el coach envia una invitació i el client rep la notificació en temps real', async ({ browser, request }) => {
    // El seed crea E2E-INVITE-001 PENDING per a e2e_client_unlinked.
    // La rebutgem via API per partir amb badge = 0 i provar l'increment en temps real.
    const loginRes = await request.post(`${apiUrl()}/testing/login`, {
      data: { username: e2eUsers.clientUnlinked.username },
    });
    expect(loginRes.ok()).toBeTruthy();
    const { access_token: clientToken } = await loginRes.json();

    const pendingRes = await request.get(`${apiUrl()}/invitations/pending-for-me`, {
      headers: { Authorization: `Bearer ${clientToken}` },
    });
    const pending: Array<{ id: number }> = await pendingRes.json();
    for (const inv of pending) {
      await request.patch(`${apiUrl()}/invitations/${inv.id}/reject`, {
        headers: { Authorization: `Bearer ${clientToken}` },
      });
    }

    // Obrim dos contextos independents (localStorage i Socket.IO separats)
    const coachCtx = await browser.newContext();
    const clientCtx = await browser.newContext();
    try {
      const coachPage = await coachCtx.newPage();
      const clientPage = await clientCtx.newPage();

      await loginViaApi(coachPage, e2eUsers.coach);
      await setLangCa(coachPage);
      await loginViaApi(clientPage, e2eUsers.clientUnlinked);
      await setLangCa(clientPage);

      // El client carrega una pàgina amb Layout; badge ha de ser 0 (cap invitació pendent)
      await clientPage.goto('/client-home');
      await expect(clientPage.locator('[data-testid="pending-invites-badge"]')).toHaveCount(0);

      // El coach va a la llista de clients i obre el modal d'invitació
      await coachPage.goto('/clients');
      await coachPage.getByText('Convidar client').first().click();

      // Emplena el nom d'usuari al camp del modal
      await coachPage.getByPlaceholder(/john_doe/i).fill(e2eUsers.clientUnlinked.username);

      // Clica "Enviar invitació" i espera la resposta del backend (HTTP 201)
      const [inviteResponse] = await Promise.all([
        coachPage.waitForResponse(
          (r) =>
            r.url().includes('/clients/invite-by-user') &&
            r.request().method() === 'POST',
        ),
        coachPage.getByText('Enviar invitació').click(),
      ]);
      expect(inviteResponse.status()).toBe(201);

      // El badge del client ha d'incrementar a 1 via socket (sense recàrrega de pàgina)
      await expect(clientPage.locator('[data-testid="pending-invites-badge"]')).toBeVisible();
      await expect(clientPage.locator('[data-testid="pending-invites-badge"]')).toHaveText('1');
    } finally {
      await coachCtx.close();
      await clientCtx.close();
    }
  });

  // ─── El client accepta la invitació ─────────────────────────────────────────

  test('el client accepta la invitació i tots dos costats reflecteixen l\'estat correcte', async ({ browser, request }) => {
    const coachCtx = await browser.newContext();
    const clientCtx = await browser.newContext();
    try {
      const coachPage = await coachCtx.newPage();
      const clientPage = await clientCtx.newPage();

      await loginViaApi(coachPage, e2eUsers.coach);
      await setLangCa(coachPage);
      await loginViaApi(clientPage, e2eUsers.clientUnlinked);
      await setLangCa(clientPage);

      // El client navega a la pàgina d'invitacions (E2E-INVITE-001 del seed ha d'aparèixer)
      await clientPage.goto('/clients/invitations');
      await expect(clientPage.getByText('e2e_coach')).toBeVisible();

      // El badge mostra 1 (invitació pendent del seed)
      await expect(clientPage.locator('[data-testid="pending-invites-badge"]')).toHaveText('1');

      // Clica "Acceptar" sobre la invitació
      await clientPage.getByText('Acceptar').first().click();

      // La invitació desapareix de la llista i el badge desapareix
      await expect(clientPage.getByText('Acceptar')).toHaveCount(0);
      await expect(clientPage.locator('[data-testid="pending-invites-badge"]')).toHaveCount(0);

      // Confirma via API que no hi ha invitacions pendents
      const secondLogin = await request.post(`${apiUrl()}/testing/login`, {
        data: { username: e2eUsers.clientUnlinked.username },
      });
      const { access_token } = await secondLogin.json();
      const pendingRes = await request.get(`${apiUrl()}/invitations/pending-for-me`, {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      const remaining: unknown[] = await pendingRes.json();
      expect(remaining.length).toBe(0);

      // El coach veu el nou client a la seva llista (nom en h3)
      await coachPage.goto('/clients');
      await expect(coachPage.getByRole('heading', { name: e2eUsers.clientUnlinked.username })).toBeVisible();
    } finally {
      await coachCtx.close();
      await clientCtx.close();
    }
  });

  // ─── El client rebutja la invitació ─────────────────────────────────────────

  test('el client rebutja la invitació i roman desvinculat', async ({ browser, request }) => {
    const coachCtx = await browser.newContext();
    const clientCtx = await browser.newContext();
    try {
      const coachPage = await coachCtx.newPage();
      const clientPage = await clientCtx.newPage();

      await loginViaApi(coachPage, e2eUsers.coach);
      await setLangCa(coachPage);
      await loginViaApi(clientPage, e2eUsers.clientUnlinked);
      await setLangCa(clientPage);

      // Log any 401 responses to help debug redirects
      clientPage.on('response', (resp) => {
        if (resp.status() === 401) console.log('[E2E-DEBUG] 401 from:', resp.url());
      });

      // El client navega a la pàgina d'invitacions
      await clientPage.goto('/clients/invitations');
      await expect(clientPage.getByText('e2e_coach')).toBeVisible();

      // El badge mostra 1 (invitació pendent del seed)
      await expect(clientPage.locator('[data-testid="pending-invites-badge"]')).toHaveText('1');

      // Clica "Rebutjar"
      await clientPage.getByRole('button', { name: 'Rebutjar' }).first().click();

      // La invitació desapareix, el badge desapareix i el client roman desvinculat
      await expect(clientPage.getByRole('button', { name: 'Rebutjar' })).toHaveCount(0, { timeout: 10_000 });
      await expect(clientPage.locator('[data-testid="pending-invites-badge"]')).toHaveCount(0);

      // Confirma via API que no hi ha invitacions pendents
      const secondLogin = await request.post(`${apiUrl()}/testing/login`, {
        data: { username: e2eUsers.clientUnlinked.username },
      });
      const { access_token } = await secondLogin.json();
      const pendingRes = await request.get(`${apiUrl()}/invitations/pending-for-me`, {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      const remaining: unknown[] = await pendingRes.json();
      expect(remaining.length).toBe(0);

      // El coach NO veu e2e_client_unlinked a la seva llista
      await coachPage.goto('/clients');
      await expect(coachPage.getByRole('heading', { name: e2eUsers.clientUnlinked.username })).toHaveCount(0);
    } finally {
      await coachCtx.close();
      await clientCtx.close();
    }
  });

  // ─── Control d'accés basat en rol ────────────────────────────────────────────

  test('POST /invitations retorna 401 sense JWT', async ({ request }) => {
    const res = await request.post(`${apiUrl()}/invitations`);
    expect(res.status()).toBe(401);
  });

  test('POST /invitations retorna 403 per a un CLIENT', async ({ request }) => {
    const loginRes = await request.post(`${apiUrl()}/testing/login`, {
      data: { username: e2eUsers.clientLinked.username },
    });
    const { access_token } = await loginRes.json();
    const res = await request.post(`${apiUrl()}/invitations`, {
      headers: { Authorization: `Bearer ${access_token}` },
      data: {},
    });
    expect(res.status()).toBe(403);
  });

  test('el badge és absent per a e2e_client_linked que ja té coach i cap invitació pendent', async ({ page }) => {
    await loginViaApi(page, e2eUsers.clientLinked);
    await setLangCa(page);
    await page.goto('/client-home');
    // e2e_client_linked ja té coach → no hi ha invitacions pendents → badge absent
    await expect(page.locator('[data-testid="pending-invites-badge"]')).toHaveCount(0);
  });

  // ─── Control d'accés: accept/reject només per a CLIENT ───────────────────────

  test('POST /invitations/:code/accept retorna 403 quan ho crida un COACH', async ({ request }) => {
    const clientLogin = await request.post(`${apiUrl()}/testing/login`, {
      data: { username: e2eUsers.clientUnlinked.username },
    });
    const { access_token: clientToken } = await clientLogin.json();
    const pendingRes = await request.get(`${apiUrl()}/invitations/pending-for-me`, {
      headers: { Authorization: `Bearer ${clientToken}` },
    });
    const [invitation]: Array<{ id: number; code: string }> = await pendingRes.json();

    const coachLogin = await request.post(`${apiUrl()}/testing/login`, {
      data: { username: e2eUsers.coach.username },
    });
    const { access_token: coachToken } = await coachLogin.json();

    const res = await request.post(`${apiUrl()}/invitations/${invitation.code}/accept`, {
      headers: { Authorization: `Bearer ${coachToken}` },
    });
    expect(res.status()).toBe(403);
  });

  test('PATCH /invitations/:id/reject retorna 403 quan ho crida un COACH', async ({ request }) => {
    const clientLogin = await request.post(`${apiUrl()}/testing/login`, {
      data: { username: e2eUsers.clientUnlinked.username },
    });
    const { access_token: clientToken } = await clientLogin.json();
    const pendingRes = await request.get(`${apiUrl()}/invitations/pending-for-me`, {
      headers: { Authorization: `Bearer ${clientToken}` },
    });
    const [invitation]: Array<{ id: number; code: string }> = await pendingRes.json();

    const coachLogin = await request.post(`${apiUrl()}/testing/login`, {
      data: { username: e2eUsers.coach.username },
    });
    const { access_token: coachToken } = await coachLogin.json();

    const res = await request.patch(`${apiUrl()}/invitations/${invitation.id}/reject`, {
      headers: { Authorization: `Bearer ${coachToken}` },
    });
    expect(res.status()).toBe(403);
  });

  test('el doble acceptament de la mateixa invitació retorna 409', async ({ request }) => {
    const clientLogin = await request.post(`${apiUrl()}/testing/login`, {
      data: { username: e2eUsers.clientUnlinked.username },
    });
    const { access_token: clientToken } = await clientLogin.json();
    const pendingRes = await request.get(`${apiUrl()}/invitations/pending-for-me`, {
      headers: { Authorization: `Bearer ${clientToken}` },
    });
    const [invitation]: Array<{ id: number; code: string }> = await pendingRes.json();

    const firstAccept = await request.post(`${apiUrl()}/invitations/${invitation.code}/accept`, {
      headers: { Authorization: `Bearer ${clientToken}` },
    });
    expect(firstAccept.status()).toBe(201);

    const secondAccept = await request.post(`${apiUrl()}/invitations/${invitation.code}/accept`, {
      headers: { Authorization: `Bearer ${clientToken}` },
    });
    expect(secondAccept.status()).toBe(409);
  });
});
