import { randomUUID } from 'crypto';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, type TestingModule } from '@nestjs/testing';
import type { ExecutionContext } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import type { AuthenticatedActor } from '@kernel/domain/actor-id';
import { anActor } from '@kernel/testing/actor.fixture';
import { IS_PUBLIC_KEY } from '@common/decorators/public.decorator';

import { AcceptCampaignInvitationUseCase } from '../application/use-cases/accept-campaign-invitation.use-case';
import { CancelCampaignInvitationUseCase } from '../application/use-cases/cancel-campaign-invitation.use-case';
import { CountCampaignInvitationsUseCase } from '../application/use-cases/count-campaign-invitations.use-case';
import { CreateCampaignUseCase } from '../application/use-cases/create-campaign.use-case';
import { DeleteCampaignUseCase } from '../application/use-cases/delete-campaign.use-case';
import { DemoteCampaignMemberUseCase } from '../application/use-cases/demote-campaign-member.use-case';
import { GetCampaignDetailUseCase } from '../application/use-cases/get-campaign-detail.use-case';
import { InviteToCampaignUseCase } from '../application/use-cases/invite-to-campaign.use-case';
import { ListCampaignInvitationsUseCase } from '../application/use-cases/list-campaign-invitations.use-case';
import { ListMyCampaignsUseCase } from '../application/use-cases/list-my-campaigns.use-case';
import { RefuseCampaignInvitationUseCase } from '../application/use-cases/refuse-campaign-invitation.use-case';
import { TransferCampaignOwnershipUseCase } from '../application/use-cases/transfer-campaign-ownership.use-case';
import { CampaignController } from './campaign.controller';

const mockUseCase = (): { execute: ReturnType<typeof vi.fn> } => ({
  execute: vi.fn(),
});

const user = (userId: string): AuthenticatedActor => ({ userId: anActor(userId) });

const aSummary = () => ({
  id: randomUUID(),
  name: 'La Malédiction de Strahd',
  myRole: 'gameMaster' as const,
  isOwner: true,
  gameMasterCount: 1,
  playerCount: 0,
});

const USE_CASES = [
  CreateCampaignUseCase,
  ListMyCampaignsUseCase,
  ListCampaignInvitationsUseCase,
  CountCampaignInvitationsUseCase,
  GetCampaignDetailUseCase,
  InviteToCampaignUseCase,
  AcceptCampaignInvitationUseCase,
  RefuseCampaignInvitationUseCase,
  CancelCampaignInvitationUseCase,
  DemoteCampaignMemberUseCase,
  TransferCampaignOwnershipUseCase,
  DeleteCampaignUseCase,
];

