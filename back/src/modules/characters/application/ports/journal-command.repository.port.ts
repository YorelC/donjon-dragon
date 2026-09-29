import type {
  JournalChapterCommandResult,
  JournalChapterDeletionResult,
  JournalReorderResult,
} from '@donjon-dragon/shared/character-journal-schema';
import type { UserId } from '@kernel/domain/user-id';

import type { JournalChapter } from '../../domain/journal-chapter';

export const JOURNAL_COMMAND_REPOSITORY = Symbol('JOURNAL_COMMAND_REPOSITORY');

export type JournalCommandAction =
  | 'journal.chapter-created'
  | 'journal.chapter-rewritten'
  | 'journal.chapter-deleted'
  | 'journal.chapters-reordered';

export type JournalCommandResult =
  | JournalChapterCommandResult
  | JournalChapterDeletionResult
  | JournalReorderResult;

/**
 * Ce que le reçu et l'audit retiennent d'une commande du journal. Ni titre ni
 * texte : l'audit dit qui a fait quoi sur quel chapitre, jamais ce qui est écrit.
 */
export interface JournalCommand {
  campaignId: string;
  principalId: UserId;
  idempotencyKey: string;
  intentHash: string;
  occurredAt: Date;
  effectiveRole: 'gameMaster' | 'player';
  action: JournalCommandAction;
  aggregateId: string;
  revisionBefore: number | null;
  revisionAfter: number;
  result: JournalCommandResult;
}

export interface JournalCommandReceipt {
  intentHash: string;
  result: unknown;
}

/**
 * Chaque écriture est atomique avec son reçu et son audit. Une clé déjà servie
 * rend le reçu existant sans rien réécrire.
 */
export interface JournalCommandRepositoryPort {
  findReceipt(principalId: UserId, idempotencyKey: string): Promise<JournalCommandReceipt | null>;
  create(command: JournalCommand, chapter: JournalChapter): Promise<JournalCommandReceipt>;
  /** Refuse une réécriture partie d'une révision dépassée. */
  rewrite(command: JournalCommand, chapter: JournalChapter): Promise<JournalCommandReceipt>;
  remove(command: JournalCommand, chapter: JournalChapter): Promise<JournalCommandReceipt>;
  reorder(command: JournalCommand, chapters: readonly JournalChapter[]): Promise<JournalCommandReceipt>;
}
