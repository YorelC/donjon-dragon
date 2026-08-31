import { Inject, Injectable } from '@nestjs/common';
import type { IssuedAbilityRoll as IssuedAbilityRollDto } from '@donjon-dragon/shared/character-schema';
import { GetCampaignMembershipUseCase } from '@modules/campaigns/application/use-cases/get-campaign-membership.use-case';
import { CLOCK, type Clock } from '@kernel/application/clock.port';
import { DICE, type Dice } from '@kernel/application/dice.port';
import type { ActorId } from '@kernel/domain/actor-id';
import { UserId } from '@kernel/domain/user-id';

import {
  ABILITY_ROLL_REPOSITORY,
  type AbilityRollIssueCommand,
  type AbilityRollReceipt,
  type AbilityRollRepositoryPort,
} from '../ports/ability-roll.repository.port';
import { hashAbilityRollIssue } from '../character-creation-intent';
import {
  AbilityRoll,
  DICE_PER_ROLL,
  DIE_SIDES,
  ROLL_COUNT,
} from '../../domain/ability-roll';
import {
  AbilityRollCommandConflictError,
  NotActiveCampaignMemberError,
} from '../../domain/character.errors';

export interface RollAbilitiesDto {
  campaignId: string;
  actorId: ActorId;
  idempotencyKey: string;
}

/**
 * Le serveur lance les dés, et lui seul. Il rend le tirage avec son identité :
 * la création ne recevra plus des dés, mais la référence de ce tirage-là.
 *
 * Le joueur peut en demander autant qu'il veut — seul celui qu'il désigne à la
 * création est consommé, et un tirage consommé ne resert jamais.
 */
@Injectable()
export class RollAbilitiesUseCase {
  constructor(
    private readonly membership: GetCampaignMembershipUseCase,
    @Inject(DICE) private readonly dice: Dice,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(ABILITY_ROLL_REPOSITORY)
    private readonly rolls: AbilityRollRepositoryPort,
  ) {}

  async execute(dto: RollAbilitiesDto): Promise<IssuedAbilityRollDto> {
    const principalId = UserId.create(dto.actorId);
    const intentHash = hashAbilityRollIssue(dto.campaignId, principalId.value);
    const replay = await this.rolls.findReceipt(principalId, dto.idempotencyKey);
    if (replay) return replayedRoll(replay, intentHash);

    await this.assertActiveMember(dto);
    return this.rolls.issue(this.issueCommand(dto, principalId, intentHash));
  }

  private issueCommand(
    dto: RollAbilitiesDto,
    principalId: UserId,
    intentHash: string,
  ): AbilityRollIssueCommand {
    const roll = AbilityRoll.create(this.throwAllDice());

    return {
      campaignId: dto.campaignId,
      principalId,
      idempotencyKey: dto.idempotencyKey,
      intentHash,
      occurredAt: this.clock.now(),
      roll: roll.snapshot(),
      totals: roll.totals,
    };
  }

  private async assertActiveMember(dto: RollAbilitiesDto): Promise<void> {
    const role = await this.membership.execute({
      campaignId: dto.campaignId,
      userId: dto.actorId,
    });
    if (!role.isActiveMember) throw new NotActiveCampaignMemberError();
  }

  /** Six lancers de quatre d6, dans l'ordre où ils sortent. */
  private throwAllDice(): number[][] {
    return Array.from({ length: ROLL_COUNT }, () =>
      Array.from({ length: DICE_PER_ROLL }, () => this.dice.roll(DIE_SIDES)),
    );
  }
}

/**
 * Une clé d'idempotence appartient à une intention, pas seulement à un joueur :
 * la même clé rejouée dans une autre campagne est un conflit, jamais le tirage
 * de la première.
 */
function replayedRoll(
  receipt: AbilityRollReceipt,
  intentHash: string,
): IssuedAbilityRollDto {
  if (receipt.intentHash !== intentHash || !receipt.result) {
    throw new AbilityRollCommandConflictError();
  }
  return receipt.result;
}
