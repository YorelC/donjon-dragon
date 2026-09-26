import type { Locator, Page } from '@playwright/test';
import { test, expect, STORAGE_STATE } from './fixtures/test';
import { deleteCharactersNamed, ensureCampaign } from './fixtures/api';
import {
  CharacterBuilderPage,
  HEIGHT_FIELD,
  STANDARD_ARRAY_ORDER,
  WEIGHT_FIELD,
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
const REJECTION_REASON = 'Les langues ne collent pas au personnage.';
const CORRECTED_AGE = '85';
const ACCEPTED_AGE = '86';

const IDENTITY: Omit<CharacterIdentity, 'heightCm' | 'weightKg'> = {
  name: CHARACTER_NAME,
  alignment: 'Loyal bon',
  age: '84',
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
  heightCm: string;
  weightKg: string;
}

/**
 * Deux espèces, deux traitements du gabarit, jamais demandé au joueur.
 *
 * Le nain l'impose ; l'aasimar le tient de sa taille physique, sans lignage ni
 * don d'origine qui allongeraient le parcours. Sous 122 cm, il est Petit : le
 * serveur doit accepter une création où le gabarit n'est plus transmis.
 */
const DWARF: SpeciesChoice = { name: 'Nain', heightCm: '132', weightKg: '68' };
const SMALL_AASIMAR: SpeciesChoice = { name: 'Aasimar', heightCm: '110', weightKg: '40' };

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

  test('rouvre un aasimar de petite taille avec son état civil et ses langues', async ({
    page,
  }) => {
    const builder = new CharacterBuilderPage(page);
    await createCleric(builder, SMALL_AASIMAR);

    await reopenBuilder(page);

    await builder.openStep('Langues');
    for (const language of LANGUAGES) {
      await expect(builder.selectedLanguage(language)).toHaveAttribute('aria-pressed', 'true');
    }

    await builder.openStep('Identité');
    await expect(builder.nameInput).toHaveValue(CHARACTER_NAME);
    await expect(builder.selectedAlignment(IDENTITY.alignment)).toBeVisible();
    await expect(builder.identityField('Âge (années)')).toHaveValue(IDENTITY.age);
    await expect(builder.identityField(HEIGHT_FIELD)).toHaveValue(SMALL_AASIMAR.heightCm);
    await expect(builder.identityField(WEIGHT_FIELD)).toHaveValue(SMALL_AASIMAR.weightKg);
    await expect(builder.identityField('Description (facultative)')).toHaveValue(
      IDENTITY.description,
    );
  });

  /**
   * B01-ID-004 : l'état civil ne se fige qu'à l'acceptation par le MJ. Avant, un
   * brouillon ou une fiche refusée se corrige en entier, état civil compris.
   */
  test('laisse corriger l’état civil tant que la fiche n’est pas acceptée', async ({ page }) => {
    const builder = new CharacterBuilderPage(page);
    await createCleric(builder, DWARF);

    await reopenBuilder(page);
    await builder.openStep('Identité');

    await expect(builder.nameInput).toBeEnabled();
    await expect(builder.selectedAlignment(IDENTITY.alignment)).toBeEnabled();
    for (const label of [
      'Âge (années)',
      HEIGHT_FIELD,
      WEIGHT_FIELD,
      'Description (facultative)',
    ]) {
      await expect(builder.identityField(label)).toBeEnabled();
    }
  });
});

