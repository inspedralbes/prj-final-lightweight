import { resetDatabase } from './fixtures/reset';

async function globalSetup(): Promise<void> {
  await resetDatabase();
}

export default globalSetup;
