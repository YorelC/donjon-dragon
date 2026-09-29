import { Controller, Delete, Get, Inject, Post, Put } from '@nestjs/common';
import {
  CreateJournalChapterSchema,
  JournalChapterIdSchema,
  ReorderJournalChaptersSchema,
  UpdateJournalChapterSchema,
  type CreateJournalChapterDto,
  type ReorderJournalChaptersDto,
  type UpdateJournalChapterDto,
} from '@donjon-dragon/shared/character-journal-schema';
import { CharacterIdSchema } from '@donjon-dragon/shared/character-schema';
import {
  CampaignIdSchema,
  IDEMPOTENCY_KEY_HEADER,
  IdempotencyKeySchema,
} from '@donjon-dragon/shared/campaign-schema';
import type { AuthenticatedActor } from '@kernel/domain/actor-id';

import { CurrentUser } from '@common/decorators/current-user.decorator';
import { ZodBody, ZodHeader, ZodParam } from '@common/decorators/zod-validated.decorator';
import { CreateJournalChapterUseCase } from '../application/use-cases/create-journal-chapter.use-case';
import { DeleteJournalChapterUseCase } from '../application/use-cases/delete-journal-chapter.use-case';
import { GetCharacterJournalUseCase } from '../application/use-cases/get-character-journal.use-case';
import { GetJournalChapterUseCase } from '../application/use-cases/get-journal-chapter.use-case';
import { ReorderJournalChaptersUseCase } from '../application/use-cases/reorder-journal-chapters.use-case';
import { UpdateJournalChapterUseCase } from '../application/use-cases/update-journal-chapter.use-case';

/** Le journal de bord d'un personnage (spec 013). */
@Controller('campaigns/:campaignId/characters/:characterId/journal')
export class CharacterJournalController {
  constructor(
    @Inject(GetCharacterJournalUseCase) private readonly journal: GetCharacterJournalUseCase,
    @Inject(GetJournalChapterUseCase) private readonly chapter: GetJournalChapterUseCase,
    @Inject(CreateJournalChapterUseCase) private readonly create: CreateJournalChapterUseCase,
    @Inject(UpdateJournalChapterUseCase) private readonly update: UpdateJournalChapterUseCase,
    @Inject(DeleteJournalChapterUseCase) private readonly remove: DeleteJournalChapterUseCase,
    @Inject(ReorderJournalChaptersUseCase) private readonly reorder: ReorderJournalChaptersUseCase,
  ) {}

  @Get()
  getJournal(
    @CurrentUser() user: AuthenticatedActor,
    @ZodParam('campaignId', CampaignIdSchema) campaignId: string,
    @ZodParam('characterId', CharacterIdSchema) characterId: string,
  ) {
    return this.journal.execute({ campaignId, characterId, actorId: user.userId });
  }

  @Get('chapters/:chapterId')
  getChapter(
    @CurrentUser() user: AuthenticatedActor,
    @ZodParam('campaignId', CampaignIdSchema) campaignId: string,
    @ZodParam('characterId', CharacterIdSchema) characterId: string,
    @ZodParam('chapterId', JournalChapterIdSchema) chapterId: string,
  ) {
    return this.chapter.execute({ campaignId, characterId, chapterId, actorId: user.userId });
  }

  @Post('chapters')
  createChapter(
    @CurrentUser() user: AuthenticatedActor,
    @ZodParam('campaignId', CampaignIdSchema) campaignId: string,
    @ZodParam('characterId', CharacterIdSchema) characterId: string,
    @ZodBody(CreateJournalChapterSchema) body: CreateJournalChapterDto,
    @ZodHeader(IDEMPOTENCY_KEY_HEADER, IdempotencyKeySchema) idempotencyKey: string,
  ) {
    return this.create.execute({
      ...body, campaignId, characterId, actorId: user.userId, idempotencyKey,
    });
  }

  @Put('chapters/:chapterId')
  updateChapter(
    @CurrentUser() user: AuthenticatedActor,
    @ZodParam('campaignId', CampaignIdSchema) campaignId: string,
    @ZodParam('characterId', CharacterIdSchema) characterId: string,
    @ZodParam('chapterId', JournalChapterIdSchema) chapterId: string,
    @ZodBody(UpdateJournalChapterSchema) body: UpdateJournalChapterDto,
    @ZodHeader(IDEMPOTENCY_KEY_HEADER, IdempotencyKeySchema) idempotencyKey: string,
  ) {
    return this.update.execute({
      ...body, campaignId, characterId, chapterId, actorId: user.userId, idempotencyKey,
    });
  }

  @Delete('chapters/:chapterId')
  deleteChapter(
    @CurrentUser() user: AuthenticatedActor,
    @ZodParam('campaignId', CampaignIdSchema) campaignId: string,
    @ZodParam('characterId', CharacterIdSchema) characterId: string,
    @ZodParam('chapterId', JournalChapterIdSchema) chapterId: string,
    @ZodHeader(IDEMPOTENCY_KEY_HEADER, IdempotencyKeySchema) idempotencyKey: string,
  ) {
    return this.remove.execute({
      campaignId, characterId, chapterId, actorId: user.userId, idempotencyKey,
    });
  }

  @Put('order')
  reorderChapters(
    @CurrentUser() user: AuthenticatedActor,
    @ZodParam('campaignId', CampaignIdSchema) campaignId: string,
    @ZodParam('characterId', CharacterIdSchema) characterId: string,
    @ZodBody(ReorderJournalChaptersSchema) body: ReorderJournalChaptersDto,
    @ZodHeader(IDEMPOTENCY_KEY_HEADER, IdempotencyKeySchema) idempotencyKey: string,
  ) {
    return this.reorder.execute({
      ...body, campaignId, characterId, actorId: user.userId, idempotencyKey,
    });
  }
}
