import { Inject, Injectable } from '@nestjs/common';
import type { CampaignCharacterListItem } from '@donjon-dragon/shared/character-schema';
import { GetCampaignMembershipUseCase } from '@modules/campaigns/application/use-cases/get-campaign-membership.use-case';
import type { ActorId } from '@kernel/domain/actor-id';
import { UserId } from '@kernel/domain/user-id';

import {
  CHARACTER_DIRECTORY,
  type CharacterDirectoryPort,
  type CharacterDirectoryUser,
} from '../ports/character-directory.port';
import {
  CHARACTER_REPOSITORY,
  type CharacterRepositoryPort,
} from '../ports/character.repository.port';
import { indexCharacterDirectoryUsers } from '../directory-index';
import { toCharacterListItem } from '../character-list.mapper';
import type { Character } from '../../domain/character';
import { CharacterNotFoundError } from '../../domain/character.errors';
import { OwningCampaignId } from '../../domain/owning-campaign-id';

export interface ListCampaignCharactersDto {
  campaignId: string;
  actorId: ActorId;
}

/**
 * Les personnages de la campagne sous une projection calculée pour le lecteur.
 * Les champs privés ne franchissent jamais la frontière HTTP avant filtrage.
 */
@Injectable()
export class ListCampaignCharactersUseCase {
  constructor(
    @Inject(CHARACTER_REPOSITORY)
    private readonly characterRepo: CharacterRepositoryPort,
    @Inject(CHARACTER_DIRECTORY)
    private readonly directory: CharacterDirectoryPort,
    private readonly membership: GetCampaignMembershipUseCase,
  ) {}

  /**
   * Quatre lectures quel que soit le nombre de fiches : l'adhesion, les
   * personnages, puis les joueurs assignes en un seul lot. La resolution ligne
   * par ligne coutait une lecture d'annuaire par fiche assignee.
   */
  async execute(dto: ListCampaignCharactersDto): Promise<CampaignCharacterListItem[]> {
    const role = await this.membership.execute({
      campaignId: dto.campaignId,
      userId: dto.actorId,
    });
    if (!role.isActiveMember) throw new CharacterNotFoundError();

    const characters = await this.characterRepo.findByCampaignId(
      OwningCampaignId.create(dto.campaignId),
    );
    const players = await indexCharacterDirectoryUsers(
      this.directory,
      assignedPlayerIds(characters),
    );
    const viewer = { id: UserId.create(dto.actorId), isGameMaster: role.isGameMaster };

    return characters.map((character) =>
      toCharacterListItem(character, viewer, playerOf(players, character)),
    );
  }
}

function assignedPlayerIds(characters: readonly Character[]): string[] {
  return characters.flatMap((character) =>
    character.assignedTo ? [character.assignedTo.value] : [],
  );
}

function playerOf(
  players: Map<string, CharacterDirectoryUser>,
  character: Character,
): CharacterDirectoryUser | null {
  const assignedTo = character.assignedTo;
  return assignedTo ? players.get(assignedTo.value) ?? null : null;
}
