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
import { loadCharacter, resolveAccessContext } from '../character.lookup';
import { toCharacterDtoResolved } from '../character.mapper';
import { AbilityScores } from '../../domain/ability-scores';
import { type CharacterSheet } from '../../domain/character';
import { CharacterName } from '../../domain/character-name';
import { CharacterTrait } from '../../domain/character-trait';

export interface UpdateCharacterDto {
  characterId: string;
  campaignId: string;
  actorId: ActorId;
  name: string;
  race: string;
  characterClass: string;
  abilityScores: AbilityScoresDto;
}

@Injectable()
export class UpdateCharacterUseCase {
  constructor(
    @Inject(CHARACTER_REPOSITORY)
    private readonly characterRepo: CharacterRepositoryPort,
    @Inject(CHARACTER_DIRECTORY)
    private readonly directory: CharacterDirectoryPort,
    private readonly membership: GetCampaignMembershipUseCase,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(dto: UpdateCharacterDto): Promise<CharacterDto> {
    const character = await loadCharacter(this.characterRepo, dto.characterId);
    const context = await resolveAccessContext(
      this.membership,
      dto.campaignId,
      dto.actorId,
      character.createdBy,
    );

    character.update(sheetFrom(dto), context, this.clock.now());
    await this.characterRepo.save(character);
    return toCharacterDtoResolved(this.directory, character, UserId.create(dto.actorId));
  }
}

function sheetFrom(dto: UpdateCharacterDto): CharacterSheet {
  return {
    name: CharacterName.create(dto.name),
    race: CharacterTrait.create(dto.race, 'la race'),
    characterClass: CharacterTrait.create(dto.characterClass, 'la classe'),
    abilityScores: AbilityScores.create(dto.abilityScores),
  };
}