describe('CampaignController', () => {
  let controller: CampaignController;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      controllers: [CampaignController],
      providers: USE_CASES.map((useCase) => ({
        provide: useCase,
        useValue: mockUseCase(),
      })),
    }).compile();

    controller = module.get<CampaignController>(CampaignController);
  });

  it('crée la campagne au nom de l APPELANT, jamais d un id reçu du client', async () => {
    const caller = user(randomUUID());
    const idempotencyKey = randomUUID();
    const createCampaign = module.get(CreateCampaignUseCase);
    vi.mocked(createCampaign.execute).mockResolvedValue(aSummary());

    await controller.createCampaign(
      caller,
      { name: 'La Malédiction de Strahd' },
      idempotencyKey,
    );

    expect(createCampaign.execute).toHaveBeenCalledWith({
      name: 'La Malédiction de Strahd',
      founderId: caller.userId,
      idempotencyKey,
    });
  });

  it('liste les campagnes de l appelant', async () => {
    const caller = user(randomUUID());
    const summaries = [aSummary()];
    const listMyCampaigns = module.get(ListMyCampaignsUseCase);
    vi.mocked(listMyCampaigns.execute).mockResolvedValue(summaries);

    expect(await controller.listMyCampaigns(caller)).toBe(summaries);
    expect(listMyCampaigns.execute).toHaveBeenCalledWith({ userId: caller.userId });
  });

  it('liste les invitations reçues par l appelant', async () => {
    const caller = user(randomUUID());
    const listInvitations = module.get(ListCampaignInvitationsUseCase);
    vi.mocked(listInvitations.execute).mockResolvedValue([]);

    await controller.listCampaignInvitations(caller);

    expect(listInvitations.execute).toHaveBeenCalledWith({ userId: caller.userId });
  });

  it('compte les invitations reçues par l appelant', async () => {
    const caller = user(randomUUID());
    const countInvitations = module.get(CountCampaignInvitationsUseCase);
    vi.mocked(countInvitations.execute).mockResolvedValue({ count: 3 });

    expect(await controller.countCampaignInvitations(caller)).toEqual({ count: 3 });
    expect(countInvitations.execute).toHaveBeenCalledWith({ userId: caller.userId });
  });

  it('invite au nom de l appelant, avec l id de campagne reçu en paramètre', async () => {
    const caller = user(randomUUID());
    const campaignId = randomUUID();
    const invite = module.get(InviteToCampaignUseCase);

    const idempotencyKey = randomUUID();
    await controller.inviteToCampaign(
      caller,
      campaignId,
      { displayName: 'Frodon' },
      idempotencyKey,
    );

    expect(invite.execute).toHaveBeenCalledWith({
      campaignId,
      displayName: 'Frodon',
      inviterId: caller.userId,
      idempotencyKey,
    });
  });

  it.each([
    ['acceptCampaignInvitation' as const, AcceptCampaignInvitationUseCase],
    ['refuseCampaignInvitation' as const, RefuseCampaignInvitationUseCase],
  ])('répond à une invitation au nom de l appelant (%s)', async (route, useCase) => {
    const caller = user(randomUUID());
    const campaignId = randomUUID();
    const idempotencyKey = randomUUID();

    await controller[route](caller, campaignId, idempotencyKey);

    expect(module.get(useCase).execute).toHaveBeenCalledWith({
      campaignId,
      userId: caller.userId,
      idempotencyKey,
    });
  });

  it('annule une invitation au nom du MJ avec une clé idempotente', async () => {
    const caller = user(randomUUID());
    const campaignId = randomUUID();
    const idempotencyKey = randomUUID();
    const cancel = module.get(CancelCampaignInvitationUseCase);

    await controller.cancelCampaignInvitation(
      caller,
      campaignId,
      'Frodon',
      idempotencyKey,
    );

    expect(cancel.execute).toHaveBeenCalledWith({
      campaignId,
      displayName: 'Frodon',
      actorId: caller.userId,
      idempotencyKey,
    });
  });

  it('lit le détail au nom de l appelant', async () => {
    const caller = user(randomUUID());
    const campaignId = randomUUID();
    const detail = module.get(GetCampaignDetailUseCase);

    await controller.getCampaignDetail(caller, campaignId);

    expect(detail.execute).toHaveBeenCalledWith({
      campaignId,
      userId: caller.userId,
    });
  });

  it('rétrograde le membre avec révision et clé de commande', async () => {
    const caller = user(randomUUID());
    const campaignId = randomUUID();
    const idempotencyKey = randomUUID();
    const demote = module.get(DemoteCampaignMemberUseCase);

    await controller.demoteCampaignMember(
      caller,
      campaignId,
      'Frodon',
      { expectedRevision: 3 },
      idempotencyKey,
    );

    expect(demote.execute).toHaveBeenCalledWith({
      campaignId,
      displayName: 'Frodon',
      expectedRevision: 3,
      actorId: caller.userId,
      idempotencyKey,
    });
  });

  it('transfère la propriété au successeur nommé dans le corps', async () => {
    const caller = user(randomUUID());
    const campaignId = randomUUID();
    const idempotencyKey = randomUUID();
    const transfer = module.get(TransferCampaignOwnershipUseCase);

    await controller.transferCampaignOwnership(caller, campaignId, {
      displayName: 'Frodon',
      expectedRevision: 3,
    }, idempotencyKey);

    expect(transfer.execute).toHaveBeenCalledWith({
      campaignId,
      displayName: 'Frodon',
      expectedRevision: 3,
      actorId: caller.userId,
      idempotencyKey,
    });
  });

  it('supprime au nom de l appelant, jamais d un id reçu du client', async () => {
    const caller = user(randomUUID());
    const campaignId = randomUUID();
    const remove = module.get(DeleteCampaignUseCase);

    await controller.deleteCampaign(caller, campaignId);

    expect(remove.execute).toHaveBeenCalledWith({
      campaignId,
      actorId: caller.userId,
    });
  });
});

describe('CampaignController — protection des routes', () => {
  const ROUTES = [
    'createCampaign',
    'listMyCampaigns',
    'listCampaignInvitations',
    'countCampaignInvitations',
    'getCampaignDetail',
    'inviteToCampaign',
    'acceptCampaignInvitation',
    'refuseCampaignInvitation',
    'cancelCampaignInvitation',
    'demoteCampaignMember',
    'transferCampaignOwnership',
    'deleteCampaign',
  ] as const;

  it('ne déclare pas @Public() au niveau du controller', () => {
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, CampaignController)).toBeUndefined();
  });

  it.each(ROUTES)('ne déclare pas @Public() sur %s', (route) => {
    const handler = CampaignController.prototype[route];

    expect(Reflect.getMetadata(IS_PUBLIC_KEY, handler)).toBeUndefined();
  });

  it('couvre bien toutes les routes du controller', () => {
    const handlers = Object.getOwnPropertyNames(CampaignController.prototype).filter(
      (name) => name !== 'constructor',
    );

    expect(handlers.sort()).toEqual([...ROUTES].sort());
  });
});

describe('CampaignController — Idempotency-Key', () => {
  const MUTATIONS = [
    ['createCampaign', 2],
    ['inviteToCampaign', 3],
    ['acceptCampaignInvitation', 2],
    ['refuseCampaignInvitation', 2],
    ['cancelCampaignInvitation', 3],
    ['demoteCampaignMember', 4],
    ['transferCampaignOwnership', 3],
  ] as const;

  it.each(MUTATIONS)('valide un UUID sur %s', (route, parameterIndex) => {
    const key = randomUUID();
    const factory = headerFactory(route, parameterIndex);

    expect(factory(undefined, headerContext(key))).toBe(key);
    expect(() => factory(undefined, headerContext('commande-42'))).toThrow();
  });
});

interface RouteArgumentMetadata {
  index: number;
  factory?: (data: unknown, context: ExecutionContext) => unknown;
}

function headerFactory(
  route: string,
  parameterIndex: number,
): NonNullable<RouteArgumentMetadata['factory']> {
  const metadata = Reflect.getMetadata(
    ROUTE_ARGS_METADATA,
    CampaignController,
    route,
  ) as Record<string, RouteArgumentMetadata>;
  const argument = Object.values(metadata).find(
    (item) => item.index === parameterIndex && item.factory,
  );
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
