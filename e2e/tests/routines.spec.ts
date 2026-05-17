import { test, expect, e2eUsers, loginViaApi } from '../fixtures';
import { apiUrl } from '../fixtures/reset';
import type { Page } from '@playwright/test';

// serial mode — tests share DB state (create → edit → delete chain)
test.describe.configure({ mode: 'serial' });

const COACH_ROUTINES_URL = '/dashboard';

async function setLangCa(page: Page): Promise<void> {
  await page.evaluate(() => localStorage.setItem('language', 'ca'));
}

test.describe('Flux de cicle de vida de rutines', () => {

  // ─── Crear una rutina nova ────────────────────────────────────────────────

  test('el coach crea una rutina nova i apareix a la llista', async ({ page }) => {
    await loginViaApi(page, e2eUsers.coach);
    await setLangCa(page);
    await page.goto(COACH_ROUTINES_URL);

    // Obre el modal de creació
    await page.getByText('Nova rutina').click();
    await expect(page.locator('[data-testid="routine-modal-name-input"]')).toBeVisible();

    // Omple el nom i guarda interceptant la resposta del backend
    await page.locator('[data-testid="routine-modal-name-input"]').fill('Rutina E2E Nova');

    const [createResponse] = await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes('/routines/create') &&
          r.request().method() === 'POST',
      ),
      page.locator('[data-testid="routine-modal-save-btn"]').click(),
    ]);

    expect(createResponse.status()).toBe(201);

    // La targeta ha d'aparèixer sense recarregar la pàgina
    await expect(page.getByText('Rutina E2E Nova')).toBeVisible();
  });

  // ─── Editar una rutina existent ──────────────────────────────────────────

  test('el coach edita el nom d\'una rutina existent', async ({ page, request }) => {
    await loginViaApi(page, e2eUsers.coach);
    await setLangCa(page);
    await page.goto(COACH_ROUTINES_URL);

    // Obté l'ID de la rutina base del seed via API
    const loginRes = await request.post(`${apiUrl()}/testing/login`, {
      data: { username: e2eUsers.coach.username },
    });
    const { access_token } = await loginRes.json();
    const routinesRes = await request.get(`${apiUrl()}/routines`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const routines: Array<{ id: number; name: string }> = await routinesRes.json();
    const seed = routines.find((r) => r.name === 'e2e_routine_basic');
    expect(seed).toBeDefined();

    // Clica el botó d'editar de la targeta correcta
    await page.locator(`[data-testid="routine-card-edit-btn-${seed!.id}"]`).click();
    await expect(page.locator('[data-testid="routine-modal-name-input"]')).toBeVisible();

    // Canvia el nom
    await page.locator('[data-testid="routine-modal-name-input"]').fill('');
    await page.locator('[data-testid="routine-modal-name-input"]').fill('Rutina E2E Editada');

    const [editResponse] = await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes(`/routines/${seed!.id}/edit`) &&
          r.request().method() === 'PUT',
      ),
      page.locator('[data-testid="routine-modal-save-btn"]').click(),
    ]);

    expect(editResponse.status()).toBe(200);

    // El nou nom ha d'apareixer; l'anterior no
    await expect(page.getByText('Rutina E2E Editada')).toBeVisible();
    await expect(page.getByText('e2e_routine_basic')).not.toBeVisible();
  });

  // ─── Cancel·lar l'edició no persisteix canvis ────────────────────────────

  test('cancel·lar l\'edició no fa cap petició PATCH/PUT', async ({ page, request }) => {
    await loginViaApi(page, e2eUsers.coach);
    await setLangCa(page);
    await page.goto(COACH_ROUTINES_URL);

    // Obté l'ID d'una rutina per editar-la
    const loginRes = await request.post(`${apiUrl()}/testing/login`, {
      data: { username: e2eUsers.coach.username },
    });
    const { access_token } = await loginRes.json();
    const routinesRes = await request.get(`${apiUrl()}/routines`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const routines: Array<{ id: number; name: string }> = await routinesRes.json();
    const anyRoutine = routines[0];
    expect(anyRoutine).toBeDefined();

    // Registra si es fa alguna petició PUT a routines
    let putMade = false;
    page.on('request', (req) => {
      if (req.url().includes('/routines/') && req.method() === 'PUT') {
        putMade = true;
      }
    });

    // Obre modal, canvia nom i cancel·la
    await page.locator(`[data-testid="routine-card-edit-btn-${anyRoutine.id}"]`).click();
    await expect(page.locator('[data-testid="routine-modal-name-input"]')).toBeVisible();
    await page.locator('[data-testid="routine-modal-name-input"]').fill('Nom que no es desa');
    await page.locator('[data-testid="routine-modal-cancel-btn"]').click();

    // El modal ha de tancar-se, no s'ha fet cap PUT i el nom original segueix visible
    await expect(page.locator('[data-testid="routine-modal-name-input"]')).not.toBeVisible();
    expect(putMade).toBe(false);
    await expect(page.getByText(anyRoutine.name)).toBeVisible();
  });

  // ─── Eliminar una rutina ─────────────────────────────────────────────────

  test('el coach elimina una rutina i desapareix de la llista', async ({ page, request }) => {
    await loginViaApi(page, e2eUsers.coach);
    await setLangCa(page);
    await page.goto(COACH_ROUTINES_URL);

    // Crea una rutina nova per eliminar-la (no toquem la del seed)
    const loginRes = await request.post(`${apiUrl()}/testing/login`, {
      data: { username: e2eUsers.coach.username },
    });
    const { access_token } = await loginRes.json();
    const createRes = await request.post(`${apiUrl()}/routines/create`, {
      headers: { Authorization: `Bearer ${access_token}` },
      data: { name: 'Rutina per Eliminar', exercises: [], clientIds: [] },
    });
    expect(createRes.status()).toBe(201);
    const created: { id: number; name: string } = await createRes.json();

    // Refresca la pàgina per veure la nova targeta
    await page.reload();
    await expect(page.locator(`[data-testid="routine-card-${created.id}"]`)).toBeVisible();

    // Accepta el diàleg natiu del navegador
    page.on('dialog', (dialog) => dialog.accept());

    const [deleteResponse] = await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes(`/routines/${created.id}`) &&
          r.request().method() === 'DELETE',
      ),
      page.locator(`[data-testid="routine-card-delete-btn-${created.id}"]`).click(),
    ]);

    expect(deleteResponse.status()).toBe(200);

    // La targeta ha de desaparèixer sense recarregar la pàgina
    await expect(page.locator(`[data-testid="routine-card-${created.id}"]`)).not.toBeVisible();
  });

  // ─── Cancel·lar el diàleg d'eliminació no esborrem res ───────────────────

  test('descartar el diàleg d\'eliminació no fa DELETE ni treu la targeta', async ({ page, request }) => {
    await loginViaApi(page, e2eUsers.coach);
    await setLangCa(page);
    await page.goto(COACH_ROUTINES_URL);

    const loginRes = await request.post(`${apiUrl()}/testing/login`, {
      data: { username: e2eUsers.coach.username },
    });
    const { access_token } = await loginRes.json();
    const routinesRes = await request.get(`${apiUrl()}/routines`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const routines: Array<{ id: number; name: string }> = await routinesRes.json();
    const target = routines.find((r) => r.name === 'e2e_routine_basic');
    expect(target).toBeDefined();

    let deleteMade = false;
    page.on('request', (req) => {
      if (req.url().includes(`/routines/${target!.id}`) && req.method() === 'DELETE') {
        deleteMade = true;
      }
    });

    // Descartem el diàleg natiu
    page.on('dialog', (dialog) => dialog.dismiss());
    await page.locator(`[data-testid="routine-card-delete-btn-${target!.id}"]`).click();

    // La targeta ha de seguir visible i no s'ha fet cap DELETE
    await expect(page.locator(`[data-testid="routine-card-${target!.id}"]`)).toBeVisible();
    expect(deleteMade).toBe(false);
  });

  // ─── Guard de rol: client no pot crear rutines ───────────────────────────

  test('un client no pot crear rutines (HTTP 403)', async ({ request }) => {
    const loginRes = await request.post(`${apiUrl()}/testing/login`, {
      data: { username: e2eUsers.clientLinked.username },
    });
    const { access_token } = await loginRes.json();

    const res = await request.post(`${apiUrl()}/routines/create`, {
      headers: { Authorization: `Bearer ${access_token}` },
      data: { name: 'Rutina no autoritzada', exercises: [], clientIds: [] },
    });

    expect(res.status()).toBe(403);
  });

  // ─── Validació: nom buit ──────────────────────────────────────────────────

  test('el formulari mostra error si el nom és buit i no fa POST', async ({ page }) => {
    await loginViaApi(page, e2eUsers.coach);
    await setLangCa(page);
    await page.goto(COACH_ROUTINES_URL);

    await page.getByText('Nova rutina').click();
    await expect(page.locator('[data-testid="routine-modal-name-input"]')).toBeVisible();

    // Assegura que el camp és buit i intenta guardar
    await page.locator('[data-testid="routine-modal-name-input"]').fill('');

    let postMade = false;
    page.on('request', (req) => {
      if (req.url().includes('/routines/create') && req.method() === 'POST') {
        postMade = true;
      }
    });

    await page.locator('[data-testid="routine-modal-save-btn"]').click();

    // L'error ha de ser visible i no s'ha fet cap POST
    await expect(page.locator('[data-testid="routine-modal-name-error"]')).toBeVisible();
    expect(postMade).toBe(false);

    // El modal segueix obert
    await expect(page.locator('[data-testid="routine-modal-name-input"]')).toBeVisible();
  });

  // ─── Validació: l'error desapareix quan s'introdueix un nom vàlid ────────

  test('l\'error de validació desapareix i fa POST quan s\'introdueix un nom vàlid', async ({ page }) => {
    await loginViaApi(page, e2eUsers.coach);
    await setLangCa(page);
    await page.goto(COACH_ROUTINES_URL);

    await page.getByText('Nova rutina').click();
    await expect(page.locator('[data-testid="routine-modal-name-input"]')).toBeVisible();

    // Primer provoquem l'error
    await page.locator('[data-testid="routine-modal-save-btn"]').click();
    await expect(page.locator('[data-testid="routine-modal-name-error"]')).toBeVisible();

    // Introduïm un nom vàlid i guardem
    const [createResponse] = await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes('/routines/create') &&
          r.request().method() === 'POST',
      ),
      (async () => {
        await page.locator('[data-testid="routine-modal-name-input"]').fill('Rutina Validada');
        await page.locator('[data-testid="routine-modal-save-btn"]').click();
      })(),
    ]);

    // L'error ha de desaparèixer i la petició ha de tenir èxit
    await expect(page.locator('[data-testid="routine-modal-name-error"]')).not.toBeVisible();
    expect(createResponse.status()).toBe(201);
  });

  // ─── Validació: nom amb espais en blanc ───────────────────────────────────

  test('el formulari mostra error si el nom és d\'espais en blanc i no fa POST', async ({ page }) => {
    await loginViaApi(page, e2eUsers.coach);
    await setLangCa(page);
    await page.goto(COACH_ROUTINES_URL);

    await page.getByText('Nova rutina').click();
    await expect(page.locator('[data-testid="routine-modal-name-input"]')).toBeVisible();

    await page.locator('[data-testid="routine-modal-name-input"]').fill('   ');

    let postMade = false;
    page.on('request', (req) => {
      if (req.url().includes('/routines/create') && req.method() === 'POST') {
        postMade = true;
      }
    });

    await page.locator('[data-testid="routine-modal-save-btn"]').click();

    await expect(page.locator('[data-testid="routine-modal-name-error"]')).toBeVisible();
    expect(postMade).toBe(false);
  });
});
