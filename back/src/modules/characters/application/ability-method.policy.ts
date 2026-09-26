import type { AbilityMethod } from '../domain/ability-generation';
import { OnlyGameMasterCanSetManualAbilitiesError } from '../domain/character.errors';

const MANUAL_METHOD: AbilityMethod = 'manual';

export function assertAbilityMethodAllowed(
  method: AbilityMethod,
  actorIsGameMaster: boolean,
): void {
  if (method !== MANUAL_METHOD || actorIsGameMaster) return;
  throw new OnlyGameMasterCanSetManualAbilitiesError();
}
