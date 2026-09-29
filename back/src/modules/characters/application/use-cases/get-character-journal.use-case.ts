import { Inject, Injectable } from '@nestjs/common';
import type { CharacterJournal } from '@donjon-dragon/shared/character-journal-schema';
import { GetCampaignMembershipUseCase } from '@modules/campaigns/application/use-cases/get-campaign-membership.use-case';

import { openJournal, type JournalQuery } from '../journal.lookup';
import { toJournalChapterSummaryDto } from '../journal-chapter.mapper';
import {
  CHARACTER_REPOSITORY,
  type CharacterRepositoryPort,
} from '../ports/character.repository.port';
import {
  JOURNAL_CHAPTER_REPOSITORY,
  type JournalChapterRepositoryPort,
} from '../ports/journal-chapter.repository.port';

/** Le sommaire du journal, sans les textes : un chapitre se lit à son ouverture. */
@Injectable()
export class GetCharacterJournalUseCase {
  constructor(
    @Inject(CHARACTER_REPOSITORY) private readonly characters: CharacterRepositoryPort,
    @Inject(JOURNAL_CHAPTER_REPOSITORY) private readonly chapters: JournalChapterRepositoryPort,
    private readonly membership: GetCampaignMembershipUseCase,
  ) {}

  async execute(query: JournalQuery): Promise<CharacterJournal> {
    const journal = await openJournal(this.lookup, query);
    const chapters = await this.chapters.listByCharacter(journal.character.id);
    return {
      chapters: chapters.map(toJournalChapterSummaryDto),
      canWrite: journal.access === 'writer',
    };
  }

  private get lookup() {
    return { characters: this.characters, membership: this.membership };
  }
}
