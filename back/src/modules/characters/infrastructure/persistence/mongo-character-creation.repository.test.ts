import { randomUUID } from 'crypto';
import { describe, expect, it, vi } from 'vitest';
import type { ClientSession, Connection, Model } from 'mongoose';
import type { CommandReceiptDocument } from '@kernel/infrastructure/command-receipt.schema';
import type { FunctionalAuditEntryDocument } from '@kernel/infrastructure/functional-audit-entry.schema';
import type { OutboxMessageDocument } from '@kernel/infrastructure/outbox-message.schema';
import { UserId } from '@kernel/domain/user-id';
import { TEST_INSTANT } from '@kernel/testing/fixed-clock';

import type { CharacterCreationCommand } from '../../application/ports/character-creation.repository.port';
import { toCharacterDto } from '../../application/character.mapper';
import { Character } from '../../domain/character';
import { CharacterName } from '../../domain/character-name';
import {
  AbilityRollAlreadyUsedError,
  PlayerAlreadyHasCharacterError,
} from '../../domain/character.errors';
import { OwningCampaignId } from '../../domain/owning-campaign-id';
import { STANDARD_ARRAY_ROLL } from '../../testing/character-build.fixture';
import {
  A_CHARACTER_BUILD, A_CHARACTER_IDENTITY, A_CHARACTER_NAME,
} from '../../testing/character.fixture';
import type { CharacterDocument } from './character.mapper';
import { MongoCharacterCreationRepository } from './mongo-character-creation.repository';

describe('MongoCharacterCreationRepository', () => {
  it('écrit personnage, reçu, audit et outbox dans la même transaction', async () => {
    const fixture = creationFixture();

    await fixture.repository.execute(fixture.command);

    expect(created(fixture.characters)).toMatchObject({
      id: fixture.command.character.id.value,
      campaignId: fixture.command.campaignId,
    });
    expect(created(fixture.receipts)).toMatchObject({ intentHash: 'intent-hash' });
    expect(created(fixture.audits)).toMatchObject({ action: 'character.created' });
    expect(created(fixture.outbox)).toMatchObject({ factType: 'character.created' });
    assertSameSession(fixture);
  });

  // Un tirage ne sert qu'une fois, et sa bascule appartient à la transaction du
  // personnage : sinon deux créations concurrentes s'appuieraient sur le même.
  it('consomme le tirage désigné dans la même session', async () => {
    const rollId = randomUUID();
    const fixture = creationFixture({ abilityRollId: rollId });

    await fixture.repository.execute(fixture.command);

    const [filter, update, options] = fixture.receipts.update.mock.calls[0] ?? [];
    expect(filter).toMatchObject({ _id: rollId, status: 'accepted' });
    expect(update).toEqual({ $set: { status: 'consumed', updatedAt: TEST_INSTANT } });
    expect(options).toEqual({ session: fixture.session });
  });

  it('refuse une création qui s’appuie sur un tirage déjà consommé', async () => {
    const fixture = creationFixture({ abilityRollId: randomUUID(), consumable: false });

    await expect(fixture.repository.execute(fixture.command))
      .rejects.toThrow(AbilityRollAlreadyUsedError);
  });

  // Le client a perdu la reponse et rejoue : le recu deja ecrit repond, et
  // aucune seconde ecriture n'a lieu.
  it('relit le reçu déjà écrit sans rien réécrire', async () => {
    const fixture = creationFixture();
    fixture.receipts.findOne.mockReturnValue(leanOf(receiptOf(fixture.command.result)));

    const replay = await fixture.repository.execute(fixture.command);

    expect(replay).toEqual({ intentHash: 'intent-hash', result: fixture.command.result });
    expect(fixture.characters.create).not.toHaveBeenCalled();
    expect(fixture.outbox.create).not.toHaveBeenCalled();
  });

  /**
   * Les recus des deux commandes vivent dans la meme collection, sous le meme
   * index unique. Une cle deja depensee pour un tirage ne doit pas rendre ce
   * tirage-la sous les traits d'un personnage : l'appelant tranchera en conflit.
   */
  it('ne rejoue pas le reçu d’une autre commande écrit sous la même clé', async () => {
    const fixture = creationFixture();
    fixture.receipts.findOne.mockReturnValue(leanOf(receiptOf(AN_ISSUED_ROLL)));

    const receipt = await fixture.repository.findReceipt(
      fixture.command.principalId, fixture.command.idempotencyKey,
    );

    expect(receipt).toEqual({ intentHash: 'intent-hash', result: null });
  });

  // Deux creations concurrentes sous la meme cle : l'index unique en arrete une,
  // et c'est le personnage deja ecrit qui fait foi.
  it('rend le reçu déjà écrit quand deux créations entrent en collision', async () => {
    const fixture = creationFixture();
    fixture.receipts.create.mockRejectedValueOnce({ code: 11000 });
    fixture.receipts.findOne
      .mockReturnValueOnce(leanOf(null))
      .mockReturnValue(leanOf(receiptOf(fixture.command.result)));

    await expect(fixture.repository.execute(fixture.command))
      .resolves.toEqual({ intentHash: 'intent-hash', result: fixture.command.result });
  });

  /**
   * Meme collision, mais aucun recu derriere : l'index viole n'etait pas celui
   * de la cle, c'etait celui du personnage unique par joueur.
   */
  it('traduit une collision sans reçu en personnage déjà existant', async () => {
    const fixture = creationFixture();
    fixture.receipts.create.mockRejectedValueOnce({ code: 11000 });

    await expect(fixture.repository.execute(fixture.command))
      .rejects.toThrow(PlayerAlreadyHasCharacterError);
  });

  it('laisse remonter une erreur qui n’est pas une collision de clé', async () => {
    const fixture = creationFixture();
    fixture.receipts.create.mockRejectedValueOnce(new Error('Mongo est tombe'));

    await expect(fixture.repository.execute(fixture.command)).rejects.toThrow('Mongo est tombe');
  });
});

