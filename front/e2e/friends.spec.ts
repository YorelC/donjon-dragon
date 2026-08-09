import { ACCOUNTS, STORAGE_STATE, expect, test } from './fixtures/test';
import { clearAllRelations, sendFriendRequest } from './fixtures/api';

/**
 * Les use cases de l'amitié, contre la vraie base.
 *
 * Ces parcours ont une raison d'être précise : le bug qui faisait échouer la
 * suppression d'un ami À L'ÉCRAN était invisible en test unitaire, parce que les mocks
 * renvoyaient 204 là où le serveur renvoyait 200 avec un corps vide. Un test qui
 * décide lui-même de la réponse ne peut pas attraper ce genre de faute.
 *
 * Chaque test remet les relations à zéro AVANT de poser sa précondition : la base est
 * partagée et persistante, un test non rejouable finit ignoré.
 */
test.use({ storageState: STORAGE_STATE.gandalf });

test.describe('Recherche de joueurs', () => {
  test.beforeEach(async ({ page, friendsPage }) => {
    await friendsPage.goto();
    await clearAllRelations(page.request);
  });

  test('trouve un joueur par une partie de son pseudo', async ({ friendsPage }) => {
    await friendsPage.search('leg');

    await expect(friendsPage.row(ACCOUNTS.legolas.displayName)).toBeVisible();
  });

  test("n'expose que le pseudo, jamais l'email", async ({ friendsPage, page }) => {
    await friendsPage.search('leg');
    await expect(friendsPage.row(ACCOUNTS.legolas.displayName)).toBeVisible();

    // Le Lot E vérifié à l'écran : l'email ne traverse plus le réseau, donc il ne peut
    // pas s'afficher — même par accident, même dans un attribut.
    expect(await page.content()).not.toContain(ACCOUNTS.legolas.email);
  });

  test("refuse une requête trop courte sans appeler l'API", async ({
    friendsPage,
    page,
  }) => {
    const searchCalls: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/api/friends/search')) searchCalls.push(request.url());
    });

    await friendsPage.search('le');

    // Le minimum à 3 caractères est ce qui empêche de balayer l'annuaire lettre par
    // lettre : il doit mordre AVANT le réseau.
    await expect(page.getByText(/au moins 3 caractères/i)).toBeVisible();
    expect(searchCalls).toEqual([]);
  });

  test('annonce clairement une recherche sans résultat', async ({
    page,
    friendsPage,
  }) => {
    await friendsPage.search('zzzqqq');

    await expect(page.getByText('Aucun résultat trouvé')).toBeVisible();
  });
});

test.describe("Envoi d'une demande d'ami", () => {
  test.beforeEach(async ({ page, friendsPage }) => {
    await friendsPage.goto();
    await clearAllRelations(page.request);
  });

  test('la demande partie apparaît dans les envoyées', async ({ friendsPage }) => {
    await friendsPage.search(ACCOUNTS.gimli.displayName);
    await friendsPage.sendRequestTo(ACCOUNTS.gimli.displayName);

    await expect(
      friendsPage.row(ACCOUNTS.gimli.displayName).getByRole('button'),
    ).toHaveText('Invitation envoyée');

    await friendsPage.openTab('Envoyées');
    await expect(friendsPage.row(ACCOUNTS.gimli.displayName)).toBeVisible();
  });

  test('le bouton se verrouille après envoi, pas de double demande', async ({
    friendsPage,
  }) => {
    await friendsPage.search(ACCOUNTS.gimli.displayName);
    await friendsPage.sendRequestTo(ACCOUNTS.gimli.displayName);

    const button = friendsPage.row(ACCOUNTS.gimli.displayName).getByRole('button');
    await expect(button).toHaveText('Invitation envoyée');
    await expect(button).toBeDisabled();
  });
});

