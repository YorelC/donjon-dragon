import type {
  AbilityRoll as AbilityRollDto,
  Character as CharacterDto,
  CharacterBuildSummary,
} from '@donjon-dragon/shared/character-schema';
import type { UserId } from '@kernel/domain/user-id';

import type { Character } from '../domain/character';
import { BACKGROUNDS } from '../domain/reference/backgrounds';
import { CLASSES } from '../domain/reference/classes';
import { SPECIES } from '../domain/reference/species';
import type { CharacterDirectoryUser } from './ports/character-directory.port';

/**
 * Agrégat → contrat HTTP. `createdByMe` remplace tout id de créateur : le
 * client sait seulement s'il a lui-même créé cette fiche.
 *
 * `assignedPlayer` arrive déjà résolu, et c'est la seule forme admise : un
 * mapper qui prendrait le port pourrait être appelé dans une boucle sans que
 * rien ne le signale. C'est exactement ce qui s'est produit ici, sous un
 * commentaire qui décrivait le bon découpage sans que le code l'applique.
 *
 * Les noms d'espèce, de classe et d'historique sont résolus ici et non côté
 * front : les données de référence vivent au back, le client affiche.
 */
export function toCharacterDto(
  character: Character,
  viewerId: UserId,
  assignedPlayer: CharacterDirectoryUser | null,
): CharacterDto {
  return {
    id: character.id.value,
    campaignId: character.campaignId.value,
    name: character.name.value,
    status: character.status,
    build: buildSummaryOf(character),
    abilityRoll: rollOf(character),
    createdByMe: character.createdBy.equals(viewerId),
    assignedTo: assignedPlayer ? { displayName: assignedPlayer.displayName } : null,
    revision: character.revision,
  };
}

function buildSummaryOf(character: Character): CharacterBuildSummary {
  const build = character.build;
  const species = SPECIES[build.speciesKey];
  const lineage = species.lineage?.options.find((option) => option.key === build.lineageKey);

  return {
    speciesKey: build.speciesKey,
    speciesName: species.name,
    lineageName: lineage?.name ?? null,
    classKey: build.classKey,
    className: CLASSES[build.classKey].name,
    backgroundKey: build.backgroundKey,
    backgroundName: BACKGROUNDS[build.backgroundKey].name,
  };
}

/** Le détail des dés accompagne les totaux : le joueur doit pouvoir refaire le calcul. */
function rollOf(character: Character): AbilityRollDto | null {
  const roll = character.abilityRoll;
  if (!roll) return null;

  return { dice: roll.snapshot().dice, totals: roll.totals };
}
