import { Inject, Injectable } from '@nestjs/common';
import type { JournalChapter } from '@donjon-dragon/shared/character-journal-schema';
import { GetCampaignMembershipUseCase } from '@modules/campaigns/application/use-cases/get-campaign-membership.use-case';

import { loadJournalChapter, openJournal, type JournalQuery } from '../journal.lookup';
import { toJournalChapterDto } from '../journal-chapter.mapper';
import {
  CHARACTER_REPOSITORY,
  type CharacterRepositoryPort,
} from '../ports/character.repository.port';
import {
  JOURNAL_CHAPTER_REPOSITORY,
  type JournalChapterRepositoryPort,
} from '../ports/journal-chapter.repository.port';

export interface GetJournalChapterDto extends JournalQuery {
  chapterId: string;
}

@Injectable()
export class GetJournalChapterUseCase {
  constructor(
    @Inject(CHARACTER_REPOSITORY) private readonly characters: CharacterRepositoryPort,
    @Inject(JOURNAL_CHAPTER_REPOSITORY) private readonly chapters: JournalChapterRepositoryPort,
    private readonly membership: GetCampaignMembershipUseCase,
  ) {}

  async execute(dto: GetJournalChapterDto): Promise<JournalChapter> {
    const journal = await openJournal(this.lookup, dto);
    const chapter = await loadJournalChapter(this.chapters, journal.character, dto.chapterId);
    return toJournalChapterDto(chapter);
  }

  private get lookup() {
    return { characters: this.characters, membership: this.membership };
  }
}
