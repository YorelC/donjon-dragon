import { GetCampaignMembershipUseCase } from '@modules/campaigns/application/use-cases/get-campaign-membership.use-case';
import { UserId } from '@kernel/domain/user-id';

import type { CharacterRepositoryPort } from './ports/character.repository.port';
import type { Character, CharacterAccessContext } from '../domain/character';
import { CharacterId } from '../domain/character-id';
import { CharacterNotFoundError } from '../domain/character.errors';

/**
 * La lecture que fait tout use-case du module avant d'agir. Le port arrive en
 * paramètre : cette fonction n'a pas de dépendance propre, donc rien à injecter.
 */
export async function loadCharacter(
  characterRepo: CharacterRepositoryPort,
  characterId: string,
): Promise<Character> {
  const character = await characterRepo.findById(CharacterId.create(characterId));
  if (!character) throw new CharacterNotFoundError();

  return character;
}

/**
 * Résout le contexte d'accès d'un use-case d'édition : deux lectures de rôle,
 * l'appelant et le créateur de la fiche, jamais un seul — sinon un MJ démis
 * garderait indéfiniment les droits d'un autre MJ sur ce qu'il a créé.
 */
export async function resolveAccessContext(
  membership: GetCampaignMembershipUseCase,
  campaignId: string,
  actorId: string,
  createdBy: UserId,
): Promise<CharacterAccessContext> {
  const [actorRole, creatorRole] = await Promise.all([
    membership.execute({ campaignId, userId: actorId }),
    membership.execute({ campaignId, userId: createdBy.value }),
  ]);

  return {
    actorId: UserId.create(actorId),
    actorIsGameMaster: actorRole.isGameMaster,
    actorIsCampaignOwner: actorRole.isOwner,
    creatorIsGameMaster: creatorRole.isGameMaster,
  };
}