/** Le resultat d'un tirage : lisible, mais pas comme un personnage. */
const AN_ISSUED_ROLL = {
  rollId: '4c1f2e30-5a6b-4c7d-8e9f-0a1b2c3d4e5f',
  dice: [[6, 5, 4, 1]],
  totals: [15],
};

function receiptOf(result: unknown) {
  return { intentHash: 'intent-hash', result };
}

interface CreationOptions {
  abilityRollId?: string | null;
  consumable?: boolean;
}

interface CreationFixture {
  repository: MongoCharacterCreationRepository;
  command: CharacterCreationCommand;
  session: ClientSession;
  characters: TestModel<CharacterDocument>;
  receipts: ReceiptTestModel;
  audits: TestModel<FunctionalAuditEntryDocument>;
  outbox: TestModel<OutboxMessageDocument>;
}

interface TestModel<T> {
  model: Model<T>;
  create: CreateDocuments<T>;
}

interface ReceiptTestModel extends TestModel<CommandReceiptDocument> {
  update: ReturnType<typeof updateOneStub>;
  findOne: ReturnType<typeof findOneStub>;
}

type CreateDocuments<T> = ReturnType<typeof createDocuments<T>>;

function creationFixture(options: CreationOptions = {}): CreationFixture {
  const session = {} as ClientSession;
  const command = { ...commandFixture(), abilityRollId: options.abilityRollId ?? null };
  const characters = testModel<CharacterDocument>();
  const receipts = receiptTestModel(options.consumable ?? true);
  const audits = testModel<FunctionalAuditEntryDocument>();
  const outbox = testModel<OutboxMessageDocument>();
  const connection = transactionConnection(session);
  const repository = new MongoCharacterCreationRepository(
    connection, characters.model, receipts.model, audits.model, outbox.model,
  );
  return { repository, command, session, characters, receipts, audits, outbox };
}

function commandFixture(): CharacterCreationCommand {
  const campaignId = randomUUID();
  const actor = UserId.create(randomUUID());
  const character = Character.create({
    campaignId: OwningCampaignId.create(campaignId),
    name: CharacterName.create(A_CHARACTER_NAME), identity: A_CHARACTER_IDENTITY,
    createdBy: actor, build: A_CHARACTER_BUILD, roll: STANDARD_ARRAY_ROLL,
    now: TEST_INSTANT,
  });
  return {
    campaignId, principalId: actor, idempotencyKey: randomUUID(),
    intentHash: 'intent-hash', occurredAt: TEST_INSTANT, effectiveRole: 'gameMaster',
    abilityRollId: null,
    character, result: toCharacterDto(character, actor, null),
  };
}

function testModel<T>(): TestModel<T> {
  const create = createDocuments<T>();
  return { model: { create } as unknown as Model<T>, create };
}

function receiptTestModel(consumable: boolean): ReceiptTestModel {
  const create = createDocuments<CommandReceiptDocument>();
  const findOne = findOneStub();
  const updateOne = updateOneStub(consumable);
  const model = { create, findOne, updateOne } as unknown as Model<CommandReceiptDocument>;
  return { model, create, update: updateOne, findOne };
}

function findOneStub() {
  return vi.fn((_filter: object) => leanOf(null));
}

function leanOf(document: unknown) {
  return { lean: vi.fn(async () => document) } as never;
}

function updateOneStub(consumable: boolean) {
  return vi.fn(async (
    _filter: object,
    _update: object,
    _options: { session: ClientSession },
  ) => ({ modifiedCount: consumable ? 1 : 0 }));
}

function createDocuments<T>() {
  return vi.fn(async (_documents: T[], _options: { session: ClientSession }) => []);
}

function transactionConnection(session: ClientSession): Connection {
  const transaction = vi.fn(async (work: (value: ClientSession) => unknown) => work(session));
  return { transaction } as unknown as Connection;
}

function created<T>(fixture: TestModel<T>): T | undefined {
  return fixture.create.mock.calls[0]?.[0][0] as T | undefined;
}

function assertSameSession(fixture: CreationFixture): void {
  const expected = { session: fixture.session };
  expect(fixture.characters.create.mock.calls[0]?.[1]).toEqual(expected);
  expect(fixture.receipts.create.mock.calls[0]?.[1]).toEqual(expected);
  expect(fixture.audits.create.mock.calls[0]?.[1]).toEqual(expected);
  expect(fixture.outbox.create.mock.calls[0]?.[1]).toEqual(expected);
}
