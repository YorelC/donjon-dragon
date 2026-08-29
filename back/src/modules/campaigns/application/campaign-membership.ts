import { UserId } from '@kernel/domain/user-id';

import type { Campaign } from '../domain/campaign';

/**
 * Le rôle d'un utilisateur dans une campagne, tel que le lisent les use-cases.
 *
 * Ce n'est pas un use-case : c'est la projection qu'ils partagent. Elle vit dans
 * un fichier neutre plutôt que dans l'un des deux, sinon la lecture plurielle
 * importerait la lecture singulière et « un fichier = un use-case » ne voudrait
 * plus rien dire.
 */
export interface CampaignMembership {
  isActiveMember: boolean;
  isGameMaster: boolean;
  isOwner: boolean;
}

export function membershipOf(campaign: Campaign, userId: string): CampaignMembership {
  const id = UserId.create(userId);
  const member = campaign.members.find((candidate) => candidate.is(id));

  return {
    isActiveMember: !!member?.isActive(),
    isGameMaster: !!member?.isActive() && member.isGameMaster(),
    isOwner: campaign.isOwner(id),
  };
}
