import { describe, it, expect } from 'vitest';

import {
  CAMPAIGN_NAME_RULES,
  CampaignDetailSchema,
  CampaignInvitationSchema,
  CampaignRoleEnum,
  CampaignSummarySchema,
  CreateCampaignSchema,
  InviteToCampaignSchema,
  IdempotencyKeySchema,
  LeaveCampaignSchema,
  MembershipStatusEnum,
  PendingCampaignInvitationCountSchema,
  TransferOwnershipSchema,
} from './campaign-schema.js';

const shortest = 'a'.repeat(CAMPAIGN_NAME_RULES.min);
const longest = 'a'.repeat(CAMPAIGN_NAME_RULES.max);

describe('CreateCampaignSchema', () => {
  it.each([shortest, longest])('accepte un nom dans les bornes', (name) => {
    expect(CreateCampaignSchema.parse({ name }).name).toBe(name);
  });

  it.each([
    ['a'.repeat(CAMPAIGN_NAME_RULES.min - 1)],
    ['a'.repeat(CAMPAIGN_NAME_RULES.max + 1)],
    [''],
  ])('refuse un nom hors bornes', (name) => {
    expect(CreateCampaignSchema.safeParse({ name }).success).toBe(false);
  });

  it('mesure le nom une fois détouré', () => {
    const padded = `   ${'a'.repeat(CAMPAIGN_NAME_RULES.min - 1)}   `;

    expect(CreateCampaignSchema.safeParse({ name: padded }).success).toBe(false);
  });

  it('rend le nom détouré, pour que le serveur stocke ce que l utilisateur lit', () => {
    expect(CreateCampaignSchema.parse({ name: `  ${shortest}  ` }).name).toBe(shortest);
  });

  it('porte un message en français, celui que le formulaire affichera', () => {
    const result = CreateCampaignSchema.safeParse({ name: 'court' });

    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((issue) => issue.message).join(' ');
      expect(messages).toContain('au moins');
    }
  });
});

describe('IdempotencyKeySchema', () => {
  it('accepte une clé UUID', () => {
    const key = '3f1a2b4c-5d6e-4f70-8192-a3b4c5d6e7f8';

    expect(IdempotencyKeySchema.parse(key)).toBe(key);
  });

  it('refuse une clé arbitraire', () => {
    expect(IdempotencyKeySchema.safeParse('commande-42').success).toBe(false);
  });
});

describe('énumérations', () => {
  it('ne connaît que deux rôles, sans recouvrement possible', () => {
    expect(CampaignRoleEnum.options).toEqual(['gameMaster', 'player']);
  });

  it("n'a pas de statut 'refused' : un refus ne laisse rien", () => {
    expect(MembershipStatusEnum.options).toEqual(['pending', 'active']);
  });
});

describe('CampaignSummarySchema', () => {
  const valid = {
    id: '3f1a2b4c-5d6e-4f70-8192-a3b4c5d6e7f8',
    name: shortest,
    myRole: 'gameMaster',
    gameMasterCount: 1,
    playerCount: 0,
  };

  it('accepte un résumé complet', () => {
    expect(CampaignSummarySchema.safeParse(valid).success).toBe(true);
  });

  it('exige au moins un maître du jeu : une campagne n est jamais orpheline', () => {
    expect(
      CampaignSummarySchema.safeParse({ ...valid, gameMasterCount: 0 }).success,
    ).toBe(false);
  });

  it('accepte une campagne sans joueur', () => {
    expect(CampaignSummarySchema.safeParse({ ...valid, playerCount: 0 }).success).toBe(
      true,
    );
  });
});

describe('InviteToCampaignSchema', () => {
  it('accepte un pseudo', () => {
    expect(InviteToCampaignSchema.safeParse({ displayName: 'Frodon' }).success).toBe(
      true,
    );
  });

  it('refuse un pseudo vide', () => {
    expect(InviteToCampaignSchema.safeParse({ displayName: '' }).success).toBe(false);
  });

  it("n'accepte pas d'identifiant à la place du pseudo", () => {
    expect(InviteToCampaignSchema.safeParse({ id: 'peu importe' }).success).toBe(false);
  });
});

