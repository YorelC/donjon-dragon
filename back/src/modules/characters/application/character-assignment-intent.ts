import { createHash } from 'crypto';

const HASH_ALGORITHM = 'sha256';

export function hashCharacterAssignment(
  campaignId: string,
  characterId: string,
  displayName: string,
  expectedRevision: number,
): string {
  return hash({ type: 'character.assign', campaignId, characterId, displayName, expectedRevision });
}

export function hashCharacterUnassignment(
  campaignId: string,
  characterId: string,
  expectedRevision: number,
): string {
  return hash({ type: 'character.unassign', campaignId, characterId, expectedRevision });
}

function hash(intent: object): string {
  return createHash(HASH_ALGORITHM).update(JSON.stringify(intent)).digest('hex');
}
