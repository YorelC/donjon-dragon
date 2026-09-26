import { test, expect, STORAGE_STATE } from './fixtures/test';
import { deleteCharactersNamed, ensureCampaign } from './fixtures/api';
import { BuilderAutopilot } from './pages/builder-autopilot';
import { CharacterBuilderPage } from './pages/character-builder.page';

/**
 * Les règles transverses de la création, celles qui cassent en silence quand
 * on change d'avis en cours de route ou qu'on rouvre une fiche.
 *
 * La plupart s'arrêtent à l'écran qui porte la règle : c'est lui qu'on prouve.
 * La persistance, elle, va jusqu'à la fiche et en revient.
 */
test.use({ storageState: STORAGE_STATE.gandalf });

const CAMPAIGN_NAME = 'E2E regles de creation';
const CHARACTER_NAME = 'Regles E2E';

const GROUP = {
  classCantrips: 'Sorts mineurs de classe',
  backgroundCantrips: 'Sorts mineurs — Historique',
  speciesCantrips: 'Sorts mineurs — Espèce',
} as const;

let campaignId: string;
let builder: CharacterBuilderPage;
let autopilot: BuilderAutopilot;

test.beforeEach(async ({ page }) => {
  campaignId = await ensureCampaign(page.request, CAMPAIGN_NAME);
  await deleteCharactersNamed(page.request, campaignId, CHARACTER_NAME);
  builder = new CharacterBuilderPage(page);
  autopilot = new BuilderAutopilot(builder);
});

test.describe('Sorts', () => {
  test('deux Initiés à la magie de même liste ne partagent aucun sort mineur', async () => {
    await begin('Humain', 'Clerc', 'Acolyte', () => builder.toggle('Discrétion'));
    await autopilot.fillBetween('Historique', 'Dons');
    await builder.openStep('Dons');
    await builder.toggle('Initié à la magie');
    await builder.featCard('Espèce').getByRole('button', { name: 'Clerc', exact: true }).click();
    await builder.featCard('Espèce').getByRole('button', { name: 'Sagesse', exact: true }).click();
    await builder.featCard('Historique').getByRole('button', { name: 'Sagesse', exact: true }).click();
    await autopilot.fillBetween('Dons', 'Sorts mineurs');
    await builder.openStep('Sorts mineurs');

    await builder.spellIn(GROUP.backgroundCantrips, 'Thaumaturgie').click();

    await expect(builder.spellIn(GROUP.speciesCantrips, 'Thaumaturgie')).toBeDisabled();
    await expect(builder.spellIn(GROUP.classCantrips, 'Thaumaturgie')).toBeDisabled();
  });
});

test.describe('Changer d’avis en cours de route', () => {
  test('changer de classe efface les sorts de classe et garde ceux d Initié', async () => {
    await beginSageWizardWithCantrips();

    await builder.openStep('Classe');
    await builder.choose('Clerc');
    await autopilot.fillBetween('Classe', 'Sorts mineurs');
    await builder.openStep('Sorts mineurs');

    await expect(builder.spellGroup(GROUP.classCantrips)).toContainText('0 / 3');
    await expect(builder.spellGroup(GROUP.backgroundCantrips)).toContainText('2 / 2');
  });

  test('passer de Sage à Guide remplace la liste imposée et vide les sorts d Initié', async () => {
    await beginSageWizardWithCantrips();

    await builder.openStep('Historique');
    await builder.choose('Guide');
    await builder.openStep('Dons');

    await expect(builder.choice('Druide')).toHaveAttribute('aria-pressed', 'true');
    await expect(builder.choice('Magicien')).toHaveCount(0);
    await builder.toggle('Sagesse');
    await autopilot.fillBetween('Dons', 'Sorts mineurs');
    await builder.openStep('Sorts mineurs');
    await expect(builder.spellGroup(GROUP.backgroundCantrips)).toContainText('0 / 2');
  });

  test('quitter l Aasimar rend Lumière de nouveau disponible', async () => {
    await begin('Aasimar', 'Magicien', 'Criminel');
    await autopilot.fillBetween('Historique', 'Sorts mineurs');
    await builder.openStep('Sorts mineurs');
    await expect(builder.spellIn(GROUP.classCantrips, 'Lumière')).toBeDisabled();

    await builder.openStep('Espèce');
    await builder.choose('Nain');
    await autopilot.fillBetween('Espèce', 'Sorts mineurs');
    await builder.openStep('Sorts mineurs');

    await expect(builder.spellIn(GROUP.classCantrips, 'Lumière')).toBeEnabled();
  });
});

