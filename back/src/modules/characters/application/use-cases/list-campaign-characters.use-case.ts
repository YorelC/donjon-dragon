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
import type { Character } from '../../domain/character';
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
      characters
        .filter((character) => isVisibleTo(character, viewerId))
        .map((character) => toCharacterDtoResolved(this.directory, character, viewerId)),
    );
  }
}

/**
 * Un brouillon n'appartient qu'à son créateur tant qu'il n'est pas terminé : un
 * wizard abandonné à mi-parcours n'a rien à faire dans la liste de la table.
 */
function isVisibleTo(character: Character, viewerId: UserId): boolean {
  return character.isReady || character.createdBy.equals(viewerId);
}
