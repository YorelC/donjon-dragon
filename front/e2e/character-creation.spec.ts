import type { Page } from '@playwright/test';
import { test, expect, STORAGE_STATE } from './fixtures/test';
import { deleteCharactersNamed, ensureCampaign } from './fixtures/api';
import {
  CharacterBuilderPage,
  STANDARD_ARRAY_ORDER,
  type CharacterIdentity,
} from './pages/character-builder.page';

/**
 * Ce que Bruno ne peut pas prouver : que le WIZARD sait fabriquer la requête.
 *
 * La collection HTTP envoie des corps écrits à la main ; elle reste verte alors
 * même que le front n'émet plus l'état civil, le gabarit ni les langues — ce qui
 * est exactement arrivé, et n'a été vu par aucun test. Ici, la composition part
 * de l'interface et va jusqu'à la fiche persistée, puis en revient.
 */
test.use({ storageState: STORAGE_STATE.gandalf });

const CAMPAIGN_NAME = 'E2E creation de personnage';
const CHARACTER_NAME = 'Thorin E2E';

const IDENTITY: CharacterIdentity = {
  name: CHARACTER_NAME,
  alignment: 'Loyal bon',
  age: '84',
  heightCm: '132',
  weightKg: '68',
  description: 'Forgeron taciturne, converti sur le tard.',
};

const LANGUAGES = ['Elfique', 'Géant'];
const CLASS_SKILLS = ['Histoire', 'Intuition'];
const CANTRIPS = ['Assistance', 'Réparation', 'Résistance'];
const SPELLS = [
  'Imprécation',
  'Bénédiction',
  'Injonction',
  "Création ou destruction d'eau",
];
const STANDARD_ARRAY = ['15', '14', '13', '12', '10', '8'];

interface SpeciesChoice {
  name: string;
  size: string | null;
}

/**
 * Deux espèces, deux traitements du gabarit.
 *
 * Le nain l'impose ; l'aasimar le fait choisir, sans lignage ni don d'origine
 * qui allongeraient le parcours. La réouverture se joue sur l'aasimar : c'est le
 * seul cas où `selectedSize` porte une décision à restituer.
 */
const DWARF: SpeciesChoice = { name: 'Nain', size: null };
const AASIMAR: SpeciesChoice = { name: 'Aasimar', size: 'Petite' };

let campaignId: string;

test.beforeEach(async ({ page }) => {
  campaignId = await ensureCampaign(page.request, CAMPAIGN_NAME);
  await deleteCharactersNamed(page.request, campaignId, CHARACTER_NAME);
});

test.describe('Créer un personnage depuis le wizard', () => {
  test('compose un clerc nain et le persiste', async ({ page }) => {
    const builder = new CharacterBuilderPage(page);
    await createCleric(builder, DWARF);

    await expect(page.getByRole('heading', { name: CHARACTER_NAME })).toBeVisible();
    await expect(page.getByText('Clerc')).toBeVisible();
  });

  test('rouvre le personnage avec son état civil, son gabarit et ses langues', async ({
    page,
  }) => {
    const builder = new CharacterBuilderPage(page);
    await createCleric(builder, AASIMAR);

    await reopenBuilder(page);

    await builder.openStep('Espèce');
    await expect(builder.selectedSize()).toContainText(AASIMAR.size as string);

    await builder.openStep('Langues');
    for (const language of LANGUAGES) {
      await expect(builder.selectedLanguage(language)).toHaveAttribute('aria-pressed', 'true');
    }

    await builder.openStep('Identité');
    await expect(builder.nameInput).toHaveValue(CHARACTER_NAME);
    await expect(builder.frozenField('Alignement')).toHaveValue(IDENTITY.alignment);
    await expect(builder.frozenField('Âge (années)')).toHaveValue(IDENTITY.age);
    await expect(builder.frozenField('Taille (cm)')).toHaveValue(IDENTITY.heightCm);
    await expect(builder.frozenField('Poids (kg)')).toHaveValue(IDENTITY.weightKg);
    await expect(builder.frozenField('Description (facultative)')).toHaveValue(
      IDENTITY.description,
    );
  });

  /**
   * L'agrégat ne mute jamais son identité : offrir le champ répondrait `200` sans
   * rien changer, et le joueur croirait avoir corrigé son âge.
   */
  test('interdit de modifier l’état civil d’un personnage existant', async ({ page }) => {
    const builder = new CharacterBuilderPage(page);
    await createCleric(builder, DWARF);

    await reopenBuilder(page);
    await builder.openStep('Identité');

    await expect(builder.nameInput).toBeEnabled();
    for (const label of [
      'Alignement',
      'Âge (années)',
      'Taille (cm)',
      'Poids (kg)',
      'Description (facultative)',
    ]) {
      await expect(builder.frozenField(label)).toBeDisabled();
    }
  });
});

