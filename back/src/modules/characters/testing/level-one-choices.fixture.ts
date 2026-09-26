import { CharacterChoices, type CharacterChoice } from '../domain/character-choices';
import { BACKGROUNDS } from '../domain/reference/backgrounds';
import { CLASS_ORDERS } from '../domain/reference/class-orders';
import { CLASSES } from '../domain/reference/classes';
import {
  ARTISAN_TOOLS,
  BACKGROUND_FIXED_TOOLS,
  MUSICAL_INSTRUMENTS,
} from '../domain/reference/creation-options';
import type {
  BackgroundKey,
  ClassKey,
  LineageKey,
  OriginFeatKey,
  SpeciesKey,
  SpellKey,
} from '../domain/reference/keys';
import { SKILLS, type SkillName } from '../domain/reference/skills';
import { SPECIES } from '../domain/reference/species';
import { SPELLS } from '../domain/reference/spells';
import type { ChoicesToValidate } from '../domain/resolution/choice-validation';
import {
  backgroundToolOptions,
  classToolOptions,
  weaponMasteryCount,
  weaponMasteryOptions,
} from '../domain/resolution/class-options';
import { collectEffects } from '../domain/resolution/collect-effects';

/**
 * Une création niveau 1 VALIDE pour n'importe quelle espèce, classe et historique.
 *
 * Chaque source choisit dans ce que les précédentes lui ont laissé : une
 * compétence, un outil ou un sort ne se prend qu'une fois (B01-CLA-001,
 * B01-SOR-006). Les choix eux-mêmes sont les premiers disponibles : ces tests
 * éprouvent l'acceptation d'une combinaison, pas l'optimisation d'un build.
 */
export interface LevelOneOrigin {
  speciesKey: SpeciesKey;
  classKey: ClassKey;
  backgroundKey: BackgroundKey;
  /** Le don que l'Humain choisit par Polyvalent ; Vigilant par défaut. */
  speciesFeat?: OriginFeatKey;
}

const STANDARD_LANGUAGES = ['elvish', 'dwarvish'] as const;
const ROGUE_LANGUAGE = 'gnomish';
const ROGUE_EXPERTISE_COUNT = 2;
const FEAT_PROFICIENCY_COUNT = 3;
const MAGIC_INITIATE_CANTRIPS = 2;
const MAGIC_INITIATE_SPELL_LIST: ClassKey = 'wizard';
const DEFAULT_HUMAN_FEAT: OriginFeatKey = 'alert';

export function levelOneInput(origin: LevelOneOrigin): ChoicesToValidate {
  const draft = new LevelOneDraft(origin);
  draft.chooseSpecies();
  draft.chooseBackgroundTool();
  draft.chooseClass();
  draft.chooseFeats();

  return {
    speciesKey: origin.speciesKey,
    lineageKey: draft.lineageKey,
    standardLanguages: STANDARD_LANGUAGES,
    classKey: origin.classKey,
    backgroundKey: origin.backgroundKey,
    choices: CharacterChoices.create(draft.choices),
  };
}

class LevelOneDraft {
  readonly choices: CharacterChoice[] = [];
  readonly lineageKey: LineageKey | null;
  private readonly skills: SkillName[];
  private readonly tools: string[];
  private readonly spells: SpellKey[];

  constructor(private readonly origin: LevelOneOrigin) {
    this.lineageKey = SPECIES[origin.speciesKey].lineage?.options[0]?.key ?? null;
    this.skills = [...BACKGROUNDS[origin.backgroundKey].skillProficiencies];
    this.tools = fixedToolsOf(origin);
    this.spells = grantedSpells(origin, this.lineageKey);
  }

  chooseSpecies(): void {
    const skillChoice = speciesSkillChoice(this.origin.speciesKey);
    const skills = skillChoice ? this.takeSkills(skillChoice.options, skillChoice.count) : [];
    const feat = this.speciesFeat();
    if (skills.length > 0 || feat) this.add('species', this.origin.speciesKey, {
      skills, ...(feat ? { originFeat: feat } : {}),
    });
    this.chooseLineageAbility();
  }

  chooseBackgroundTool(): void {
    const options = backgroundToolOptions(this.origin.backgroundKey);
    if (options.length === 0) return;
    this.add('background', this.origin.backgroundKey, { tools: this.takeTools(options, 1) });
  }

  chooseClass(): void {
    const { classKey } = this.origin;
    const characterClass = CLASSES[classKey];
    const choice: CharacterChoice = {
      source: { type: 'class', key: classKey },
      skills: this.takeSkills(characterClass.skillChoice.options, characterClass.skillChoice.count),
      tools: this.takeTools(classToolOptions(classKey), characterClass.toolChoice?.count ?? 0),
      ...classOptionsOf(classKey),
    };
    Object.assign(choice, this.classSpells(choice), this.rogueChoices());
    this.choices.push(choice);
  }

  chooseFeats(): void {
    const background = BACKGROUNDS[this.origin.backgroundKey];
    this.chooseFeat(background.originFeat, { type: 'background', key: background.key });
    const speciesFeat = this.speciesFeat();
    if (speciesFeat) {
      this.chooseFeat(speciesFeat, { type: 'species', key: this.origin.speciesKey });
    }
  }

  private chooseFeat(feat: OriginFeatKey, grantedBy: FeatGrant): void {
    const configure: Partial<Record<OriginFeatKey, () => Omit<CharacterChoice, 'source'>>> = {
      'magic-initiate': () => this.magicInitiate(grantedBy),
      skilled: () => ({ skills: this.takeSkills(SKILLS, FEAT_PROFICIENCY_COUNT) }),
      crafter: () => ({ tools: this.takeTools(ARTISAN_TOOLS, FEAT_PROFICIENCY_COUNT) }),
      musician: () => ({ tools: this.takeTools(MUSICAL_INSTRUMENTS, FEAT_PROFICIENCY_COUNT) }),
    };
    const details = configure[feat]?.();
    if (!details) return;
    this.choices.push({ source: { type: 'feat', key: feat, grantedBy }, ...details });
  }

