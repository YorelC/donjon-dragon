import type { UserId } from '@kernel/domain/user-id';

import type { AbilityRollSnapshot } from '../../domain/ability-roll';

export const ABILITY_ROLL_REPOSITORY = Symbol('ABILITY_ROLL_REPOSITORY');

export interface AbilityRollIssueCommand {
  campaignId: string;
  principalId: UserId;
  idempotencyKey: string;
  intentHash: string;
  occurredAt: Date;
  roll: AbilityRollSnapshot;
  totals: readonly number[];
}

export interface IssuedAbilityRoll {
  rollId: string;
  dice: number[][];
  totals: number[];
}

/**
 * Ce qu'une clé d'idempotence a déjà produit. L'empreinte d'intention voyage
 * avec le résultat : c'est elle qui distingue un vrai rejeu d'une clé réutilisée
 * pour autre chose, dans une autre campagne par exemple.
 */
export interface AbilityRollReceipt {
  intentHash: string;
  result: IssuedAbilityRoll | null;
}

/**
 * Les tirages émis, avant qu'un personnage n'existe. Ils vivent dans les reçus
 * de commande du kernel : un tirage est une commande comme une autre, avec sa
 * clé d'idempotence et son résultat rejouable.
 */
export interface AbilityRollRepositoryPort {
  issue(command: AbilityRollIssueCommand): Promise<IssuedAbilityRoll>;
  /**
   * Le reçu déjà écrit sous cette clé, s'il existe : on ne relance pas les dés
   * pour un rejeu. L'appelant compare l'empreinte avant de rendre le résultat.
   */
  findReceipt(
    principalId: UserId,
    idempotencyKey: string,
  ): Promise<AbilityRollReceipt | null>;
  /**
   * Le tirage tel qu'il a été émis, à condition qu'il appartienne bien à ce
   * joueur, dans cette campagne, et qu'aucun personnage ne l'ait déjà consommé.
   */
  findIssued(
    rollId: string,
    principalId: UserId,
    campaignId: string,
  ): Promise<AbilityRollSnapshot | null>;
}
