import { Controller, Inject, Post } from '@nestjs/common';
import {
  CharacterIdSchema,
  CharacterReviewCommandSchema,
  RejectCharacterSchema,
  type CharacterReviewCommand,
  type RejectCharacterDto,
} from '@donjon-dragon/shared/character-schema';
import {
  CampaignIdSchema,
  IDEMPOTENCY_KEY_HEADER,
  IdempotencyKeySchema,
} from '@donjon-dragon/shared/campaign-schema';
import type { AuthenticatedActor } from '@kernel/domain/actor-id';

import { CurrentUser } from '@common/decorators/current-user.decorator';
import { ZodBody, ZodHeader, ZodParam } from '@common/decorators/zod-validated.decorator';
import { AcceptCharacterReviewUseCase } from '../application/use-cases/accept-character-review.use-case';
import { RefuseCharacterReviewUseCase } from '../application/use-cases/refuse-character-review.use-case';
import { SubmitCharacterForReviewUseCase } from '../application/use-cases/submit-character-for-review.use-case';

@Controller('campaigns/:campaignId/characters/:characterId/review')
export class CharacterReviewController {
  constructor(
    @Inject(SubmitCharacterForReviewUseCase) private submit: SubmitCharacterForReviewUseCase,
    @Inject(AcceptCharacterReviewUseCase) private accept: AcceptCharacterReviewUseCase,
    @Inject(RefuseCharacterReviewUseCase) private refuse: RefuseCharacterReviewUseCase,
  ) {}

  @Post('submit')
  submitCharacter(
    @CurrentUser() user: AuthenticatedActor,
    @ZodParam('campaignId', CampaignIdSchema) campaignId: string,
    @ZodParam('characterId', CharacterIdSchema) characterId: string,
    @ZodBody(CharacterReviewCommandSchema) body: CharacterReviewCommand,
    @ZodHeader(IDEMPOTENCY_KEY_HEADER, IdempotencyKeySchema) idempotencyKey: string,
  ) {
    return this.submit.execute(command({ user, campaignId, characterId, body, idempotencyKey }));
  }

  @Post('accept')
  acceptCharacter(
    @CurrentUser() user: AuthenticatedActor,
    @ZodParam('campaignId', CampaignIdSchema) campaignId: string,
    @ZodParam('characterId', CharacterIdSchema) characterId: string,
    @ZodBody(CharacterReviewCommandSchema) body: CharacterReviewCommand,
    @ZodHeader(IDEMPOTENCY_KEY_HEADER, IdempotencyKeySchema) idempotencyKey: string,
  ) {
    return this.accept.execute(command({ user, campaignId, characterId, body, idempotencyKey }));
  }

  @Post('refuse')
  refuseCharacter(
    @CurrentUser() user: AuthenticatedActor,
    @ZodParam('campaignId', CampaignIdSchema) campaignId: string,
    @ZodParam('characterId', CharacterIdSchema) characterId: string,
    @ZodBody(RejectCharacterSchema) body: RejectCharacterDto,
    @ZodHeader(IDEMPOTENCY_KEY_HEADER, IdempotencyKeySchema) idempotencyKey: string,
  ) {
    return this.refuse.execute({
      ...command({ user, campaignId, characterId, body, idempotencyKey }), reason: body.reason,
    });
  }
}

interface ReviewHttpInput {
  user: AuthenticatedActor;
  campaignId: string;
  characterId: string;
  body: CharacterReviewCommand;
  idempotencyKey: string;
}

function command(input: ReviewHttpInput) {
  const { user, campaignId, characterId, body, idempotencyKey } = input;
  return {
    campaignId, characterId, actorId: user.userId,
    expectedRevision: body.expectedRevision, idempotencyKey,
  };
}
