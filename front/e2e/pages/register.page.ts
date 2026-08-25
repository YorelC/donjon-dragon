import type { Locator, Page } from '@playwright/test';

export interface RegistrationValues {
  email: string;
  displayName: string;
  password: string;
}

export class RegisterPage {
  readonly success: Locator;

  constructor(private readonly page: Page) {
    this.success = page.getByText('Vérifie ta boîte mail pour activer ton compte.');
  }

  async goto(): Promise<void> {
    await this.page.goto('/register');
  }

  async submit(values: RegistrationValues): Promise<void> {
    await this.page.getByLabel("Nom d'aventurier").fill(values.displayName);
    await this.page.getByLabel('Adresse email').fill(values.email);
    await this.page.getByLabel('Mot de passe', { exact: true }).fill(values.password);
    await this.page.getByLabel('Confirmation du mot de passe').fill(values.password);
    await this.page.getByRole('button', { name: 'Créer mon compte' }).click();
  }
}
