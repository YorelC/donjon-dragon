import { test, expect, STORAGE_STATE } from './fixtures/test';
import { deleteCharactersNamed, ensureCampaign } from './fixtures/api';
import {
  CharacterBuilderPage,
  STANDARD_ARRAY_ORDER,
  type CharacterIdentity,
} from './pages/character-builder.page';

/**
 * Les sorts de création, là où plusieurs sources se partagent les mêmes listes.
 *
 * Le Magicien Sage cumule tout ce qui a cassé ensemble : un grimoire qui se
 * remplit à la place des sorts préparés (`DR-B01-05`), et un Initié à la magie
 * qui puise dans la MÊME liste que la classe. Un sort pris d'un côté doit
 * devenir indisponible de l'autre (`B01-SOR-006`), sous les yeux du joueur.
 *
 * Ce qui se prouve ici et pas en vitest : que l'écran réel l'empêche, et que le
 * serveur accepte la fiche qui en sort.
 */
test.use({ storageState: STORAGE_STATE.gandalf });

const CAMPAIGN_NAME = 'E2E sorts de creation';
const DWARF = 'Nain';
/** L'Aasimar connaît Lumière d'office, par son trait Porteur de lumière. */
const AASIMAR = 'Aasimar';
const AASIMAR_CANTRIP = 'Lumière';
const CHARACTER_NAME = 'Grimoire E2E';

const LANGUAGES = ['Elfique', 'Géant'];
const STANDARD_ARRAY = ['15', '14', '13', '12', '10', '8'];

const GROUP = {
  classCantrips: 'Sorts mineurs de classe',
  featCantrips: 'Sorts mineurs — Historique',
  spellbook: 'Grimoire',
  featSpell: 'Sort de niveau 1 — Historique',
} as const;

const CLASS_CANTRIPS = ["Aspersion d'acide", 'Voile défensif', 'Contact glacial'];
const FEAT_CANTRIPS = ['Lumière', 'Main de mage'];
const SPELLBOOK = [
  'Alarme',
  'Détection de la magie',
  'Identification',
  'Armure de mage',
  'Projectile magique',
  'Bouclier',
];
const FEAT_SPELL = 'Sommeil';
const SPELLBOOK_SIZE = SPELLBOOK.length;

const IDENTITY: CharacterIdentity = {
  name: CHARACTER_NAME,
  alignment: 'Neutre bon',
  age: '112',
  heightCm: '132',
  weightKg: '68',
  description: 'Érudit nain, plus à l’aise avec un grimoire qu’avec une hache.',
};

let campaignId: string;

test.beforeEach(async ({ page }) => {
  campaignId = await ensureCampaign(page.request, CAMPAIGN_NAME);
  await deleteCharactersNamed(page.request, campaignId, CHARACTER_NAME);
});

test.describe('Le grimoire du Magicien', () => {
  test('ne fait remplir que le grimoire, et le serveur accepte la fiche', async ({ page }) => {
    const builder = new CharacterBuilderPage(page);
    await composeSageWizardUntilSpells(builder, DWARF);

    // DR-B01-05 : plus aucun choix de sort préparé à la création.
    await expect(builder.spellGroup('Sorts préparés')).toHaveCount(0);
    await expect(builder.spellGroup(GROUP.spellbook)).toBeVisible();

    await chooseIn(builder, GROUP.spellbook, SPELLBOOK.slice(0, SPELLBOOK_SIZE - 1));
    await builder.spellIn(GROUP.featSpell, FEAT_SPELL).click();
    await expect(builder.nextButton).toBeDisabled();

    await builder.spellIn(GROUP.spellbook, SPELLBOOK[SPELLBOOK_SIZE - 1] as string).click();
    await expect(builder.nextButton).toBeEnabled();
    // Le grimoire plein, les autres sorts ne se prennent plus.
    await expect(builder.spellIn(GROUP.spellbook, FEAT_SPELL)).toBeDisabled();

    await finishCreation(builder);
    await expect(page.getByRole('heading', { name: CHARACTER_NAME })).toBeVisible();
  });
});

