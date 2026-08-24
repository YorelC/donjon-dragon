import { randomUUID } from 'crypto';
import { describe, it, expect } from 'vitest';
import { UserId } from '@kernel/domain/user-id';
import { TEST_INSTANT } from '@kernel/testing/fixed-clock';

import { Campaign } from './campaign';
import { CampaignName } from './campaign-name';
import {
  AlreadyCampaignMemberError,
  AlreadyGameMasterError,
  CannotDemoteLastGameMasterError,
  CannotDemoteOwnerError,
  CannotInviteSelfError,
  CannotLeaveAsLastGameMasterError,
  CannotRemoveGameMasterError,
  CannotRemoveOwnerError,
  CannotRemoveSelfError,
  CannotSelfDemoteAsLastGameMasterError,
  CannotTransferToSelfError,
  MemberNotFoundError,
  NoPendingCampaignInvitationError,
  NotAGameMasterError,
  NotCampaignGameMasterError,
  NotCampaignMemberError,
  NotCampaignOwnerError,
  SuccessorRequiredError,
} from './campaign.errors';

const gandalf = UserId.create(randomUUID());
const frodo = UserId.create(randomUUID());
const sam = UserId.create(randomUUID());

const NOW = TEST_INSTANT;
const LATER = new Date(NOW.getTime() + 60_000);

const NAME = CampaignName.create('La Communauté de l Anneau');

function aCampaign(): Campaign {
  return Campaign.create(NAME, gandalf, NOW);
}

const idsOf = (userIds: UserId[]): string[] => userIds.map((userId) => userId.value);

/** Campagne où frodo a été invité mais n'a pas encore répondu. */
function withPendingFrodo(): Campaign {
  const campaign = aCampaign();
  campaign.invite(gandalf, frodo, NOW);
  return campaign;
}

/** Campagne où frodo est joueur actif. */
function withFrodoAsPlayer(): Campaign {
  const campaign = withPendingFrodo();
  campaign.acceptInvitation(frodo, NOW);
  return campaign;
}

/** Campagne où frodo est maître du jeu — gandalf en reste le propriétaire. */
function withTwoGameMasters(): Campaign {
  const campaign = withFrodoAsPlayer();
  campaign.promote(gandalf, frodo, NOW);
  return campaign;
}

describe('Campaign.create', () => {
  it('fait du créateur son maître du jeu, actif immédiatement', () => {
    const campaign = aCampaign();

    expect(idsOf(campaign.gameMasters())).toEqual([gandalf.value]);
    expect(campaign.players()).toHaveLength(0);
  });

  it('naît créée et modifiée au même instant, celui qu on lui donne', () => {
    const snapshot = aCampaign().snapshot();

    expect(snapshot.createdAt).toBe(NOW.toISOString());
    expect(snapshot.updatedAt).toBe(NOW.toISOString());
  });

  it('se réhydrate à l identique depuis son snapshot', () => {
    const snapshot = withFrodoAsPlayer().snapshot();

    expect(Campaign.restore(snapshot).snapshot()).toEqual(snapshot);
  });
});

describe('Campaign.invite', () => {
  it('ajoute l invité comme joueur en attente, jamais comme maître du jeu', () => {
    const campaign = withPendingFrodo();

    expect(idsOf(campaign.pendingInvitees())).toEqual([frodo.value]);
    expect(campaign.players()).toHaveLength(0);
    expect(campaign.pendingInvitationFor(frodo).invitedBy?.value).toBe(gandalf.value);
  });

  it('date la campagne de l instant de l invitation', () => {
    const campaign = aCampaign();

    campaign.invite(gandalf, frodo, LATER);

    expect(campaign.updatedAt).toBe(LATER.toISOString());
  });

  it('refuse un invitant qui n est pas maître du jeu', () => {
    const campaign = withFrodoAsPlayer();

    expect(() => campaign.invite(frodo, sam, NOW)).toThrow(NotCampaignGameMasterError);
  });

  it('refuse un invitant étranger à la campagne', () => {
    expect(() => aCampaign().invite(sam, frodo, NOW)).toThrow(NotCampaignMemberError);
  });

  it('refuse de s inviter soi-même', () => {
    expect(() => aCampaign().invite(gandalf, gandalf, NOW)).toThrow(CannotInviteSelfError);
  });

  it('refuse un invité déjà membre actif', () => {
    const campaign = withFrodoAsPlayer();

    expect(() => campaign.invite(gandalf, frodo, NOW)).toThrow(AlreadyCampaignMemberError);
  });

  it('refuse un invité déjà invité et sans réponse', () => {
    const campaign = withPendingFrodo();

    expect(() => campaign.invite(gandalf, frodo, NOW)).toThrow(AlreadyCampaignMemberError);
  });
});

