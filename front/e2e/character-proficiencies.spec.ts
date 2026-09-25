import { test, expect, STORAGE_STATE } from './fixtures/test';
import { deleteCharactersNamed, ensureCampaign } from './fixtures/api';
import {
  CharacterBuilderPage,
  STANDARD_ARRAY_ORDER,
  type CharacterIdentity,
} from './pages/character-builder.page';

/**
 * Ce que les tests unitaires du wizard ne prouvent pas : qu'un parcours ABOUTIT.
 *
 * Ils montrent que la composition émet les bons champs une fois remplie. Ils ne
 * disent rien du fait qu'un joueur puisse la remplir, ni que le serveur accepte
 * le corps qui en sort. Neuf classes sur douze ont vécu dans cet intervalle : le
 * contrat était satisfait au test unitaire, et `400` en vrai.
 *
 * Deux parcours, choisis pour ce qu'ils traversent et non pour leur variété :
 *
 * - le Roublard porte à lui seul les maîtrises d'armes, la langue de classe et
 *   son unicité, et l'Expertise sur une compétence d'HISTORIQUE — seule preuve
 *   de `B01-CLA-ROG` ;
 * - le Voyageur qui l'accompagne n'a AUCUN choix de maîtrise d'outil : il
 *   n'apparaît donc dans aucun lot d'outils, et son paquetage exige pourtant un
 *   objet concret. C'est exactement le trou qu'un découpage par maîtrises rate ;
 * - le Barde porte les outils de classe, leur quota de trois, et leur exclusion
 *   mutuelle avec l'outil d'historique de l'Artisan.
 */
test.use({ storageState: STORAGE_STATE.gandalf });

const CAMPAIGN_NAME = 'E2E maitrises et outils';
const ROGUE_NAME = 'Sombre E2E';
const BARD_NAME = 'Lyre E2E';

/** Les deux langues standards : la langue de classe devra en différer. */
const LANGUAGES = ['Elfique', 'Géant'];
const STANDARD_ARRAY = ['15', '14', '13', '12', '10', '8'];

/**
 * Le Nain, et non l'Humain : ce dernier impose une compétence d'espèce et un don
 * d'Origine, dont l'absence rendrait toutes les étapes suivantes injoignables.
 * Ces parcours portent sur les maîtrises, pas sur l'espèce.
 */
const SPECIES = 'Nain';

/** Le Voyageur accorde Discrétion et Intuition. L'Expertise doit pouvoir les viser. */
const BACKGROUND_SKILL = 'Discrétion';

const CONCRETE_ITEM_LABEL = 'Objet concret du paquetage';
const TRINKET_LABEL = 'Babiole facultative';

function identityFor(name: string): CharacterIdentity {
  return {
    name,
    alignment: 'Neutre',
    age: '27',
    heightCm: '171',
    weightKg: '63',
    description: 'Composé par le parcours de bout en bout.',
  };
}

let campaignId: string;

test.beforeEach(async ({ page }) => {
  campaignId = await ensureCampaign(page.request, CAMPAIGN_NAME);
  await deleteCharactersNamed(page.request, campaignId, ROGUE_NAME);
  await deleteCharactersNamed(page.request, campaignId, BARD_NAME);
});

