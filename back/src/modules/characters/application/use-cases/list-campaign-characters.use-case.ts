import { Inject, Injectable } from '@nestjs/common';
import type { Character as CharacterDto } from '@donjon-dragon/shared/character-schema';
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
import { OwningCampaignId } from '../../domain/owning-campaign-id';

export interface ListCampaignCharactersDto {
  campaignId: string;
  actorId: ActorId;
}

@Injectable()
export class ListCampaignCharactersUseCase {
  constructor(
    @Inject(CHARACTER_REPOSITORY)
    private readonly characterRepo: CharacterRepositoryPort,
    @Inject(CHARACTER_DIRECTORY)
    private readonly directory: CharacterDirectoryPort,
  ) {}

  async execute(dto: ListCampaignCharactersDto): Promise<CharacterDto[]> {
    const viewerId = UserId.create(dto.actorId);
    const characters = await this.characterRepo.findByCampaignId(
      OwningCampaignId.create(dto.campaignId),
    );

    return Promise.all(
      characters.map((character) => toCharacterDtoResolved(this.directory, character, viewerId)),
    );
  }
}
