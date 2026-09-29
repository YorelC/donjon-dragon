import { InvalidDomainError } from '@kernel/domain/domain.error';
import { isUuid } from '@kernel/domain/uuid';

export class InvalidJournalChapterIdError extends InvalidDomainError {
  constructor() {
    super('Invalid journal chapter id');
  }
}

export class JournalChapterId {
  declare private readonly brand: 'JournalChapterId';

  private constructor(readonly value: string) {}

  static create(raw: string): JournalChapterId {
    if (!isUuid(raw)) throw new InvalidJournalChapterIdError();
    return new JournalChapterId(raw);
  }

  equals(other: JournalChapterId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