test.describe('Un sort ne se choisit qu’une fois (B01-SOR-006)', () => {
  test('retire à Initié à la magie les sorts mineurs pris par la classe, et inversement', async ({
    page,
  }) => {
    const builder = new CharacterBuilderPage(page);
    await composeSageWizardUntilCantrips(builder, DWARF);

    await builder.spellIn(GROUP.classCantrips, CLASS_CANTRIPS[0] as string).click();
    await expect(builder.spellIn(GROUP.featCantrips, CLASS_CANTRIPS[0] as string)).toBeDisabled();

    await builder.spellIn(GROUP.featCantrips, FEAT_CANTRIPS[0] as string).click();
    await expect(builder.spellIn(GROUP.classCantrips, FEAT_CANTRIPS[0] as string)).toBeDisabled();
  });

  test('retire de tous les groupes le sort mineur que l espèce accorde déjà', async ({ page }) => {
    const builder = new CharacterBuilderPage(page);
    await composeSageWizardUntilCantrips(builder, AASIMAR);

    await expect(builder.spellIn(GROUP.classCantrips, AASIMAR_CANTRIP)).toBeDisabled();
    await expect(builder.spellIn(GROUP.featCantrips, AASIMAR_CANTRIP)).toBeDisabled();
  });

  test('retire à Initié à la magie un sort déjà inscrit au grimoire', async ({ page }) => {
    const builder = new CharacterBuilderPage(page);
    await composeSageWizardUntilSpells(builder, DWARF);

    const inscribed = SPELLBOOK[0] as string;
    await builder.spellIn(GROUP.spellbook, inscribed).click();

    await expect(builder.spellIn(GROUP.featSpell, inscribed)).toBeDisabled();
  });
});

/** Magicien Sage : l'Initié à la magie du Sage puise dans la liste du Magicien. */
async function composeSageWizardUntilCantrips(
  builder: CharacterBuilderPage,
  species: string,
): Promise<void> {
  await builder.gotoNew(campaignId);
  await builder.choose(species);
  await chooseFrom(builder, 'Langues', LANGUAGES);
  await builder.openStep('Classe');
  await builder.choose('Magicien');
  await builder.openStep('Historique');
  await builder.choose('Sage');
  await builder.openStep('Compétences');
  await builder.chooseAvailable(2);
  // Le Sage impose la liste du Magicien : elle est retenue d'office.
  await builder.openStep('Dons');
  await expect(builder.choice('Magicien')).toHaveAttribute('aria-pressed', 'true');
  await builder.toggle('Intelligence');
  await assignStandardArray(builder);
  await builder.openStep('Sorts mineurs');
}

async function composeSageWizardUntilSpells(
  builder: CharacterBuilderPage,
  species: string,
): Promise<void> {
  await composeSageWizardUntilCantrips(builder, species);
  await chooseIn(builder, GROUP.classCantrips, CLASS_CANTRIPS);
  await chooseIn(builder, GROUP.featCantrips, FEAT_CANTRIPS);
  await builder.openStep('Sorts');
}

async function finishCreation(builder: CharacterBuilderPage): Promise<void> {
  await builder.openStep('Équipement');
  await builder.choosePackage('class', 'A');
  await builder.choosePackage('background', 'A');
  await builder.openStep('Identité');
  await builder.fillIdentity(IDENTITY);
  // Les PV ne s'affichent que si le SERVEUR a validé la composition.
  await expect(builder.page.getByText(/^PV \d+$/)).toBeVisible();
  await builder.finishCreation();
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

async function chooseIn(
  builder: CharacterBuilderPage,
  group: string,
  spells: readonly string[],
): Promise<void> {
  for (const spell of spells) {
    await builder.spellIn(group, spell).click();
  }
}

/** L'Intelligence en tête, puis les bonus du Sage sur Intelligence et Constitution. */
async function assignStandardArray(builder: CharacterBuilderPage): Promise<void> {
  await builder.openStep('Caractéristiques');
  const order = ['Intelligence', ...STANDARD_ARRAY_ORDER.filter((ability) => ability !== 'Intelligence')];
  for (const [index, ability] of order.entries()) {
    await builder.assignScore(ability, STANDARD_ARRAY[index] as string);
  }
  await builder.setBackgroundBonus('Intelligence', 2);
  await builder.setBackgroundBonus('Constitution', 1);
}
