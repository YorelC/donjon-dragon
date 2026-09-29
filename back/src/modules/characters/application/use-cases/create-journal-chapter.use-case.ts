import { Inject, Injectable } from '@nestjs/common';
import {
  CHARACTER_JOURNAL_RULES,
  JournalChapterCommandResultSchema,
  type CreateJournalChapterDto as CreateJournalChapterBody,
  type JournalChapterCommandResult,
} from '@donjon-dragon/shared/character-journal-schema';
import { CLOCK, type Clock } from '@kernel/application/clock.port';
import { UserId } from '@kernel/domain/user-id';
import { GetCampaignMembershipUseCase } from '@modules/campaigns/application/use-cases/get-campaign-membership.use-case';

import { hashJournalCommand } from '../character-command-intent';
import { openJournal, type OpenedJournal } from '../journal.lookup';
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
  type JournalCommandRepositoryPort,
} from '../ports/journal-command.repository.port';
import { assertJournalWriter } from '../../domain/journal-access';
import { assertRoomForChapter, JournalChapter } from '../../domain/journal-chapter';

export type CreateJournalChapterDto = CreateJournalChapterBody & JournalCommandRequest;

const ACTION = 'journal.chapter-created' as const;
const FIRST_POSITION = 0;
const NEXT_POSITION = 1;

/** Un chapitre vide, ajouté en dernier dans le journal. */
@Injectable()
export class CreateJournalChapterUseCase {
  constructor(
    @Inject(CHARACTER_REPOSITORY) private readonly characters: CharacterRepositoryPort,
    @Inject(JOURNAL_CHAPTER_REPOSITORY) private readonly chapters: JournalChapterRepositoryPort,
    @Inject(JOURNAL_COMMAND_REPOSITORY) private readonly commands: JournalCommandRepositoryPort,
    private readonly membership: GetCampaignMembershipUseCase,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(dto: CreateJournalChapterDto): Promise<JournalChapterCommandResult> {
    const principalId = UserId.create(dto.actorId);
    const intentHash = intentHashOf(dto);
    const replay = await this.commands.findReceipt(principalId, dto.idempotencyKey);
    if (replay) return acceptedJournalResult(replay, intentHash, JournalChapterCommandResultSchema);
    const journal = await openJournal(this.lookup, dto);
    assertJournalWriter(journal.access);
    const occurredAt = this.clock.now();
    const chapter = await this.appendChapter(journal, dto.title, occurredAt);
    const result = toJournalChapterCommandResult(chapter);
    const command = journalCommandOf(dto, {
      principalId, intentHash, occurredAt, action: ACTION, result,
      actorIsGameMaster: journal.actorIsGameMaster, aggregateId: chapter.id.value,
      revisionBefore: null, revisionAfter: chapter.revision,
    });
    const receipt = await this.commands.create(command, chapter);
    return acceptedJournalResult(receipt, intentHash, JournalChapterCommandResultSchema);
  }

  private async appendChapter(
    journal: OpenedJournal,
    title: string,
    now: Date,
  ): Promise<JournalChapter> {
    const existing = await this.chapters.listByCharacter(journal.character.id);
    assertRoomForChapter(existing.length, CHARACTER_JOURNAL_RULES.maxChapters);
    const last = existing.at(-1);
    return JournalChapter.create({
      campaignId: journal.character.campaignId, characterId: journal.character.id,
      title, now, position: last ? last.position + NEXT_POSITION : FIRST_POSITION,
    });
  }

  private get lookup() {
    return { characters: this.characters, membership: this.membership };
  }
}

function intentHashOf(dto: CreateJournalChapterDto): string {
  return hashJournalCommand({
    action: ACTION, campaignId: dto.campaignId, target: dto.characterId, body: { title: dto.title },
  });
}