describe('Campaign.acceptInvitation', () => {
  it('fait passer l invité de en attente à joueur actif', () => {
    const campaign = withFrodoAsPlayer();

    expect(campaign.pendingInvitees()).toHaveLength(0);
    expect(idsOf(campaign.players())).toEqual([frodo.value]);
  });

  it('refuse un utilisateur sans invitation en attente', () => {
    const campaign = aCampaign();

    expect(() => campaign.acceptInvitation(sam, NOW)).toThrow(
      NoPendingCampaignInvitationError,
    );
  });

  it('refuse une seconde acceptation', () => {
    const campaign = withFrodoAsPlayer();

    expect(() => campaign.acceptInvitation(frodo, NOW)).toThrow(
      NoPendingCampaignInvitationError,
    );
  });
});

describe('Campaign.refuseInvitation', () => {
  it('ne laisse rien : l invité redevient inconnu de la campagne', () => {
    const campaign = withPendingFrodo();

    campaign.refuseInvitation(frodo, NOW);

    expect(campaign.pendingInvitees()).toHaveLength(0);
    expect(campaign.snapshot().members).toHaveLength(1);
  });

  it('laisse le maître du jeu réinviter aussitôt', () => {
    const campaign = withPendingFrodo();
    campaign.refuseInvitation(frodo, NOW);

    expect(() => campaign.invite(gandalf, frodo, NOW)).not.toThrow();
  });

  it('refuse un utilisateur sans invitation en attente', () => {
    const campaign = aCampaign();

    expect(() => campaign.refuseInvitation(sam, NOW)).toThrow(
      NoPendingCampaignInvitationError,
    );
  });
});

describe('Campaign.leave', () => {
  it('retire le joueur de la campagne', () => {
    const campaign = withFrodoAsPlayer();

    campaign.leave(frodo, null, NOW);

    expect(campaign.players()).toHaveLength(0);
    expect(campaign.snapshot().members).toHaveLength(1);
  });

  it('refuse le départ de l unique maître du jeu, même avec des joueurs', () => {
    const campaign = withFrodoAsPlayer();

    expect(() => campaign.leave(gandalf, frodo, NOW)).toThrow(
      CannotLeaveAsLastGameMasterError,
    );
  });

  it('refuse le départ de l unique maître du jeu resté seul', () => {
    expect(() => aCampaign().leave(gandalf, null, NOW)).toThrow(
      CannotLeaveAsLastGameMasterError,
    );
  });

  it('refuse le départ d un invité qui n a pas répondu', () => {
    const campaign = withPendingFrodo();

    expect(() => campaign.leave(frodo, null, NOW)).toThrow(NotCampaignMemberError);
  });

  it('refuse le départ d un étranger', () => {
    expect(() => aCampaign().leave(sam, null, NOW)).toThrow(NotCampaignMemberError);
  });

  it('exige un successeur quand c est le propriétaire qui part', () => {
    const campaign = withTwoGameMasters();

    expect(() => campaign.leave(gandalf, null, NOW)).toThrow(SuccessorRequiredError);
  });

  it('passe la main et part, en une seule opération', () => {
    const campaign = withTwoGameMasters();
    const revisionBefore = campaign.revision;

    campaign.leave(gandalf, frodo, NOW);

    expect(campaign.ownerId.equals(frodo)).toBe(true);
    expect(campaign.snapshot().members).toHaveLength(1);
    expect(campaign.revision).toBe(revisionBefore + 1);
  });

  it('ne laisse pas partir le propriétaire en désignant un absent', () => {
    const campaign = withTwoGameMasters();

    expect(() => campaign.leave(gandalf, sam, NOW)).toThrow(MemberNotFoundError);
    expect(campaign.snapshot().members).toHaveLength(2);
  });

  it('ignore le successeur quand le partant n est pas propriétaire', () => {
    const campaign = withTwoGameMasters();

    campaign.leave(frodo, null, NOW);

    expect(campaign.ownerId.equals(gandalf)).toBe(true);
  });
});

describe('Campaign.promote', () => {
  it('fait du joueur un maître du jeu sans toucher à la propriété', () => {
    const campaign = withFrodoAsPlayer();

    campaign.promote(gandalf, frodo, NOW);

    expect(idsOf(campaign.gameMasters()).sort()).toEqual(
      [gandalf.value, frodo.value].sort(),
    );
    expect(campaign.ownerId.equals(gandalf)).toBe(true);
  });

  it('refuse un promoteur qui n est pas maître du jeu', () => {
    const campaign = withTwoGameMasters();
    campaign.demote(gandalf, frodo, NOW);

    expect(() => campaign.promote(frodo, frodo, NOW)).toThrow(
      NotCampaignGameMasterError,
    );
  });

  it('refuse de promouvoir un membre déjà maître du jeu', () => {
    const campaign = withTwoGameMasters();

    expect(() => campaign.promote(gandalf, frodo, NOW)).toThrow(
      AlreadyGameMasterError,
    );
  });

  it('refuse de promouvoir un invité qui n a pas répondu', () => {
    const campaign = withPendingFrodo();

    expect(() => campaign.promote(gandalf, frodo, NOW)).toThrow(MemberNotFoundError);
  });

  it('refuse de promouvoir un étranger', () => {
    expect(() => aCampaign().promote(gandalf, sam, NOW)).toThrow(MemberNotFoundError);
  });
});

