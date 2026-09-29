import { Inject, Injectable } from '@nestjs/common';
import {
  JournalReorderResultSchema,
  type JournalReorderResult,
  type ReorderJournalChaptersDto as ReorderJournalChaptersBody,
} from '@donjon-dragon/shared/character-journal-schema';
import { CLOCK, type Clock } from '@kernel/application/clock.port';
import { UserId } from '@kernel/domain/user-id';
import { GetCampaignMembershipUseCase } from '@modules/campaigns/application/use-cases/get-campaign-membership.use-case';

import { hashJournalCommand } from '../character-command-intent';
import { openJournal } from '../journal.lookup';
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
import type { Character } from '../../domain/character';
import { assertJournalWriter } from '../../domain/journal-access';
import { reorderChapters, type JournalChapter } from '../../domain/journal-chapter';
import { JournalChapterId } from '../../domain/journal-chapter-id';

export type ReorderJournalChaptersDto = ReorderJournalChaptersBody & JournalCommandRequest;

const ACTION = 'journal.chapters-reordered' as const;

/**
 * Le journal n'a pas de révision propre : l'audit date l'ordre sous la révision
 * du personnage, qu'il ne change pas.
 */
@Injectable()
export class ReorderJournalChaptersUseCase {
  constructor(
    @Inject(CHARACTER_REPOSITORY) private readonly characters: CharacterRepositoryPort,
    @Inject(JOURNAL_CHAPTER_REPOSITORY) private readonly chapters: JournalChapterRepositoryPort,
    @Inject(JOURNAL_COMMAND_REPOSITORY) private readonly commands: JournalCommandRepositoryPort,
    private readonly membership: GetCampaignMembershipUseCase,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(dto: ReorderJournalChaptersDto): Promise<JournalReorderResult> {
    const principalId = UserId.create(dto.actorId);
    const intentHash = intentHashOf(dto);
    const replay = await this.commands.findReceipt(principalId, dto.idempotencyKey);
    if (replay) return acceptedJournalResult(replay, intentHash, JournalReorderResultSchema);
    const journal = await openJournal(this.lookup, dto);
    assertJournalWriter(journal.access);
    const ordered = await this.reorder(journal.character, dto.chapterIds);
    const command = journalCommandOf(dto, {
      principalId, intentHash, occurredAt: this.clock.now(), action: ACTION,
      result: { chapterIds: dto.chapterIds },
      actorIsGameMaster: journal.actorIsGameMaster, aggregateId: journal.character.id.value,
      revisionBefore: journal.character.revision, revisionAfter: journal.character.revision,
    });
    const receipt = await this.commands.reorder(command, ordered);
    return acceptedJournalResult(receipt, intentHash, JournalReorderResultSchema);
  }

  private async reorder(character: Character, chapterIds: string[]): Promise<JournalChapter[]> {
    const chapters = await this.chapters.listByCharacter(character.id);
    return reorderChapters(chapters, chapterIds.map((id) => JournalChapterId.create(id)));
  }

  private get lookup() {
    return { characters: this.characters, membership: this.membership };
  }
}

function intentHashOf(dto: ReorderJournalChaptersDto): string {
  return hashJournalCommand({
    action: ACTION, campaignId: dto.campaignId, target: dto.characterId,
    body: { chapterIds: dto.chapterIds },
  });
}
