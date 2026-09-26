import type { Locator } from '@playwright/test';
import { CharacterBuilderPage, STANDARD_ARRAY_ORDER } from './character-builder.page';

/**
 * Le fil du wizard, dans son ordre. Une étape absente pour la composition en
 * cours (pas de sort pour un barbare) est simplement sautée.
 */
const STEP_ORDER = [
  'Espèce', 'Lignage', 'Langues', 'Classe', 'Historique', 'Outil d’historique',
  'Compétences', 'Style de combat', 'Ordre', 'Maîtrises d’armes', 'Outils de classe',
  'Langue de classe', 'Dons', 'Expertise', 'Manifestation occulte', 'Caractéristiques',
  'Sorts mineurs', 'Sorts', 'Équipement', 'Identité',
] as const;

type StepLabel = (typeof STEP_ORDER)[number];

const STANDARD_ARRAY = ['15', '14', '13', '12', '10', '8'];
const SPELLCASTING_ABILITIES = /^(Intelligence|Sagesse|Charisme)$/;
const COUNTER = /(\d+) ?\/ ?(\d+)/;
const CONCRETE_ITEM_LABEL = 'Objet concret du paquetage';
const SKILLED_FEAT = 'Doué';
const SKILLED_COUNT = 3;

/**
 * Remplit les étapes qu'un parcours ne vise pas, avec les premières options
 * encore libres.
 *
 * Un parcours par classe n'a de valeur que par le mécanisme qu'il éprouve :
 * le reste du wizard doit seulement être franchi, sans que chaque test le
 * réécrive. Chaque remplissage ne complète que ce qui manque, pour qu'un test
 * puisse fixer lui-même une étape avant de rendre la main au pilote.
 */
export type { StepLabel };

export class BuilderAutopilot {
  private readonly fillers: Partial<Record<StepLabel, () => Promise<void>>> = {
    Lignage: () => this.chooseLineage(),
    'Style de combat': () => this.chooseFirstCard(),
    Ordre: () => this.chooseFirstCard(),
    Caractéristiques: () => this.assignAbilities(),
    'Sorts mineurs': () => this.fillSpellGroups(),
    Sorts: () => this.fillSpellGroups(),
    Équipement: () => this.chooseEquipment(),
    Dons: () => this.completeSkilled(),
    // Son choix est l'objet même des parcours qui la traversent : jamais au hasard.
    'Manifestation occulte': async () => {},
  };

  constructor(private readonly builder: CharacterBuilderPage) {}

  /** Remplit chaque étape visible strictement entre `after` et `until`. */
  async fillBetween(after: StepLabel, until: StepLabel): Promise<void> {
    const start = STEP_ORDER.indexOf(after) + 1;
    for (const step of STEP_ORDER.slice(start, STEP_ORDER.indexOf(until))) {
      await this.fill(step);
    }
  }

  async fill(step: StepLabel): Promise<void> {
    if ((await this.builder.step(step).count()) === 0) return;
    await this.builder.openStep(step);
    const filler = this.fillers[step] ?? (() => this.completeCounter(step));
    await filler();
  }

  /**
   * Défaut : l'étape porte un compteur « x/y » dans le fil, et on prend ce qui
   * manque. Sans compteur (langue de classe), c'est un choix unique.
   */
  private async completeCounter(step: StepLabel): Promise<void> {
    const panel = this.builder.stepPanel();
    const remaining = await remainingOf(this.builder.step(step));
    const nothingPressed = (await panel.locator('button[aria-pressed="true"]').count()) === 0;
    await this.pressFirstFree(panel, remaining ?? (nothingPressed ? 1 : 0));
  }

  private async chooseLineage(): Promise<void> {
    await this.chooseFirstCard();
    const abilities = this.cards().filter({ hasText: SPELLCASTING_ABILITIES });
    if ((await abilities.count()) === 0) return;
    if ((await abilities.and(this.checkedCards()).count()) === 0) await abilities.first().click();
  }

  private async chooseFirstCard(): Promise<void> {
    if ((await this.checkedCards().count()) > 0) return;
    await this.cards().first().click();
  }

  private async assignAbilities(): Promise<void> {
    for (const [index, ability] of STANDARD_ARRAY_ORDER.entries()) {
      await this.builder.assignScore(ability, STANDARD_ARRAY[index] as string);
    }
    const [major, minor] = await this.eligibleBonusAbilities();
    await this.builder.setBackgroundBonus(major as string, 2);
    await this.builder.setBackgroundBonus(minor as string, 1);
  }

  /** Les trois caractéristiques de l'historique : leurs cases +2 sont les seules actives. */
  private async eligibleBonusAbilities(): Promise<string[]> {
    const boxes = this.builder.page.getByRole('checkbox', { name: /\+2$/ })
      .and(this.builder.page.locator(':enabled'));
    const labels = await boxes.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('aria-label') ?? ''));
    return labels.map((label) => label.replace(/ \+2$/, ''));
  }

  /**
   * L'Elfe et l'Humain font choisir une compétence dès l'étape Espèce : sans
   * elle, tout le reste du fil reste fermé.
   */
  async completeSpecies(): Promise<void> {
    const panel = this.builder.stepPanel();
    const nothingPressed = (await panel.locator('button[aria-pressed="true"]').count()) === 0;
    if (nothingPressed) await this.pressFirstFree(panel, (await panel.locator('button[aria-pressed]').count()) > 0 ? 1 : 0);
  }

  /**
   * Seul Doué, venu de l'historique, est complété d'office : trois compétences
   * libres. Initié à la magie et le don de l'Humain restent aux parcours qui
   * les éprouvent.
   */
  private async completeSkilled(): Promise<void> {
    const card = this.builder.featCard('Historique').filter({ hasText: SKILLED_FEAT });
    if ((await card.count()) === 0) return;
    const pressed = await card.locator('button[aria-pressed="true"]').count();
    await this.pressFirstFree(card, SKILLED_COUNT - pressed);
  }

  /** Complète chaque groupe de sorts de l'étape ouverte, selon son compteur. */
  async fillSpellGroups(): Promise<void> {
    const headings = this.builder.stepPanel().getByRole('heading', { level: 3, name: COUNTER });
    for (const heading of await headings.all()) {
      const remaining = await remainingOf(heading);
      await this.pressFirstFree(heading.locator('..'), remaining ?? 0);
    }
  }

  private async chooseEquipment(): Promise<void> {
    await this.builder.choosePackage('class', 'A');
    await this.builder.choosePackage('background', 'A');
    const concrete = this.builder.page.getByRole('combobox', { name: CONCRETE_ITEM_LABEL });
    for (const select of await concrete.all()) {
      await select.click();
      await this.builder.page.getByRole('option').first().click();
    }
  }

  /** Coche les `count` premiers boutons libres, un à la fois : la liste se réordonne. */
  private async pressFirstFree(scope: Locator, count: number): Promise<void> {
    const free = scope.locator('button[aria-pressed="false"]:enabled');
    for (let pressed = 0; pressed < count; pressed += 1) {
      await free.first().click();
    }
  }

  private cards(): Locator {
    return this.builder.stepPanel().getByRole('radio');
  }

  private checkedCards(): Locator {
    return this.builder.stepPanel().getByRole('radio', { checked: true });
  }
}

async function remainingOf(locator: Locator): Promise<number | null> {
  const match = COUNTER.exec((await locator.textContent()) ?? '');
  if (!match) return null;
  return Number(match[2]) - Number(match[1]);
}
