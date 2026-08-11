import { Inject, Injectable } from '@nestjs/common';
import type { Character as CharacterDto } from '@donjon-dragon/shared/character-schema';
import { GetCampaignMembershipUseCase } from '@modules/campaigns/application/use-cases/get-campaign-membership.use-case';
import { CLOCK, type Clock } from '@kernel/application/clock.port';
import type { ActorId } from '@kernel/domain/actor-id';
import { UserId } from '@kernel/domain/user-id';

import {
  CHARACTER_DIRECTORY,
  type CharacterDirectoryPort,
} from '../ports/character-directory.port';
import {
  CHARACTER_REPOSITORY,
  type CharacterRepositoryPort,
} from '../ports/character.repository.port';
import { loadCharacter } from '../character.lookup';
import { toCharacterDtoResolved } from '../character.mapper';

export interface UnassignCharacterDto {
  characterId: string;
  campaignId: string;
  actorId: ActorId;
}

@Injectable()
export class UnassignCharacterUseCase {
  constructor(
    @Inject(CHARACTER_REPOSITORY)
    private readonly characterRepo: CharacterRepositoryPort,
    @Inject(CHARACTER_DIRECTORY)
    private readonly directory: CharacterDirectoryPort,
    private readonly membership: GetCampaignMembershipUseCase,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(dto: UnassignCharacterDto): Promise<CharacterDto> {
    const character = await loadCharacter(this.characterRepo, dto.characterId);
    const role = await this.membership.execute({
      campaignId: dto.campaignId,
      userId: dto.actorId,
    });

    character.unassign(role.isGameMaster, this.clock.now());
    await this.characterRepo.save(character);
    return toCharacterDtoResolved(this.directory, character, UserId.create(dto.actorId));
  }
}
