import { test, expect, STORAGE_STATE } from './fixtures/test';
import { deleteCharactersNamed, ensureCampaign } from './fixtures/api';
import { BuilderAutopilot } from './pages/builder-autopilot';
import { CharacterBuilderPage } from './pages/character-builder.page';

/**
 * Un parcours par classe, jusqu'à la fiche persistée.
 *
 * Chaque classe est associée à une espèce et à un historique choisis pour le
 * MÉCANISME qu'ils ajoutent (voir `SCENARIOS-CREATION.md`). Le pilote franchit
 * les étapes sans intérêt pour le test ; l'assertion porte sur ce mécanisme, et
 * la fin du parcours prouve que le serveur accepte ce que le wizard émet.
 */
test.use({ storageState: STORAGE_STATE.gandalf });

const CAMPAIGN_NAME = 'E2E classes';
const CHARACTER_NAME = 'Parcours E2E';

/** Une stature au milieu des bornes de chaque espèce (B01-ESP, gabarit déduit). */
const STATURE: Record<string, { heightCm: string; weightKg: string }> = {
  Nain: { heightCm: '132', weightKg: '68' },
  Humain: { heightCm: '170', weightKg: '70' },
  Elfe: { heightCm: '170', weightKg: '60' },
  Gnome: { heightCm: '105', weightKg: '18' },
  Goliath: { heightCm: '225', weightKg: '150' },
  Drakéide: { heightCm: '190', weightKg: '110' },
  Orc: { heightCm: '195', weightKg: '110' },
  Tieffelin: { heightCm: '170', weightKg: '70' },
};

interface Origin {
  species: string;
  lineage?: string;
  characterClass: string;
  background: string;
}

let campaignId: string;
let builder: CharacterBuilderPage;
let autopilot: BuilderAutopilot;

test.beforeEach(async ({ page }) => {
  campaignId = await ensureCampaign(page.request, CAMPAIGN_NAME);
  await deleteCharactersNamed(page.request, campaignId, CHARACTER_NAME);
  builder = new CharacterBuilderPage(page);
  autopilot = new BuilderAutopilot(builder);
});

