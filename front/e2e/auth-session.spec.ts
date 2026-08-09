import {
  ACCOUNTS,
  NO_SESSION,
  STORAGE_STATE,
  WRONG_PASSWORD,
  expect,
  test,
} from './fixtures/test';
import {
  clearAllRelations,
  cookiesVisibleToPageScripts,
  localStorageEntries,
} from './fixtures/api';

/**
 * Ce que SEUL un vrai navigateur peut prouver.
 *
 * jsdom n'implémente pas la sémantique `HttpOnly` : dans un test unitaire,
 * `document.cookie` rend ce qu'on y a écrit. L'affirmation centrale de la session en
 * cookies — « aucun script de la page ne peut lire les tokens » — y est donc
 * intestable, et n'était jusqu'ici vérifiée que par lecture de code.
 *
 * Ces tests-ci font une VRAIE connexion : ils portent sur ce que `POST /login` pose,
 * et l'état partagé de la suite ne contient volontairement pas le cookie de
 * renouvellement (cf. fixtures/storage-state.ts).
 */
test.describe('Ce que la connexion établit', () => {
  test.use({ storageState: NO_SESSION });

  test('les trois cookies, et les deux secrets illisibles par la page', async ({
    page,
    loginAs,
  }) => {
    await loginAs(ACCOUNTS.gandalf);

    // Vu du navigateur : les drapeaux réellement posés.
    const cookies = await page.context().cookies();
    const byName = (name: string) => cookies.find((cookie) => cookie.name === name);

    expect(byName('access_token')?.httpOnly).toBe(true);
    expect(byName('refresh_token')?.httpOnly).toBe(true);
    expect(byName('csrf_token')?.httpOnly).toBe(false);
    // Le refresh ne part pas sur les appels métier.
    expect(byName('refresh_token')?.path).toBe('/api/auth');
    for (const name of ['access_token', 'refresh_token', 'csrf_token']) {
      expect(byName(name)?.sameSite).toBe('Lax');
    }

    // Vu de la page : ce qu'aurait une faille XSS. C'est la même session observée
    // depuis les deux côtés de la barrière, et c'est l'écart qui fait la preuve.
    const visible = await cookiesVisibleToPageScripts(page);
    expect(visible).not.toContain('access_token');
    expect(visible).not.toContain('refresh_token');
    // Le jeton CSRF, lui, DOIT être lisible : c'est le mécanisme même du
    // double-submit. Sa signature le protège, pas son secret.
    expect(visible).toContain('csrf_token');
  });

  test('une connexion valide mène aux campagnes', async ({ loginAs, page }) => {
    await loginAs(ACCOUNTS.gandalf);

    expect(page.url()).toContain('/campaigns');
    await expect(page.getByRole('button', { name: 'Déconnexion' })).toBeVisible();
  });

  test('un mot de passe erroné est refusé', async ({ loginPage, page }) => {
    await loginPage.goto();
    await loginPage.submitWith(ACCOUNTS.gandalf.email, WRONG_PASSWORD);

    await expect(loginPage.error).toContainText('incorrect');
    expect(page.url()).toContain('/login');
  });

  /**
   * Le bug n°3. L'intercepteur 401 ne distinguait pas les chemins : un mot de passe
   * erroné déclenchait un renouvellement qui CONSOMMAIT et faisait tourner le refresh
   * token de la session précédente, puis rejouait le login.
   *
   * On attend que le bruit du démarrage soit retombé avant de mesurer — sinon on
   * compterait le renouvellement du bootstrap, qui n'a rien à voir.
   */
  test("un 401 de connexion n'est pas suivi d'un renouvellement ni d'un rejeu", async ({
    loginPage,
    page,
  }) => {
    await loginPage.goto();
    await page.waitForLoadState('networkidle');

    const calls: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/api/auth/')) {
        calls.push(`${request.method()} ${new URL(request.url()).pathname}`);
      }
    });

    await loginPage.submitWith(ACCOUNTS.gandalf.email, WRONG_PASSWORD);
    await expect(loginPage.error).toBeVisible();

    // Exactement un appel : le login. Ni renouvellement, ni second essai.
    expect(calls).toEqual(['POST /api/auth/login']);
  });

  test('la déconnexion efface les trois cookies et referme les pages protégées', async ({
    page,
    loginAs,
  }) => {
    await loginAs(ACCOUNTS.gandalf);

    await page.getByRole('button', { name: 'Déconnexion' }).click();
    await page.waitForURL('**/');

    const remaining = (await page.context().cookies()).map((cookie) => cookie.name);
    for (const name of ['access_token', 'refresh_token', 'csrf_token']) {
      expect(remaining).not.toContain(name);
    }

    await page.goto('/profile/friends');
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Visiteur sans session', () => {
  test.use({ storageState: NO_SESSION });

  test('est renvoyé vers la connexion', async ({ page }) => {
    await page.goto('/profile/friends');

    await expect(page).toHaveURL(/\/login/);
  });

  /**
   * Comportement DÉLIBÉRÉ, découvert en écrivant ces tests et documenté ici plutôt
   * que contourné : un visiteur sans cookie coûte deux requêtes au démarrage.
   *
   * `/me` répond 401, ce qui déclenche une tentative de renouvellement — parce que le
   * front est structurellement incapable de distinguer « pas de session » de « access
   * token expiré, refresh encore valide ». C'est ce second cas qui rend le
   * renouvellement indispensable ; le premier en paie le prix.
   */
  test('le démarrage tente un renouvellement, une seule fois', async ({ page }) => {
    const calls: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/api/auth/')) {
        calls.push(`${request.method()} ${new URL(request.url()).pathname}`);
      }
    });

    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    expect(calls).toEqual(['GET /api/auth/me', 'POST /api/auth/refresh']);
  });
});

