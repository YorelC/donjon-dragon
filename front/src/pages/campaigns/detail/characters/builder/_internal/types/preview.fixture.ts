import type { Ability, ComputedCharacter, ResolvedSavingThrow } from "@donjon-dragon/shared";
import type { SpellsStep } from "../views/spells-step.view";

/** Un aperçu serveur construit au type réel : un champ ajouté au contrat casse `tsc`. */
export function aPreview(overrides: Partial<ComputedCharacter> = {}): ComputedCharacter {
  return {
    equipment: { items: [], gold: 0, armorName: null, shield: false, stealthDisadvantage: false },
    level: 1, experiencePoints: 0, proficiencyBonus: 2, hitDie: 10,
    speciesName: "Nain", lineageName: null, className: "Rôdeur", backgroundName: "Guide",
    size: "Medium", darkvision: 36, abilityMethod: "standardArray",
    abilities: everyAbility({ score: 14, modifier: 2 }),
    maxHitPoints: { value: 13, sources: [] }, currentHitPoints: { value: 13, sources: [] },
    armorClass: { value: 14, sources: [] }, initiative: { value: 3, sources: [] },
    speed: { value: 9, sources: [] }, passivePerception: 13, unarmedDamage: "1",
    savingThrows: everySave(),
    skills: [],
    proficiencies: {
      skills: ["survival"], expertise: [], tools: [], languages: ["common"],
      armorTraining: ["light", "shields"], weapons: ["simple", "martial"], savingThrows: [],
    },
    spellcasting: [], features: [], resources: [], attacks: [], spellbook: [],
    ...overrides,
  };
}

/** Aucune liste de sorts chargée : ce que voit un personnage qui ne lance rien. */
export function noSpells(overrides: Partial<SpellsStep> = {}): SpellsStep {
  return {
    classSpells: null, classCantripsKnown: 0, classSpellsPrepared: 0, spellbookSize: 0,
    featSpells: null, featCantripsKnown: 0, featSpellsPrepared: 0, featSpellLists: {},
    grantedSpells: [], grantedBy: [], tomeSpells: { cantrips: [], rituals: [] }, isLoading: false,
    ...overrides,
  };
}

const ABILITY_KEYS: readonly Ability[] = [
  "strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma",
];

function everyAbility<T>(value: T): Record<Ability, T> {
  return Object.fromEntries(ABILITY_KEYS.map((ability) => [ability, value])) as Record<Ability, T>;
}

function everySave(): Record<Ability, ResolvedSavingThrow> {
  return Object.fromEntries(ABILITY_KEYS.map((ability) => [
    ability, { ability, modifier: 1, proficient: false },
  ])) as Record<Ability, ResolvedSavingThrow>;
}
