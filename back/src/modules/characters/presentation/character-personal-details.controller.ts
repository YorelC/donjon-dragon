import { Controller, Inject, Put } from '@nestjs/common';
import {
  CharacterIdSchema,
  UpdateCharacterPersonalDetailsSchema,
  type UpdateCharacterPersonalDetailsDto,
} from '@donjon-dragon/shared/character-schema';
import {
  CampaignIdSchema,
  IDEMPOTENCY_KEY_HEADER,
  IdempotencyKeySchema,
} from '@donjon-dragon/shared/campaign-schema';
import type { AuthenticatedActor } from '@kernel/domain/actor-id';

import { CurrentUser } from '@common/decorators/current-user.decorator';
import { ZodBody, ZodHeader, ZodParam } from '@common/decorators/zod-validated.decorator';
import { UpdateCharacterPersonalDetailsUseCase } from '../application/use-cases/update-character-personal-details.use-case';

@Controller('campaigns/:campaignId/characters/:characterId/personal-details')
export class CharacterPersonalDetailsController {
  constructor(
    @Inject(UpdateCharacterPersonalDetailsUseCase)
    private readonly update: UpdateCharacterPersonalDetailsUseCase,
  ) {}

  @Put()
  execute(
    @CurrentUser() user: AuthenticatedActor,
    @ZodParam('campaignId', CampaignIdSchema) campaignId: string,
    @ZodParam('characterId', CharacterIdSchema) characterId: string,
    @ZodBody(UpdateCharacterPersonalDetailsSchema) body: UpdateCharacterPersonalDetailsDto,
    @ZodHeader(IDEMPOTENCY_KEY_HEADER, IdempotencyKeySchema) idempotencyKey: string,
  ) {
    return this.update.execute({
      ...body, campaignId, characterId, actorId: user.userId, idempotencyKey,
    });
  }
}
