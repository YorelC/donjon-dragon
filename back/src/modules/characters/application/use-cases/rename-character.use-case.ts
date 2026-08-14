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
import { loadCharacter, resolveAccessContext } from '../character.lookup';
import { toCharacterDtoResolved } from '../character.mapper';
import { CharacterName } from '../../domain/character-name';

export interface RenameCharacterDto {
  characterId: string;
  campaignId: string;
  actorId: ActorId;
  name: string;
}

/**
 * Corriger un nom sans rejouer la création. `finalize` rebâtit tout le
 * personnage ; il n'a pas à être le seul chemin pour rattraper une faute de
 * frappe, et il exige un tirage qu'un brouillon tout juste ouvert n'a pas.
 */
@Injectable()
export class RenameCharacterUseCase {
  constructor(
    @Inject(CHARACTER_REPOSITORY)
    private readonly characterRepo: CharacterRepositoryPort,
    @Inject(CHARACTER_DIRECTORY)
    private readonly directory: CharacterDirectoryPort,
    private readonly membership: GetCampaignMembershipUseCase,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(dto: RenameCharacterDto): Promise<CharacterDto> {
    const character = await loadCharacter(this.characterRepo, dto.characterId);
    const context = await resolveAccessContext(
      this.membership,
      dto.campaignId,
      dto.actorId,
      character.createdBy,
    );

    character.rename(CharacterName.create(dto.name), context, this.clock.now());
    await this.characterRepo.save(character);
    return toCharacterDtoResolved(this.directory, character, UserId.create(dto.actorId));
  }
}