describe('CampaignInvitationSchema', () => {
  const valid = {
    campaignId: '3f1a2b4c-5d6e-4f70-8192-a3b4c5d6e7f8',
    name: shortest,
    invitedBy: { displayName: 'Gandalf' },
  };

  it('accepte une invitation complète', () => {
    expect(CampaignInvitationSchema.safeParse(valid).success).toBe(true);
  });

  it('exige de savoir qui a invité', () => {
    const { invitedBy: _invitedBy, ...withoutInviter } = valid;

    expect(CampaignInvitationSchema.safeParse(withoutInviter).success).toBe(false);
  });

  it("ne laisse pas passer l'identifiant de l'inviteur", () => {
    const parsed = CampaignInvitationSchema.parse({
      ...valid,
      invitedBy: { displayName: 'Gandalf', id: 'fuite' },
    });

    expect(parsed.invitedBy).toEqual({ displayName: 'Gandalf' });
  });
});

describe('CampaignDetailSchema', () => {
  const valid = {
    id: '3f1a2b4c-5d6e-4f70-8192-a3b4c5d6e7f8',
    name: shortest,
    myRole: 'player',
    isOwner: false,
    owner: { displayName: 'Gandalf' },
    gameMasters: [{ displayName: 'Gandalf' }],
    players: [{ displayName: 'Frodon' }],
    pendingInvitees: [],
  };

  it('accepte un détail complet', () => {
    expect(CampaignDetailSchema.safeParse(valid).success).toBe(true);
  });

  it('dit le droit de supprimer sans le faire déduire des pseudos', () => {
    // isOwner et owner ne disent pas la même chose : le premier est un droit du
    // lecteur, le second un membre à désigner dans la liste.
    const parsed = CampaignDetailSchema.parse({ ...valid, isOwner: true });

    expect(parsed.isOwner).toBe(true);
    expect(parsed.owner).toEqual({ displayName: 'Gandalf' });
  });

  it('exige isOwner', () => {
    const { isOwner: _isOwner, ...incomplete } = valid;

    expect(CampaignDetailSchema.safeParse(incomplete).success).toBe(false);
  });

  it('exige owner', () => {
    const { owner: _owner, ...incomplete } = valid;

    expect(CampaignDetailSchema.safeParse(incomplete).success).toBe(false);
  });

  it('accepte une campagne dont le propriétaire n est que joueur', () => {
    const ownerIsPlayer = {
      ...valid,
      isOwner: true,
      owner: { displayName: 'Frodon' },
    };

    expect(CampaignDetailSchema.safeParse(ownerIsPlayer).success).toBe(true);
  });
});

describe('TransferOwnershipSchema', () => {
  it('accepte un pseudo de successeur', () => {
    expect(TransferOwnershipSchema.safeParse({ displayName: 'Frodon' }).success).toBe(
      true,
    );
  });

  it('exige un successeur : transférer à personne n a pas de sens', () => {
    expect(TransferOwnershipSchema.safeParse({}).success).toBe(false);
  });
});

describe('LeaveCampaignSchema', () => {
  it('accepte un départ sans successeur : tout le monde n est pas propriétaire', () => {
    expect(LeaveCampaignSchema.safeParse({}).success).toBe(true);
  });

  it('accepte un départ avec successeur', () => {
    const parsed = LeaveCampaignSchema.parse({ successorDisplayName: 'Frodon' });

    expect(parsed.successorDisplayName).toBe('Frodon');
  });

  it('refuse un successeur vide plutôt que de le traiter comme absent', () => {
    expect(
      LeaveCampaignSchema.safeParse({ successorDisplayName: '' }).success,
    ).toBe(false);
  });
});

describe('PendingCampaignInvitationCountSchema', () => {
  it.each([0, 1, 42])('accepte un compteur positif (%s)', (count) => {
    expect(PendingCampaignInvitationCountSchema.safeParse({ count }).success).toBe(true);
  });

  it.each([-1, 1.5])('refuse un compteur invalide (%s)', (count) => {
    expect(PendingCampaignInvitationCountSchema.safeParse({ count }).success).toBe(
      false,
    );
  });
});
