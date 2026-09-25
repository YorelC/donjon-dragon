import { createHash } from 'crypto';

import type { FinalizeCharacterDto } from '@donjon-dragon/shared/character-schema';

import type { CharacterSnapshot } from '../domain/character';
import type { CharacterCommandAction } from './ports/character-command.repository.port';

const HASH_ALGORITHM = 'sha256';

export interface CharacterReviewIntent {
  action: CharacterCommandAction;
  campaignId: string;
  characterId: string;
  expectedRevision: number;
  reason?: string | null;
}

export function hashCharacterReviewCommand(intent: CharacterReviewIntent): string {
  return hash({ ...intent, reason: intent.reason ?? null });
}

export interface CharacterCorrectionIntent {
  campaignId: string;
  characterId: string;
  body: FinalizeCharacterDto;
}

export function hashCharacterCorrection(intent: CharacterCorrectionIntent): string {
  return hash({ action: 'character.corrected', ...intent });
}

export function hashBuildVersion(snapshot: CharacterSnapshot): string {
  return hash(snapshot);
}

function hash(intent: object): string {
  return createHash(HASH_ALGORITHM).update(JSON.stringify(intent)).digest('hex');
}
