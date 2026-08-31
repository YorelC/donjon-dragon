import { Inject, Injectable } from '@nestjs/common';
import type {
  Character as CharacterDto,
  CreateCharacterDto as CreateCharacterBody,
} from '@donjon-dragon/shared/character-schema';
import { GetCampaignMembershipUseCase } from '@modules/campaigns/application/use-cases/get-campaign-membership.use-case';
import { CLOCK, type Clock } from '@kernel/application/clock.port';
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
import { ITEM_CATALOG, type ItemCatalogPort } from '../ports/item-catalog.port';
import {
  ABILITY_ROLL_REPOSITORY,
  type AbilityRollRepositoryPort,
} from '../ports/ability-roll.repository.port';
import { assertEquipmentIsKnown } from '../item.lookup';
import { toCharacterDto } from '../character.mapper';
import { toBuildInput } from '../character-build.mapper';
import { hashCharacterCreation } from '../character-creation-intent';
import {
  CHARACTER_CREATION_REPOSITORY,
  type CharacterCreationCommand,
  type CharacterCreationReceipt,
  type CharacterCreationRepositoryPort,
} from '../ports/character-creation.repository.port';
import { ROLL_METHOD } from '@donjon-dragon/shared/character-schema';
import { AbilityRoll } from '../../domain/ability-roll';
import { Character, type CharacterCreationInput } from '../../domain/character';
import { CharacterName } from '../../domain/character-name';
import {
  AbilitiesNotRolledError,
  AbilityRollNotExpectedError,
  AbilityRollNotIssuedError,
  NotActiveCampaignMemberError,
  PlayerAlreadyHasCharacterError,
  CharacterCreationCommandConflictError,
} from '../../domain/character.errors';
import { OwningCampaignId } from '../../domain/owning-campaign-id';

export type CreateCharacterDto = CreateCharacterBody & {
  campaignId: string;
  actorId: ActorId;
  idempotencyKey: string;
};

/**
 * Le wizard rend sa copie complète : le personnage naît déjà fini, en un seul
 * geste, jamais à moitié construit en base. Le domaine recalcule le tirage,
 * valide tous les choix et produit les dérivés sans faire confiance au client.
 */
@Injectable()
export class CreateCharacterUseCase {
  constructor(
    @Inject(CHARACTER_REPOSITORY)
    private readonly characterRepo: CharacterRepositoryPort,
    @Inject(CHARACTER_DIRECTORY)
    private readonly directory: CharacterDirectoryPort,
    @Inject(ITEM_CATALOG) private readonly itemCatalog: ItemCatalogPort,
    private readonly membership: GetCampaignMembershipUseCase,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(CHARACTER_CREATION_REPOSITORY)
    private readonly creations: CharacterCreationRepositoryPort,
    @Inject(ABILITY_ROLL_REPOSITORY)
    private readonly rolls: AbilityRollRepositoryPort,
  ) {}

  async execute(dto: CreateCharacterDto): Promise<CharacterDto> {
    const actorId = UserId.create(dto.actorId);
    const intentHash = hashCharacterCreation(dto.campaignId, compositionOf(dto));
    const replay = await this.creations.findReceipt(actorId, dto.idempotencyKey);
    if (replay) return acceptedResult(replay, intentHash);
    const command = await this.prepareCommand(dto, actorId, intentHash);
    const receipt = await this.creations.execute(command);
    return acceptedResult(receipt, intentHash);
  }

  private async prepareCommand(
    dto: CreateCharacterDto,
    actorId: UserId,
    intentHash: string,
  ): Promise<CharacterCreationCommand> {
    const campaignId = OwningCampaignId.create(dto.campaignId);
    const role = await this.membership.execute(membershipQueryOf(dto));
    if (!role.isActiveMember) throw new NotActiveCampaignMemberError();
    if (!role.isGameMaster) await this.assertNoExistingCharacter(campaignId, actorId);
    const now = this.clock.now();
    const roll = await this.issuedRoll(dto, actorId);
    const character = Character.create(
      this.creationInputFor(dto, { campaignId, createdBy: actorId, roll, now }),
    );
    await this.assertEquipment(character, dto.campaignId);
    if (!role.isGameMaster) character.selfAssignToCreator(now);
    const result = toCharacterDto(character, actorId, await this.assignedPlayer(character));
    const context = { dto, actorIsGameMaster: role.isGameMaster, intentHash, occurredAt: now };
    return creationCommand(context, character, result);
  }

