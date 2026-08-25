import type { Locator, Page } from '@playwright/test';
import type { Account } from '../fixtures/accounts';

/**
 * Les sélecteurs de la connexion, ici et nulle part ailleurs.
 *
 * C'est ce qui rend la suite maintenable : renommer un libellé de champ coûte une
 * ligne, pas une chasse dans dix specs. Et les localisateurs passent par le rôle et
 * le libellé accessibles plutôt que par des classes CSS — un test qui casse quand
 * on retouche du Tailwind ne teste pas le produit.
 */
export class LoginPage {
  readonly email: Locator;
  readonly password: Locator;
  readonly submit: Locator;
  readonly error: Locator;

  constructor(private readonly page: Page) {
    this.email = page.getByLabel('Adresse email');
    this.password = page.getByLabel('Mot de passe', { exact: true });
    this.submit = page.getByRole('button', { name: 'Se connecter' });
    this.error = page.locator('.alert-error');
  }

  async goto(): Promise<void> {
    await this.page.goto('/login');
  }

  async fill(email: string, password: string): Promise<void> {
    await this.email.fill(email);
    await this.password.fill(password);
  }

  async submitWith(email: string, password: string): Promise<void> {
    await this.fill(email, password);
    await this.submit.click();
  }

  /** Connexion complète, jusqu'à l'arrivée sur les campagnes. */
  async loginAs(account: Account): Promise<void> {
    await this.goto();
    await this.submitWith(account.email, account.password);

    try {
      await this.page.waitForURL('**/campaigns', { timeout: 10_000 });
    } catch (cause) {
      // Un timeout nu sur waitForURL ne dit pas POURQUOI. Il ne distingue pas un
      // mot de passe erroné d'une limite de débit atteinte — et ce diagnostic a
      // coûté un run entier.
      const shown =
        (await this.error.textContent().catch(() => null)) ?? 'aucun message affiché';
      throw new Error(
        `Connexion refusée pour ${account.email} : ${shown.trim()}`,
        { cause },
      );
    }
  }
}
