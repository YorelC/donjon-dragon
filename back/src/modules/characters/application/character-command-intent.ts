import { createHash } from 'crypto';

import type {
  FinalizeCharacterDto,
  UpdateCharacterPersonalDetailsDto,
} from '@donjon-dragon/shared/character-schema';

import type { CharacterSnapshot } from '../domain/character';
import type { CharacterCommandAction } from './ports/character-command.repository.port';
import type { JournalCommandAction } from './ports/journal-command.repository.port';

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

/**
 * Une validation par le MJ créateur est acceptée sous l'action `character.accepted`,
 * mais son intention reste distincte : une clé rejouée d'une acceptation ne vaut pas
 * validation.
 */
export function hashCharacterValidation(intent: Omit<CharacterReviewIntent, 'action'>): string {
  return hash({ ...intent, action: 'character.validated', reason: null });
}

export interface CharacterCorrectionIntent {
  campaignId: string;
  characterId: string;
  body: FinalizeCharacterDto;
}

export function hashCharacterCorrection(intent: CharacterCorrectionIntent): string {
  return hash({ action: 'character.corrected', ...intent });
}

export interface CharacterPersonalDetailsIntent {
  campaignId: string;
  characterId: string;
  body: UpdateCharacterPersonalDetailsDto;
}

export function hashCharacterPersonalDetails(intent: CharacterPersonalDetailsIntent): string {
  return hash({ action: 'character.personal-details-updated', ...intent });
}

/**
 * `target` nomme ce que la commande vise : le chapitre, ou le personnage quand
 * elle porte sur tout le journal. Une même clé rejouée sur un autre chapitre ne
 * vaut pas la même intention.
 */
export interface JournalCommandIntent {
  action: JournalCommandAction;
  campaignId: string;
  target: string;
  body: object;
}

export function hashJournalCommand(intent: JournalCommandIntent): string {
  return hash(intent);
}

export function hashBuildVersion(snapshot: CharacterSnapshot): string {
  return hash(snapshot);
}

function hash(intent: object): string {
  return createHash(HASH_ALGORITHM).update(JSON.stringify(intent)).digest('hex');
}
