import {
  request as apiRequest,
  test as base,
  type APIRequestContext,
} from '@playwright/test';
import type { Account } from './accounts';
import { STORAGE_STATE } from './storage-state';
import { LoginPage } from '../pages/login.page';
import { FriendsPage } from '../pages/friends.page';
import { RegisterPage } from '../pages/register.page';

interface Fixtures {
  loginPage: LoginPage;
  friendsPage: FriendsPage;
  registerPage: RegisterPage;
  /**
   * Connecte le compte demandé par l'INTERFACE.
   *
   * À réserver aux specs qui testent la connexion elle-même : partout ailleurs, la
   * session vient de `storageState` (cf. fixtures/storage-state.ts), sinon le
   * throttle de `login` fait tomber la suite.
   */
  loginAs: (account: Account) => Promise<void>;
  /**
   * Session de Legolas, en API seule.
   *
   * Pour poser une précondition venant d'un AUTRE joueur — « quelqu'un t'a envoyé une
   * demande » — sans ouvrir une seconde fenêtre ni consommer une connexion.
   */
  legolasApi: APIRequestContext;
}

/**
 * Le `test` que tous les specs importent — jamais celui de @playwright/test
 * directement.
 *
 * C'est le point d'extension de la suite : un nouveau page object ou une nouvelle
 * précondition s'ajoute ici et devient disponible partout, sans toucher aux specs
 * existants.
 */
export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  friendsPage: async ({ page }, use) => {
    await use(new FriendsPage(page));
  },
  registerPage: async ({ page }, use) => {
    await use(new RegisterPage(page));
  },
  loginAs: async ({ loginPage }, use) => {
    await use((account: Account) => loginPage.loginAs(account));
  },
  legolasApi: async ({ baseURL }, use) => {
    const context = await apiRequest.newContext({
      baseURL,
      storageState: STORAGE_STATE.legolas,
    });

    await use(context);
    await context.dispose();
  },
});

export { expect } from '@playwright/test';
export { ACCOUNTS, SEARCH_SEED_PREFIX, WRONG_PASSWORD } from './accounts';
export { NO_SESSION, STORAGE_STATE } from './storage-state';
