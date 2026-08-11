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
import type { Character } from '../../domain/character';
import { AssigneeNotFoundError } from '../../domain/character.errors';
import { OwningCampaignId } from '../../domain/owning-campaign-id';

export interface AssignCharacterDto {
  characterId: string;
  campaignId: string;
  actorId: ActorId;
  playerDisplayName: string;
}

/**
 * Attribuer un personnage déjà assigné à un joueur libère l'ancien : un joueur
 * ne porte jamais deux fiches en même temps, et l'ancienne rejoint le pool.
 */
@Injectable()
export class AssignCharacterUseCase {
  constructor(
    @Inject(CHARACTER_REPOSITORY)
    private readonly characterRepo: CharacterRepositoryPort,
    @Inject(CHARACTER_DIRECTORY)
    private readonly directory: CharacterDirectoryPort,
    private readonly membership: GetCampaignMembershipUseCase,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(dto: AssignCharacterDto): Promise<CharacterDto> {
    const character = await loadCharacter(this.characterRepo, dto.characterId);
    const role = await this.membership.execute({
      campaignId: dto.campaignId,
      userId: dto.actorId,
    });
    const playerId = await this.resolvePlayerId(dto.playerDisplayName);
    const now = this.clock.now();

    await this.releasePreviousCharacter({
      campaignId: dto.campaignId,
      playerId,
      incoming: character,
      now,
      actorIsGameMaster: role.isGameMaster,
    });
    character.assignTo(role.isGameMaster, playerId, now);
    await this.characterRepo.save(character);
    return toCharacterDtoResolved(this.directory, character, UserId.create(dto.actorId));
  }

  private async resolvePlayerId(displayName: string): Promise<UserId> {
    const player = await this.directory.findByDisplayName(displayName);
    if (!player) throw new AssigneeNotFoundError();

    return UserId.create(player.id);
  }

  private async releasePreviousCharacter(params: {
    campaignId: string;
    playerId: UserId;
    incoming: Character;
    now: Date;
    actorIsGameMaster: boolean;
  }): Promise<void> {
    const previous = await this.characterRepo.findAssignedTo(
      OwningCampaignId.create(params.campaignId),
      params.playerId,
    );
    if (!previous || previous.id.equals(params.incoming.id)) return;

    previous.unassign(params.actorIsGameMaster, params.now);
    await this.characterRepo.save(previous);
  }
}
