import { Inject, Injectable } from '@nestjs/common';
import type { CharacterAssignmentCommandResult } from '@donjon-dragon/shared/character-schema';
import { GetCampaignMembershipUseCase } from '@modules/campaigns/application/use-cases/get-campaign-membership.use-case';
import { CLOCK, type Clock } from '@kernel/application/clock.port';
import type { ActorId } from '@kernel/domain/actor-id';
import { UserId } from '@kernel/domain/user-id';

import { hashCharacterAssignment } from '../character-assignment-intent';
import { toAssignmentResult, type AssignedPlayers } from '../character-assignment.mapper';
import { indexCharacterDirectoryUsers } from '../directory-index';
import { loadCampaignCharacter } from '../character.lookup';
import {
  CHARACTER_ASSIGNMENT_REPOSITORY,
  type CharacterAssignmentCommand,
  type CharacterAssignmentFact,
  type CharacterAssignmentRepositoryPort,
  type CharacterAssignmentReceipt,
} from '../ports/character-assignment.repository.port';
import { CHARACTER_DIRECTORY, type CharacterDirectoryPort } from '../ports/character-directory.port';
import { CHARACTER_REPOSITORY, type CharacterRepositoryPort } from '../ports/character.repository.port';
import type { Character } from '../../domain/character';
import {
  AssigneeIsNotActivePlayerError,
  AssigneeNotFoundError,
  CharacterAssignedToAnotherPlayerError,
  CharacterAssignmentCommandConflictError,
  CharacterNotFoundError,
  OnlyGameMasterCanAssignError,
} from '../../domain/character.errors';
import { OwningCampaignId } from '../../domain/owning-campaign-id';

export interface AssignCharacterDto {
  characterId: string;
  campaignId: string;
  actorId: ActorId;
  playerDisplayName: string;
  expectedRevision: number;
  idempotencyKey: string;
}

interface AssignmentContext {
  dto: AssignCharacterDto;
  principalId: UserId;
  intentHash: string;
}

@Injectable()
export class AssignCharacterUseCase {
  constructor(
    @Inject(CHARACTER_REPOSITORY) private readonly characters: CharacterRepositoryPort,
    @Inject(CHARACTER_ASSIGNMENT_REPOSITORY)
    private readonly assignments: CharacterAssignmentRepositoryPort,
    @Inject(CHARACTER_DIRECTORY) private readonly directory: CharacterDirectoryPort,
    private readonly membership: GetCampaignMembershipUseCase,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(dto: AssignCharacterDto): Promise<CharacterAssignmentCommandResult> {
    const context = assignmentContext(dto);
    const replay = await this.replay(context);
    if (replay) return replay;
    const command = await this.prepare(context);
    const receipt = await this.assignments.execute(command);
    return acceptedResult(receipt, context.intentHash);
  }

  private async replay(context: AssignmentContext) {
    const receipt = await this.assignments.findReceipt(
      context.principalId, context.dto.idempotencyKey,
    );
    return receipt ? acceptedResult(receipt, context.intentHash) : null;
  }

  private async prepare(context: AssignmentContext): Promise<CharacterAssignmentCommand> {
    await this.assertActorIsGameMaster(context);
    const character = await this.incomingCharacter(context);
    const playerId = await this.resolveActivePlayer(context.dto);
    this.assertAvailableTo(character, playerId);
    const previous = await this.previousCharacter(context.dto.campaignId, playerId, character);
    const occurredAt = this.clock.now();
    if (previous) previous.unassignForCampaignTransition(occurredAt);
    character.assignTo(true, playerId, occurredAt);
    const players = await this.playersOf(character, previous);
    return command({ context, occurredAt, players }, character, previous);
  }

  /** Les deux fiches concernees en une seule lecture, pour un mapper sans I/O. */
  private playersOf(
    character: Character,
    previous: Character | null,
  ): Promise<AssignedPlayers> {
    const characters = previous ? [character, previous] : [character];
    return indexCharacterDirectoryUsers(this.directory, assignedIds(characters));
  }

  private async assertActorIsGameMaster(context: AssignmentContext): Promise<void> {
    const role = await this.membership.execute({
      campaignId: context.dto.campaignId, userId: context.principalId.value,
    });
    if (!role.isActiveMember) throw new CharacterNotFoundError();
    if (!role.isGameMaster) throw new OnlyGameMasterCanAssignError();
  }

  private async incomingCharacter(context: AssignmentContext): Promise<Character> {
    const character = await loadCampaignCharacter(
      this.characters, context.dto.campaignId, context.dto.characterId,
    );
    character.assertRevision(context.dto.expectedRevision);
    return character;
  }

  private async resolveActivePlayer(dto: AssignCharacterDto): Promise<UserId> {
    const user = await this.directory.findByDisplayName(dto.playerDisplayName);
    if (!user) throw new AssigneeNotFoundError();
    const role = await this.membership.execute({ campaignId: dto.campaignId, userId: user.id });
    if (!role.isActiveMember || role.isGameMaster) throw new AssigneeIsNotActivePlayerError();
    return UserId.create(user.id);
  }

  private assertAvailableTo(character: Character, playerId: UserId): void {
    if (character.assignedTo && !character.assignedTo.equals(playerId)) {
      throw new CharacterAssignedToAnotherPlayerError();
    }
  }

  private async previousCharacter(
    campaignId: string, playerId: UserId, incoming: Character,
  ): Promise<Character | null> {
    const previous = await this.characters.findAssignedTo(
      OwningCampaignId.create(campaignId), playerId,
    );
    return previous?.id.equals(incoming.id) ? null : previous;
  }

}

interface CommandContext {
  context: AssignmentContext;
  occurredAt: Date;
  players: AssignedPlayers;
}

function command(
  { context, occurredAt, players }: CommandContext,
  character: Character,
  previousCharacter: Character | null,
): CharacterAssignmentCommand {
  return {
    campaignId: context.dto.campaignId,
    principalId: context.principalId,
    idempotencyKey: context.dto.idempotencyKey,
    intentHash: context.intentHash,
    occurredAt,
    effectiveRole: 'gameMaster',
    character,
    previousCharacter,
    facts: assignmentFacts(previousCharacter),
    result: toAssignmentResult(players, character, previousCharacter),
  };
}

function assignedIds(characters: readonly Character[]): string[] {
  return characters.flatMap((character) =>
    character.assignedTo ? [character.assignedTo.value] : [],
  );
}

function assignmentFacts(previous: Character | null): CharacterAssignmentFact[] {
  return previous
    ? ['character.unassigned', 'character.assigned']
    : ['character.assigned'];
}

function assignmentContext(dto: AssignCharacterDto): AssignmentContext {
  return {
    dto,
    principalId: UserId.create(dto.actorId),
    intentHash: hashCharacterAssignment(
      dto.campaignId, dto.characterId, dto.playerDisplayName, dto.expectedRevision,
    ),
  };
}

function acceptedResult(
  receipt: CharacterAssignmentReceipt,
  intentHash: string,
): CharacterAssignmentCommandResult {
  if (receipt.intentHash !== intentHash || !receipt.result) {
    throw new CharacterAssignmentCommandConflictError();
  }
  return receipt.result;
}
