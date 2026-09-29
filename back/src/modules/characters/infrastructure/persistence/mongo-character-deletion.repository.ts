import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import type { Connection, Model } from 'mongoose';

import type { CharacterDeletionPort } from '../../application/ports/character-deletion.port';
import type { CharacterId } from '../../domain/character-id';
import type { CharacterDocument } from './character.mapper';
import { CHARACTER_MODEL } from './character.schema';
import type { JournalChapterDocument } from './journal-chapter.mapper';
import { JOURNAL_CHAPTER_MODEL } from './journal-chapter.schema';

@Injectable()
export class MongoCharacterDeletionRepository implements CharacterDeletionPort {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(CHARACTER_MODEL) private readonly characters: Model<CharacterDocument>,
    @InjectModel(JOURNAL_CHAPTER_MODEL) private readonly chapters: Model<JournalChapterDocument>,
  ) {}

  async deleteWithJournal(id: CharacterId): Promise<void> {
    await this.connection.transaction(async (session) => {
      await this.chapters.deleteMany({ characterId: id.value }, { session });
      await this.characters.deleteOne({ id: id.value }, { session });
    });
  }
}
