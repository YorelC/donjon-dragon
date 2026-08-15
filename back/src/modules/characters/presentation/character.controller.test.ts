import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, type TestingModule } from '@nestjs/testing';
import { IS_PUBLIC_KEY } from '@common/decorators/public.decorator';
import type { AuthenticatedActor } from '@kernel/domain/actor-id';
import { anActor } from '@kernel/testing/actor.fixture';

import { AssignCharacterUseCase } from '../application/use-cases/assign-character.use-case';
import { CreateCharacterUseCase } from '../application/use-cases/create-character.use-case';
import { DeleteCharacterUseCase } from '../application/use-cases/delete-character.use-case';
import { FinalizeCharacterUseCase } from '../application/use-cases/finalize-character.use-case';
import { GetCharacterBuildUseCase } from '../application/use-cases/get-character-build.use-case';
import { GetCharacterSheetUseCase } from '../application/use-cases/get-character-sheet.use-case';
import { ListCampaignCharactersUseCase } from '../application/use-cases/list-campaign-characters.use-case';
import { PreviewCharacterSheetUseCase } from '../application/use-cases/preview-character-sheet.use-case';
import { UnassignCharacterUseCase } from '../application/use-cases/unassign-character.use-case';
import { CharacterController } from './character.controller';

const mockUseCase = (): { execute: ReturnType<typeof vi.fn> } => ({ execute: vi.fn() });

const user = (userId: string): AuthenticatedActor => ({ userId: anActor(userId) });

const CAMPAIGN_ID = '550e8400-e29b-41d4-a716-446655440000';
const CHARACTER_ID = '660e8400-e29b-41d4-a716-446655440001';
const ACTOR_ID = '770e8400-e29b-41d4-a716-446655440002';

describe('CharacterController', () => {
  let controller: CharacterController;
  let create: CreateCharacterUseCase;
  let finalize: FinalizeCharacterUseCase;
  let preview: PreviewCharacterSheetUseCase;
  let sheet: GetCharacterSheetUseCase;
  let buildDetail: GetCharacterBuildUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CharacterController],
      providers: [
        { provide: ListCampaignCharactersUseCase, useValue: mockUseCase() },
        { provide: CreateCharacterUseCase, useValue: mockUseCase() },
        { provide: FinalizeCharacterUseCase, useValue: mockUseCase() },
        { provide: PreviewCharacterSheetUseCase, useValue: mockUseCase() },
        { provide: GetCharacterSheetUseCase, useValue: mockUseCase() },
        { provide: GetCharacterBuildUseCase, useValue: mockUseCase() },
        { provide: DeleteCharacterUseCase, useValue: mockUseCase() },
        { provide: AssignCharacterUseCase, useValue: mockUseCase() },
        { provide: UnassignCharacterUseCase, useValue: mockUseCase() },
      ],
    }).compile();

    controller = module.get(CharacterController);
    create = module.get(CreateCharacterUseCase);
    finalize = module.get(FinalizeCharacterUseCase);
    preview = module.get(PreviewCharacterSheetUseCase);
    sheet = module.get(GetCharacterSheetUseCase);
    buildDetail = module.get(GetCharacterBuildUseCase);
  });

  // L'identité vient exclusivement de @CurrentUser. Un actorId lu dans le corps
  // ou dans un param serait une IDOR : chaque route doit prouver qu'elle prend
  // bien celui du jeton.
  it('crée le personnage avec l identité du jeton, jamais celle du corps', async () => {
    const actor = user(ACTOR_ID);
    const body = { name: 'Frodo Sacquet' } as Parameters<typeof controller.createCharacter>[2];

    await controller.createCharacter(actor, CAMPAIGN_ID, body);

    expect(create.execute).toHaveBeenCalledWith({
      campaignId: CAMPAIGN_ID,
      actorId: actor.userId,
      name: 'Frodo Sacquet',
    });
  });

  it('transmet la copie du wizard au use-case de finalisation', async () => {
    const actor = user(ACTOR_ID);
    const body = { name: 'Frodo Sacquet' } as Parameters<
      typeof controller.finalizeCharacter
    >[3];

    await controller.finalizeCharacter(actor, CAMPAIGN_ID, CHARACTER_ID, body);

    expect(finalize.execute).toHaveBeenCalledWith({
      campaignId: CAMPAIGN_ID,
      characterId: CHARACTER_ID,
      actorId: actor.userId,
      name: 'Frodo Sacquet',
    });
  });

  it('calcule un aperçu sans identifiant de personnage', async () => {
    const actor = user(ACTOR_ID);
    const body = { classKey: 'rogue' } as Parameters<typeof controller.previewSheet>[2];

    await controller.previewSheet(actor, CAMPAIGN_ID, body);

    expect(preview.execute).toHaveBeenCalledWith({
      campaignId: CAMPAIGN_ID,
      actorId: actor.userId,
      classKey: 'rogue',
    });
  });

  it('renvoie la fiche du personnage visé', async () => {
    const actor = user(ACTOR_ID);

    await controller.getCharacterSheet(actor, CAMPAIGN_ID, CHARACTER_ID);

    expect(sheet.execute).toHaveBeenCalledWith({
      campaignId: CAMPAIGN_ID,
      characterId: CHARACTER_ID,
      actorId: actor.userId,
    });
  });

  it('renvoie le build du personnage visé, pour le pré-remplissage du wizard', async () => {
    const actor = user(ACTOR_ID);

    await controller.getCharacterBuild(actor, CAMPAIGN_ID, CHARACTER_ID);

    expect(buildDetail.execute).toHaveBeenCalledWith({
      campaignId: CAMPAIGN_ID,
      characterId: CHARACTER_ID,
      actorId: actor.userId,
    });
  });
});

// Le JwtAuthGuard est monté en APP_GUARD : la protection ne s'assert plus par
// la présence d'un @UseGuards, mais par l'ABSENCE de @Public(). C'est
// l'invariant qui compte — un @Public() posé par erreur ici ouvrirait au monde
// la fiche de personnage de toutes les campagnes.
describe('CharacterController — protection des routes', () => {
  const ROUTES = [
    'listCampaignCharacters',
    'createCharacter',
    'finalizeCharacter',
    'previewSheet',
    'getCharacterSheet',
    'getCharacterBuild',
    'deleteCharacter',
    'assignCharacter',
    'unassignCharacter',
  ] as const;

  it('ne déclare pas @Public() au niveau du controller', () => {
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, CharacterController)).toBeUndefined();
  });

  it.each(ROUTES)('ne déclare pas @Public() sur %s', (route) => {
    const handler = CharacterController.prototype[route];
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, handler)).toBeUndefined();
  });

  it('couvre bien toutes les routes du controller', () => {
    const handlers = Object.getOwnPropertyNames(CharacterController.prototype).filter(
      (name) => name !== 'constructor',
    );

    expect(handlers.sort()).toEqual([...ROUTES].sort());
  });
});
