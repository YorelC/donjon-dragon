import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import {
  AssignCharacterSchema,
  FinalizeCharacterSchema,
  PreviewCharacterSheetSchema,
  RenameCharacterSchema,
  StartCharacterSchema,
  type AssignCharacterDto as AssignCharacterBody,
  type FinalizeCharacterDto as FinalizeCharacterBody,
  type PreviewCharacterSheetDto as PreviewCharacterSheetBody,
  type RenameCharacterDto as RenameCharacterBody,
  type StartCharacterDto as StartCharacterBody,
} from '@donjon-dragon/shared/character-schema';
import type { AuthenticatedActor } from '@kernel/domain/actor-id';

import { CurrentUser } from '@common/decorators/current-user.decorator';
import { ZodBody } from '@common/decorators/zod-validated.decorator';
import { AssignCharacterUseCase } from '../application/use-cases/assign-character.use-case';
import { DeleteCharacterUseCase } from '../application/use-cases/delete-character.use-case';
import { FinalizeCharacterUseCase } from '../application/use-cases/finalize-character.use-case';
import { GetCharacterSheetUseCase } from '../application/use-cases/get-character-sheet.use-case';
import { ListCampaignCharactersUseCase } from '../application/use-cases/list-campaign-characters.use-case';
import { PreviewCharacterSheetUseCase } from '../application/use-cases/preview-character-sheet.use-case';
import { RenameCharacterUseCase } from '../application/use-cases/rename-character.use-case';
import { RollCharacterAbilitiesUseCase } from '../application/use-cases/roll-character-abilities.use-case';
import { StartCharacterUseCase } from '../application/use-cases/start-character.use-case';
import { UnassignCharacterUseCase } from '../application/use-cases/unassign-character.use-case';

/**
 * Traduction HTTP seule. Aucun @UseGuards : JwtAuthGuard est monté en
 * APP_GUARD. Les routes vivent sous /campaigns/:campaignId/characters, jamais
 * sous /characters seul : un personnage n'existe qu'au sein d'une campagne.
 *
 * La création se fait en trois temps — ouvrir un brouillon, lancer les dés,
 * rendre sa copie — parce que le tirage doit exister côté serveur avant qu'on
 * puisse vérifier la répartition qu'on en fait.
 */
@Controller('campaigns/:campaignId/characters')
export class CharacterController {
  constructor(
    @Inject(ListCampaignCharactersUseCase) private list: ListCampaignCharactersUseCase,
    @Inject(StartCharacterUseCase) private start: StartCharacterUseCase,
    @Inject(RollCharacterAbilitiesUseCase) private roll: RollCharacterAbilitiesUseCase,
    @Inject(FinalizeCharacterUseCase) private finalize: FinalizeCharacterUseCase,
    @Inject(RenameCharacterUseCase) private renameUseCase: RenameCharacterUseCase,
    @Inject(PreviewCharacterSheetUseCase) private preview: PreviewCharacterSheetUseCase,
    @Inject(GetCharacterSheetUseCase) private sheet: GetCharacterSheetUseCase,
    @Inject(DeleteCharacterUseCase) private remove: DeleteCharacterUseCase,
    @Inject(AssignCharacterUseCase) private assign: AssignCharacterUseCase,
    @Inject(UnassignCharacterUseCase) private unassign: UnassignCharacterUseCase,
  ) {}

  @Get()
  async listCampaignCharacters(
    @CurrentUser() user: AuthenticatedActor,
    @Param('campaignId') campaignId: string,
  ) {
    return this.list.execute({ campaignId, actorId: user.userId });
  }

  @Post()
  async startCharacter(
    @CurrentUser() user: AuthenticatedActor,
    @Param('campaignId') campaignId: string,
    @ZodBody(StartCharacterSchema) body: StartCharacterBody,
  ) {
    return this.start.execute({ campaignId, actorId: user.userId, ...body });
  }

  @Post(':characterId/ability-roll')
  async rollAbilities(
    @CurrentUser() user: AuthenticatedActor,
    @Param('campaignId') campaignId: string,
    @Param('characterId') characterId: string,
  ) {
    return this.roll.execute({ campaignId, characterId, actorId: user.userId });
  }

  @Put(':characterId')
  async finalizeCharacter(
    @CurrentUser() user: AuthenticatedActor,
    @Param('campaignId') campaignId: string,
    @Param('characterId') characterId: string,
    @ZodBody(FinalizeCharacterSchema) body: FinalizeCharacterBody,
  ) {
    return this.finalize.execute({
      campaignId,
      characterId,
      actorId: user.userId,
      ...body,
    });
  }

  @Patch(':characterId')
  async renameCharacter(
    @CurrentUser() user: AuthenticatedActor,
    @Param('campaignId') campaignId: string,
    @Param('characterId') characterId: string,
    @ZodBody(RenameCharacterSchema) body: RenameCharacterBody,
  ) {
    return this.renameUseCase.execute({
      campaignId,
      characterId,
      actorId: user.userId,
      ...body,
    });
  }

  @Post('sheet-preview')
  async previewSheet(
    @CurrentUser() user: AuthenticatedActor,
    @Param('campaignId') campaignId: string,
    @ZodBody(PreviewCharacterSheetSchema) body: PreviewCharacterSheetBody,
  ) {
    return this.preview.execute({ campaignId, actorId: user.userId, ...body });
  }

  @Get(':characterId/sheet')
  async getCharacterSheet(
    @CurrentUser() user: AuthenticatedActor,
    @Param('campaignId') campaignId: string,
    @Param('characterId') characterId: string,
  ) {
    return this.sheet.execute({ campaignId, characterId, actorId: user.userId });
  }

  @HttpCode(204)
  @Delete(':characterId')
  async deleteCharacter(
    @CurrentUser() user: AuthenticatedActor,
    @Param('campaignId') campaignId: string,
    @Param('characterId') characterId: string,
  ) {
    await this.remove.execute({ campaignId, characterId, actorId: user.userId });
  }

  @Post(':characterId/assign')
  async assignCharacter(
    @CurrentUser() user: AuthenticatedActor,
    @Param('campaignId') campaignId: string,
    @Param('characterId') characterId: string,
    @ZodBody(AssignCharacterSchema) body: AssignCharacterBody,
  ) {
    return this.assign.execute({
      campaignId,
      characterId,
      actorId: user.userId,
      playerDisplayName: body.playerDisplayName,
    });
  }

  @Post(':characterId/unassign')
  async unassignCharacter(
    @CurrentUser() user: AuthenticatedActor,
    @Param('campaignId') campaignId: string,
    @Param('characterId') characterId: string,
  ) {
    return this.unassign.execute({ campaignId, characterId, actorId: user.userId });
  }
}
