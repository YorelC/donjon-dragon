import { randomUUID } from 'crypto';
import { describe, expect, it, vi } from 'vitest';
import type { ClientSession, Connection, Model } from 'mongoose';
import type { CommandReceiptDocument } from '@kernel/infrastructure/command-receipt.schema';
import type { FunctionalAuditEntryDocument } from '@kernel/infrastructure/functional-audit-entry.schema';
import { UserId } from '@kernel/domain/user-id';
import { TEST_INSTANT } from '@kernel/testing/fixed-clock';

import type { JournalCommand } from '../../application/ports/journal-command.repository.port';
import { CharacterId } from '../../domain/character-id';
import { JournalChapter } from '../../domain/journal-chapter';
import { JournalChapterModifiedElsewhereError } from '../../domain/journal-chapter.errors';
import { OwningCampaignId } from '../../domain/owning-campaign-id';
import type { JournalChapterDocument } from './journal-chapter.mapper';
import { MongoJournalCommandRepository } from './mongo-journal-command.repository';

describe('MongoJournalCommandRepository', () => {
  it('écrit chapitre, reçu et audit dans la même transaction', async () => {
    const fixture = journalFixture();

    await fixture.repository.create(fixture.command, fixture.chapter);

    expect(fixture.chapters.create).toHaveBeenCalledWith(
      [fixture.chapter.snapshot()], { session: fixture.session },
    );
    expect(fixture.receipts.create.mock.calls[0]?.[1]).toEqual({ session: fixture.session });
    expect(fixture.audits.create.mock.calls[0]?.[0][0]).toMatchObject({
      action: 'journal.chapter-rewritten', aggregateId: fixture.chapter.id.value,
      audiences: ['campaign-game-masters'],
    });
  });

  it('ne réécrit un chapitre que depuis la révision dont la sauvegarde est partie', async () => {
    const fixture = journalFixture();
    fixture.chapter.rewrite({ title: 'Le forgeron', body: 'il ment' }, TEST_INSTANT);

    await fixture.repository.rewrite(fixture.command, fixture.chapter);

    expect(fixture.chapters.replaceOne.mock.calls[0]?.[0]).toEqual({
      id: fixture.chapter.id.value, revision: 0,
    });
  });

  it('refuse la réécriture d’un chapitre modifié ailleurs', async () => {
    const fixture = journalFixture();
    fixture.chapters.replaceOne.mockResolvedValueOnce({ matchedCount: 0 });
    fixture.chapter.rewrite({ title: '', body: 'téléphone' }, TEST_INSTANT);

    await expect(fixture.repository.rewrite(fixture.command, fixture.chapter))
      .rejects.toThrow(JournalChapterModifiedElsewhereError);
  });

  it('ne copie ni le titre ni le texte dans le reçu ou l’audit', async () => {
    const fixture = journalFixture();
    fixture.chapter.rewrite({ title: 'Titre secret', body: 'Texte secret' }, TEST_INSTANT);

    await fixture.repository.rewrite(fixture.command, fixture.chapter);

    const written = JSON.stringify([
      fixture.receipts.create.mock.calls, fixture.audits.create.mock.calls,
    ]);
    expect(written).not.toContain('secret');
  });

  it('range un journal vide sans envoyer de lot vide à Mongo', async () => {
    const fixture = journalFixture();

    await fixture.repository.reorder(fixture.command, []);

    expect(fixture.chapters.bulkWrite).not.toHaveBeenCalled();
    expect(fixture.receipts.create).toHaveBeenCalledTimes(1);
  });

  it('rend le reçu déjà écrit sans rien réécrire', async () => {
    const fixture = journalFixture();
    fixture.receipts.findOne.mockReturnValue(leanOf({ intentHash: 'intent-hash', result: {} }));

    await fixture.repository.remove(fixture.command, fixture.chapter);

    expect(fixture.chapters.deleteOne).not.toHaveBeenCalled();
  });
});

type StoredReceipt = Pick<CommandReceiptDocument, 'intentHash' | 'result'>;

function journalFixture() {
  const session = {} as ClientSession;
  const chapters = {
    create: vi.fn(async (_docs: JournalChapterDocument[], _options?: object) => []),
    replaceOne: vi.fn(async (_filter: object, _doc: object, _options?: object) => ({ matchedCount: 1 })),
    deleteOne: vi.fn(async () => ({ deletedCount: 1 })),
    bulkWrite: vi.fn(async () => ({})),
  };
  const receipts = {
    create: vi.fn(async (_docs: CommandReceiptDocument[], _options?: object) => []),
    findOne: vi.fn(() => leanOf<StoredReceipt | null>(null)) };
  const audits = {
    create: vi.fn(async (_docs: FunctionalAuditEntryDocument[], _options?: object) => []),
  };
  const repository = new MongoJournalCommandRepository(
    transactionConnection(session),
    chapters as unknown as Model<JournalChapterDocument>,
    receipts as unknown as Model<CommandReceiptDocument>,
    audits as unknown as Model<FunctionalAuditEntryDocument>,
  );
  const chapter = JournalChapter.create({
    campaignId: OwningCampaignId.create(randomUUID()), characterId: CharacterId.create(randomUUID()),
    title: 'La taverne', position: 0, now: TEST_INSTANT,
  });
  return { repository, session, chapters, receipts, audits, chapter, command: commandFor(chapter) };
}

function commandFor(chapter: JournalChapter): JournalCommand {
  return {
    campaignId: chapter.campaignId, principalId: UserId.create(randomUUID()),
    idempotencyKey: randomUUID(), intentHash: 'intent-hash', occurredAt: TEST_INSTANT,
    effectiveRole: 'player', action: 'journal.chapter-rewritten', aggregateId: chapter.id.value,
    revisionBefore: 0, revisionAfter: 1,
    result: { id: chapter.id.value, revision: 1, updatedAt: TEST_INSTANT.toISOString() },
  };
}

function transactionConnection(session: ClientSession): Connection {
  return {
    transaction: <T>(work: (current: ClientSession) => Promise<T>) => work(session),
  } as unknown as Connection;
}

function leanOf<T>(value: T) {
  return { lean: async () => value };
}
