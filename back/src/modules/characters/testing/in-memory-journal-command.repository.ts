import type { UserId } from '@kernel/domain/user-id';

import type {
  JournalCommand,
  JournalCommandReceipt,
  JournalCommandRepositoryPort,
} from '../application/ports/journal-command.repository.port';
import { JOURNAL_REVISION_STEP, type JournalChapter } from '../domain/journal-chapter';
import { JournalChapterModifiedElsewhereError } from '../domain/journal-chapter.errors';
import type { InMemoryJournalChapterRepository } from './in-memory-journal-chapter.repository';

export class InMemoryJournalCommandRepository implements JournalCommandRepositoryPort {
  private readonly receipts = new Map<string, JournalCommandReceipt>();
  /** Ce que l'audit retiendrait : la commande entière, pour vérifier qu'elle ne porte aucun texte. */
  readonly audited: JournalCommand[] = [];

  constructor(private readonly chapters: InMemoryJournalChapterRepository) {}

  async findReceipt(
    principalId: UserId,
    idempotencyKey: string,
  ): Promise<JournalCommandReceipt | null> {
    return this.receipts.get(receiptKey(principalId, idempotencyKey)) ?? null;
  }

  create(command: JournalCommand, chapter: JournalChapter): Promise<JournalCommandReceipt> {
    return this.run(command, () => this.chapters.save(chapter));
  }

  rewrite(command: JournalCommand, chapter: JournalChapter): Promise<JournalCommandReceipt> {
    return this.run(command, () => {
      const stored = this.chapters.revisionOf(chapter.id);
      if (stored !== chapter.revision - JOURNAL_REVISION_STEP) throw new JournalChapterModifiedElsewhereError();
      this.chapters.save(chapter);
    });
  }

  remove(command: JournalCommand, chapter: JournalChapter): Promise<JournalCommandReceipt> {
    return this.run(command, () => this.chapters.delete(chapter.id));
  }

  reorder(
    command: JournalCommand,
    chapters: readonly JournalChapter[],
  ): Promise<JournalCommandReceipt> {
    return this.run(command, () => chapters.forEach((chapter) => this.chapters.save(chapter)));
  }

  private async run(command: JournalCommand, write: () => void): Promise<JournalCommandReceipt> {
    const existing = await this.findReceipt(command.principalId, command.idempotencyKey);
    if (existing) return existing;
    write();
    const receipt = { intentHash: command.intentHash, result: command.result };
    this.receipts.set(receiptKey(command.principalId, command.idempotencyKey), receipt);
    this.audited.push(command);
    return receipt;
  }
}

function receiptKey(principalId: UserId, idempotencyKey: string): string {
  return `${principalId.value}:${idempotencyKey}`;
}
