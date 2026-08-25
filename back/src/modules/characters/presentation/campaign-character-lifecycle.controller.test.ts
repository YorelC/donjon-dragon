import { randomUUID } from 'crypto';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { ExecutionContext } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { Test, type TestingModule } from '@nestjs/testing';
import type { AuthenticatedActor } from '@kernel/domain/actor-id';
import { anActor } from '@kernel/testing/actor.fixture';
import { IS_PUBLIC_KEY } from '@common/decorators/public.decorator';

import { LeaveCampaignWithCharacterUseCase } from '../application/use-cases/leave-campaign-with-character.use-case';
import { ExcludeCampaignMemberWithCharacterUseCase } from '../application/use-cases/exclude-campaign-member-with-character.use-case';
import { PromoteCampaignMemberWithCharacterUseCase } from '../application/use-cases/promote-campaign-member-with-character.use-case';
import { CampaignCharacterLifecycleController } from './campaign-character-lifecycle.controller';

const mockUseCase = () => ({ execute: vi.fn() });

describe('CampaignCharacterLifecycleController', () => {
  let controller: CampaignCharacterLifecycleController;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      controllers: [CampaignCharacterLifecycleController],
      providers: [
        { provide: PromoteCampaignMemberWithCharacterUseCase, useValue: mockUseCase() },
        { provide: LeaveCampaignWithCharacterUseCase, useValue: mockUseCase() },
        { provide: ExcludeCampaignMemberWithCharacterUseCase, useValue: mockUseCase() },
      ],
    }).compile();
    controller = module.get(CampaignCharacterLifecycleController);
  });

  it('transmet promotion, révision et clé au coordinateur', async () => {
    const actor = authenticatedActor();
    const campaignId = randomUUID();
    const idempotencyKey = randomUUID();
    await controller.promoteMember(
      actor,
      campaignId,
      'Frodon',
      { expectedRevision: 2 },
      idempotencyKey,
    );
    expect(module.get(PromoteCampaignMemberWithCharacterUseCase).execute)
      .toHaveBeenCalledWith({
        campaignId,
        displayName: 'Frodon',
        expectedRevision: 2,
        actorId: actor.userId,
        idempotencyKey,
      });
  });

  it('transmet le départ atomique au coordinateur', async () => {
    const actor = authenticatedActor();
    const campaignId = randomUUID();
    const idempotencyKey = randomUUID();
    await controller.leaveCampaign(
      actor,
      campaignId,
      { successorDisplayName: 'Frodon', expectedRevision: 4 },
      idempotencyKey,
    );
    expect(module.get(LeaveCampaignWithCharacterUseCase).execute).toHaveBeenCalledWith({
      campaignId,
      successorDisplayName: 'Frodon',
      expectedRevision: 4,
      actorId: actor.userId,
      idempotencyKey,
    });
  });

  it('transmet l exclusion atomique au coordinateur', async () => {
    const actor = authenticatedActor();
    const campaignId = randomUUID();
    const idempotencyKey = randomUUID();
    await controller.excludeMember(
      actor,
      campaignId,
      'Frodon',
      { expectedRevision: 5 },
      idempotencyKey,
    );
    expect(module.get(ExcludeCampaignMemberWithCharacterUseCase).execute)
      .toHaveBeenCalledWith({
        campaignId,
        displayName: 'Frodon',
        expectedRevision: 5,
        actorId: actor.userId,
        idempotencyKey,
      });
  });
});

describe('CampaignCharacterLifecycleController — protection', () => {
  const ROUTES = ['promoteMember', 'excludeMember', 'leaveCampaign'] as const;

  it('reste fermé par défaut sur la classe et les handlers', () => {
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, CampaignCharacterLifecycleController))
      .toBeUndefined();
    ROUTES.forEach((route) => {
      const handler = CampaignCharacterLifecycleController.prototype[route];
      expect(Reflect.getMetadata(IS_PUBLIC_KEY, handler)).toBeUndefined();
    });
  });

  it.each([
    ['promoteMember', 4],
    ['excludeMember', 4],
    ['leaveCampaign', 3],
  ] as const)('valide Idempotency-Key sur %s', (route, index) => {
    const key = randomUUID();
    expect(headerFactory(route, index)(undefined, headerContext(key))).toBe(key);
    expect(() => headerFactory(route, index)(undefined, headerContext('bad'))).toThrow();
  });
});

function authenticatedActor(): AuthenticatedActor {
  return { userId: anActor(randomUUID()) };
}

interface RouteArgumentMetadata {
  index: number;
  factory?: (data: unknown, context: ExecutionContext) => unknown;
}

function headerFactory(route: string, index: number) {
  const metadata = Reflect.getMetadata(
    ROUTE_ARGS_METADATA,
    CampaignCharacterLifecycleController,
    route,
  ) as Record<string, RouteArgumentMetadata>;
  const argument = Object.values(metadata).find((item) => item.index === index);
  if (!argument?.factory) throw new Error('Missing Idempotency-Key decorator');
  return argument.factory;
}

function headerContext(value: string): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ headers: { 'idempotency-key': value } }),
    }),
  } as unknown as ExecutionContext;
}