test.describe("Réception d'une demande d'ami", () => {
  // La précondition vient de la session de Legolas, en API seule : pas de seconde
  // fenêtre à piloter, et pas une connexion de plus à consommer.
  test.beforeEach(async ({ page, legolasApi, friendsPage }) => {
    await page.goto('/campaigns');
    await clearAllRelations(page.request);
    await clearAllRelations(legolasApi);
    await sendFriendRequest(legolasApi, ACCOUNTS.gandalf.displayName);

    await friendsPage.goto();
  });

  test('le badge annonce les demandes en attente', async ({ friendsPage }) => {
    await expect(friendsPage.receivedBadge).toBeVisible();
  });

  test('accepter fait basculer la demande dans les amis', async ({ friendsPage }) => {
    await friendsPage.openTab('Reçues');
    await friendsPage.accept(ACCOUNTS.legolas.displayName);

    await friendsPage.openTab('Amis');
    await expect(friendsPage.row(ACCOUNTS.legolas.displayName)).toBeVisible();
  });

  test("refuser la retire des demandes sans créer d'amitié", async ({ friendsPage }) => {
    await friendsPage.openTab('Reçues');
    await friendsPage.refuse(ACCOUNTS.legolas.displayName);

    await expect(friendsPage.row(ACCOUNTS.legolas.displayName)).toBeHidden();
    await friendsPage.openTab('Amis');
    await expect(friendsPage.row(ACCOUNTS.legolas.displayName)).toBeHidden();
  });

  test('le badge disparaît quand il ne reste rien à traiter', async ({ friendsPage }) => {
    await friendsPage.openTab('Reçues');
    await friendsPage.refuse(ACCOUNTS.legolas.displayName);

    await expect(friendsPage.receivedBadge).toBeHidden();
  });
});

test.describe("Suppression d'un ami", () => {
  test.beforeEach(async ({ page, legolasApi, friendsPage }) => {
    await page.goto('/campaigns');
    await clearAllRelations(page.request);
    await clearAllRelations(legolasApi);
    await sendFriendRequest(legolasApi, ACCOUNTS.gandalf.displayName);

    await friendsPage.goto();
    await friendsPage.openTab('Reçues');
    await friendsPage.accept(ACCOUNTS.legolas.displayName);
    await friendsPage.openTab('Amis');
    await expect(friendsPage.row(ACCOUNTS.legolas.displayName)).toBeVisible();
  });

  // LE test qui manquait. La suppression renvoyait 200 avec un corps vide là où le
  // front n'accepte que 204 : l'ami disparaissait, réapparaissait par rollback, un
  // toast d'erreur s'affichait, puis il disparaissait au refetch suivant. Invisible en
  // test unitaire, évident ici.
  test('la suppression aboutit, sans erreur ni retour en arrière', async ({
    friendsPage,
    page,
  }) => {
    await friendsPage.removeFriend(ACCOUNTS.legolas.displayName);

    await expect(friendsPage.row(ACCOUNTS.legolas.displayName)).toBeHidden();
    await expect(page.getByText(/Erreur lors de la suppression/)).toBeHidden();
  });

  test('la suppression survit à un rechargement', async ({ friendsPage, page }) => {
    await friendsPage.removeFriend(ACCOUNTS.legolas.displayName);
    await expect(friendsPage.row(ACCOUNTS.legolas.displayName)).toBeHidden();

    // Le vrai juge : l'ami a-t-il disparu de la BASE, ou seulement de l'écran ?
    await page.reload();
    await expect(friendsPage.row(ACCOUNTS.legolas.displayName)).toBeHidden();
  });

  test('annuler la confirmation ne supprime rien', async ({ friendsPage }) => {
    await friendsPage.cancelRemoval(ACCOUNTS.legolas.displayName);

    await expect(friendsPage.row(ACCOUNTS.legolas.displayName)).toBeVisible();
  });

  test("la confirmation nomme l'ami concerné", async ({ friendsPage, page }) => {
    await friendsPage
      .row(ACCOUNTS.legolas.displayName)
      .getByRole('button', { name: 'Supprimer' })
      .click();

    // Le titre précisément : la description reprend le même pseudo, et un locator par
    // texte seul en attrapait deux.
    await expect(
      page.getByRole('heading', {
        name: `Supprimer ${ACCOUNTS.legolas.displayName} ?`,
      }),
    ).toBeVisible();
  });
});
