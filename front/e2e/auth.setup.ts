import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { test as setup } from '@playwright/test';
import { ACCOUNTS } from './fixtures/accounts';
import { REFRESH_COOKIE, STORAGE_STATE } from './fixtures/storage-state';
import { LoginPage } from './pages/login.page';

/**
 * Ouvre une session par compte, une seule fois, et l'enregistre sur disque.
 *
 * Ce projet tourne avant tous les autres (`dependencies` dans la config). C'est ce
 * qui permet aux specs de ne plus se connecter du tout — et donc de ne plus
 * s'écrouler sur le throttle de `login`.
 *
 * Le cookie de RENOUVELLEMENT est retiré avant l'enregistrement : voir
 * fixtures/storage-state.ts. C'est ce qui rend l'état partageable sans risque.
 */
for (const name of ['gandalf', 'legolas'] as const) {
  setup(`session ${name}`, async ({ page }) => {
    await new LoginPage(page).loginAs(ACCOUNTS[name]);

    await saveSessionWithoutRefreshToken(page.context(), STORAGE_STATE[name]);
  });
}

type BrowserContextLike = {
  storageState(): Promise<{ cookies: { name: string }[] }>;
};

async function saveSessionWithoutRefreshToken(
  context: BrowserContextLike,
  path: string,
): Promise<void> {
  const state = await context.storageState();

  await mkdir(dirname(path), { recursive: true });
  await writeFile(
    path,
    JSON.stringify(
      {
        ...state,
        cookies: state.cookies.filter((cookie) => cookie.name !== REFRESH_COOKIE),
      },
      null,
      2,
    ),
    'utf8',
  );
}
