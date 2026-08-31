import { randomUUID } from 'crypto';
import { describe, expect, it, vi } from 'vitest';
import type { ClientSession, Connection, Model } from 'mongoose';
import type { CommandReceiptDocument } from '@kernel/infrastructure/command-receipt.schema';
import type { FunctionalAuditEntryDocument } from '@kernel/infrastructure/functional-audit-entry.schema';
import { UserId } from '@kernel/domain/user-id';
import { TEST_INSTANT } from '@kernel/testing/fixed-clock';

import type { AbilityRollIssueCommand } from '../../application/ports/ability-roll.repository.port';
import { AbilityRollCommandConflictError } from '../../domain/character.errors';
import { STANDARD_ARRAY_ROLL } from '../../testing/character-build.fixture';
import { MongoAbilityRollRepository } from './mongo-ability-roll.repository';

describe('MongoAbilityRollRepository', () => {
  it('écrit le reçu du tirage et son audit dans la même transaction', async () => {
    const fixture = issueFixture();

    const issued = await fixture.repository.issue(fixture.command);

    expect(created(fixture.receipts)).toMatchObject({
      _id: issued.rollId,
      intentionType: 'character.abilityRoll.issued',
      intentHash: 'intent-hash',
      status: 'accepted',
      randomResults: [fixture.command.roll],
    });
    expect(created(fixture.audits)).toMatchObject({
      action: 'character.abilityRoll.issued',
      audiences: ['target-user'],
    });
    expect(fixture.receipts.create.mock.calls[0]?.[1]).toEqual({ session: fixture.session });
    expect(fixture.audits.create.mock.calls[0]?.[1]).toEqual({ session: fixture.session });
  });

  it('rend les dés et leurs totaux, sous une identité neuve', async () => {
    const fixture = issueFixture();

    const issued = await fixture.repository.issue(fixture.command);

    expect(issued.dice).toEqual(fixture.command.roll.dice);
    expect(issued.totals).toEqual([15, 14, 13, 12, 10, 8]);
  });

  // Un tirage consommé n'est plus lisible : la création ne peut pas le rejouer.
  it('ne rend qu’un tirage émis, à son propriétaire et dans sa campagne', async () => {
    const fixture = issueFixture();
    const rollId = randomUUID();

    await fixture.repository.findIssued(rollId, fixture.command.principalId, 'campaign-42');

    expect(fixture.receipts.findOne).toHaveBeenCalledWith({
      _id: rollId,
      principalKey: fixture.command.principalId.value,
      campaignId: 'campaign-42',
      intentionType: 'character.abilityRoll.issued',
      status: 'accepted',
    });
  });
  // Deux demandes simultanees : l'index unique en arrete une, et c'est le recu
  // deja ecrit qui fait foi. Jamais une erreur Mongo brute.
  it('rend le reçu déjà écrit quand deux demandes entrent en collision', async () => {
    const fixture = issueFixture();
    fixture.receipts.findOne.mockReturnValue(leanOf(receiptOf(WINNING_ROLL)));
    fixture.receipts.create.mockRejectedValueOnce({ code: 11000 });

    const recovered = await fixture.repository.issue(fixture.command);

    // Les des du perdant sont jetes : c'est le tirage deja ecrit qui fait foi.
    expect(recovered).toEqual(WINNING_ROLL);
    expect(recovered.dice).not.toEqual(fixture.command.roll.dice);
  });

  it('refuse une collision dont l’intention diffère', async () => {
    const fixture = issueFixture();
    fixture.receipts.findOne.mockReturnValue(leanOf(
      { intentHash: 'autre', result: WINNING_ROLL },
    ));
    fixture.receipts.create.mockRejectedValueOnce({ code: 11000 });

    await expect(fixture.repository.issue(fixture.command))
      .rejects.toThrow(AbilityRollCommandConflictError);
  });

  // L'index unique a parle, mais le recu qu'il protege reste introuvable :
  // rendre un tirage neuf ferait produire deux resultats a une meme cle.
  it('refuse une collision dont le reçu reste introuvable', async () => {
    const fixture = issueFixture();
    fixture.receipts.create.mockRejectedValueOnce({ code: 11000 });

    await expect(fixture.repository.issue(fixture.command))
      .rejects.toThrow(AbilityRollCommandConflictError);
  });

  it('refuse une collision dont le résultat est illisible', async () => {
    const fixture = issueFixture();
    fixture.receipts.findOne.mockReturnValue(leanOf(receiptOf(A_FOREIGN_RESULT)));
    fixture.receipts.create.mockRejectedValueOnce({ code: 11000 });

    await expect(fixture.repository.issue(fixture.command))
      .rejects.toThrow(AbilityRollCommandConflictError);
  });

  /**
   * Les recus des deux commandes vivent dans la meme collection, sous le meme
   * index unique. Une cle deja depensee pour une creation ne doit donc pas
   * rendre ce personnage-la sous les traits d'un tirage.
   */
  it('ne rejoue pas le reçu d’une autre commande écrit sous la même clé', async () => {
    const fixture = issueFixture();
    fixture.receipts.findOne.mockReturnValue(leanOf(receiptOf(A_FOREIGN_RESULT)));

    const receipt = await fixture.repository.findReceipt(
      fixture.command.principalId, fixture.command.idempotencyKey,
    );

    expect(receipt).toEqual({ intentHash: 'intent-hash', result: null });
  });

  it('rend le reçu lisible tel quel, sans le reconstruire', async () => {
    const fixture = issueFixture();
    fixture.receipts.findOne.mockReturnValue(leanOf(receiptOf(WINNING_ROLL)));

    const receipt = await fixture.repository.findReceipt(
      fixture.command.principalId, fixture.command.idempotencyKey,
    );

    expect(receipt).toEqual({ intentHash: 'intent-hash', result: WINNING_ROLL });
  });
});

