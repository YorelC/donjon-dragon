import type { Ability, ComputedCharacter } from "@donjon-dragon/shared";
import { SIZE_LABELS } from "@/shared/constants/character-labels";
import type { SpellsStep } from "../views/spells-step.view";
import { abbreviationOf } from "./builder-step-texts";
import { backgroundOf, classOf, speciesOf, type StepContext } from "./builder-lookups";
import { ABILITIES, ABILITY_LABELS, type CharacterComposition } from "./character-composition";
import { recapProficienciesOf, type RecapLine } from "./recap-proficiencies";
import { recapTokenGroupsOf, type RecapTokenGroup } from "./recap-tokens";

export const UNNAMED_CHARACTER = "Personnage à créer";
const NO_ALIGNMENT = "Aucun alignement choisi";
const NO_CREST = "?";
const MISSING_VALUE = "—";
const LEVEL_ONE = "Niveau 1";
const SHORT_LABEL_LENGTH = 3;
const SCORE_BASELINE = 10;
const SCORE_STEP = 2;

export interface RecapSource {
  context: StepContext;
  preview: ComputedCharacter | null;
  spells: SpellsStep;
}

export interface RecapAbility {
  ability: Ability;
  short: string;
  score: number;
  modifier: string;
  primary: boolean;
}

export interface RecapStat {
  label: string;
  value: string;
}

export interface CharacterRecap {
  crest: string;
  name: string;
  origin: string;
  classLine: string;
  alignment: string;
  abilities: RecapAbility[];
  stats: RecapStat[];
  tokenGroups: RecapTokenGroup[];
  proficiencies: RecapLine[];
  vitals: RecapStat[];
}

/**
 * Le récapitulatif qui accompagne toute la création.
 *
 * Il lit les choix bruts dès le premier écran, et les valeurs calculées dès que
 * l'aperçu du serveur répond — ce qui n'arrive qu'une fois l'espèce, la classe
 * et l'historique choisis. Sans ce repli, le panneau resterait vide trois étapes.
 */
export function toCharacterRecap(source: RecapSource): CharacterRecap {
  return {
    ...identityOf(source.context),
    abilities: recapAbilitiesOf(source),
    stats: statsOf(source.preview),
    tokenGroups: recapTokenGroupsOf(source),
    proficiencies: recapProficienciesOf(source),
    vitals: vitalsOf(source),
  };
}

function identityOf(context: StepContext) {
  const characterClass = classOf(context);

  return {
    crest: characterClass ? abbreviationOf(characterClass.name) : NO_CREST,
    name: context.composition.name.trim() || UNNAMED_CHARACTER,
    origin: originOf(context),
    classLine: classLineOf(context),
    alignment: context.catalog.alignments
      .find((entry) => entry.key === context.composition.alignment)?.name ?? NO_ALIGNMENT,
  };
}

/** « Niveau 1 Rôdeur · Guide » : la classe d'abord, l'historique ensuite. */
function classLineOf(context: StepContext): string {
  const className = classOf(context)?.name;
  const heading = className ? `${LEVEL_ONE} ${className}` : LEVEL_ONE;

  return [heading, backgroundOf(context)?.name].filter(Boolean).join(" · ");
}

function originOf(context: StepContext): string {
  const species = speciesOf(context);
  const lineage = species?.lineage?.options
    .find((entry) => entry.key === context.composition.lineageKey);

  return lineage?.name ?? species?.name ?? "";
}

/** Les six scores : ceux du serveur dès qu'il répond, les scores saisis avant. */
export function recapAbilitiesOf({ context, preview }: Pick<RecapSource, "context" | "preview">): RecapAbility[] {
  const primary = classOf(context)?.primaryAbilities ?? [];

  return ABILITIES.map((ability) => {
    const score = preview?.abilities[ability].score ?? directScoreOf(context.composition, ability);
    const modifier = preview?.abilities[ability].modifier ?? modifierOf(score);

    return {
      ability,
      short: ABILITY_LABELS[ability].slice(0, SHORT_LABEL_LENGTH),
      score,
      modifier: formatSigned(modifier),
      primary: primary.includes(ability),
    };
  });
}

/** Sans aperçu, seules les méthodes qui fixent un score direct ont quelque chose à montrer. */
function directScoreOf(composition: CharacterComposition, ability: Ability): number {
  return composition.abilityMethod === "manual"
    ? composition.manualScores[ability]
    : composition.pointBuyScores[ability];
}

function modifierOf(score: number): number {
  return Math.floor((score - SCORE_BASELINE) / SCORE_STEP);
}

function statsOf(preview: ComputedCharacter | null): RecapStat[] {
  return [
    { label: "PV", value: valueOrMissing(preview?.maxHitPoints.value) },
    { label: "Maîtrise", value: preview ? formatSigned(preview.proficiencyBonus) : MISSING_VALUE },
    { label: "CA", value: valueOrMissing(preview?.armorClass.value) },
    { label: "Init.", value: preview ? formatSigned(preview.initiative.value) : MISSING_VALUE },
  ];
}

function vitalsOf({ context, preview }: RecapSource): RecapStat[] {
  const species = speciesOf(context);
  const size = preview?.size ?? species?.size;
  const darkvision = preview?.darkvision ?? species?.darkvision ?? 0;

  return [
    { label: "Vitesse", value: metersOf(preview?.speed.value ?? species?.speed) },
    { label: "Taille", value: size ? SIZE_LABELS[size] : MISSING_VALUE },
    { label: "Vision dans le noir", value: darkvision > 0 ? metersOf(darkvision) : MISSING_VALUE },
  ];
}

function valueOrMissing(value: number | undefined): string {
  return value === undefined ? MISSING_VALUE : String(value);
}

function metersOf(value: number | undefined): string {
  return value === undefined ? MISSING_VALUE : `${value} m`;
}

export function formatSigned(value: number): string {
  return value >= 0 ? `+${value}` : String(value);
}
