import { describe, it, expect, beforeEach } from 'vitest';
import { CountPendingReceivedUseCase } from './count-pending-received.use-case';
import { InMemoryFriendshipRepository } from '../../testing/in-memory-friendship.repository';
import { pendingRequest, accept, refuse } from '../../testing/friendship.fixture';

describe('CountPendingReceivedUseCase', () => {
  let useCase: CountPendingReceivedUseCase;
  let friendshipRepo: InMemoryFriendshipRepository;
  const ALICE = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
  const BOB = 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb';
  const CHARLIE = 'cccccccc-cccc-4ccc-cccc-cccccccccccc';

  beforeEach(() => {
    friendshipRepo = new InMemoryFriendshipRepository();
    useCase = new CountPendingReceivedUseCase(friendshipRepo);
  });

  describe('INV-001 — countPendingReceived: countDocuments sur { recipientId, status: "pending" }', () => {
    it("retourne 0 quand aucun utilisateur n'a envoyé de demande", async () => {
      const result = await useCase.execute({ userId: ALICE });
      expect(result.count).toBe(0);
    });

    it('retourne le nombre exact de demandes pending reçues', async () => {
      // Bob et Charlie envoient une demande à Alice
      const req1 = pendingRequest(BOB, ALICE);
      const req2 = pendingRequest(CHARLIE, ALICE);
      await friendshipRepo.save(req1);
      await friendshipRepo.save(req2);

      const result = await useCase.execute({ userId: ALICE });
      expect(result.count).toBe(2);
    });

    it("ne compte pas les demandes envoyées par l'utilisateur", async () => {
      // Alice envoie une demande à Bob
      const req = pendingRequest(ALICE, BOB);
      await friendshipRepo.save(req);

      const result = await useCase.execute({ userId: ALICE });
      expect(result.count).toBe(0);
    });

    it('ne compte pas les demandes acceptées', async () => {
      const req = pendingRequest(BOB, ALICE);
      await friendshipRepo.save(req);
      const accepted = accept(req, ALICE);
      await friendshipRepo.save(accepted);

      const result = await useCase.execute({ userId: ALICE });
      expect(result.count).toBe(0);
    });

    it('ne compte pas les demandes refusées', async () => {
      const req = pendingRequest(BOB, ALICE);
      await friendshipRepo.save(req);
      await friendshipRepo.save(refuse(req, ALICE));

      const result = await useCase.execute({ userId: ALICE });
      expect(result.count).toBe(0);
    });

    it("retourne 0 quand l'utilisateur n'a que des amis accepted (aucune demande pending)", async () => {
      const req = pendingRequest(BOB, ALICE);
      await friendshipRepo.save(req);
      const accepted = accept(req, ALICE);
      await friendshipRepo.save(accepted);

      // Bob reçoit une demande de Charlie — Alice ne doit pas la voir
      const req2 = pendingRequest(CHARLIE, BOB);
      await friendshipRepo.save(req2);

      const result = await useCase.execute({ userId: ALICE });
      expect(result.count).toBe(0);
    });

    it("compte uniquement les demandes dont Alice est le destinataire (recipientId)", async () => {
      // Bob → Alice (pending)
      const bobToAlice = pendingRequest(BOB, ALICE);
      await friendshipRepo.save(bobToAlice);
      // Charlie → Alice (pending)
      const charlieToAlice = pendingRequest(CHARLIE, ALICE);
      await friendshipRepo.save(charlieToAlice);
      // Alice → Bob (pending) — ne doit PAS être comptée
      const aliceToBob = pendingRequest(ALICE, BOB);
      await friendshipRepo.save(aliceToBob);

      const result = await useCase.execute({ userId: ALICE });
      expect(result.count).toBe(2);
    });

    it('retourne le nombre correct avec un mélange de status variés', async () => {
      // Bob → Alice pending
      await friendshipRepo.save(pendingRequest(BOB, ALICE));
      // Charlie → Alice pending
      await friendshipRepo.save(pendingRequest(CHARLIE, ALICE));
      // David → Alice → accepted
      const david = 'dddddddd-dddd-4ddd-dddd-dddddddddddd';
      const davidReq = pendingRequest(david, ALICE);
      await friendshipRepo.save(davidReq);
      await friendshipRepo.save(accept(davidReq, ALICE));
      // Alice → Eve pending (envoyée, pas reçue)
      const eve = 'eeeeeeee-eeee-4eee-eeee-eeeeeeeeeeee';
      await friendshipRepo.save(pendingRequest(ALICE, eve));

      const result = await useCase.execute({ userId: ALICE });
      expect(result.count).toBe(2);
    });
  });
});

// ── Matrice de couverture UA ─────────────────────────────────────────────────
// UA-008 — Rechargement des demandes au chargement de la page : testé dans friends.container.test.tsx
// INV-001 — countPendingReceived: countDocuments sur { recipientId, status: 'pending' } : COUVERT
//   - 0 demandes → 0
//   - N demandes pending reçues → N
//   - Demandes envoyées non comptées
//   - Demandes acceptées/refusées non comptées
//   - Mélange de status variés → seules les pending reçues comptent