import { GetCampaignMembershipsUseCase } from '@modules/campaigns/application/use-cases/get-campaign-memberships.use-case';
import { UserId } from '@kernel/domain/user-id';

import type { CharacterRepositoryPort } from './ports/character.repository.port';
import type { Character, CharacterAccessContext } from '../domain/character';
import { CharacterId } from '../domain/character-id';
import { CharacterNotFoundError } from '../domain/character.errors';
import { OwningCampaignId } from '../domain/owning-campaign-id';

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

export async function loadCampaignCharacter(
  characterRepo: CharacterRepositoryPort,
  campaignId: string,
  characterId: string,
): Promise<Character> {
  const character = await characterRepo.findByCampaignAndId(
    OwningCampaignId.create(campaignId),
    CharacterId.create(characterId),
  );
  if (!character) throw new CharacterNotFoundError();
  return character;
}

export interface AccessContextQuery {
  campaignId: string;
  actorId: string;
  createdBy: UserId;
}

/**
 * Résout le contexte d'accès d'un use-case d'édition : deux rôles, l'appelant et
 * le créateur de la fiche, jamais un seul — sinon un MJ démis garderait
 * indéfiniment les droits d'un autre MJ sur ce qu'il a créé.
 *
 * Les deux identités sont connues d'avance — l'une vient de la session, l'autre
 * de la fiche déjà chargée. Aucun pseudo n'est résolu, donc la lecture groupée
 * ne crée aucun oracle d'annuaire : une seule campagne chargée suffit.
 */
export async function resolveAccessContext(
  memberships: GetCampaignMembershipsUseCase,
  query: AccessContextQuery,
): Promise<CharacterAccessContext> {
  const roles = await memberships.execute({
    campaignId: query.campaignId,
    userIds: [query.actorId, query.createdBy.value],
  });
  const actorRole = roles.get(query.actorId);
  const creatorRole = roles.get(query.createdBy.value);

  return {
    actorId: UserId.create(query.actorId),
    actorIsGameMaster: !!actorRole?.isGameMaster,
    actorIsCampaignOwner: !!actorRole?.isOwner,
    creatorIsGameMaster: !!creatorRole?.isGameMaster,
  };
}
