import { Inject, Injectable } from '@nestjs/common';
import type { CharacterBuildDetailDto } from '@donjon-dragon/shared/character-schema';
import { GetCampaignMembershipUseCase } from '@modules/campaigns/application/use-cases/get-campaign-membership.use-case';
import type { ActorId } from '@kernel/domain/actor-id';

import {
  CHARACTER_REPOSITORY,
  type CharacterRepositoryPort,
} from '../ports/character.repository.port';
import { loadCharacter } from '../character.lookup';
import { toCharacterBuildDetailDto } from '../character-build-detail.mapper';
import { NotActiveCampaignMemberError } from '../../domain/character.errors';

export interface GetCharacterBuildDto {
  characterId: string;
  campaignId: string;
  actorId: ActorId;
}

/**
 * Le build d'un personnage déjà créé, dans la forme granulaire qu'attend le
 * wizard pour se pré-remplir en édition.
 *
 * Même lecture que la fiche : tout membre actif de la campagne peut la lire,
 * c'est l'édition — via `finalize` — qui reste restreinte, pas la
 * consultation.
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
    if (!role.isActiveMember) throw new NotActiveCampaignMemberError();

    const character = await loadCharacter(this.characterRepo, dto.characterId);

    return toCharacterBuildDetailDto(character);
  }
}
