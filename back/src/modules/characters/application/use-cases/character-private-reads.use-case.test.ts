import { beforeEach, describe, expect, it } from 'vitest';
import { randomUUID } from 'crypto';
import { anActor } from '@kernel/testing/actor.fixture';
import { FixedClock } from '@kernel/testing/fixed-clock';
import { GetCampaignMembershipUseCase } from '@modules/campaigns/application/use-cases/get-campaign-membership.use-case';
import { aCampaign, withPlayer } from '@modules/campaigns/testing/campaign.fixture';
import { InMemoryCampaignRepository } from '@modules/campaigns/testing/in-memory-campaign.repository';

import { CharacterNotFoundError } from '../../domain/character.errors';
import { aCharacterBody } from '../../testing/character.fixture';
import { InMemoryCharacterDirectory } from '../../testing/in-memory-character-directory';
import { InMemoryCharacterRepository } from '../../testing/in-memory-character.repository';
import { InMemoryItemCatalog } from '../../testing/in-memory-item-catalog';
import { CreateCharacterUseCase } from './create-character.use-case';
import { GetCharacterBuildUseCase } from './get-character-build.use-case';
import { GetCharacterSheetUseCase } from './get-character-sheet.use-case';

describe('lectures privées du personnage', () => {
  const gameMasterId = randomUUID();
  const frodoId = randomUUID();
  const samId = randomUUID();
  let sheet: GetCharacterSheetUseCase;
  let build: GetCharacterBuildUseCase;
  let campaignId: string;
  let characterId: string;

  beforeEach(async () => {
    const campaigns = new InMemoryCampaignRepository();
    const campaign = withPlayer(aCampaign(gameMasterId), gameMasterId, frodoId);
    withPlayer(campaign, gameMasterId, samId);
    await campaigns.save(campaign);
    campaignId = campaign.id.value;
    const membership = new GetCampaignMembershipUseCase(campaigns);
    const characters = new InMemoryCharacterRepository();
    const directory = new InMemoryCharacterDirectory();
    directory.register({ id: frodoId, displayName: 'Frodo' });
    const items = new InMemoryItemCatalog();
    const create = new CreateCharacterUseCase(
      characters, directory, items, membership, new FixedClock(),
    );
    characterId = (await create.execute({
      ...aCharacterBody(), campaignId, actorId: anActor(frodoId),
    })).id;
    sheet = new GetCharacterSheetUseCase(characters, items, membership);
    build = new GetCharacterBuildUseCase(characters, membership);
  });

  it('autorise le joueur assigné et tous les MJ', async () => {
    await expect(sheet.execute(request(frodoId))).resolves.toBeDefined();
    await expect(build.execute(request(frodoId))).resolves.toBeDefined();
    await expect(sheet.execute(request(gameMasterId))).resolves.toBeDefined();
    await expect(build.execute(request(gameMasterId))).resolves.toBeDefined();
  });

  it('masque fiche et build à un autre joueur actif', async () => {
    await expect(sheet.execute(request(samId))).rejects.toThrow(CharacterNotFoundError);
    await expect(build.execute(request(samId))).rejects.toThrow(CharacterNotFoundError);
  });

  it('masque un identifiant connu sous une autre campagne', async () => {
    const wrongCampaign = randomUUID();
    await expect(sheet.execute({ ...request(gameMasterId), campaignId: wrongCampaign }))
      .rejects.toThrow();
  });

  function request(actorId: string) {
    return { campaignId, characterId, actorId: anActor(actorId) };
  }
});
