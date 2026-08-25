import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Post,
  Put,
} from '@nestjs/common';
import {
  AssignCharacterSchema,
  CharacterIdSchema,
  FinalizeCharacterSchema,
  PreviewCharacterSheetSchema,
  UnassignCharacterSchema,
  type AssignCharacterDto as AssignCharacterBody,
  type FinalizeCharacterDto as FinalizeCharacterBody,
  type PreviewCharacterSheetDto as PreviewCharacterSheetBody,
  type UnassignCharacterDto as UnassignCharacterBody,
} from '@donjon-dragon/shared/character-schema';
import {
  CampaignIdSchema,
  IDEMPOTENCY_KEY_HEADER,
  IdempotencyKeySchema,
} from '@donjon-dragon/shared/campaign-schema';
import type { AuthenticatedActor } from '@kernel/domain/actor-id';

import { CurrentUser } from '@common/decorators/current-user.decorator';
import { ZodBody, ZodHeader, ZodParam } from '@common/decorators/zod-validated.decorator';
import { AssignCharacterUseCase } from '../application/use-cases/assign-character.use-case';
import { CreateCharacterUseCase } from '../application/use-cases/create-character.use-case';
import { DeleteCharacterUseCase } from '../application/use-cases/delete-character.use-case';
import { FinalizeCharacterUseCase } from '../application/use-cases/finalize-character.use-case';
import { GetCharacterBuildUseCase } from '../application/use-cases/get-character-build.use-case';
import { GetCharacterSheetUseCase } from '../application/use-cases/get-character-sheet.use-case';
import { ListCampaignCharactersUseCase } from '../application/use-cases/list-campaign-characters.use-case';
import { PreviewCharacterSheetUseCase } from '../application/use-cases/preview-character-sheet.use-case';
import { UnassignCharacterUseCase } from '../application/use-cases/unassign-character.use-case';

/**
 * Traduction HTTP seule. Aucun @UseGuards : JwtAuthGuard est monté en
 * APP_GUARD. Les routes vivent sous /campaigns/:campaignId/characters, jamais
 * sous /characters seul : un personnage n'existe qu'au sein d'une campagne.
 *
 * Un personnage se crée d'un coup, déjà complet : `FinalizeCharacterSchema`
 * sert de corps de requête à la fois pour `POST` (création) et `PUT`
 * (édition d'un personnage déjà créé — montée de niveau, correction).
 */
@Controller('campaigns/:campaignId/characters')
export class CharacterController {
  constructor(
    @Inject(ListCampaignCharactersUseCase) private list: ListCampaignCharactersUseCase,
    @Inject(CreateCharacterUseCase) private create: CreateCharacterUseCase,
    @Inject(FinalizeCharacterUseCase) private finalize: FinalizeCharacterUseCase,
    @Inject(PreviewCharacterSheetUseCase) private preview: PreviewCharacterSheetUseCase,
    @Inject(GetCharacterSheetUseCase) private sheet: GetCharacterSheetUseCase,
    @Inject(GetCharacterBuildUseCase) private buildDetail: GetCharacterBuildUseCase,
    @Inject(DeleteCharacterUseCase) private remove: DeleteCharacterUseCase,
    @Inject(AssignCharacterUseCase) private assign: AssignCharacterUseCase,
    @Inject(UnassignCharacterUseCase) private unassign: UnassignCharacterUseCase,
  ) {}

  @Get()
  async listCampaignCharacters(
    @CurrentUser() user: AuthenticatedActor,
    @ZodParam('campaignId', CampaignIdSchema) campaignId: string,
  ) {
    return this.list.execute({ campaignId, actorId: user.userId });
  }

  @Post()
  async createCharacter(
    @CurrentUser() user: AuthenticatedActor,
    @ZodParam('campaignId', CampaignIdSchema) campaignId: string,
    @ZodBody(FinalizeCharacterSchema) body: FinalizeCharacterBody,
  ) {
    return this.create.execute({ campaignId, actorId: user.userId, ...body });
  }

  @Put(':characterId')
  async finalizeCharacter(
    @CurrentUser() user: AuthenticatedActor,
    @ZodParam('campaignId', CampaignIdSchema) campaignId: string,
    @ZodParam('characterId', CharacterIdSchema) characterId: string,
    @ZodBody(FinalizeCharacterSchema) body: FinalizeCharacterBody,
  ) {
    return this.finalize.execute({
      campaignId,
      characterId,
      actorId: user.userId,
      ...body,
    });
  }

  @Post('sheet-preview')
  async previewSheet(
    @CurrentUser() user: AuthenticatedActor,
    @ZodParam('campaignId', CampaignIdSchema) campaignId: string,
    @ZodBody(PreviewCharacterSheetSchema) body: PreviewCharacterSheetBody,
  ) {
    return this.preview.execute({ campaignId, actorId: user.userId, ...body });
  }

  @Get(':characterId/sheet')
  async getCharacterSheet(
    @CurrentUser() user: AuthenticatedActor,
    @ZodParam('campaignId', CampaignIdSchema) campaignId: string,
    @ZodParam('characterId', CharacterIdSchema) characterId: string,
  ) {
    return this.sheet.execute({ campaignId, characterId, actorId: user.userId });
  }

  @Get(':characterId/build')
  async getCharacterBuild(
    @CurrentUser() user: AuthenticatedActor,
    @ZodParam('campaignId', CampaignIdSchema) campaignId: string,
    @ZodParam('characterId', CharacterIdSchema) characterId: string,
  ) {
    return this.buildDetail.execute({ campaignId, characterId, actorId: user.userId });
  }

  @HttpCode(204)
  @Delete(':characterId')
  async deleteCharacter(
    @CurrentUser() user: AuthenticatedActor,
    @ZodParam('campaignId', CampaignIdSchema) campaignId: string,
    @ZodParam('characterId', CharacterIdSchema) characterId: string,
  ) {
    await this.remove.execute({ campaignId, characterId, actorId: user.userId });
  }

  @Post(':characterId/assign')
  async assignCharacter(
    @CurrentUser() user: AuthenticatedActor,
    @ZodParam('campaignId', CampaignIdSchema) campaignId: string,
    @ZodParam('characterId', CharacterIdSchema) characterId: string,
    @ZodBody(AssignCharacterSchema) body: AssignCharacterBody,
    @ZodHeader(IDEMPOTENCY_KEY_HEADER, IdempotencyKeySchema)
    idempotencyKey: string,
  ) {
    return this.assign.execute({
      campaignId,
      characterId,
      actorId: user.userId,
      playerDisplayName: body.playerDisplayName,
      expectedRevision: body.expectedRevision,
      idempotencyKey,
    });
  }

  @Post(':characterId/unassign')
  async unassignCharacter(
    @CurrentUser() user: AuthenticatedActor,
    @ZodParam('campaignId', CampaignIdSchema) campaignId: string,
    @ZodParam('characterId', CharacterIdSchema) characterId: string,
    @ZodBody(UnassignCharacterSchema) body: UnassignCharacterBody,
    @ZodHeader(IDEMPOTENCY_KEY_HEADER, IdempotencyKeySchema)
    idempotencyKey: string,
  ) {
    return this.unassign.execute({
      campaignId, characterId, actorId: user.userId,
      expectedRevision: body.expectedRevision, idempotencyKey,
    });
  }
}