test.describe('Soumettre une fiche au MJ et la faire valider', () => {
  /**
   * Le cycle entier en un seul test, et non quatre.
   *
   * Chaque état n'existe que par le précédent : `SOUMISE` suppose une soumission,
   * `REFUSÉE` un refus motivé, la resoumission une correction. Les découper
   * obligerait à fabriquer un état de départ par un chemin que le produit
   * n'offre pas — ce serait tester la fixture, pas le parcours.
   *
   * Gandalf crée et valide : `SF-002` l'autorise explicitement pour une fiche
   * créée par un MJ.
   */
  test('parcourt brouillon, soumission, refus motivé, correction et acceptation', async ({
    page,
  }) => {
    const builder = new CharacterBuilderPage(page);
    await createCleric(builder, DWARF);
    await page.goto(`/campaigns/${campaignId}/characters`);

    const row = characterRow(page);
    await expect(row.getByText('Brouillon')).toBeVisible();

    await row.getByRole('button', { name: 'Soumettre' }).click();
    await expect(row.getByText('En attente de validation')).toBeVisible();
    // Une fiche à l'examen ne se corrige pas dans le dos du MJ.
    await expect(row.getByRole('link', { name: 'Éditer' })).toHaveCount(0);

    await refuse(page, row, REJECTION_REASON);
    await expect(row.getByText('À corriger')).toBeVisible();
    await expect(row.getByText(`Motif : ${REJECTION_REASON}`)).toBeVisible();
    // Refusée, elle redevient corrigeable : c'est ce que « correction » veut dire.
    const editLink = row.getByRole('link', { name: 'Éditer' });
    await expect(editLink).toBeVisible();
    const builderUrl = await editLink.getAttribute('href');

    await editLink.click();
    await builder.openStep('Identité');
    await builder.identityField('Âge (années)').fill(CORRECTED_AGE);
    await builder.identityField('Description (facultative)').fill('Description corrigée.');
    await builder.saveButton.click();
    await page.goto(`/campaigns/${campaignId}/characters`);

    await row.getByRole('button', { name: 'Soumettre' }).click();
    await row.getByRole('button', { name: 'Accepter' }).click();

    await expect(row.getByText('Acceptée')).toBeVisible();
    await expect(row.getByRole('link', { name: 'Éditer' })).toHaveCount(0);

    await row.getByRole('button', { name: 'Détails' }).click();
    const details = page.getByRole('dialog');
    await details.getByLabel('Âge').fill(ACCEPTED_AGE);
    await details.getByLabel('Description physique').fill('Description après validation.');
    await details.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByText('Données personnelles mises à jour')).toBeVisible();

    // Acceptée, elle est figée : même l'URL directe du wizard ne l'ouvre plus.
    await page.goto(builderUrl as string);
    await page.waitForLoadState('networkidle');
    await expect(builder.nameInput).toHaveCount(0);
  });
});

/** La ligne du personnage du test, et non celle d'un voisin resté d'un autre passage. */
function characterRow(page: Page): Locator {
  return page.getByRole('listitem').filter({ hasText: CHARACTER_NAME });
}

async function refuse(page: Page, row: Locator, reason: string): Promise<void> {
  await row.getByRole('button', { name: 'Refuser' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('textbox').fill(reason);
  await dialog.getByRole('button', { name: 'Confirmer' }).click();
}

/** Le parcours complet, jusqu'à la fiche affichée. */
async function createCleric(
  builder: CharacterBuilderPage,
  species: SpeciesChoice,
): Promise<void> {
  await builder.gotoNew(campaignId);
  await composeCleric(builder, species);
  await builder.openStep('Identité');
  await builder.fillIdentity({ ...IDENTITY, heightCm: species.heightCm, weightKg: species.weightKg });

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
  await chooseFrom(builder, 'Langues', LANGUAGES);
  await builder.openStep('Classe');
  await builder.choose('Clerc');
  // L'historique passe AVANT les compétences de classe : c'est le fil réordonné,
  // celui qui laisse l'étape des compétences exclure ce que l'historique donne
  // déjà. Choisir la classe puis ses compétences d'abord rendait les étapes
  // suivantes injoignables.
  await builder.openStep('Historique');
  await builder.choose('Fermier');
  await chooseFrom(builder, 'Compétences', CLASS_SKILLS);
  await builder.openStep('Ordre');
  await builder.choose('Protecteur');
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
