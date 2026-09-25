import type {
  Ability,
  DndCatalog,
  CreateCharacterDto,
  FinalizeCharacterDto,
  PreviewCharacterSheetDto,
} from "@donjon-dragon/shared";
import {
  ABILITIES,
  availableScores,
  isFullyAssigned,
  type CharacterComposition,
} from "./character-composition";
import { speciesOf } from "./builder-lookups";
import { completeIdentityOf } from "./identity-fields";
import { choicesOf } from "./payload-choices";
import { equipmentPayloadOf } from "./starting-equipment";
import { STANDARD_LANGUAGE_QUOTA } from "./builder-validity";

/** Un score neutre tant que rien n'est réparti : l'aperçu doit répondre. */
const UNASSIGNED_SCORE = 10;

function baseScoresOf(composition: CharacterComposition): Record<Ability, number> {
  if (composition.abilityMethod === "pointBuy") return { ...composition.pointBuyScores };
  const available = availableScores(composition);

  return Object.fromEntries(
    ABILITIES.map((ability) => {
      const slot = composition.assignment[ability];

      return [
        ability,
        slot === undefined ? UNASSIGNED_SCORE : available[slot] ?? UNASSIGNED_SCORE,
      ];
    }),
  ) as Record<Ability, number>;
}

/**
 * L'aperçu, dont le contrat est plus permissif que celui de la création : il
 * exige l'origine — espèce, langues, classe, historique — mais pas l'état
 * civil. Un joueur voit donc sa fiche bien avant de choisir son âge. La taille
 * physique, dès qu'elle est connue, permet au serveur d'en déduire le gabarit.
 */
export function toPreviewPayload(
  catalog: DndCatalog,
  composition: CharacterComposition,
): PreviewCharacterSheetDto | null {
  const origin = originOf(composition);
  if (!origin) return null;

  return {
    ...origin,
    ...knownHeightOf(composition),
    abilityMethod: composition.abilityMethod,
    base: baseScoresOf(composition),
    backgroundBonuses: composition.backgroundBonuses,
    choices: choicesOf(composition),
    equipment: equipmentPayloadOf(catalog, composition),
  };
}

type PayloadOrigin = Pick<
  CreateCharacterDto,
  "speciesKey" | "lineageKey" | "standardLanguages" | "classKey" | "backgroundKey"
>;

/** Ce que l'espèce, les langues, la classe et l'historique fixent. */
function originOf(composition: CharacterComposition): PayloadOrigin | null {
  const { speciesKey, classKey, backgroundKey, standardLanguages } = composition;
  if (!speciesKey || !classKey || !backgroundKey) return null;
  if (standardLanguages.length !== STANDARD_LANGUAGE_QUOTA) return null;

  return {
    speciesKey, lineageKey: composition.lineageKey,
    standardLanguages: [...standardLanguages], classKey, backgroundKey,
  };
}

function knownHeightOf({ heightCm }: CharacterComposition): { heightCm?: number } {
  return heightCm === null ? {} : { heightCm };
}

/** Le corps du `POST` : la création est le seul moment où un tirage se désigne. */
export function toCreatePayload(
  catalog: DndCatalog,
  composition: CharacterComposition,
): CreateCharacterDto | null {
  const named = toNamedComposition(catalog, composition);
  if (!named) return null;

  return { ...named, abilityRollId: composition.abilityRollId };
}

/**
 * Le corps du `PUT`. Le tirage n'y figure jamais : le personnage garde le sien,
 * et le serveur refuse toute composition qui prétend en redésigner un.
 */
export function toEditPayload(
  catalog: DndCatalog,
  composition: CharacterComposition,
  expectedRevision: number,
): FinalizeCharacterDto | null {
  const named = toNamedComposition(catalog, composition);
  if (!named) return null;

  return { ...named, abilityRollId: null, expectedRevision };
}

/**
 * La part commune aux deux contrats : tout, sauf le sort réservé au tirage.
 *
 * `completeIdentityOf` est un rétrécissement de type, pas une affirmation :
 * tant qu'un champ d'état civil manque, il n'y a pas de payload du tout. Le
 * serveur reste le juge — cette garde évite d'envoyer un corps qu'on sait
 * incomplet, elle ne prétend pas rendre le `400` impossible.
 */
function toNamedComposition(
  catalog: DndCatalog,
  composition: CharacterComposition,
): Omit<CreateCharacterDto, "abilityRollId"> | null {
  const preview = toPreviewPayload(catalog, composition);
  const bounds = speciesOf({ catalog, composition })?.physicalBounds;
  const identity = completeIdentityOf(composition, bounds);
  if (!preview || !identity || !isFullyAssigned(composition)) return null;

  return { ...preview, ...identity };
}