  private magicInitiate(grantedBy: FeatGrant): Omit<CharacterChoice, 'source'> {
    const spellList = grantedBy.type === 'background'
      ? BACKGROUNDS[this.origin.backgroundKey].originFeatSpellList ?? MAGIC_INITIATE_SPELL_LIST
      : MAGIC_INITIATE_SPELL_LIST;
    const spells = [
      ...this.takeSpells(spellList, 0, MAGIC_INITIATE_CANTRIPS),
      ...this.takeSpells(spellList, 1, 1),
    ];
    return { spellList, spellcastingAbility: 'intelligence', spells };
  }

  private classSpells(choice: CharacterChoice): Omit<CharacterChoice, 'source'> {
    const spellcasting = CLASSES[this.origin.classKey].spellcasting;
    if (!spellcasting) return {};
    const cantrips = this.takeSpells(this.origin.classKey, 0, spellcasting.cantripsKnown + extraCantrips(choice));
    const spellbookSize = spellcasting.spellbookSize ?? 0;
    if (spellbookSize > 0) {
      return { spells: cantrips, spellbook: this.takeSpells(this.origin.classKey, 1, spellbookSize) };
    }
    return { spells: [...cantrips, ...this.takeSpells(this.origin.classKey, 1, spellcasting.spellsPrepared)] };
  }

  private rogueChoices(): Omit<CharacterChoice, 'source'> {
    if (this.origin.classKey !== 'rogue') return {};
    return { expertise: this.skills.slice(0, ROGUE_EXPERTISE_COUNT), languages: [ROGUE_LANGUAGE] };
  }

  private chooseLineageAbility(): void {
    const ability = SPECIES[this.origin.speciesKey].lineage?.spellcastingAbilityOptions?.[0];
    if (!this.lineageKey || !ability) return;
    this.add('lineage', this.lineageKey, { spellcastingAbility: ability });
  }

  private speciesFeat(): OriginFeatKey | null {
    if (this.origin.speciesKey !== 'human') return null;
    return this.origin.speciesFeat ?? DEFAULT_HUMAN_FEAT;
  }

  private add(
    type: 'species' | 'lineage' | 'background',
    key: string,
    details: Omit<CharacterChoice, 'source'>,
  ): void {
    this.choices.push({ source: { type, key }, ...details });
  }

  private takeSkills(options: readonly SkillName[] | 'any', count: number): SkillName[] {
    const pool = options === 'any' ? SKILLS : options;
    return takeFrom(pool, this.skills, count);
  }

  private takeTools(options: readonly string[], count: number): string[] {
    return takeFrom(options, this.tools, count);
  }

  private takeSpells(list: ClassKey, level: 0 | 1, count: number): SpellKey[] {
    const pool = Object.values(SPELLS)
      .filter((spell) => spell.level === level && spell.classLists.includes(list))
      .map((spell) => spell.key);
    return takeFrom(pool, this.spells, count);
  }
}

type FeatGrant = { type: 'background' | 'species'; key: string };

/** Prend les `count` premières options encore libres, et les marque prises. */
function takeFrom<T>(pool: readonly T[], taken: T[], count: number): T[] {
  const chosen = pool.filter((option) => !taken.includes(option)).slice(0, count);
  taken.push(...chosen);
  return chosen;
}

function fixedToolsOf(origin: LevelOneOrigin): string[] {
  const backgroundTool = BACKGROUND_FIXED_TOOLS[origin.backgroundKey];
  return [...CLASSES[origin.classKey].toolProficiencies, ...(backgroundTool ? [backgroundTool] : [])];
}

function speciesSkillChoice(speciesKey: SpeciesKey) {
  return SPECIES[speciesKey].traits.flatMap((trait) => trait.effects)
    .find((effect) => effect.grants?.skillChoice)?.grants?.skillChoice;
}

function classOptionsOf(classKey: ClassKey): Omit<CharacterChoice, 'source'> {
  const order = CLASS_ORDERS[classKey]?.options[0];
  const masteries = weaponMasteryOptions(classKey).slice(0, weaponMasteryCount(classKey));
  return {
    ...(order ? { classOrder: order.key } : {}),
    ...(classKey === 'fighter' ? { fightingStyle: 'archery' } : {}),
    ...(masteries.length > 0 ? { weaponMasteries: masteries } : {}),
    ...(classKey === 'warlock' ? { invocation: 'armor-of-shadows' } : {}),
  };
}

function extraCantrips(choice: CharacterChoice): number {
  const order = CLASS_ORDERS[choice.source.key as ClassKey]?.options
    .find((option) => option.key === choice.classOrder);
  return order?.effects.reduce((count, effect) => count + (effect.grants?.extraCantrips ?? 0), 0) ?? 0;
}

/** Ce que l'espèce, la lignée, la classe et son ordre accordent déjà : hors choix. */
function grantedSpells(origin: LevelOneOrigin, lineageKey: LineageKey | null): SpellKey[] {
  const classChoice: CharacterChoice = {
    source: { type: 'class', key: origin.classKey },
    ...classOptionsOf(origin.classKey),
  };
  return collectEffects({ ...origin, lineageKey, choices: CharacterChoices.create([classChoice]) })
    .flatMap((collected) => collected.effect.grants?.spells ?? [])
    .map((spell) => spell.spellKey);
}
