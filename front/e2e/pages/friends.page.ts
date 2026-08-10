import type { Locator, Page } from '@playwright/test';

/**
 * Les quatre onglets de la page Amis, et les actions qu'on y mène.
 *
 * Chaque ligne de résultat est repérée par le pseudo affiché : c'est aussi ce que le
 * back renvoie désormais, et rien d'autre — depuis le Lot E, ni email ni id
 * d'utilisateur ne traversent le réseau. Le test s'appuie donc exactement sur ce
 * que le produit expose.
 */
export class FriendsPage {
  readonly searchInput: Locator;
  readonly receivedBadge: Locator;

  constructor(private readonly page: Page) {
    this.searchInput = page.getByLabel('Rechercher un joueur');
    // Le badge porte un aria-label qui enonce le compte : on le cible par ce
    // libelle plutot que par son texte tronque ("9+").
    this.receivedBadge = page.getByLabel(/demandes? en attente|Plus de 9 demandes/);
  }

  async goto(): Promise<void> {
    await this.page.goto('/profile/friends');
  }

  async openTab(name: 'Amis' | 'Reçues' | 'Envoyées' | 'Chercher'): Promise<void> {
    await this.page.getByRole('tab', { name: new RegExp(`^${name}`) }).click();
  }

  /** Recherche live : pas de bouton, la saisie déclenche la requête après debounce. */
  async search(query: string): Promise<void> {
    await this.openTab('Chercher');
    await this.searchInput.fill(query);
  }

  /** La carte d'un joueur, dans l'onglet actif. */
  row(displayName: string): Locator {
    return this.page.locator('[data-slot="card"]', { hasText: displayName });
  }

  async sendRequestTo(displayName: string): Promise<void> {
    await this.row(displayName).getByRole('button', { name: 'Envoyer' }).click();
  }

  async accept(displayName: string): Promise<void> {
    await this.row(displayName).getByRole('button', { name: 'Accepter' }).click();
  }

  async refuse(displayName: string): Promise<void> {
    await this.row(displayName).getByRole('button', { name: 'Refuser' }).click();
  }

  /** Suppression d'un ami : ouvre la confirmation, puis confirme. */
  async removeFriend(displayName: string): Promise<void> {
    await this.row(displayName).getByRole('button', { name: 'Supprimer' }).click();
    await this.page
      .getByRole('alertdialog')
      .getByRole('button', { name: 'Supprimer' })
      .click();
  }

  async cancelRemoval(displayName: string): Promise<void> {
    await this.row(displayName).getByRole('button', { name: 'Supprimer' }).click();
    await this.page.getByRole('button', { name: 'Annuler' }).click();
  }
}
