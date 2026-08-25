import { Inject, Injectable } from '@nestjs/common';
import type { CharacterBuildDetailDto } from '@donjon-dragon/shared/character-schema';
import { GetCampaignMembershipUseCase } from '@modules/campaigns/application/use-cases/get-campaign-membership.use-case';
import type { ActorId } from '@kernel/domain/actor-id';
import { UserId } from '@kernel/domain/user-id';

import {
  CHARACTER_REPOSITORY,
  type CharacterRepositoryPort,
} from '../ports/character.repository.port';
import { loadCampaignCharacter } from '../character.lookup';
import { toCharacterBuildDetailDto } from '../character-build-detail.mapper';
import { CharacterNotFoundError } from '../../domain/character.errors';

export interface GetCharacterBuildDto {
  characterId: string;
  campaignId: string;
  actorId: ActorId;
}

/**
 * Le build d'un personnage déjà créé, dans la forme granulaire qu'attend le
 * wizard pour se pré-remplir en édition.
 *
 * Même audience privée que la fiche : joueur assigné ou MJ actif seulement.
 */
@Injectable()
export class GetCharacterBuildUseCase {
  constructor(
    @Inject(CHARACTER_REPOSITORY)
    private readonly characterRepo: CharacterRepositoryPort,
    private readonly membership: GetCampaignMembershipUseCase,
  ) {}

  async execute(dto: GetCharacterBuildDto): Promise<CharacterBuildDetailDto> {
    const role = await this.membership.execute({
      campaignId: dto.campaignId,
      userId: dto.actorId,
    });
    if (!role.isActiveMember) throw new CharacterNotFoundError();
    const character = await loadCampaignCharacter(
      this.characterRepo, dto.campaignId, dto.characterId,
    );
    const assignedToActor = character.assignedTo?.equals(UserId.create(dto.actorId));
    if (!role.isGameMaster && !assignedToActor) throw new CharacterNotFoundError();

    return toCharacterBuildDetailDto(character);
  }
}
