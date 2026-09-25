import {
  CharacterReviewStateError,
  InvalidRejectionReasonError,
  OnlyGameMasterCanReviewError,
} from './character.errors';

export type CharacterValidationStatus = 'draft' | 'submitted' | 'refused' | 'accepted';
export type CharacterReviewAuthority = 'gameMaster' | 'player';

export interface CharacterReviewSnapshot {
  status: CharacterValidationStatus;
  submittedVersion: number | null;
  lastSubmissionVersion: number;
  lastRejectionReason: string | null;
}

export class CharacterReview {
  private constructor(private state: CharacterReviewSnapshot) {}

  static create(): CharacterReview {
    return new CharacterReview({
      status: 'draft', submittedVersion: null,
      lastSubmissionVersion: 0, lastRejectionReason: null,
    });
  }

  static restore(snapshot?: CharacterReviewSnapshot): CharacterReview {
    return snapshot ? new CharacterReview({ ...snapshot }) : CharacterReview.create();
  }

  get status(): CharacterValidationStatus {
    return this.state.status;
  }

  assertEditable(): void {
    if (this.state.status !== 'draft' && this.state.status !== 'refused') {
      throw new CharacterReviewStateError();
    }
  }

  submit(): number {
    this.assertEditable();
    this.state.lastSubmissionVersion += 1;
    this.state.submittedVersion = this.state.lastSubmissionVersion;
    this.state.status = 'submitted';
    return this.state.lastSubmissionVersion;
  }

  accept(authority: CharacterReviewAuthority): void {
    this.assertReviewable(authority);
    this.state.status = 'accepted';
  }

  refuse(authority: CharacterReviewAuthority, reason: string): void {
    this.assertReviewable(authority);
    const normalized = reason.trim();
    if (!normalized) throw new InvalidRejectionReasonError();
    this.state.status = 'refused';
    this.state.lastRejectionReason = normalized;
  }

  snapshot(): CharacterReviewSnapshot {
    return { ...this.state };
  }

  private assertReviewable(authority: CharacterReviewAuthority): void {
    if (authority !== 'gameMaster') throw new OnlyGameMasterCanReviewError();
    if (this.state.status !== 'submitted') throw new CharacterReviewStateError();
  }
}
