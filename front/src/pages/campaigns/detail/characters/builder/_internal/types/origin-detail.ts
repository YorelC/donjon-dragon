import type {
  Ability,
  CatalogBackground,
  CatalogLineage,
  CatalogLineageChoice,
  CatalogSpecies,
} from "@donjon-dragon/shared";
import { SIZE_LABELS } from "@/shared/constants/character-labels";
import { speciesOf } from "./builder-lookups";
import { ABILITY_LABELS } from "./character-composition";
import {
  describedBlock,
  labelsOf,
  metersOf,
  plainDetail,
  presentBlocks,
  proseBlock,
  shownKey,
  type DetailBlock,
  type DetailSource,
  type StepDetail,
} from "./step-detail-parts";

const NO_DARKVISION = "Aucune";
const ELIGIBLE_BONUS = "+2 ou +1";
const BONUS_RULE =
  "Répartissez +2 et +1 entre deux d'entre elles, ou +1 à chacune, à l'étape Caractéristiques.";
const LINEAGE_PURPOSE = "Ce choix vous confère des pouvoirs surnaturels propres à votre lignée.";
const LINEAGE_ABILITY_PURPOSE =
  "Elle détermine le degré de difficulté et le bonus d'attaque du sort mineur de votre lignée.";

/** L'espèce survolée ou retenue : gabarit, vitesse, vision, traits. */
export function speciesDetail(source: DetailSource): StepDetail {
  const { catalog, composition } = source.context;
  const key = shownKey(source, composition.speciesKey);
  const species = catalog.species.find((entry) => entry.key === key);
  if (!species) return plainDetail("Espèce", "Choisissez une espèce");

  return {
    kicker: "Espèce",
    title: species.name,
    lede: species.description || null,
    badges: [
      { label: "Taille", value: species.sizeOptions.map((size) => SIZE_LABELS[size]).join(" ou ") },
      { label: "Vitesse", value: metersOf(species.speed) },
      { label: "Vision dans le noir", value: species.darkvision > 0 ? metersOf(species.darkvision) : NO_DARKVISION },
    ],
    blocks: presentBlocks([describedBlock("Traits d'espèce", species.traits), lineagesBlock(species)]),
  };
}

function lineagesBlock(species: CatalogSpecies): DetailBlock | null {
  if (!species.lineage) return null;

  return proseBlock("Lignages disponibles", species.lineage.options.map((option) => option.name).join(" · "));
}

/**
 * Le lignage survolé ou retenu, et la caractéristique qui incante son sort.
 * Sans lignage, la fiche dit à quoi sert le choix.
 */
export function lineageDetail(source: DetailSource): StepDetail {
  const species = speciesOf(source.context);
  const choice = species?.lineage;
  if (!species || !choice) return plainDetail("Lignage", "Lignage", LINEAGE_PURPOSE);
  const key = shownKey(source, source.context.composition.lineageKey);
  const lineage = choice.options.find((option) => option.key === key);

  return {
    kicker: species.name,
    title: lineage?.name ?? choice.label,
    lede: lineage ? lineage.description || null : LINEAGE_PURPOSE,
    badges: [],
    blocks: lineageBlocks(choice, lineage),
  };
}

function lineageBlocks(choice: CatalogLineageChoice, lineage: CatalogLineage | undefined): DetailBlock[] {
  const abilities = choice.spellcastingAbilityOptions;

  return presentBlocks([
    lineage ? proseBlock(choice.label, LINEAGE_PURPOSE) : null,
    lineage ? lineageTraitsBlock(lineage) : null,
    abilities.length > 0
      ? proseBlock(
        "Caractéristique d'incantation",
        `${LINEAGE_ABILITY_PURPOSE} Au choix : ${labelsOf(abilities, ABILITY_LABELS)}.`,
      )
      : null,
  ]);
}

/** L'historique survolé ou retenu : don, compétences, outil, bonus, paquetage. */
export function backgroundDetail(source: DetailSource): StepDetail {
  const { catalog, composition } = source.context;
  const key = shownKey(source, composition.backgroundKey);
  const background = catalog.backgrounds.find((entry) => entry.key === key);
  if (!background) return plainDetail("Historique", "Choisissez un historique");

  return {
    kicker: "Historique",
    title: background.name,
    lede: background.description || null,
    badges: [
      { label: "Caractéristiques", value: labelsOf(background.abilityBonuses, ABILITY_LABELS) },
      { label: "Outil", value: background.toolProficiency },
    ],
    blocks: backgroundBlocks(source, background),
  };
}

function backgroundBlocks(source: DetailSource, background: CatalogBackground): DetailBlock[] {
  const { catalog } = source.context;
  const feat = catalog.originFeats.filter((entry) => entry.key === background.originFeat);

  return presentBlocks([
    describedBlock("Don d'origine", feat),
    proseBlock("Compétences accordées", labelsOf(background.skillProficiencies, catalog.skillLabels)),
    bonusesBlock(background.abilityBonuses),
    describedBlock("Paquetage", background.equipment.options.map((option) => ({
      name: `Option ${option.id}`,
      description: option.label,
    }))),
  ]);
}

/** Les trois caractéristiques éligibles, une par ligne : c'est ce qu'on cherche des yeux. */
function bonusesBlock(abilities: readonly Ability[]): DetailBlock {
  return {
    heading: "Bonus de caractéristiques",
    body: BONUS_RULE,
    items: abilities.map((ability) => ({ name: ABILITY_LABELS[ability], text: ELIGIBLE_BONUS })),
  };
}

/** Le résumé du lignage en tête, puis le détail de chacun de ses traits. */
function lineageTraitsBlock(lineage: CatalogLineage): DetailBlock {
  return {
    heading: "Traits spécifiques",
    body: lineage.summary || null,
    items: lineage.traits.map((trait) => ({ name: trait.name, text: trait.description })),
  };
}
