import { randomUUID } from 'crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import { anActor } from '@kernel/testing/actor.fixture';
import { UserId } from '@kernel/domain/user-id';
import { FixedClock } from '@kernel/testing/fixed-clock';
import { FixedDice, STANDARD_ARRAY_ROLLS } from '@kernel/testing/fixed-dice';
import { GetCampaignMembershipUseCase } from '@modules/campaigns/application/use-cases/get-campaign-membership.use-case';
import { aCampaign, withPlayer } from '@modules/campaigns/testing/campaign.fixture';
import { InMemoryCampaignRepository } from '@modules/campaigns/testing/in-memory-campaign.repository';

import {
  AbilityRollCommandConflictError,
  NotActiveCampaignMemberError,
} from '../../domain/character.errors';
import { InMemoryAbilityRollRepository } from '../../testing/in-memory-ability-roll.repository';
import { hashAbilityRollIssue } from '../character-creation-intent';
import { RollAbilitiesUseCase } from './roll-abilities.use-case';

const DICE_THROWN = 24;

describe('RollAbilitiesUseCase', () => {
  const gameMasterId = randomUUID();
  const playerId = randomUUID();
  let useCase: RollAbilitiesUseCase;
  let dice: FixedDice;
  let rolls: InMemoryAbilityRollRepository;
  let campaignId: string;

  beforeEach(async () => {
    const campaigns = new InMemoryCampaignRepository();
    const campaign = withPlayer(aCampaign(gameMasterId), gameMasterId, playerId);
    await campaigns.save(campaign);
    campaignId = campaign.id.value;
    dice = new FixedDice(STANDARD_ARRAY_ROLLS);
    rolls = new InMemoryAbilityRollRepository();
    useCase = new RollAbilitiesUseCase(
      new GetCampaignMembershipUseCase(campaigns),
      dice,
      new FixedClock(),
      rolls,
    );
  });

  it('lance six fois quatre d6 et garde les trois meilleurs', async () => {
    const issued = await useCase.execute(command());

    expect(dice.rollCount).toBe(DICE_THROWN);
    expect(issued.totals).toEqual([15, 14, 13, 12, 10, 8]);
    expect(issued.dice).toHaveLength(6);
  });

  it('rend les dés bruts, pour que le joueur puisse refaire le calcul', async () => {
    const issued = await useCase.execute(command());

    expect(issued.dice[0]).toEqual([6, 5, 4, 1]);
  });

  it('rejoue le même tirage sous la même clé d’idempotence', async () => {
    const key = randomUUID();

    const first = await useCase.execute(command(key));
    const replay = await useCase.execute(command(key));

    expect(replay).toEqual(first);
    expect(dice.rollCount).toBe(DICE_THROWN);
  });

  // Une cle d'idempotence appartient a une intention, pas juste a un joueur.
  it('refuse la même clé réutilisée dans une autre campagne', async () => {
    const key = randomUUID();
    await useCase.execute(command(key));

    await expect(
      useCase.execute({ ...command(key), campaignId: randomUUID() }),
    ).rejects.toThrow(AbilityRollCommandConflictError);
  });

  // Le client n'a jamais vu la reponse et rejoue : il doit retrouver SON tirage,
  // pas un tirage neuf, et le serveur ne doit pas rejeter un des de plus.
  it('rend le tirage initial au client qui a perdu la réponse', async () => {
    const key = randomUUID();
    const first = await useCase.execute(command(key));

    const afterLostResponse = await useCase.execute(command(key));

    expect(afterLostResponse.rollId).toEqual(first.rollId);
    expect(afterLostResponse.dice).toEqual(first.dice);
    expect(dice.rollCount).toBe(DICE_THROWN);
  });

  /**
   * Un recu peut exister sans resultat lisible : ecrit par une version
   * precedente, ou pose par une autre commande sous la meme cle. Rendre un
   * tirage neuf serait pire que refuser — la cle aurait produit deux resultats.
   */
  it('refuse un reçu dont le résultat est illisible', async () => {
    const key = randomUUID();
    const issued = await useCase.execute(command(key));
    const intentHash = hashAbilityRollIssue(campaignId, playerId);
    const plant = (result: typeof issued | null) =>
      rolls.plantReceipt(UserId.create(anActor(playerId)), key, { intentHash, result });

    // Le meme recu, lisible, est bien rejoue : l'empreinte posee est la bonne,
    // et c'est donc l'absence de resultat, elle seule, qui fait echouer la suite.
    plant(issued);
    await expect(useCase.execute(command(key))).resolves.toEqual(issued);

    plant(null);
    await expect(useCase.execute(command(key)))
      .rejects.toThrow(AbilityRollCommandConflictError);
    expect(dice.rollCount).toBe(DICE_THROWN);
  });

  it('refuse de lancer pour qui n’est pas membre actif de la campagne', async () => {
    await expect(useCase.execute({ ...command(), actorId: anActor(randomUUID()) }))
      .rejects.toThrow(NotActiveCampaignMemberError);
  });

  function command(idempotencyKey: string = randomUUID()) {
    return { campaignId, actorId: anActor(playerId), idempotencyKey };
  }
});
