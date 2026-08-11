import { Controller, Delete, Get, HttpCode, Inject, Param, Post, Put } from '@nestjs/common';
import {
  AssignCharacterSchema,
  CreateCharacterSchema,
  UpdateCharacterSchema,
  type AssignCharacterDto as AssignCharacterBody,
  type CreateCharacterDto as CreateCharacterBody,
  type UpdateCharacterDto as UpdateCharacterBody,
} from '@donjon-dragon/shared/character-schema';
import type { AuthenticatedActor } from '@kernel/domain/actor-id';

import { CurrentUser } from '@common/decorators/current-user.decorator';
import { ZodBody } from '@common/decorators/zod-validated.decorator';
import { AssignCharacterUseCase } from '../application/use-cases/assign-character.use-case';
import { CreateCharacterUseCase } from '../application/use-cases/create-character.use-case';
import { DeleteCharacterUseCase } from '../application/use-cases/delete-character.use-case';
import { ListCampaignCharactersUseCase } from '../application/use-cases/list-campaign-characters.use-case';
import { UnassignCharacterUseCase } from '../application/use-cases/unassign-character.use-case';
import { UpdateCharacterUseCase } from '../application/use-cases/update-character.use-case';

/**
 * Traduction HTTP seule. Aucun @UseGuards : JwtAuthGuard est monté en
 * APP_GUARD. Les routes vivent sous /campaigns/:campaignId/characters, jamais
 * sous /characters seul : un personnage n'existe qu'au sein d'une campagne.
 */
@Controller('campaigns/:campaignId/characters')
export class CharacterController {
  constructor(
    @Inject(ListCampaignCharactersUseCase) private list: ListCampaignCharactersUseCase,
    @Inject(CreateCharacterUseCase) private create: CreateCharacterUseCase,
    @Inject(UpdateCharacterUseCase) private update: UpdateCharacterUseCase,
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
  async createCharacter(
    @CurrentUser() user: AuthenticatedActor,
    @Param('campaignId') campaignId: string,
    @ZodBody(CreateCharacterSchema) body: CreateCharacterBody,
  ) {
    return this.create.execute({ campaignId, actorId: user.userId, ...body });
  }

  @Put(':characterId')
  async updateCharacter(
    @CurrentUser() user: AuthenticatedActor,
    @Param('campaignId') campaignId: string,
    @Param('characterId') characterId: string,
    @ZodBody(UpdateCharacterSchema) body: UpdateCharacterBody,
  ) {
    return this.update.execute({
      campaignId,
      characterId,
      actorId: user.userId,
      ...body,
    });
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
