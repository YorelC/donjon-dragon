import { test as setup } from '@playwright/test';
import { ACCOUNTS } from './fixtures/accounts';
import { STORAGE_STATE } from './fixtures/storage-state';
import { LoginPage } from './pages/login.page';

/**
 * Ouvre une session par compte, une seule fois, et l'enregistre sur disque.
 *
 * Ce projet tourne avant tous les autres (`dependencies` dans la config). C'est ce
 * qui permet aux specs de ne plus se connecter du tout — et donc de ne plus
 * s'écrouler sur le throttle de `login`.
 */
for (const name of ['gandalf', 'legolas'] as const) {
  setup(`session ${name}`, async ({ page }) => {
    await new LoginPage(page).loginAs(ACCOUNTS[name]);
    await page.context().storageState({ path: STORAGE_STATE[name] });
  });
}