test.describe('Créer les classes que le wizard ne savait pas composer', () => {
  test('compose un roublard voyageur, sa langue de classe et son expertise d historique', async ({
    page,
  }) => {
    const builder = new CharacterBuilderPage(page);
    await builder.gotoNew(campaignId);

    await builder.choose(SPECIES);
    await chooseLanguages(builder);
    await builder.openStep('Classe');
    await builder.choose('Roublard');
    await builder.openStep('Historique');
    await builder.choose('Voyageur');

    // Quatre compétences de classe, prises parmi ce que le Voyageur laisse : la
    // marque de l'étape d'historique remontée AVANT celle des compétences.
    await builder.openStep('Compétences');
    const classSkills = await builder.chooseAvailable(4);
    await expect(builder.boundedCounter()).toHaveText('4 / 4');

    await builder.openStep('Maîtrises d’armes');
    await builder.chooseAvailable(2);
    await expect(builder.boundedCounter()).toHaveText('2 / 2');

    // La langue de classe ne peut pas redoubler une langue déjà prise : le front
    // le montre en désactivant l'option, il n'attend pas le refus du serveur.
    await builder.openStep('Langue de classe');
    for (const language of LANGUAGES) {
      await expect(builder.choice(language)).toBeDisabled();
    }
    await builder.chooseAvailable(1);

    // Le cœur de `B01-CLA-ROG` : l'Expertise voit les compétences d'HISTORIQUE,
    // pas seulement celles de la classe.
    await builder.openStep('Expertise');
    await expect(builder.choice(BACKGROUND_SKILL)).toBeEnabled();
    await builder.choice(BACKGROUND_SKILL).click();
    // Nommée, et non prise par index : une option retenue reste cliquable, donc
    // `chooseAvailable` retomberait sur Discrétion et la retirerait.
    await builder.choice(classSkills[0] as string).click();
    await expect(builder.boundedCounter()).toHaveText('2 / 2');

    await assignStandardArray(builder, 'Dextérité', 'Constitution');

    // Le paquetage du Voyageur promet une « boîte de jeux » : une catégorie, pas
    // un objet. Sans ce choix concret, le serveur refuse l'option entière.
    await builder.openStep('Équipement');
    await builder.choosePackage('class', 'A');
    await builder.choosePackage('background', 'A');
    await builder.selectFirstCatalogOption(CONCRETE_ITEM_LABEL);
    await builder.selectFirstCatalogOption(TRINKET_LABEL);

    await finish(builder, ROGUE_NAME);
  });

  test('compose un barde artisan dont les outils de classe excluent celui de l historique', async ({
    page,
  }) => {
    const builder = new CharacterBuilderPage(page);
    await builder.gotoNew(campaignId);

    await builder.choose(SPECIES);
    await chooseLanguages(builder);
    await builder.openStep('Classe');
    await builder.choose('Barde');
    await builder.openStep('Historique');
    await builder.choose('Artisan');

    // L'Artisan fait choisir son outil ; le Barde en choisira trois autres.
    await builder.openStep('Outil d’historique');
    const [backgroundTool] = await builder.chooseAvailable(1);

    await builder.openStep('Compétences');
    await builder.chooseAvailable(3);

    await builder.openStep('Outils de classe');
    // L'outil déjà pris à l'historique est désactivé ici : sans ça le joueur
    // brûlerait un de ses trois choix sur un doublon que le serveur refuse.
    await expect(builder.choice(backgroundTool as string)).toBeDisabled();
    await builder.chooseAvailable(3);
    await expect(builder.boundedCounter()).toHaveText('3 / 3');

    await assignStandardArray(builder, 'Charisme', 'Dextérité');
    await chooseSpells(builder);

    // Option A du Barde : elle promet un instrument, donc un objet concret.
    // L'Artisan part en or seul, pour n'avoir qu'un menu à l'écran.
    await builder.openStep('Équipement');
    await builder.choosePackage('class', 'A');
    await builder.choosePackage('background', 'B');
    await builder.selectFirstCatalogOption(CONCRETE_ITEM_LABEL);

    await finish(builder, BARD_NAME);
  });
});

async function chooseLanguages(builder: CharacterBuilderPage): Promise<void> {
  await builder.openStep('Langues');
  for (const language of LANGUAGES) {
    await builder.toggle(language);
  }
}

/**
 * Les valeurs se posent dans l'ordre décroissant : ce test éprouve le parcours,
 * pas l'optimisation d'un build. Les deux bonus d'historique suivent la classe.
 */
async function assignStandardArray(
  builder: CharacterBuilderPage,
  major: string,
  minor: string,
): Promise<void> {
  await builder.openStep('Caractéristiques');
  for (const [index, ability] of STANDARD_ARRAY_ORDER.entries()) {
    await builder.assignScore(ability, STANDARD_ARRAY[index] as string);
  }
  await builder.setBackgroundBonus(major, 2);
  await builder.setBackgroundBonus(minor, 1);
}

async function chooseSpells(builder: CharacterBuilderPage): Promise<void> {
  await builder.openStep('Sorts mineurs');
  await builder.chooseAvailable(2);
  await builder.openStep('Sorts');
  await builder.chooseAvailable(4);
}

/**
 * Les constantes vitales ne s'affichent que si le SERVEUR a répondu : leur
 * présence prouve que le corps émis par le wizard a franchi le contrat.
 */
async function finish(builder: CharacterBuilderPage, name: string): Promise<void> {
  await builder.openStep('Identité');
  await builder.fillIdentity(identityFor(name));
  await expect(builder.page.getByText(/^PV \d+$/)).toBeVisible();
  await expect(builder.finishButton).toBeEnabled();
  await builder.finishButton.click();
  await expect(builder.page.getByRole('heading', { name })).toBeVisible();
}
