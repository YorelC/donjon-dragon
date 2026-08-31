import type { Locator, Page } from '@playwright/test';

/** Les six caractéristiques, dans l'ordre où le tableau standard les distribue. */
export const STANDARD_ARRAY_ORDER = [
  'Force',
  'Dextérité',
  'Constitution',
  'Intelligence',
  'Sagesse',
  'Charisme',
] as const;

export interface CharacterIdentity {
  name: string;
  alignment: string;
  age: string;
  heightCm: string;
  weightKg: string;
  /** Facultative pour le contrat, mais elle doit survivre à la réouverture. */
  description: string;
}

/**
 * Le wizard de création, du choix d'espèce à la fiche persistée.
 *
 * Tout est ciblé par rôle et libellé accessibles : ce test doit tomber quand le
 * produit change, pas quand une classe Tailwind bouge.
 */
export class CharacterBuilderPage {
  readonly nameInput: Locator;
  readonly finishButton: Locator;
  readonly preview: Locator;

  constructor(readonly page: Page) {
    this.nameInput = page.getByLabel('Nom du personnage');
    this.finishButton = page.getByRole('button', { name: 'Créer le personnage' });
    this.preview = page.getByText('Personnage à créer');
  }

  async gotoNew(campaignId: string): Promise<void> {
    await this.page.goto(`/campaigns/${campaignId}/characters/new`);
  }

  async gotoEdit(campaignId: string, characterId: string): Promise<void> {
    await this.page.goto(`/campaigns/${campaignId}/characters/${characterId}/builder`);
  }

  /**
   * Le fil conducteur : chaque étape y est un bouton portant son libellé, suivi
   * de son compteur quand elle en a un — « Langues 2/2 ».
   *
   * D'où ni égalité ni simple préfixe : « Sorts » attraperait aussi « Sorts
   * mineurs ». Le libellé doit finir la chaîne, ou être suivi de son compteur.
   * Classes de caractères littérales, sans antislash : dans un littéral de
   * gabarit, `\s` vaut « s » et la regex passerait à côté sans rien dire.
   */
  step(label: string): Locator {
    return this.page.getByRole('button', { name: new RegExp(`^${label}( [0-9]|$)`) });
  }

  async openStep(label: string): Promise<void> {
    await this.step(label).click();
  }

  /**
   * Une carte de choix — espèce, classe, historique, ordre, alignement. Son nom
   * accessible inclut la description qui suit le titre : on filtre sur le titre.
   */
  async choose(name: string): Promise<void> {
    await this.page.getByRole('radio').filter({ hasText: new RegExp(`^${name}`) }).click();
  }

  /** Un bouton bascule : compétence, langue, sort. */
  async toggle(name: string): Promise<void> {
    await this.page.getByRole('button', { name, exact: true }).click();
  }

  /** Le menu d'une caractéristique, nommé par elle depuis le correctif d'accessibilité. */
  async assignScore(ability: string, option: string): Promise<void> {
    await this.page.getByRole('combobox', { name: ability }).click();
    await this.page.getByRole('option', { name: option, exact: true }).click();
  }

  /** Une case de bonus d'historique, nommée « Sagesse +2 » depuis le correctif. */
  async setBackgroundBonus(ability: string, bonus: 1 | 2): Promise<void> {
    await this.page.getByRole('checkbox', { name: `${ability} +${bonus}` }).click();
  }

  /** Le paquetage : deux groupes dont les options portent les mêmes libellés. */
  async choosePackage(group: 'class' | 'background', optionId: string): Promise<void> {
    await this.page.locator(`#equipment-option-${group}-${optionId}`).click();
  }

  async fillIdentity(identity: CharacterIdentity): Promise<void> {
    await this.nameInput.fill(identity.name);
    await this.choose(identity.alignment);
    await this.page.getByLabel('Âge (années)').fill(identity.age);
    await this.page.getByLabel('Taille (cm)').fill(identity.heightCm);
    await this.page.getByLabel('Poids (kg)').fill(identity.weightKg);
    await this.page.getByLabel('Description (facultative)').fill(identity.description);
  }

  /** Le gabarit retenu, tel que la carte sélectionnée l'expose. */
  selectedSize(): Locator {
    return this.page.getByRole('radio', { checked: true }).filter({ hasText: /Petite|Moyenne/ });
  }

  /** Une langue retenue : le bouton porte son état, pas seulement sa couleur. */
  selectedLanguage(name: string): Locator {
    return this.page.getByRole('button', { name, exact: true });
  }

  /** Ce que l'édition n'a pas le droit de rendre modifiable. */
  frozenField(label: string): Locator {
    return this.page.getByLabel(label);
  }
}
