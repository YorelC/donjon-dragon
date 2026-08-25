import type { CampaignMutationParticipantRequest } from '@modules/campaigns/application/campaign-lifecycle-participant';

import type { CharacterRepositoryPort } from '../ports/character.repository.port';
import { OwningCampaignId } from '../../domain/owning-campaign-id';

export async function unassignCampaignMember(
  characters: CharacterRepositoryPort,
  request: CampaignMutationParticipantRequest,
): Promise<string[]> {
  const campaignId = OwningCampaignId.create(request.campaignId);
  const character = await characters.findAssignedToInTransaction(
    campaignId,
    request.userId,
    request.transaction.handle,
  );
  if (!character) return [];
  character.unassignForCampaignTransition(request.occurredAt);
  await characters.saveInTransaction(character, request.transaction.handle);
  return [character.id.value];
}
