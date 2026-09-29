import { Inject, Injectable } from '@nestjs/common';
import {
  JournalChapterDeletionResultSchema,
  type JournalChapterDeletionResult,
} from '@donjon-dragon/shared/character-journal-schema';
import { CLOCK, type Clock } from '@kernel/application/clock.port';
import { UserId } from '@kernel/domain/user-id';
import { GetCampaignMembershipUseCase } from '@modules/campaigns/application/use-cases/get-campaign-membership.use-case';

import { hashJournalCommand } from '../character-command-intent';
import { loadJournalChapter, openJournal } from '../journal.lookup';
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
  type JournalCommandRepositoryPort,
} from '../ports/journal-command.repository.port';
import { assertJournalWriter } from '../../domain/journal-access';

export type DeleteJournalChapterDto = JournalCommandRequest & { chapterId: string };

const ACTION = 'journal.chapter-deleted' as const;

/**
 * Définitive, après la confirmation de l'interface. Sans révision attendue :
 * l'auteur a nommé ce chapitre, pas une de ses versions.
 */
@Injectable()
export class DeleteJournalChapterUseCase {
  constructor(
    @Inject(CHARACTER_REPOSITORY) private readonly characters: CharacterRepositoryPort,
    @Inject(JOURNAL_CHAPTER_REPOSITORY) private readonly chapters: JournalChapterRepositoryPort,
    @Inject(JOURNAL_COMMAND_REPOSITORY) private readonly commands: JournalCommandRepositoryPort,
    private readonly membership: GetCampaignMembershipUseCase,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(dto: DeleteJournalChapterDto): Promise<JournalChapterDeletionResult> {
    const principalId = UserId.create(dto.actorId);
    const intentHash = intentHashOf(dto);
    const replay = await this.commands.findReceipt(principalId, dto.idempotencyKey);
    if (replay) return acceptedJournalResult(replay, intentHash, JournalChapterDeletionResultSchema);
    const journal = await openJournal(this.lookup, dto);
    assertJournalWriter(journal.access);
    const chapter = await loadJournalChapter(this.chapters, journal.character, dto.chapterId);
    const command = journalCommandOf(dto, {
      principalId, intentHash, occurredAt: this.clock.now(), action: ACTION,
      result: { id: chapter.id.value },
      actorIsGameMaster: journal.actorIsGameMaster, aggregateId: chapter.id.value,
      revisionBefore: chapter.revision, revisionAfter: chapter.revision,
    });
    const receipt = await this.commands.remove(command, chapter);
    return acceptedJournalResult(receipt, intentHash, JournalChapterDeletionResultSchema);
  }

  private get lookup() {
    return { characters: this.characters, membership: this.membership };
  }
}

function intentHashOf(dto: DeleteJournalChapterDto): string {
  return hashJournalCommand({
    action: ACTION, campaignId: dto.campaignId, target: dto.chapterId,
    body: { characterId: dto.characterId },
  });
}