test.describe('Caractéristiques', () => {
  test('les bonus d historique ne portent que sur ses trois caractéristiques', async () => {
    await begin('Nain', 'Guerrier', 'Soldat');
    await autopilot.fillBetween('Historique', 'Caractéristiques');
    await builder.openStep('Caractéristiques');

    // Le Soldat : Force, Dextérité, Constitution.
    for (const ability of ['Intelligence', 'Sagesse', 'Charisme']) {
      await expect(builder.page.getByRole('checkbox', { name: `${ability} +2` })).toBeDisabled();
      await expect(builder.page.getByRole('checkbox', { name: `${ability} +1` })).toBeDisabled();
    }
    await expect(builder.page.getByRole('checkbox', { name: 'Force +2' })).toBeEnabled();
  });
});

test.describe('Fiche', () => {
  test('Lumière de l Aasimar s incante avec le Charisme', async ({ page }) => {
    await begin('Aasimar', 'Guerrier', 'Soldat');
    await autopilot.fillBetween('Historique', 'Identité');
    await finishWith({ heightCm: '170', weightKg: '70' });

    // Un guerrier n'a pas d'incantation de classe : la seule est celle de l'Aasimar.
    await page.getByRole('tab', { name: 'Grimoire' }).click();
    await expect(page.getByText('Caractéristique', { exact: true }).locator('..'))
      .toContainText('Charisme');
  });
});

test.describe('Persistance', () => {
  test('rouvre un Magicien Sage avec son grimoire, ses sorts d Initié et sa liste imposée', async ({
    page,
  }) => {
    await begin('Nain', 'Magicien', 'Sage');
    await autopilot.fillBetween('Historique', 'Dons');
    await builder.openStep('Dons');
    await builder.toggle('Intelligence');
    await autopilot.fillBetween('Dons', 'Identité');
    await finishWith({ heightCm: '132', weightKg: '68' });

    await page.goto(`/campaigns/${campaignId}/characters`);
    await page.getByRole('listitem').filter({ hasText: CHARACTER_NAME })
      .getByRole('link', { name: 'Éditer' }).click();
    await builder.waitForServerPreview();

    await expect(builder.step('Sorts mineurs')).toHaveText(/5\/5/);
    await expect(builder.step('Sorts')).toHaveText(/7\/7/);
    await builder.openStep('Dons');
    await expect(builder.choice('Magicien')).toHaveAttribute('aria-pressed', 'true');
    await expect(builder.choice('Intelligence')).toHaveAttribute('aria-pressed', 'true');
  });
});

async function begin(
  species: string,
  characterClass: string,
  background: string,
  speciesChoices?: () => Promise<void>,
): Promise<void> {
  await builder.gotoNew(campaignId);
  await builder.choose(species);
  await speciesChoices?.();
  await autopilot.completeSpecies();
  await autopilot.fillBetween('Espèce', 'Classe');
  await builder.openStep('Classe');
  await builder.choose(characterClass);
  await builder.openStep('Historique');
  await builder.choose(background);
}

/** Un Magicien Sage dont la classe et l'Initié ont déjà leurs sorts mineurs. */
async function beginSageWizardWithCantrips(): Promise<void> {
  await begin('Nain', 'Magicien', 'Sage');
  await autopilot.fillBetween('Historique', 'Dons');
  await builder.openStep('Dons');
  await builder.toggle('Intelligence');
  await autopilot.fillBetween('Dons', 'Sorts');
}

async function finishWith(stature: { heightCm: string; weightKg: string }): Promise<void> {
  await builder.openStep('Identité');
  await builder.fillIdentity({
    name: CHARACTER_NAME, alignment: 'Neutre pur', age: '90',
    ...stature, description: 'Composé par le parcours des règles.',
  });
  await builder.waitForServerPreview();
  await builder.finishCreation();
}
