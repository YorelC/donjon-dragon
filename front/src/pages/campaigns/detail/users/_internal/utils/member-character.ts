import type { CampaignCharacterListItem } from "@donjon-dragon/shared";

const NO_CHARACTER = "Aucun personnage associé";

/**
 * Qui lit la liste, et jusqu'où il a le droit de voir. Le serveur ne nomme le
 * meneur d'une fiche qu'au maître du jeu et à celui qui la mène : sur les autres
 * lignes on se tait, plutôt que d'affirmer une absence qu'on ne constate pas.
 */
export interface CharacterReader {
  displayName: string;
  seesEveryAssignment: boolean;
}

/** Ce qu'on dit d'un membre sous son nom : le personnage qu'il mène à la table. */
export function toMemberCharacterLine(
  displayName: string,
  characters: CampaignCharacterListItem[],
  reader: CharacterReader,
): string | undefined {
  const [first, ...others] = toOwnedCharacters(displayName, characters);
  if (!first) return toAbsenceLine(displayName, reader);
  if (others.length > 0) return `${others.length + 1} personnages`;

  return `${first.name} · ${first.className} niveau ${first.level}`;
}

function toAbsenceLine(
  displayName: string,
  reader: CharacterReader,
): string | undefined {
  const constatable =
    reader.seesEveryAssignment || displayName === reader.displayName;

  return constatable ? NO_CHARACTER : undefined;
}

/** Les fiches en projection `pool` ne disent pas qui les mène : on les écarte. */
function toOwnedCharacters(
  displayName: string,
  characters: CampaignCharacterListItem[],
): CampaignCharacterListItem[] {
  return characters.filter(
    (character) =>
      character.projection !== "pool" &&
      character.assignedTo?.displayName === displayName,
  );
}
