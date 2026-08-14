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
import { toCharacterDtoResolved } from '../character.mapper';
import { Character } from '../../domain/character';
import { CharacterName } from '../../domain/character-name';
import {
  NotActiveCampaignMemberError,
  PlayerAlreadyHasCharacterError,
} from '../../domain/character.errors';
import { OwningCampaignId } from '../../domain/owning-campaign-id';

export interface StartCharacterDto {
  campaignId: string;
  actorId: ActorId;
  name: string;
}

/**
 * Ouvre un brouillon : un nom, et rien d'autre. Les dés se lancent ensuite, les
 * choix viennent en dernier. Le brouillon n'apparaît qu'à son créateur tant
 * qu'il n'est pas terminé.
 */
@Injectable()
export class StartCharacterUseCase {
  constructor(
    @Inject(CHARACTER_REPOSITORY)
    private readonly characterRepo: CharacterRepositoryPort,
    @Inject(CHARACTER_DIRECTORY)
    private readonly directory: CharacterDirectoryPort,
    private readonly membership: GetCampaignMembershipUseCase,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(dto: StartCharacterDto): Promise<CharacterDto> {
    const campaignId = OwningCampaignId.create(dto.campaignId);
    const actorId = UserId.create(dto.actorId);
    const role = await this.membership.execute({
      campaignId: dto.campaignId,
      userId: dto.actorId,
    });
    if (!role.isActiveMember) throw new NotActiveCampaignMemberError();

    const now = this.clock.now();
    const character = Character.start(campaignId, CharacterName.create(dto.name), actorId, now);
    if (!role.isGameMaster) {
      await this.assertNoExistingCharacter(campaignId, actorId);
      character.selfAssignToCreator(now);
    }

    await this.characterRepo.save(character);
    return toCharacterDtoResolved(this.directory, character, actorId);
  }

  private async assertNoExistingCharacter(
    campaignId: OwningCampaignId,
    playerId: UserId,
  ): Promise<void> {
    const existing = await this.characterRepo.findAssignedTo(campaignId, playerId);
    if (existing) throw new PlayerAlreadyHasCharacterError();
  }
}
