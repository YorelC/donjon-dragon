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
  CannotInviteSelfError,
  CannotLeaveAsLastGameMasterError,
  CannotExcludeLastGameMasterError,
  CannotExcludeOwnerError,
  CannotTransferToSelfError,
  MemberNotFoundError,
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

/** Campagne où frodo est joueur actif. */
function withFrodoAsPlayer(): Campaign {
  const campaign = aCampaign();
  campaign.joinFromInvitation(frodo, gandalf, NOW);
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

describe('Campaign.assertCanInvite', () => {
  it('refuse un invitant qui n est pas maître du jeu', () => {
    const campaign = withFrodoAsPlayer();

    expect(() => campaign.assertCanInvite(frodo, sam)).toThrow(NotCampaignGameMasterError);
  });

  it('refuse un invitant étranger à la campagne', () => {
    expect(() => aCampaign().assertCanInvite(sam, frodo)).toThrow(NotCampaignMemberError);
  });

  it('refuse de s inviter soi-même', () => {
    expect(() => aCampaign().assertCanInvite(gandalf, gandalf)).toThrow(CannotInviteSelfError);
  });

  it('refuse un invité déjà membre actif', () => {
    const campaign = withFrodoAsPlayer();

    expect(() => campaign.assertCanInvite(gandalf, frodo)).toThrow(
      AlreadyCampaignMemberError,
    );
  });

  it('autorise un ami qui n est pas encore membre', () => {
    expect(() => aCampaign().assertCanInvite(gandalf, frodo)).not.toThrow();
  });
});

describe('Campaign.joinFromInvitation', () => {
  it('crée une adhésion joueur active et conserve l invitant', () => {
    const campaign = aCampaign();
    campaign.joinFromInvitation(frodo, gandalf, LATER);
    const member = campaign.snapshot().members.find((item) => item.userId === frodo.value);

    expect(idsOf(campaign.players())).toEqual([frodo.value]);
    expect(member).toMatchObject({ status: 'active', invitedBy: gandalf.value });
    expect(campaign.updatedAt).toBe(LATER.toISOString());
  });

  it('refuse de créer une seconde adhésion', () => {
    const campaign = withFrodoAsPlayer();

    expect(() => campaign.joinFromInvitation(frodo, gandalf, NOW)).toThrow(
      AlreadyCampaignMemberError,
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

  it('refuse le départ d un utilisateur sans adhésion', () => {
    expect(() => aCampaign().leave(frodo, null, NOW)).toThrow(
      NotCampaignMemberError,
    );
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

  it('refuse un promoteur qui n est pas propriétaire', () => {
    const campaign = withTwoGameMasters();
    campaign.demote(gandalf, frodo, NOW);

    expect(() => campaign.promote(frodo, frodo, NOW)).toThrow(
      NotCampaignOwnerError,
    );
  });

  it('refuse de promouvoir un membre déjà maître du jeu', () => {
    const campaign = withTwoGameMasters();

    expect(() => campaign.promote(gandalf, frodo, NOW)).toThrow(
      AlreadyGameMasterError,
    );
  });

  it('refuse de promouvoir un utilisateur sans adhésion', () => {
    expect(() => aCampaign().promote(gandalf, frodo, NOW)).toThrow(
      MemberNotFoundError,
    );
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

  it('refuse la rétrogradation demandée par un co-MJ non propriétaire', () => {
    const campaign = withTwoGameMasters();

    expect(() => campaign.demote(frodo, gandalf, NOW)).toThrow(NotCampaignOwnerError);
  });

  it('refuse de rétrograder le dernier maître du jeu', () => {
    const campaign = withTwoGameMasters();
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

describe('Campaign.exclude', () => {
  it('exclut un joueur de la campagne', () => {
    const campaign = withFrodoAsPlayer();

    campaign.exclude(gandalf, frodo, NOW);

    expect(campaign.snapshot().members).toHaveLength(1);
  });

  it('exclut directement un co-MJ sans rétrogradation préalable', () => {
    const campaign = withTwoGameMasters();

    campaign.exclude(gandalf, frodo, NOW);

    expect(campaign.snapshot().members).toHaveLength(1);
  });

  it('refuse d exclure le propriétaire', () => {
    const campaign = withTwoGameMasters();

    expect(() => campaign.exclude(gandalf, gandalf, NOW)).toThrow(
      CannotExcludeOwnerError,
    );
  });

  it('refuse d exclure le dernier MJ actif', () => {
    const campaign = withTwoGameMasters();
    campaign.transferOwnership(gandalf, frodo, NOW);
    campaign.demote(frodo, frodo, NOW);

    expect(() => campaign.exclude(frodo, gandalf, NOW)).toThrow(
      CannotExcludeLastGameMasterError,
    );
  });

  it('refuse un demandeur qui n est pas propriétaire', () => {
    const campaign = withFrodoAsPlayer();

    expect(() => campaign.exclude(frodo, gandalf, NOW)).toThrow(
      NotCampaignOwnerError,
    );
  });

  it('refuse d exclure un étranger', () => {
    expect(() => aCampaign().exclude(gandalf, sam, NOW)).toThrow(
      MemberNotFoundError,
    );
  });
});

describe('Campaign.transferOwnership', () => {
  it('passe la propriété à un MJ sans modifier son rôle', () => {
    const campaign = withTwoGameMasters();

    campaign.transferOwnership(gandalf, frodo, NOW);

    expect(campaign.ownerId.equals(frodo)).toBe(true);
    expect(campaign.roleOf(frodo)).toBe('gameMaster');
  });

  it('retire au cédant le droit de supprimer', () => {
    const campaign = withTwoGameMasters();

    campaign.transferOwnership(gandalf, frodo, NOW);

    expect(() => campaign.assertIsOwner(gandalf)).toThrow(NotCampaignOwnerError);
    expect(() => campaign.assertIsOwner(frodo)).not.toThrow();
  });

  it('date la campagne de l instant du transfert', () => {
    const campaign = withTwoGameMasters();

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

  it('refuse un successeur joueur actif', () => {
    const campaign = withFrodoAsPlayer();

    expect(() => campaign.transferOwnership(gandalf, frodo, NOW)).toThrow(
      NotAGameMasterError,
    );
  });

  it('refuse un successeur sans adhésion active', () => {
    expect(() => aCampaign().transferOwnership(gandalf, frodo, NOW)).toThrow(
      MemberNotFoundError,
    );
  });
});

describe('Campaign — propriété à la réhydratation', () => {
  it('conserve le propriétaire du snapshot', () => {
    const campaign = withTwoGameMasters();
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

describe('Campaign — origine des adhésions', () => {
  it("garde l'inviteur attaché au membre une fois l'invitation acceptée", () => {
    const campaign = withFrodoAsPlayer();
    const frodoMember = campaign.snapshot().members.find((m) => m.userId === frodo.value);

    expect(frodoMember?.invitedBy).toBe(gandalf.value);
  });

  it('donne un fondateur sans inviteur : personne ne l a invité', () => {
    const founder = aCampaign().snapshot().members.find((m) => m.userId === gandalf.value);

    expect(founder?.invitedBy).toBeNull();
  });

});

describe('Campaign.roleOf', () => {
  it('rend le rôle d un membre actif', () => {
    const campaign = withFrodoAsPlayer();

    expect(campaign.roleOf(gandalf)).toBe('gameMaster');
    expect(campaign.roleOf(frodo)).toBe('player');
  });

  it('refuse un utilisateur sans adhésion active', () => {
    expect(() => aCampaign().roleOf(frodo)).toThrow(NotCampaignMemberError);
  });
});
