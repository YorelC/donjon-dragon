import { createHash } from 'crypto';
import type { CreateCharacterDto } from '@donjon-dragon/shared/character-schema';

const HASH_ALGORITHM = 'sha256';

export function hashCharacterCreation(
  campaignId: string,
  composition: CreateCharacterDto,
): string {
  return hashIntent({ type: 'character.create', campaignId, composition });
}

/**
 * Deux demandes de tirage du même joueur dans la même campagne ont la même
 * intention : c'est la clé d'idempotence, elle seule, qui les distingue.
 */
export function hashAbilityRollIssue(campaignId: string, principalKey: string): string {
  return hashIntent({ type: 'character.abilityRoll', campaignId, principalKey });
}

function hashIntent(intent: object): string {
  return createHash(HASH_ALGORITHM).update(JSON.stringify(intent)).digest('hex');
}
