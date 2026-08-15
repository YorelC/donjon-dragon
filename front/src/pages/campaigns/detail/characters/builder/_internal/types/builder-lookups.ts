import type {
  CatalogClass,
  CatalogOriginFeat,
  DndCatalog,
  SkillName,
} from "@donjon-dragon/shared";
import type { KnownSkill } from "../views/skill-picker.view";
import type { CharacterComposition } from "./character-composition";

export interface StepContext {
  catalog: DndCatalog;
  composition: CharacterComposition;
}

export function speciesOf({ catalog, composition }: StepContext) {
  return catalog.species.find((entry) => entry.key === composition.speciesKey);
}

export function classOf({ catalog, composition }: StepContext): CatalogClass | undefined {
  return catalog.classes.find((entry) => entry.key === composition.classKey);
}

export function backgroundOf({ catalog, composition }: StepContext) {
  return catalog.backgrounds.find((entry) => entry.key === composition.backgroundKey);
}

const FIGHTING_STYLE_KEY = "fightingStyle";

export function fightingStyleChoiceOf(context: StepContext) {
  return classOf(context)?.level1Choices.find((choice) => choice.key === FIGHTING_STYLE_KEY);
}

/** L'Ordre divin du clerc ou l'Ordre primitif du druide, s'il y en a un. */
export function orderChoiceOf(context: StepContext) {
  return classOf(context)?.level1Choices.find((choice) => choice.key !== FIGHTING_STYLE_KEY);
}

/** Les dons du personnage : celui de l'historique, et celui que l'espèce accorde. */
export function featsOf(context: StepContext): CatalogOriginFeat[] {
  const keys = [backgroundOf(context)?.originFeat, context.composition.speciesFeat].filter(
    Boolean,
  );

  return context.catalog.originFeats.filter((feat) => keys.includes(feat.key));
}

export function featSpellcastingOf(context: StepContext) {
  return featsOf(context).find((feat) => feat.spellcastingChoice)?.spellcastingChoice;
}

/**
 * Les deux moitiés mystiques des Ordres accordent un sort mineur de plus. Le
 * back reste l'autorité — il applique `grants.extraCantrips` ; le front n'a
 * besoin de ce compte que pour dimensionner le sélecteur.
 */
const MYSTIC_ORDER_OPTIONS = ["thaumaturge", "magician"];

function extraCantripsOf({ composition }: StepContext): number {
  return composition.classOrder && MYSTIC_ORDER_OPTIONS.includes(composition.classOrder) ? 1 : 0;
}

/** Les sorts de la classe et ceux d'un don s'additionnent, sans se confondre. */
export function cantripQuotaOf(context: StepContext): number {
  const fromClass = classOf(context)?.spellcasting?.cantripsKnown ?? 0;
  const fromFeat = featSpellcastingOf(context)?.cantripsKnown ?? 0;

  return fromClass + fromFeat + (fromClass > 0 ? extraCantripsOf(context) : 0);
}

export function spellQuotaOf(context: StepContext): number {
  const fromClass = classOf(context)?.spellcasting?.spellsPrepared ?? 0;

  return fromClass + (featSpellcastingOf(context)?.spellsPrepared ?? 0);
}

/**
 * Toutes les compétences déjà acquises, avec leur source, sauf celles qui
 * viennent de l'écran qu'on est en train de remplir.
 *
 * Sans les deux compétences fixes de l'historique, un barbare fermier se voyait
 * proposer Dressage et Nature que le Fermier lui donne déjà : il en choisissait
 * une, elle était dédoublonnée, et il perdait un choix sans le voir.
 */
export function knownSkillsExcept(
  context: StepContext,
  exclude: SkillSourceKind,
): KnownSkill[] {
  return skillSourcesOf(context)
    .filter((source) => source.kind !== exclude)
    .flatMap((source) => source.skills.map((skill) => ({ skill, source: source.origin })));
}

type SkillSourceKind = "class" | "species" | "feat" | "background";

interface SkillSource {
  kind: SkillSourceKind;
  origin: string;
  skills: readonly SkillName[];
}

function skillSourcesOf(context: StepContext): SkillSource[] {
  const { catalog, composition } = context;
  const background = backgroundOf(context);

  return [
    source("background", background?.name ?? "Historique", background?.skillProficiencies ?? []),
    source("class", classOf(context)?.name ?? "Classe", composition.classSkills),
    source("species", speciesOf(context)?.name ?? "Espèce", composition.speciesSkills),
    source("feat", featOriginLabel(catalog, composition), composition.featSkills),
  ];
}

function source(
  kind: SkillSourceKind,
  origin: string,
  skills: readonly SkillName[],
): SkillSource {
  return { kind, origin, skills };
}

function featOriginLabel(catalog: DndCatalog, composition: CharacterComposition): string {
  return catalog.originFeats.find((feat) => feat.key === composition.speciesFeat)?.name ?? "Don";
}
