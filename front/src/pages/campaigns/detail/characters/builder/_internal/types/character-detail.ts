import type { CatalogSpecies, ComputedCharacter } from "@donjon-dragon/shared";
import { GAME_MASTER_ABILITY_METHODS } from "./ability-methods";
import { backgroundOf, classOf, featsOf, speciesOf } from "./builder-lookups";
import { ABILITY_LABELS, type CharacterComposition } from "./character-composition";
import { formatSigned, recapAbilitiesOf } from "./character-recap";
import { spellSheetOf } from "./spell-detail";
import { spellIndexOf } from "./spell-index";
import {
  describedBlock,
  itemsBlock,
  labelsOf,
  plainDetail,
  presentBlocks,
  proseBlock,
  shownKey,
  type DetailBlock,
  type DetailItem,
  type DetailSource,
  type StepDetail,
} from "./step-detail-parts";

const UNNAMED = "Votre personnage";
const TO_SPECIFY = "À préciser";
const ALIGNMENT_PURPOSE =
  "La boussole morale de votre personnage. Elle guide son jeu, elle ne le contraint pas.";
const DESCRIPTION_HINT =
  "Décrivez votre héros dans le champ de gauche : silhouette, port, marques, ce que l'on remarque en premier.";

/** Le don survolé ; sans survol, tous les dons que le personnage a déjà. */
export function featsDetail(source: DetailSource): StepDetail {
  const focused = source.context.catalog.originFeats.find((feat) => feat.key === source.focusKey);
  if (focused) return plainDetail("Don d'origine", focused.name, focused.description);

  return {
    ...plainDetail("Dons", "Vos dons d'origine"),
    blocks: presentBlocks([describedBlock("Dons accordés", featsOf(source.context))]),
  };
}

/** La manifestation survolée ou retenue ; un sort de grimoire survolé a sa propre fiche. */
export function invocationDetail(source: DetailSource): StepDetail {
  const { catalog, composition } = source.context;
  const spell = source.focusKey ? spellIndexOf(source.spells).get(source.focusKey) : undefined;
  if (spell) return spellSheetOf(source, spell);
  const invocation = catalog.invocations.find((entry) => entry.key === shownKey(source, composition.invocation));
  if (invocation) return plainDetail("Manifestation occulte", invocation.name, invocation.description);

  return {
    ...plainDetail("Occultiste", "Manifestation occulte"),
    blocks: presentBlocks([describedBlock("Manifestations", catalog.invocations)]),
  };
}

/** La méthode retenue, le profil qu'elle donne, et ce que le serveur en déduit. */
export function abilitiesDetail(source: DetailSource): StepDetail {
  const { context, preview } = source;
  const method = GAME_MASTER_ABILITY_METHODS.find((entry) => entry.key === context.composition.abilityMethod);
  const bonuses = backgroundOf(context)?.abilityBonuses ?? [];

  return {
    kicker: "Caractéristiques",
    title: method?.label ?? "Méthode à choisir",
    lede: method?.hint ?? null,
    badges: [
      { label: "Bonus d'historique", value: labelsOf(bonuses, ABILITY_LABELS) || TO_SPECIFY },
      ...(preview ? [{ label: "PV", value: String(preview.maxHitPoints.value) }] : []),
    ],
    blocks: presentBlocks([itemsBlock("Profil obtenu", profileOf(source)), consequencesOf(preview)]),
  };
}

function profileOf({ context, preview }: DetailSource): DetailItem[] {
  const saves = classOf(context)?.savingThrows ?? [];

  return recapAbilitiesOf({ context, preview }).map((entry) => ({
    name: `${ABILITY_LABELS[entry.ability]} ${entry.score}`,
    text: [
      `Modificateur ${entry.modifier}`,
      entry.primary ? "caractéristique principale" : null,
      saves.includes(entry.ability) ? "sauvegarde maîtrisée" : null,
    ].filter(Boolean).join(" · "),
  }));
}

function consequencesOf(preview: ComputedCharacter | null): DetailBlock | null {
  if (!preview) return null;
  const saveDc = preview.spellcasting[0]?.saveDc;

  return proseBlock("Conséquences", [
    `Points de vie ${preview.maxHitPoints.value}`,
    `Classe d'armure ${preview.armorClass.value}`,
    `Initiative ${formatSigned(preview.initiative.value)}`,
    saveDc ? `DD de vos sorts ${saveDc}` : null,
  ].filter(Boolean).join(" · "));
}

/** Le récapitulatif de l'état civil : alignement survolé ou retenu, physique, description. */
export function identityDetail(source: DetailSource): StepDetail {
  const { catalog, composition } = source.context;
  const alignment = catalog.alignments.find((entry) => entry.key === shownKey(source, composition.alignment));

  return {
    ...plainDetail("Récapitulatif", composition.name.trim() || UNNAMED),
    blocks: presentBlocks([
      {
        heading: "Alignement",
        body: ALIGNMENT_PURPOSE,
        items: alignment ? [{ name: alignment.name, text: alignment.description }] : [],
      },
      itemsBlock("Physique", physiqueOf(composition, speciesOf(source.context))),
      proseBlock("Description", composition.description?.trim() || DESCRIPTION_HINT),
    ]),
  };
}

function physiqueOf(composition: CharacterComposition, species: CatalogSpecies | undefined): DetailItem[] {
  const bounds = species?.physicalBounds;

  return [
    { name: composition.age ? `${composition.age} ans` : TO_SPECIFY, text: "Âge" },
    {
      name: composition.heightCm ? `${composition.heightCm} cm` : TO_SPECIFY,
      text: bounds ? `Taille · de ${bounds.heightCm.min} à ${bounds.heightCm.max} cm pour l'espèce` : "Taille",
    },
    {
      name: composition.weightKg ? `${composition.weightKg} kg` : TO_SPECIFY,
      text: bounds ? `Poids · de ${bounds.weightKg.min} à ${bounds.weightKg.max} kg pour l'espèce` : "Poids",
    },
  ];
}
