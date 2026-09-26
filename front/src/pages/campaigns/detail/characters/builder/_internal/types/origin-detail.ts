import type { CatalogBackground, CatalogSpecies } from "@donjon-dragon/shared";
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

/** L'espèce survolée ou retenue : gabarit, vitesse, vision, traits. */
export function speciesDetail(source: DetailSource): StepDetail {
  const { catalog, composition } = source.context;
  const key = shownKey(source, composition.speciesKey);
  const species = catalog.species.find((entry) => entry.key === key);
  if (!species) return plainDetail("Espèce", "Choisissez une espèce");

  return {
    kicker: "Espèce",
    title: species.name,
    lede: null,
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

/** Le lignage survolé ou retenu, et la caractéristique qui incante son sort. */
export function lineageDetail(source: DetailSource): StepDetail {
  const species = speciesOf(source.context);
  const choice = species?.lineage;
  const key = shownKey(source, source.context.composition.lineageKey);
  const lineage = choice?.options.find((option) => option.key === key);
  if (!species || !choice || !lineage) return plainDetail(species?.name ?? "Lignage", choice?.label ?? "Lignage");
  const abilities = choice.spellcastingAbilityOptions;

  return {
    kicker: species.name,
    title: lineage.name,
    lede: lineage.description || null,
    badges: [],
    blocks: presentBlocks([
      describedBlock("Traits spécifiques", lineage.traits),
      abilities.length > 0
        ? proseBlock("Caractéristique d'incantation", `Au choix : ${labelsOf(abilities, ABILITY_LABELS)}.`)
        : null,
    ]),
  };
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
    proseBlock(
      "Bonus de caractéristiques",
      `+2 et +1, ou +1 partout, entre ${labelsOf(background.abilityBonuses, ABILITY_LABELS)} : ils se placent à l'étape Caractéristiques.`,
    ),
    describedBlock("Paquetage", background.equipment.options.map((option) => ({
      name: `Option ${option.id}`,
      description: option.label,
    }))),
  ]);
}
