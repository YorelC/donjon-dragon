import { expect, type Locator, type Page } from '@playwright/test';

/** Les six caractéristiques, dans l'ordre où le tableau standard les distribue. */
export const STANDARD_ARRAY_ORDER = [
  'Force',
  'Dextérité',
  'Constitution',
  'Intelligence',
  'Sagesse',
  'Charisme',
] as const;

const CHARACTER_SHEET_URL = /\/characters\/[^/]+\/sheet$/;
/** La zone de choix de l'étape ouverte, à gauche de sa fiche détaillée. */
const STEP_REGION = "Choix de l'étape";
const CHARACTER_LIST_URL = /\/characters$/;

/** Le champ numérique de l'échelle, distinct du curseur qui porte le libellé court. */
export const HEIGHT_FIELD = 'Taille en cm';
export const WEIGHT_FIELD = 'Poids en kg';

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
  readonly nextButton: Locator;
  /** En réouverture, le même bouton final change de nom : la fiche existe déjà. */
  readonly saveButton: Locator;

  constructor(readonly page: Page) {
    this.nameInput = page.getByLabel('Nom du personnage');
    this.finishButton = page.getByRole('button', { name: 'Créer le personnage' });
    this.nextButton = page.getByRole('button', { name: 'Suivant', exact: true });
    this.saveButton = page.getByRole('button', { name: 'Enregistrer les modifications' });
    this.preview = page.getByText('Personnage à créer');
  }

  /**
   * Crée la fiche et attend d'arriver dessus.
   *
   * Pas un titre au nom du personnage : l'aperçu en affiche déjà un avant tout
   * enregistrement, et des parcours ont passé au vert alors que le serveur
   * refusait la création. Seule la redirection prouve que la fiche existe.
   */
  async finishCreation(): Promise<void> {
    await expect(this.finishButton).toBeEnabled();
    await this.finishButton.click();
    await expect(this.page).toHaveURL(CHARACTER_SHEET_URL);
  }

  /**
   * Enregistre une correction : le retour à la liste prouve que le serveur l'a
   * acceptée. La liste s'affiche d'abord depuis le cache, avec l'ancienne
   * révision : agir avant son rafraîchissement vaut un 409 légitime.
   */
  async saveChanges(): Promise<void> {
    await expect(this.saveButton).toBeEnabled();
    await this.saveButton.click();
    await expect(this.page).toHaveURL(CHARACTER_LIST_URL);
    // Plusieurs requêtes rafraîchissent la liste après l'enregistrement : attendre
    // la première ne suffit pas (409 intermittent). Le temps réel passe par
    // websocket, qui ne compte pas dans `networkidle`.
    await this.page.waitForLoadState('networkidle');
  }

  /** Les PV n'apparaissent qu'une fois l'aperçu calculé par le serveur. */
  async waitForServerPreview(): Promise<void> {
    await expect(this.page.getByText(/^PV \d+$/)).toBeVisible();
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
   * Une vignette de choix — espèce, classe, historique, ordre, alignement. Son
   * nom accessible est son seul libellé : les initiales du losange n'en font pas
   * partie, et la description se lit dans la fiche détaillée.
   */
  async choose(name: string): Promise<void> {
    await this.page.getByRole('radio', { name, exact: true }).click();
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
    await this.page.getByLabel(HEIGHT_FIELD).fill(identity.heightCm);
    await this.page.getByLabel(WEIGHT_FIELD).fill(identity.weightKg);
    await this.page.getByLabel('Description (facultative)').fill(identity.description);
  }

  /** Une langue retenue : le bouton porte son état, pas seulement sa couleur. */
  selectedLanguage(name: string): Locator {
    return this.page.getByRole('button', { name, exact: true });
  }

  /** Un champ d'état civil, modifiable tant que la fiche n'est pas acceptée. */
  identityField(label: string): Locator {
    return this.page.getByLabel(label);
  }

  /** L'alignement retenu : une carte cochée tant que la fiche reste corrigeable. */
  selectedAlignment(name: string): Locator {
    return this.page.getByRole('radio', { name, checked: true });
  }

  /**
   * Un bouton d'une étape bornée — maîtrise d'arme, outil, langue de classe.
   *
   * Rendu comme locator et non comme clic : ces étapes se prouvent autant par ce
   * qu'elles REFUSENT que par ce qu'elles acceptent. Un choix déjà pris ailleurs
   * doit être désactivé sous les yeux du joueur, pas silencieusement absent.
   */
  choice(label: string): Locator {
    return this.stepPanel().getByRole('button', { name: label, exact: true });
  }

  /**
   * La zone de choix de l'étape ouverte, pour ne pas confondre ses boutons avec
   * ceux du fil conducteur, de la fiche détaillée ni avec « Précédent » /
   * « Suivant ». Elle porte son nom de région.
   */
  stepPanel(): Locator {
    return this.page.getByRole('region', { name: STEP_REGION });
  }

  /**
   * Coche un à un les premiers boutons libres d'une zone, et rend leurs libellés.
   *
   * Un à la fois, en relisant la zone : cocher un bouton en grise d'autres.
   * `aria-pressed="false"` exclut ce qui est déjà coché, donc jamais de retrait.
   */
  async pressFirstFree(scope: Locator, count: number): Promise<string[]> {
    const labels: string[] = [];
    for (let pressed = 0; pressed < count; pressed += 1) {
      const free = scope.locator('button[aria-pressed="false"]:enabled').first();
      labels.push(await accessibleLabelOf(free));
      await free.click();
    }
    return labels;
  }

  /** Les options que le compteur laisse encore prendre dans l'étape ouverte. */
  availableChoices(): Locator {
    return this.stepPanel().getByRole('button').and(this.page.locator(':enabled'));
  }

  /**
   * Prend les `count` premières options disponibles, et rend leurs libellés.
   *
   * Les libellés d'armes et d'instruments sont exactement ce qui bougera à la
   * première errata : les nommer un par un ferait tomber le test sur un
   * renommage plutôt que sur une régression. Ce qui se prouve ici, c'est le
   * quota et le fait que l'étape devienne franchissable.
   *
   * `nth(index)` et non `first()` : une option retenue reste cliquable — c'est
   * ainsi qu'on la retire — donc reprendre la première la DÉSÉLECTIONNERAIT.
   * L'ordre, lui, ne bouge pas : aucune option ne se désactive avant que le
   * quota soit atteint.
   */
  async chooseAvailable(count: number): Promise<string[]> {
    const labels: string[] = [];

    for (let index = 0; index < count; index += 1) {
      const option = this.availableChoices().nth(index);
      labels.push(await accessibleLabelOf(option));
      await option.click();
    }

    return labels;
  }

  /**
   * Un groupe de sorts, par le début de son titre — « Sorts mineurs de classe »,
   * « Grimoire ». Le titre porte aussi le compteur : on ne le fixe pas.
   *
   * Scoper par groupe est obligatoire : la classe et Initié à la magie proposent
   * les mêmes sorts, et un même libellé existe alors deux fois à l'écran.
   */
  spellGroup(title: string): Locator {
    return this.page
      .getByRole('heading', { level: 3, name: new RegExp(`^${title}`) })
      .locator('..');
  }

  /** La carte d'un don d'Origine, par sa provenance : l'Humain Initié en a deux pareilles. */
  featCard(origin: 'Historique' | 'Espèce'): Locator {
    return this.stepPanel()
      .locator('[data-slot="card"]')
      .filter({ has: this.page.getByText(origin, { exact: true }) });
  }

  spellIn(groupTitle: string, name: string): Locator {
    return this.spellGroup(groupTitle).getByRole('button', { name, exact: true });
  }

  /** Le compteur d'une étape bornée, tel que son badge l'affiche — « 2 / 2 ». */
  boundedCounter(): Locator {
    return this.stepPanel().getByText(/^\d+ \/ \d+$/);
  }

  /** Un menu du catalogue, nommé par son libellé depuis le correctif d'accessibilité. */
  async selectCatalogOption(label: string, option: string): Promise<void> {
    await this.page.getByRole('combobox', { name: label }).click();
    await this.page.getByRole('option', { name: option, exact: true }).click();
  }

  /**
   * La première option d'un menu du catalogue.
   *
   * Même raison que `chooseAvailable` : les noms des boîtes de jeux et des
   * instruments viennent du catalogue d'objets, et ce test porte sur le fait
   * qu'un objet concret DOIT être choisi, pas sur lequel.
   */
  async selectFirstCatalogOption(label: string): Promise<string> {
    await this.page.getByRole('combobox', { name: label }).click();
    const first = this.page.getByRole('option').first();
    const chosen = (await first.textContent()) ?? '';
    await first.click();

    return chosen;
  }
}

/**
 * Le libellé d'une option, sans sa sous-ligne : une compétence affiche
 * « Perception » puis « Sagesse », et c'est « Perception » qui la nomme.
 */
async function accessibleLabelOf(option: Locator): Promise<string> {
  return option.evaluate((node) => {
    const labelId = node.getAttribute('aria-labelledby');
    const label = labelId ? node.ownerDocument.getElementById(labelId) : null;
    return (label ?? node).textContent?.trim() ?? '';
  });
}
