import { Inject, Injectable } from '@nestjs/common';
import type {
  CharacterPersonalDetailsCommandResult,
  UpdateCharacterPersonalDetailsDto as PersonalDetailsBody,
} from '@donjon-dragon/shared/character-schema';
import { CLOCK, type Clock } from '@kernel/application/clock.port';
import type { ActorId } from '@kernel/domain/actor-id';
import { UserId } from '@kernel/domain/user-id';
import { GetCampaignMembershipsUseCase } from '@modules/campaigns/application/use-cases/get-campaign-memberships.use-case';

import { hashCharacterPersonalDetails } from '../character-command-intent';
import { acceptedPersonalDetailsResult } from '../character-command-result';
import { loadCampaignCharacter, resolveAccessContext } from '../character.lookup';
import {
  CHARACTER_COMMAND_REPOSITORY,
  type CharacterCommandRepositoryPort,
} from '../ports/character-command.repository.port';
import {
  CHARACTER_REPOSITORY,
  type CharacterRepositoryPort,
} from '../ports/character.repository.port';
import type { Character } from '../../domain/character';

export type UpdateCharacterPersonalDetailsDto = PersonalDetailsBody & {
  campaignId: string;
  characterId: string;
  actorId: ActorId;
  idempotencyKey: string;
};

@Injectable()
export class UpdateCharacterPersonalDetailsUseCase {
  constructor(
    @Inject(CHARACTER_REPOSITORY) private readonly characters: CharacterRepositoryPort,
    @Inject(CHARACTER_COMMAND_REPOSITORY)
    private readonly commands: CharacterCommandRepositoryPort,
    private readonly memberships: GetCampaignMembershipsUseCase,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(
    dto: UpdateCharacterPersonalDetailsDto,
  ): Promise<CharacterPersonalDetailsCommandResult> {
    const principal = UserId.create(dto.actorId);
    const intentHash = intentHashOf(dto);
    const replay = await this.commands.findReceipt(principal, dto.idempotencyKey);
    if (replay) return acceptedPersonalDetailsResult(replay, intentHash);
    const command = await this.prepare(dto, principal, intentHash);
    return acceptedPersonalDetailsResult(await this.commands.execute(command), intentHash);
  }

  private async prepare(
    dto: UpdateCharacterPersonalDetailsDto,
    principal: UserId,
    intentHash: string,
  ) {
    const character = await loadCampaignCharacter(this.characters, dto.campaignId, dto.characterId);
    character.assertRevision(dto.expectedRevision);
    const context = await resolveAccessContext(this.memberships, accessQuery(dto, character.createdBy));
    const occurredAt = this.clock.now();
    character.updatePersonalDetails(personalDetailsOf(dto), context, occurredAt);
    const result = personalDetailsResultOf(character);
    return commandOf(dto, { principal, intentHash, occurredAt, context, character, result });
  }
}

function personalDetailsOf(dto: UpdateCharacterPersonalDetailsDto) {
  return { age: dto.age, weightKg: dto.weightKg, description: dto.description };
}

function personalDetailsResultOf(character: Character): CharacterPersonalDetailsCommandResult {
  return {
    id: character.id.value,
    revision: character.revision,
    personalDetails: personalDetailsOfIdentity(character.identity),
  };
}

function personalDetailsOfIdentity(identity: Character['identity']) {
  return { age: identity.age, weightKg: identity.weightKg, description: identity.description };
}

function intentHashOf(dto: UpdateCharacterPersonalDetailsDto): string {
  const { actorId: _actor, idempotencyKey: _key, campaignId, characterId, ...body } = dto;
  return hashCharacterPersonalDetails({ campaignId, characterId, body });
}

function accessQuery(dto: UpdateCharacterPersonalDetailsDto, createdBy: UserId) {
  return { campaignId: dto.campaignId, actorId: dto.actorId, createdBy };
}

interface CommandContext {
  principal: UserId;
  intentHash: string;
  occurredAt: Date;
  context: { actorIsGameMaster: boolean };
  character: Character;
  result: CharacterPersonalDetailsCommandResult;
}

function commandOf(dto: UpdateCharacterPersonalDetailsDto, input: CommandContext) {
  return {
    campaignId: dto.campaignId, principalId: input.principal,
    idempotencyKey: dto.idempotencyKey, intentHash: input.intentHash,
    occurredAt: input.occurredAt,
    effectiveRole: input.context.actorIsGameMaster ? 'gameMaster' as const : 'player' as const,
    action: 'character.personal-details-updated' as const,
    character: input.character, result: input.result, reason: null, buildVersion: null,
  };
}
