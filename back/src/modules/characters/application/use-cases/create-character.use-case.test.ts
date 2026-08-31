import { randomUUID } from 'crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import { anActor } from '@kernel/testing/actor.fixture';
import { FixedClock } from '@kernel/testing/fixed-clock';
import { GetCampaignMembershipUseCase } from '@modules/campaigns/application/use-cases/get-campaign-membership.use-case';
import { aCampaign, withPlayer } from '@modules/campaigns/testing/campaign.fixture';
import { InMemoryCampaignRepository } from '@modules/campaigns/testing/in-memory-campaign.repository';

import {
  AbilitiesNotRolledError,
  AbilityRollNotExpectedError,
  AbilityRollNotIssuedError,
  CharacterCreationCommandConflictError,
} from '../../domain/character.errors';
import { STANDARD_ARRAY_ROLL } from '../../testing/character-build.fixture';
import { aCharacterBody, seedAbilityRoll } from '../../testing/character.fixture';
import { hashCharacterCreation } from '../character-creation-intent';
import { UserId } from '@kernel/domain/user-id';

import { InMemoryAbilityRollRepository } from '../../testing/in-memory-ability-roll.repository';
import { InMemoryCharacterCreationRepository } from '../../testing/in-memory-character-creation.repository';
import { InMemoryCharacterDirectory } from '../../testing/in-memory-character-directory';
import { InMemoryCharacterRepository } from '../../testing/in-memory-character.repository';
import { InMemoryItemCatalog } from '../../testing/in-memory-item-catalog';
import { OwningCampaignId } from '../../domain/owning-campaign-id';
import { CreateCharacterUseCase } from './create-character.use-case';

describe('CreateCharacterUseCase', () => {
  const gameMasterId = randomUUID();
  const playerId = randomUUID();
  const idempotencyKey = randomUUID();
  let useCase: CreateCharacterUseCase;
  let characters: InMemoryCharacterRepository;
  let creations: InMemoryCharacterCreationRepository;
  let rolls: InMemoryAbilityRollRepository;
  let campaignId: string;
  const strangerRollId = randomUUID();
  const POINT_BUY_SCORES = {
    strength: 15, dexterity: 14, constitution: 13,
    intelligence: 12, wisdom: 10, charisma: 8,
  };

  beforeEach(async () => {
    const campaigns = new InMemoryCampaignRepository();
    const campaign = withPlayer(aCampaign(gameMasterId), gameMasterId, playerId);
    await campaigns.save(campaign);
    campaignId = campaign.id.value;
    characters = new InMemoryCharacterRepository();
    const directory = new InMemoryCharacterDirectory();
    directory.register({ id: playerId, displayName: 'Frodo' });
    rolls = new InMemoryAbilityRollRepository();
    seedAbilityRoll(rolls, UserId.create(playerId), campaignId);
    creations = new InMemoryCharacterCreationRepository(characters);
    useCase = new CreateCharacterUseCase(
      characters,
      directory,
      new InMemoryItemCatalog(),
      new GetCampaignMembershipUseCase(campaigns),
      new FixedClock(),
      creations,
      rolls,
    );
  });

  it('crée et auto-attribue atomiquement le personnage du joueur', async () => {
    const result = await useCase.execute(command());

    expect(result.assignedTo).toEqual({ displayName: 'Frodo' });
    expect(await characters.findByCampaignId(campaignIdOf())).toHaveLength(1);
  });

  it('relit le résultat initial lors du rejeu de la même intention', async () => {
    const first = await useCase.execute(command());
    const replay = await useCase.execute(command());

    expect(replay).toEqual(first);
    expect(await characters.findByCampaignId(campaignIdOf())).toHaveLength(1);
  });

  it('refuse une intention différente sous la même clé', async () => {
    await useCase.execute(command());

    await expect(useCase.execute(command('Sam Gamegie')))
      .rejects.toThrow(CharacterCreationCommandConflictError);
  });

  /**
   * Le client n'a jamais vu le 201 et rejoue. Le tirage a deja ete consomme par
   * la premiere creation : le relire pour le reconsommer echouerait. Le rejeu
   * doit donc court-circuiter avant meme de le regarder.
   */
  it('ne relit pas le tirage quand la création est rejouée', async () => {
    await useCase.execute(command());
    const readsAfterCreation = rolls.issuedReads;

    await useCase.execute(command());

    expect(rolls.issuedReads).toBe(readsAfterCreation);
  });

  /**
   * Un recu peut exister sans resultat lisible : ecrit par une version
   * precedente, ou pose par une autre commande sous la meme cle. Creer un second
   * personnage serait pire que refuser — la cle en aurait produit deux.
   */
  it('refuse un reçu dont le résultat est illisible', async () => {
    const created = await useCase.execute(command());
    const intentHash = hashCharacterCreation(campaignId, compositionOf(command()));
    const plant = (result: typeof created | null) =>
      creations.plantReceipt(UserId.create(playerId), idempotencyKey, { intentHash, result });

    // Le meme recu, lisible, est bien rejoue : l'empreinte posee est la bonne,
    // et c'est donc l'absence de resultat, elle seule, qui fait echouer la suite.
    plant(created);
    await expect(useCase.execute(command())).resolves.toEqual(created);

    plant(null);
    await expect(useCase.execute(command()))
      .rejects.toThrow(CharacterCreationCommandConflictError);
    expect(await characters.findByCampaignId(campaignIdOf())).toHaveLength(1);
  });

  // Le client ne fournit plus de dés : il ne peut que désigner un tirage émis,
  // et seul le sien, dans cette campagne, est accepté.
  it('refuse un tirage que le serveur ne lui a pas émis', async () => {
    await expect(useCase.execute({ ...command(), abilityRollId: randomUUID() }))
      .rejects.toThrow(AbilityRollNotIssuedError);
  });

  it('refuse le tirage émis à un autre joueur', async () => {
    storeRollFor(UserId.create(gameMasterId), campaignId);

    await expect(useCase.execute({ ...command(), abilityRollId: strangerRollId }))
      .rejects.toThrow(AbilityRollNotIssuedError);
  });

  it('refuse le tirage émis dans une autre campagne', async () => {
    storeRollFor(UserId.create(playerId), randomUUID());

    await expect(useCase.execute({ ...command(), abilityRollId: strangerRollId }))
      .rejects.toThrow(AbilityRollNotIssuedError);
  });

  it('refuse la méthode « tirage » sans tirage désigné', async () => {
    await expect(useCase.execute({ ...command(), abilityRollId: null }))
      .rejects.toThrow(AbilitiesNotRolledError);
  });

  it('refuse un tirage désigné par une méthode qui n’en prend pas', async () => {
    await expect(
      useCase.execute({ ...command(), abilityMethod: 'pointBuy', base: POINT_BUY_SCORES }),
    ).rejects.toThrow(AbilityRollNotExpectedError);
  });

  function storeRollFor(principalId: UserId, ownerCampaignId: string) {
    rolls.store(strangerRollId, principalId, ownerCampaignId, STANDARD_ARRAY_ROLL.snapshot());
  }

  /** Le corps seul, tel que l'empreinte d'intention le voit. */
  function compositionOf({
    campaignId: _campaignId, actorId: _actorId, idempotencyKey: _key, ...body
  }: ReturnType<typeof command>) {
    return body;
  }

  function command(name?: string) {
    return {
      ...aCharacterBody(name), campaignId, actorId: anActor(playerId), idempotencyKey,
    };
  }

  function campaignIdOf() {
    return OwningCampaignId.create(campaignId);
  }
});
