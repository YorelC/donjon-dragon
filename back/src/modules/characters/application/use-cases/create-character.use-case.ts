import { Inject, Injectable } from '@nestjs/common';
import type {
  AbilityScores as AbilityScoresDto,
  Character as CharacterDto,
} from '@donjon-dragon/shared/character-schema';
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
import { AbilityScores } from '../../domain/ability-scores';
import { Character, type CharacterSheet } from '../../domain/character';
import { CharacterName } from '../../domain/character-name';
import { CharacterTrait } from '../../domain/character-trait';
import { NotActiveCampaignMemberError, PlayerAlreadyHasCharacterError } from '../../domain/character.errors';
import { OwningCampaignId } from '../../domain/owning-campaign-id';

export interface CreateCharacterDto {
  campaignId: string;
  actorId: ActorId;
  name: string;
  race: string;
  characterClass: string;
  abilityScores: AbilityScoresDto;
}

@Injectable()
export class CreateCharacterUseCase {
  constructor(
    @Inject(CHARACTER_REPOSITORY)
    private readonly characterRepo: CharacterRepositoryPort,
    @Inject(CHARACTER_DIRECTORY)
    private readonly directory: CharacterDirectoryPort,
    private readonly membership: GetCampaignMembershipUseCase,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(dto: CreateCharacterDto): Promise<CharacterDto> {
    const campaignId = OwningCampaignId.create(dto.campaignId);
    const actorId = UserId.create(dto.actorId);
    const role = await this.membership.execute({
      campaignId: dto.campaignId,
      userId: dto.actorId,
    });
    if (!role.isActiveMember) throw new NotActiveCampaignMemberError();

    const now = this.clock.now();
    const character = Character.create(campaignId, sheetFrom(dto), actorId, now);
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

function sheetFrom(dto: CreateCharacterDto): CharacterSheet {
  return {
    name: CharacterName.create(dto.name),
    race: CharacterTrait.create(dto.race, 'la race'),
    characterClass: CharacterTrait.create(dto.characterClass, 'la classe'),
    abilityScores: AbilityScores.create(dto.abilityScores),
  };
}
