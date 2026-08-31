import { randomUUID } from 'crypto';
import type { UserId } from '@kernel/domain/user-id';

import type {
  AbilityRollIssueCommand,
  AbilityRollReceipt,
  AbilityRollRepositoryPort,
  IssuedAbilityRoll,
} from '../application/ports/ability-roll.repository.port';
import type { AbilityRollSnapshot } from '../domain/ability-roll';

/**
 * Les tirages émis, en mémoire. La consommation n'est pas rejouée ici : elle
 * appartient à la transaction Mongo, et c'est son test d'intégration qui la
 * prouve.
 */
export class InMemoryAbilityRollRepository implements AbilityRollRepositoryPort {
  private readonly rolls = new Map<string, AbilityRollSnapshot>();
  private readonly replays = new Map<string, AbilityRollReceipt>();

  /** Combien de fois un tirage émis a été relu : un rejeu ne doit pas le relire. */
  issuedReads = 0;

  async issue(command: AbilityRollIssueCommand): Promise<IssuedAbilityRoll> {
    const replayKey = replayKeyOf(command.principalId, command.idempotencyKey);
    const replay = this.replays.get(replayKey);
    if (replay?.result) return replay.result;

    const issued = {
      rollId: randomUUID(),
      dice: command.roll.dice.map((faces) => [...faces]),
      totals: [...command.totals],
    };
    this.store(issued.rollId, command.principalId, command.campaignId, command.roll);
    this.replays.set(replayKey, { intentHash: command.intentHash, result: issued });
    return issued;
  }

  async findReceipt(
    principalId: UserId,
    idempotencyKey: string,
  ): Promise<AbilityRollReceipt | null> {
    return this.replays.get(replayKeyOf(principalId, idempotencyKey)) ?? null;
  }

  async findIssued(
    rollId: string,
    principalId: UserId,
    campaignId: string,
  ): Promise<AbilityRollSnapshot | null> {
    this.issuedReads += 1;
    return this.rolls.get(keyOf(rollId, principalId, campaignId)) ?? null;
  }

  /**
   * Pose un reçu tel quel, y compris illisible. Un reçu écrit par une version
   * précédente, ou par une autre commande sous la même clé, arrive au use-case
   * sous cette forme : `result` à `null`, empreinte présente.
   */
  plantReceipt(
    principalId: UserId,
    idempotencyKey: string,
    receipt: AbilityRollReceipt,
  ): void {
    this.replays.set(replayKeyOf(principalId, idempotencyKey), receipt);
  }

  /** Pose un tirage déjà émis, pour les tests qui partent d'une création. */
  store(
    rollId: string,
    principalId: UserId,
    campaignId: string,
    snapshot: AbilityRollSnapshot,
  ): string {
    this.rolls.set(keyOf(rollId, principalId, campaignId), {
      dice: snapshot.dice.map((faces) => [...faces]),
    });
    return rollId;
  }
}

function replayKeyOf(principalId: UserId, idempotencyKey: string): string {
  return `${principalId.value}:${idempotencyKey}`;
}

/**
 * La clé reproduit le filtre de la requête Mongo — identité, propriétaire et
 * campagne — pour que le double ne soit jamais plus permissif que le vrai.
 */
function keyOf(rollId: string, principalId: UserId, campaignId: string): string {
  return `${rollId}:${principalId.value}:${campaignId}`;
}