/** Le tirage de celui qui a gagne la course : des volontairement distincts. */
const WINNING_ROLL = {
  rollId: '4c1f2e30-5a6b-4c7d-8e9f-0a1b2c3d4e5f',
  dice: [
    [1, 1, 2, 3], [1, 2, 2, 3], [2, 2, 3, 3],
    [1, 1, 1, 2], [2, 3, 3, 3], [1, 2, 3, 3],
  ],
  totals: [6, 7, 8, 4, 9, 8],
};

/** Le resultat d'une creation : lisible, mais pas comme un tirage. */
const A_FOREIGN_RESULT = { id: randomUUID(), name: 'Frodo Sacquet', revision: 0 };

function receiptOf(result: unknown) {
  return { intentHash: 'intent-hash', result };
}

interface IssueFixture {
  repository: MongoAbilityRollRepository;
  command: AbilityRollIssueCommand;
  session: ClientSession;
  receipts: ReceiptTestModel;
  audits: TestModel<FunctionalAuditEntryDocument>;
}

interface TestModel<T> {
  model: Model<T>;
  create: ReturnType<typeof createDocuments<T>>;
}

interface ReceiptTestModel extends TestModel<CommandReceiptDocument> {
  findOne: ReturnType<typeof findOneStub>;
}

function issueFixture(): IssueFixture {
  const session = {} as ClientSession;
  const receipts = receiptTestModel();
  const audits = testModel<FunctionalAuditEntryDocument>();
  const repository = new MongoAbilityRollRepository(
    transactionConnection(session), receipts.model, audits.model,
  );
  return { repository, command: commandFixture(), session, receipts, audits };
}

function commandFixture(): AbilityRollIssueCommand {
  return {
    campaignId: randomUUID(),
    principalId: UserId.create(randomUUID()),
    idempotencyKey: randomUUID(),
    intentHash: 'intent-hash',
    occurredAt: TEST_INSTANT,
    roll: STANDARD_ARRAY_ROLL.snapshot(),
    totals: STANDARD_ARRAY_ROLL.totals,
  };
}

function testModel<T>(): TestModel<T> {
  const create = createDocuments<T>();
  return { model: { create } as unknown as Model<T>, create };
}

function receiptTestModel(): ReceiptTestModel {
  const create = createDocuments<CommandReceiptDocument>();
  const findOne = findOneStub();
  const model = { create, findOne } as unknown as Model<CommandReceiptDocument>;
  return { model, create, findOne };
}

function findOneStub() {
  return vi.fn((_filter: object) => leanOf(null));
}

function leanOf(document: unknown) {
  return { lean: vi.fn(async () => document) } as never;
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