describe('Campaign.demote', () => {
  it('ramène le maître du jeu au rang de joueur', () => {
    const campaign = withTwoGameMasters();

    campaign.demote(gandalf, frodo, NOW);

    expect(idsOf(campaign.gameMasters())).toEqual([gandalf.value]);
    expect(idsOf(campaign.players())).toEqual([frodo.value]);
  });

  it('refuse de rétrograder le propriétaire, même par un autre maître du jeu', () => {
    const campaign = withTwoGameMasters();

    expect(() => campaign.demote(frodo, gandalf, NOW)).toThrow(CannotDemoteOwnerError);
  });

  it('refuse de rétrograder le dernier maître du jeu', () => {
    // Le propriétaire doit être quelqu'un d'autre, sinon c'est la protection du
    // propriétaire qui répondrait — elle est vérifiée avant.
    const campaign = withTwoGameMasters();
    campaign.invite(gandalf, sam, NOW);
    campaign.acceptInvitation(sam, NOW);
    campaign.transferOwnership(gandalf, sam, NOW);
    campaign.demote(gandalf, frodo, NOW);

    expect(() => campaign.demote(gandalf, gandalf, NOW)).toThrow(
      CannotDemoteLastGameMasterError,
    );
  });

  it('refuse de rétrograder un simple joueur', () => {
    const campaign = withFrodoAsPlayer();

    expect(() => campaign.demote(gandalf, frodo, NOW)).toThrow(NotAGameMasterError);
  });
});

describe('Campaign.selfPromoteAsOwner', () => {
  it('fait du propriétaire joueur un maître du jeu', () => {
    const campaign = withFrodoAsPlayer();
    campaign.transferOwnership(gandalf, frodo, NOW);

    campaign.selfPromoteAsOwner(frodo, NOW);

    expect(campaign.roleOf(frodo)).toBe('gameMaster');
  });

  it('refuse un acteur qui n est pas propriétaire', () => {
    const campaign = withFrodoAsPlayer();

    expect(() => campaign.selfPromoteAsOwner(frodo, NOW)).toThrow(
      NotCampaignOwnerError,
    );
  });

  it('refuse un propriétaire déjà maître du jeu', () => {
    expect(() => aCampaign().selfPromoteAsOwner(gandalf, NOW)).toThrow(
      AlreadyGameMasterError,
    );
  });
});

describe('Campaign.selfDemoteAsOwner', () => {
  it('ramène le propriétaire au rang de joueur quand un autre MJ reste', () => {
    const campaign = withTwoGameMasters();

    campaign.selfDemoteAsOwner(gandalf, NOW);

    expect(campaign.roleOf(gandalf)).toBe('player');
  });

  it('refuse un acteur qui n est pas propriétaire', () => {
    const campaign = withTwoGameMasters();

    expect(() => campaign.selfDemoteAsOwner(frodo, NOW)).toThrow(
      NotCampaignOwnerError,
    );
  });

  it('refuse un propriétaire déjà joueur', () => {
    const campaign = withFrodoAsPlayer();
    campaign.transferOwnership(gandalf, frodo, NOW);

    expect(() => campaign.selfDemoteAsOwner(frodo, NOW)).toThrow(
      NotAGameMasterError,
    );
  });

  it('refuse quand le propriétaire est le dernier maître du jeu', () => {
    expect(() => aCampaign().selfDemoteAsOwner(gandalf, NOW)).toThrow(
      CannotSelfDemoteAsLastGameMasterError,
    );
  });
});

