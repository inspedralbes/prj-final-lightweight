export const apiUrl = (): string =>
  process.env.PLAYWRIGHT_API_URL ?? 'http://localhost:3000';

export const baseUrl = (): string =>
  process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173';

export async function resetDatabase(): Promise<void> {
  const url = `${apiUrl()}/testing/reset`;
  let res: Response;
  try {
    res = await fetch(url, { method: 'POST' });
  } catch (err) {
    throw new Error(
      `Backend not reachable at ${apiUrl()} — start it with E2E_TESTING=true npm run start:dev. (${
        (err as Error).message
      })`,
    );
  }
  if (res.status === 404) {
    throw new Error(
      `POST ${url} returned 404 — the E2E_TESTING flag must be set to 'true' on the backend before running the suite.`,
    );
  }
  if (!res.ok) {
    throw new Error(`POST ${url} failed with HTTP ${res.status}`);
  }
}