test.describe('Reprise de session', () => {
  test.use({ storageState: STORAGE_STATE.gandalf });

  test('un rechargement de page ne déconnecte pas', async ({ page }) => {
    await page.goto('/profile/friends');
    await page.reload();

    // Le front ne peut plus lire ses cookies : c'est /me qui lui rend sa session.
    // Sans l'état « indéterminé » du store, ce rechargement partait vers /login.
    await expect(page.getByRole('heading', { name: 'Amis' })).toBeVisible();
    expect(page.url()).toContain('/profile/friends');
  });

  test('une navigation directe vers une page protégée aboutit', async ({ page }) => {
    // Aucune transition React ici : le store part vide, tout repose sur /me.
    await page.goto('/profile/friends');

    await expect(page.getByRole('heading', { name: 'Amis' })).toBeVisible();
  });

  test("l'attente de /me est annoncée, pas silencieuse", async ({ page }) => {
    // On retient la réponse de /me pour observer l'état transitoire — celui que
    // PrivateRoute doit afficher au lieu de rediriger.
    await page.route('**/api/auth/me', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await route.continue();
    });

    await page.goto('/profile/friends');

    await expect(page.getByRole('status')).toBeVisible();
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: 'Amis' })).toBeVisible();
  });

  test("aucun stockage local n'est écrit, après un parcours complet", async ({
    page,
    friendsPage,
  }) => {
    // Le critère mesuré APRÈS navigation, et pas seulement à l'ouverture.
    await friendsPage.goto();
    await friendsPage.openTab('Chercher');
    await page.goto('/');

    expect(await localStorageEntries(page)).toEqual({});
    expect(await page.evaluate(() => ({ ...sessionStorage }))).toEqual({});
  });
});

test.describe('CSRF', () => {
  test.use({ storageState: STORAGE_STATE.gandalf });

  test('le client recopie le jeton en en-tête sur les mutations', async ({
    page,
    friendsPage,
  }) => {
    await friendsPage.goto();
    await clearAllRelations(page.request);

    const headers: (string | undefined)[] = [];
    page.on('request', (request) => {
      if (request.method() === 'POST' && request.url().includes('/api/friends')) {
        headers.push(request.headers()['x-csrf-token']);
      }
    });

    await friendsPage.search(ACCOUNTS.gimli.displayName);
    await friendsPage.sendRequestTo(ACCOUNTS.gimli.displayName);
    await expect(
      friendsPage.row(ACCOUNTS.gimli.displayName).getByRole('button'),
    ).toHaveText('Invitation envoyée');

    expect(headers.length).toBeGreaterThan(0);
    for (const header of headers) {
      expect(header).toBeTruthy();
    }

    await clearAllRelations(page.request);
  });

  test('une mutation sans le jeton est refusée par le serveur', async ({ page }) => {
    await page.goto('/campaigns');

    // On court-circuite le client pour prouver que la défense est côté serveur, et
    // pas une politesse du front.
    const response = await page.request.post(
      `/api/friends/request/${ACCOUNTS.frodo.displayName}`,
    );

    expect(response.status()).toBe(403);
  });
});