  private async assertEquipment(character: Character, campaignId: string): Promise<void> {
    await assertEquipmentIsKnown(
      this.itemCatalog,
      character.build.equipment.snapshot(),
      campaignId,
    );
  }

  /** La lecture d'annuaire appartient au use-case : le mapper ne fait plus d'I/O. */
  private async assignedPlayer(character: Character): Promise<CharacterDirectoryUser | null> {
    const assignedTo = character.assignedTo;
    return assignedTo ? this.directory.findById(assignedTo.value) : null;
  }

  /**
   * Le tirage ne vient pas du corps de la requête mais des tirages émis : le
   * client ne fait que désigner celui qu'il veut, et seul un tirage à lui,
   * dans cette campagne, encore libre, est accepté.
   */
  private async issuedRoll(
    dto: CreateCharacterDto,
    actorId: UserId,
  ): Promise<AbilityRoll | null> {
    assertRollMatchesMethod(dto);
    if (!dto.abilityRollId) return null;
    const snapshot = await this.rolls.findIssued(dto.abilityRollId, actorId, dto.campaignId);
    if (!snapshot) throw new AbilityRollNotIssuedError();
    return AbilityRoll.restore(snapshot);
  }

  private creationInputFor(
    dto: CreateCharacterDto,
    origin: CreationOrigin,
  ): CharacterCreationInput {
    return {
      ...origin,
      name: CharacterName.create(dto.name),
      identity: identityOf(dto),
      build: toBuildInput(dto),
    };
  }

  private async assertNoExistingCharacter(
    campaignId: OwningCampaignId,
    playerId: UserId,
  ): Promise<void> {
    const existing = await this.characterRepo.findAssignedTo(campaignId, playerId);
    if (existing) throw new PlayerAlreadyHasCharacterError();
  }
}

/** Ce qui situe le personnage à sa naissance, hors de sa composition. */
interface CreationOrigin {
  campaignId: OwningCampaignId;
  createdBy: UserId;
  roll: AbilityRoll | null;
  now: Date;
}

interface CreationCommandContext {
  dto: CreateCharacterDto & { idempotencyKey: string };
  actorIsGameMaster: boolean;
  intentHash: string;
  occurredAt: Date;
}

function creationCommand(
  context: CreationCommandContext,
  character: Character,
  result: CharacterDto,
): CharacterCreationCommand {
  const { dto, actorIsGameMaster, intentHash, occurredAt } = context;
  return {
    campaignId: dto.campaignId,
    principalId: UserId.create(dto.actorId),
    idempotencyKey: dto.idempotencyKey,
    intentHash,
    occurredAt,
    abilityRollId: dto.abilityRollId,
    effectiveRole: actorIsGameMaster ? 'gameMaster' : 'player',
    character,
    result,
  };
}

function compositionOf(dto: CreateCharacterDto): CreateCharacterBody {
  const { campaignId: _campaignId, actorId: _actorId, idempotencyKey: _key, ...body } = dto;
  return body;
}

function membershipQueryOf(dto: CreateCharacterDto) {
  return { campaignId: dto.campaignId, userId: dto.actorId };
}

function acceptedResult(
  receipt: CharacterCreationReceipt,
  intentHash: string,
): CharacterDto {
  if (receipt.intentHash !== intentHash || !receipt.result) {
    throw new CharacterCreationCommandConflictError();
  }
  return receipt.result;
}

/**
 * Le contrat HTTP le verifie deja ; le use-case le reverifie parce qu'il doit
 * rester appelable depuis un script, ou aucun schema Zod ne passe.
 */
function assertRollMatchesMethod(dto: CreateCharacterDto): void {
  const needsRoll = dto.abilityMethod === ROLL_METHOD;
  if (needsRoll && !dto.abilityRollId) throw new AbilitiesNotRolledError();
  if (!needsRoll && dto.abilityRollId) throw new AbilityRollNotExpectedError();
}

/** L'etat civil du personnage, distinct de son build : rien ici n'est une regle. */
function identityOf(dto: CreateCharacterDto): CharacterCreationInput['identity'] {
  return {
    alignment: dto.alignment,
    age: dto.age,
    heightCm: dto.heightCm,
    weightKg: dto.weightKg,
    description: dto.description,
  };
}
