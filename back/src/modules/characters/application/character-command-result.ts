import {
  CharacterReviewCommandResultSchema,
  CharacterPersonalDetailsCommandResultSchema,
  CharacterSchema,
  type Character,
  type CharacterReviewCommandResult,
  type CharacterPersonalDetailsCommandResult,
} from '@donjon-dragon/shared/character-schema';

import {
  CharacterReviewCommandConflictError,
} from '../domain/character.errors';
import type { CharacterCommandReceipt } from './ports/character-command.repository.port';

export function acceptedReviewResult(
  receipt: CharacterCommandReceipt,
  intentHash: string,
): CharacterReviewCommandResult {
  assertMatchingIntent(receipt, intentHash);
  const parsed = CharacterReviewCommandResultSchema.safeParse(receipt.result);
  if (!parsed.success) throw new CharacterReviewCommandConflictError();
  return parsed.data;
}

export function acceptedCharacterResult(
  receipt: CharacterCommandReceipt,
  intentHash: string,
): Character {
  assertMatchingIntent(receipt, intentHash);
  const parsed = CharacterSchema.safeParse(receipt.result);
  if (!parsed.success) throw new CharacterReviewCommandConflictError();
  return parsed.data;
}

export function acceptedPersonalDetailsResult(
  receipt: CharacterCommandReceipt,
  intentHash: string,
): CharacterPersonalDetailsCommandResult {
  assertMatchingIntent(receipt, intentHash);
  const parsed = CharacterPersonalDetailsCommandResultSchema.safeParse(receipt.result);
  if (!parsed.success) throw new CharacterReviewCommandConflictError();
  return parsed.data;
}

function assertMatchingIntent(receipt: CharacterCommandReceipt, intentHash: string): void {
  if (receipt.intentHash !== intentHash) throw new CharacterReviewCommandConflictError();
}
