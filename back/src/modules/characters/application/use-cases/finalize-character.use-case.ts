import { Inject, Injectable } from '@nestjs/common';
import type {
  Character as CharacterDto,
  FinalizeCharacterDto as FinalizeCharacterBody,
} from '@donjon-dragon/shared/character-schema';
import { GetCampaignMembershipsUseCase } from '@modules/campaigns/application/use-cases/get-campaign-memberships.use-case';
import { CLOCK, type Clock } from '@kernel/application/clock.port';
import type { ActorId } from '@kernel/domain/actor-id';
import { UserId } from '@kernel/domain/user-id';

import { hashCharacterCorrection } from '../character-command-intent';
import { acceptedCharacterResult } from '../character-command-result';
import { toBuildInput } from '../character-build.mapper';
import { loadCampaignCharacter, resolveAccessContext } from '../character.lookup';
import { toCharacterDto } from '../character.mapper';
import { assertEquipmentIsKnown } from '../item.lookup';
import {
  CHARACTER_COMMAND_REPOSITORY,
  type CharacterCommand,
  type CharacterCommandRepositoryPort,
} from '../ports/character-command.repository.port';
import {
  CHARACTER_DIRECTORY,
  type CharacterDirectoryPort,
  type CharacterDirectoryUser,
} from '../ports/character-directory.port';
import { CHARACTER_REPOSITORY, type CharacterRepositoryPort } from '../ports/character.repository.port';
import { ITEM_CATALOG, type ItemCatalogPort } from '../ports/item-catalog.port';
import type { Character, CharacterAccessContext } from '../../domain/character';
import { CharacterName } from '../../domain/character-name';
import { AbilityRollNotEditableError } from '../../domain/character.errors';

export type FinalizeCharacterDto = FinalizeCharacterBody & {
  characterId: string;
  campaignId: string;
  actorId: ActorId;
  idempotencyKey: string;
};

interface WizardOutput {
  dto: FinalizeCharacterDto;
  context: CharacterAccessContext;
  now: Date;
}

@Injectable()
export class FinalizeCharacterUseCase {
  constructor(
    @Inject(CHARACTER_REPOSITORY) private readonly characters: CharacterRepositoryPort,
    @Inject(CHARACTER_COMMAND_REPOSITORY)
    private readonly commands: CharacterCommandRepositoryPort,
    @Inject(CHARACTER_DIRECTORY) private readonly directory: CharacterDirectoryPort,
    @Inject(ITEM_CATALOG) private readonly itemCatalog: ItemCatalogPort,
    private readonly memberships: GetCampaignMembershipsUseCase,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(dto: FinalizeCharacterDto): Promise<CharacterDto> {
    const principal = UserId.create(dto.actorId);
    const intentHash = correctionIntent(dto);
    const replay = await this.commands.findReceipt(principal, dto.idempotencyKey);
    if (replay) return acceptedCharacterResult(replay, intentHash);
    const command = await this.prepare(dto, principal, intentHash);
    return acceptedCharacterResult(await this.commands.execute(command), intentHash);
  }

  private async prepare(
    dto: FinalizeCharacterDto,
    principal: UserId,
    intentHash: string,
  ): Promise<CharacterCommand> {
    const character = await loadCampaignCharacter(this.characters, dto.campaignId, dto.characterId);
    character.assertRevision(dto.expectedRevision);
    const context = await this.accessContext(dto, character);
    const occurredAt = this.clock.now();
    this.applyWizardOutput(character, { dto, context, now: occurredAt });
    await assertEquipmentIsKnown(this.itemCatalog, character.build.equipment.snapshot(), dto.campaignId);
    const assignedPlayer = await this.assignedPlayer(character);
    const result = toCharacterDto(character, principal, assignedPlayer);
    return commandOf({ dto, principal, intentHash, occurredAt, context, character, result });
  }

  private accessContext(
    dto: FinalizeCharacterDto,
    character: Character,
  ): Promise<CharacterAccessContext> {
    return resolveAccessContext(this.memberships, {
      campaignId: dto.campaignId, actorId: dto.actorId, createdBy: character.createdBy,
    });
  }

  private assignedPlayer(character: Character): Promise<CharacterDirectoryUser | null> {
    const assignedTo = character.assignedTo;
    return assignedTo ? this.directory.findById(assignedTo.value) : Promise.resolve(null);
  }

  private applyWizardOutput(character: Character, output: WizardOutput): void {
    const { dto, context, now } = output;
    if (dto.abilityRollId) throw new AbilityRollNotEditableError();
    character.revise({
      name: CharacterName.create(dto.name), identity: identityOf(dto), build: toBuildInput(dto),
    }, context, now);
  }
}

interface CorrectionCommandInput {
  dto: FinalizeCharacterDto;
  principal: UserId;
  intentHash: string;
  occurredAt: Date;
  context: CharacterAccessContext;
  character: Character;
  result: CharacterDto;
}

function commandOf(input: CorrectionCommandInput): CharacterCommand {
  const { dto, principal, intentHash, occurredAt, context, character, result } = input;
  return {
    campaignId: dto.campaignId, principalId: principal, idempotencyKey: dto.idempotencyKey,
    intentHash, occurredAt, effectiveRole: context.actorIsGameMaster ? 'gameMaster' : 'player',
    action: 'character.corrected', character, result, reason: null, buildVersion: null,
  };
}

function identityOf(dto: FinalizeCharacterDto) {
  return {
    alignment: dto.alignment, age: dto.age, heightCm: dto.heightCm,
    weightKg: dto.weightKg, description: dto.description,
  };
}

function correctionIntent(dto: FinalizeCharacterDto): string {
  const { actorId: _actorId, idempotencyKey: _key, campaignId, characterId, ...body } = dto;
  return hashCharacterCorrection({ campaignId, characterId, body });
}