test.describe('Un parcours par classe', () => {
  test('Barbare goliath soldat : maîtrises d armes, aucun sort', async () => {
    const origin = { species: 'Goliath', characterClass: 'Barbare', background: 'Soldat' };
    await begin(origin);
    await autopilot.fillBetween('Historique', 'Caractéristiques');

    await expect(builder.step('Maîtrises d’armes')).toHaveText(/2\/2/);
    await expect(builder.step('Sorts mineurs')).toHaveCount(0);
    await expect(builder.step('Sorts')).toHaveCount(0);
    await finish(origin, 'Maîtrises d’armes');
  });

  test('Clerc nain acolyte thaumaturge : un mineur de plus, Initié à la liste du Clerc', async () => {
    const origin = { species: 'Nain', characterClass: 'Clerc', background: 'Acolyte' };
    await begin(origin);
    await autopilot.fillBetween('Historique', 'Ordre');
    await builder.openStep('Ordre');
    await builder.choose('Thaumaturge');
    await configureBackgroundMagicInitiate('Clerc', 'Sagesse');

    // 3 sorts mineurs de Clerc, +1 par Thaumaturge, +2 par Initié à la magie.
    await expect(builder.step('Sorts mineurs')).toHaveText(/0\/6/);
    await finish(origin, 'Dons');
  });

  test('Druide elfe des bois guide : le Druidisme accordé n est proposé nulle part', async () => {
    const origin = {
      species: 'Elfe', lineage: 'Elfe des bois', characterClass: 'Druide', background: 'Guide',
    };
    await begin(origin);
    await autopilot.fillBetween('Historique', 'Dons');
    await configureBackgroundMagicInitiate('Druide', 'Sagesse');
    await autopilot.fillBetween('Dons', 'Sorts mineurs');
    await builder.openStep('Sorts mineurs');

    await expect(builder.spellIn('Sorts mineurs de classe', 'Druidisme')).toBeDisabled();
    await expect(builder.spellIn('Sorts mineurs — Historique', 'Druidisme')).toBeDisabled();
    await finish(origin, 'Caractéristiques');
  });

  test('Guerrier humain soldat : compétence d espèce, don Doué, style de combat', async () => {
    const origin = { species: 'Humain', characterClass: 'Guerrier', background: 'Soldat' };
    await begin(origin, () => builder.toggle('Discrétion'));
    await autopilot.fillBetween('Historique', 'Dons');
    await builder.openStep('Dons');
    await builder.toggle('Doué');
    for (const skill of ['Arcanes', 'Médecine', 'Religion']) await builder.toggle(skill);

    await expect(builder.step('Style de combat')).toHaveCount(1);
    await expect(builder.step('Maîtrises d’armes')).toHaveText(/3\/3/);
    await finish(origin, 'Dons');
  });

  test('Moine orc ermite : un outil de classe, aucun sort', async () => {
    const origin = { species: 'Orc', characterClass: 'Moine', background: 'Ermite' };
    await begin(origin);
    await autopilot.fillBetween('Historique', 'Caractéristiques');

    await expect(builder.step('Outils de classe')).toHaveText(/1\/1/);
    await expect(builder.step('Sorts mineurs')).toHaveCount(0);
    await finish(origin, 'Outils de classe');
  });

  test('Moine orc artisan : outil d historique, Façonneur et outil de classe tous distincts', async () => {
    const origin = { species: 'Orc', characterClass: 'Moine', background: 'Artisan' };
    await begin(origin);
    await builder.openStep('Outil d’historique');
    const [backgroundTool] = await builder.chooseAvailable(1);
    await autopilot.fillBetween('Outil d’historique', 'Dons');

    await builder.openStep('Dons');
    const crafter = builder.featCard('Historique');
    await expect(crafter.getByRole('button', { name: backgroundTool, exact: true })).toBeDisabled();
    await autopilot.fill('Dons');
    await expect(crafter.getByText('3 / 3')).toBeVisible();

    await builder.openStep('Outils de classe');
    await expect(builder.choice(backgroundTool as string)).toBeDisabled();
    await finish(origin, 'Dons');
  });

  test('Paladin drakéide noble : sorts préparés sans sort mineur', async () => {
    const origin = { species: 'Drakéide', characterClass: 'Paladin', background: 'Noble' };
    await begin(origin);
    await autopilot.fillBetween('Historique', 'Sorts');

    await expect(builder.step('Sorts mineurs')).toHaveCount(0);
    await expect(builder.step('Sorts')).toHaveText(/0\/2/);
    await finish(origin, 'Caractéristiques');
  });

  test('Rôdeur gnome des forêts guide : les sorts accordés ne sont proposés nulle part', async () => {
    const origin = {
      species: 'Gnome', lineage: 'Gnome des forêts', characterClass: 'Rôdeur', background: 'Guide',
    };
    await begin(origin);
    await autopilot.fillBetween('Historique', 'Dons');
    await configureBackgroundMagicInitiate('Druide', 'Sagesse');
    await autopilot.fillBetween('Dons', 'Sorts');
    await builder.openStep('Sorts');

    // Marque du chasseur vient du Rôdeur, Communication avec les animaux du gnome.
    await expect(builder.spellIn('Sorts préparés', 'Marque du chasseur')).toBeDisabled();
    await expect(builder.spellIn('Sorts préparés', 'Communication avec les animaux')).toBeDisabled();
    await expect(builder.spellIn('Sort de niveau 1 — Historique', 'Communication avec les animaux'))
      .toBeDisabled();
    await finish(origin, 'Sorts mineurs');
  });

  test('Ensorceleur tieffelin abyssal charlatan : le sort d héritage n est pas proposé', async () => {
    const origin = {
      species: 'Tieffelin', lineage: 'Abyssal', characterClass: 'Ensorceleur', background: 'Charlatan',
    };
    await begin(origin);
    await autopilot.fillBetween('Historique', 'Sorts mineurs');
    await builder.openStep('Sorts mineurs');

    await expect(builder.spellIn('Sorts mineurs de classe', 'Bouffée de poison')).toBeDisabled();
    await finish(origin, 'Caractéristiques');
  });

  test('Occultiste humain initié sage, Pacte du grimoire : aucun sort en double', async () => {
    const origin = { species: 'Humain', characterClass: 'Occultiste', background: 'Sage' };
    await begin(origin, () => builder.toggle('Discrétion'));
    await autopilot.fillBetween('Historique', 'Dons');
    await builder.openStep('Dons');
    await builder.toggle('Initié à la magie');
    await builder.featCard('Espèce').getByRole('button', { name: 'Clerc', exact: true }).click();
    await builder.featCard('Espèce').getByRole('button', { name: 'Sagesse', exact: true }).click();
    await builder.featCard('Historique').getByRole('button', { name: 'Intelligence', exact: true }).click();

    await builder.openStep('Manifestation occulte');
    await builder.stepPanel().getByRole('combobox').click();
    await builder.page.getByRole('option', { name: 'Pacte du Grimoire' }).click();
    await builder.spellIn('Sorts mineurs du grimoire', 'Illusion mineure').click();
    await autopilot.fillSpellGroups();
    await autopilot.fillBetween('Manifestation occulte', 'Sorts mineurs');
    await builder.openStep('Sorts mineurs');

    await expect(builder.spellIn('Sorts mineurs de classe', 'Illusion mineure')).toBeDisabled();
    await expect(builder.spellIn('Sorts mineurs — Historique', 'Illusion mineure')).toBeDisabled();
    await finish(origin, 'Caractéristiques');
  });
});

/** Espèce, lignée éventuelle, langues, classe, historique. */
async function begin(origin: Origin, speciesChoices?: () => Promise<void>): Promise<void> {
  await builder.gotoNew(campaignId);
  await builder.choose(origin.species);
  await speciesChoices?.();
  await autopilot.completeSpecies();
  if (origin.lineage) {
    await builder.openStep('Lignage');
    await builder.choose(origin.lineage);
  }
  await autopilot.fillBetween('Espèce', 'Classe');
  await builder.openStep('Classe');
  await builder.choose(origin.characterClass);
  await builder.openStep('Historique');
  await builder.choose(origin.background);
}

/** Acolyte, Guide et Sage imposent leur liste : elle doit être cochée d'office. */
async function configureBackgroundMagicInitiate(list: string, ability: string): Promise<void> {
  await builder.openStep('Dons');
  await expect(builder.choice(list)).toHaveAttribute('aria-pressed', 'true');
  await builder.toggle(ability);
}

/** Le pilote termine après `after`, puis la fiche doit exister côté serveur. */
async function finish(origin: Origin, after: Parameters<BuilderAutopilot['fillBetween']>[0]): Promise<void> {
  await autopilot.fillBetween(after, 'Identité');
  await builder.openStep('Identité');
  await builder.fillIdentity({
    name: CHARACTER_NAME,
    alignment: 'Neutre pur',
    age: '40',
    ...STATURE[origin.species]!,
    description: `${origin.characterClass} ${origin.species} ${origin.background}.`,
  });
  await builder.waitForServerPreview();
  await builder.finishCreation();
}
