import type { CharacterReviewCommandResult } from '@donjon-dragon/shared/character-schema';

import type { Character } from '../domain/character';

export function toCharacterReviewResult(character: Character): CharacterReviewCommandResult {
  const review = character.review;
  return {
    id: character.id.value,
    revision: character.revision,
    review: {
      status: review.status,
      submittedVersion: review.submittedVersion,
      lastRejectionReason: review.lastRejectionReason,
    },
  };
}