describe('Campaign.removeMember', () => {
  it('retire le joueur de la campagne', () => {
    const campaign = withFrodoAsPlayer();

    campaign.removeMember(gandalf, frodo, NOW);

    expect(campaign.snapshot().members).toHaveLength(1);
  });

  it('annule une invitation encore sans réponse', () => {
    const campaign = withPendingFrodo();

    campaign.removeMember(gandalf, frodo, NOW);

    expect(campaign.pendingInvitees()).toHaveLength(0);
  });

  it('refuse de retirer un maître du jeu : on le rétrograde d abord', () => {
    const campaign = withTwoGameMasters();
    campaign.transferOwnership(gandalf, frodo, NOW);

    expect(() => campaign.removeMember(frodo, gandalf, NOW)).toThrow(
      CannotRemoveGameMasterError,
    );
  });

  it('refuse de retirer le propriétaire', () => {
    const campaign = withTwoGameMasters();

    expect(() => campaign.removeMember(frodo, gandalf, NOW)).toThrow(
      CannotRemoveOwnerError,
    );
  });

  it('refuse de se retirer soi-même : on quitte, ou on supprime', () => {
    const campaign = withFrodoAsPlayer();

    expect(() => campaign.removeMember(gandalf, gandalf, NOW)).toThrow(
      CannotRemoveSelfError,
    );
  });

  it('refuse un demandeur qui n est pas maître du jeu', () => {
    const campaign = withFrodoAsPlayer();

    expect(() => campaign.removeMember(frodo, gandalf, NOW)).toThrow(
      NotCampaignGameMasterError,
    );
  });

  it('refuse de retirer un étranger', () => {
    expect(() => aCampaign().removeMember(gandalf, sam, NOW)).toThrow(
      MemberNotFoundError,
    );
  });
});

describe('Campaign.transferOwnership', () => {
  it('passe la propriété à un joueur sans le promouvoir', () => {
    const campaign = withFrodoAsPlayer();

    campaign.transferOwnership(gandalf, frodo, NOW);

    expect(campaign.ownerId.equals(frodo)).toBe(true);
    expect(campaign.roleOf(frodo)).toBe('player');
  });

  it('retire au cédant le droit de supprimer', () => {
    const campaign = withFrodoAsPlayer();

    campaign.transferOwnership(gandalf, frodo, NOW);

    expect(() => campaign.assertIsOwner(gandalf)).toThrow(NotCampaignOwnerError);
    expect(() => campaign.assertIsOwner(frodo)).not.toThrow();
  });

  it('date la campagne de l instant du transfert', () => {
    const campaign = withFrodoAsPlayer();

    campaign.transferOwnership(gandalf, frodo, LATER);

    expect(campaign.updatedAt).toBe(LATER.toISOString());
  });

  it('refuse un cédant qui n est pas propriétaire', () => {
    const campaign = withTwoGameMasters();

    expect(() => campaign.transferOwnership(frodo, sam, NOW)).toThrow(
      NotCampaignOwnerError,
    );
  });

  it('refuse un transfert à soi-même', () => {
    const campaign = withFrodoAsPlayer();

    expect(() => campaign.transferOwnership(gandalf, gandalf, NOW)).toThrow(
      CannotTransferToSelfError,
    );
  });

  it('refuse un successeur qui n a pas encore accepté son invitation', () => {
    const campaign = withPendingFrodo();

    expect(() => campaign.transferOwnership(gandalf, frodo, NOW)).toThrow(
      MemberNotFoundError,
    );
  });
});

describe('Campaign — propriété à la réhydratation', () => {
  it('conserve le propriétaire du snapshot', () => {
    const campaign = withFrodoAsPlayer();
    campaign.transferOwnership(gandalf, frodo, NOW);

    const restored = Campaign.restore(campaign.snapshot());

    expect(restored.ownerId.equals(frodo)).toBe(true);
  });

  it('conserve la révision du snapshot', () => {
    const campaign = withFrodoAsPlayer();

    const restored = Campaign.restore(campaign.snapshot());

    expect(restored.revision).toBe(campaign.revision);
  });
});

describe('Campaign.pendingInvitationFor', () => {
  it("garde l'inviteur attaché au membre une fois l'invitation acceptée", () => {
    const campaign = withFrodoAsPlayer();
    const frodoMember = campaign.snapshot().members.find((m) => m.userId === frodo.value);

    expect(frodoMember?.invitedBy).toBe(gandalf.value);
  });

  it('donne un fondateur sans inviteur : personne ne l a invité', () => {
    const founder = aCampaign().snapshot().members.find((m) => m.userId === gandalf.value);

    expect(founder?.invitedBy).toBeNull();
  });

  it('lève quand il n y a pas d invitation en attente', () => {
    expect(() => aCampaign().pendingInvitationFor(sam)).toThrow(
      NoPendingCampaignInvitationError,
    );
  });
});

describe('Campaign.roleOf', () => {
  it('rend le rôle d un membre actif', () => {
    const campaign = withFrodoAsPlayer();

    expect(campaign.roleOf(gandalf)).toBe('gameMaster');
    expect(campaign.roleOf(frodo)).toBe('player');
  });

  it('refuse un invité en attente, qui n est pas encore membre', () => {
    const campaign = withPendingFrodo();

    expect(() => campaign.roleOf(frodo)).toThrow(NotCampaignMemberError);
  });
});
