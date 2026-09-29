import { Inject, Injectable } from '@nestjs/common';
import {
  JournalChapterCommandResultSchema,
  type JournalChapterCommandResult,
  type UpdateJournalChapterDto as UpdateJournalChapterBody,
} from '@donjon-dragon/shared/character-journal-schema';
import { CLOCK, type Clock } from '@kernel/application/clock.port';
import { UserId } from '@kernel/domain/user-id';
import { GetCampaignMembershipUseCase } from '@modules/campaigns/application/use-cases/get-campaign-membership.use-case';

import { hashJournalCommand } from '../character-command-intent';
import { loadJournalChapter, openJournal } from '../journal.lookup';
import { toJournalChapterCommandResult } from '../journal-chapter.mapper';
import {
  acceptedJournalResult,
  journalCommandOf,
  type JournalCommandRequest,
} from '../journal-command';
import {
  CHARACTER_REPOSITORY,
  type CharacterRepositoryPort,
} from '../ports/character.repository.port';
import {
  JOURNAL_CHAPTER_REPOSITORY,
  type JournalChapterRepositoryPort,
} from '../ports/journal-chapter.repository.port';
import {
  JOURNAL_COMMAND_REPOSITORY,
  type JournalCommand,
  type JournalCommandRepositoryPort,
} from '../ports/journal-command.repository.port';
import { assertJournalWriter } from '../../domain/journal-access';
import type { JournalChapter } from '../../domain/journal-chapter';

export type UpdateJournalChapterDto = UpdateJournalChapterBody & JournalCommandRequest & {
  chapterId: string;
};

const ACTION = 'journal.chapter-rewritten' as const;
const REVISION_STEP = 1;

/**
 * La sauvegarde automatique d'un chapitre. Partie d'une révision dépassée, elle
 * est refusée : l'auteur choisit alors entre sa saisie et la version enregistrée.
 */
@Injectable()
export class UpdateJournalChapterUseCase {
  constructor(
    @Inject(CHARACTER_REPOSITORY) private readonly characters: CharacterRepositoryPort,
    @Inject(JOURNAL_CHAPTER_REPOSITORY) private readonly chapters: JournalChapterRepositoryPort,
    @Inject(JOURNAL_COMMAND_REPOSITORY) private readonly commands: JournalCommandRepositoryPort,
    private readonly membership: GetCampaignMembershipUseCase,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(dto: UpdateJournalChapterDto): Promise<JournalChapterCommandResult> {
    const principalId = UserId.create(dto.actorId);
    const intentHash = intentHashOf(dto);
    const replay = await this.commands.findReceipt(principalId, dto.idempotencyKey);
    if (replay) return acceptedJournalResult(replay, intentHash, JournalChapterCommandResultSchema);
    const { command, chapter } = await this.prepare(dto, principalId, intentHash);
    const receipt = await this.commands.rewrite(command, chapter);
    return acceptedJournalResult(receipt, intentHash, JournalChapterCommandResultSchema);
  }

  private async prepare(
    dto: UpdateJournalChapterDto,
    principalId: UserId,
    intentHash: string,
  ): Promise<{ command: JournalCommand; chapter: JournalChapter }> {
    const journal = await openJournal(this.lookup, dto);
    assertJournalWriter(journal.access);
    const chapter = await loadJournalChapter(this.chapters, journal.character, dto.chapterId);
    chapter.assertRevision(dto.expectedRevision);
    const occurredAt = this.clock.now();
    chapter.rewrite({ title: dto.title, body: dto.body }, occurredAt);
    const command = journalCommandOf(dto, {
      principalId, intentHash, occurredAt, action: ACTION,
      result: toJournalChapterCommandResult(chapter),
      actorIsGameMaster: journal.actorIsGameMaster, aggregateId: chapter.id.value,
      revisionBefore: chapter.revision - REVISION_STEP, revisionAfter: chapter.revision,
    });
    return { command, chapter };
  }

  private get lookup() {
    return { characters: this.characters, membership: this.membership };
  }
}

function intentHashOf(dto: UpdateJournalChapterDto): string {
  const { title, body, expectedRevision } = dto;
  return hashJournalCommand({
    action: ACTION, campaignId: dto.campaignId, target: dto.chapterId,
    body: { characterId: dto.characterId, title, body, expectedRevision },
  });
}