/** Le parcours complet, jusqu'à la fiche affichée. */
async function createCleric(
  builder: CharacterBuilderPage,
  species: SpeciesChoice,
): Promise<void> {
  await builder.gotoNew(campaignId);
  await composeCleric(builder, species);
  await builder.openStep('Identité');
  await builder.fillIdentity(IDENTITY);

  // Les constantes vitales ne s'affichent que si le SERVEUR a répondu : leur
  // présence prouve que le corps émis par le wizard a franchi le contrat.
  await expect(builder.page.getByText(/^PV \d+$/)).toBeVisible();
  await expect(builder.finishButton).toBeEnabled();
  await builder.finishButton.click();
  await expect(builder.page.getByRole('heading', { name: CHARACTER_NAME })).toBeVisible();
}

async function reopenBuilder(page: Page): Promise<void> {
  await page.goto(`/campaigns/${campaignId}/characters`);
  await page.getByRole('link', { name: 'Éditer' }).click();
}

/** Toutes les étapes sauf l'identité : elles ne changent pas d'un test à l'autre. */
async function composeCleric(
  builder: CharacterBuilderPage,
  species: SpeciesChoice,
): Promise<void> {
  await builder.choose(species.name);
  if (species.size) await builder.choose(species.size);
  await chooseFrom(builder, 'Langues', LANGUAGES);
  await builder.openStep('Classe');
  await builder.choose('Clerc');
  await chooseFrom(builder, 'Compétences', CLASS_SKILLS);
  await builder.openStep('Ordre');
  await builder.choose('Protecteur');
  await builder.openStep('Historique');
  await builder.choose('Fermier');
  await assignStandardArray(builder);
  await chooseFrom(builder, 'Sorts mineurs', CANTRIPS);
  await chooseFrom(builder, 'Sorts', SPELLS);
  await choosePackages(builder);
}

async function chooseFrom(
  builder: CharacterBuilderPage,
  step: string,
  choices: readonly string[],
): Promise<void> {
  await builder.openStep(step);
  for (const choice of choices) {
    await builder.toggle(choice);
  }
}

/**
 * Les valeurs se posent dans l'ordre décroissant sur l'ordre des caractéristiques :
 * ce test éprouve le parcours, pas l'optimisation d'un build.
 */
async function assignStandardArray(builder: CharacterBuilderPage): Promise<void> {
  await builder.openStep('Caractéristiques');
  for (const [index, ability] of STANDARD_ARRAY_ORDER.entries()) {
    await builder.assignScore(ability, STANDARD_ARRAY[index] as string);
  }
  // Le Fermier donne +2/+1 sur trois caractéristiques : le clerc met la Sagesse
  // en avant, la Constitution ensuite.
  await builder.setBackgroundBonus('Sagesse', 2);
  await builder.setBackgroundBonus('Constitution', 1);
}

async function choosePackages(builder: CharacterBuilderPage): Promise<void> {
  await builder.openStep('Équipement');
  await builder.choosePackage('class', 'A');
  await builder.choosePackage('background', 'A');
}
