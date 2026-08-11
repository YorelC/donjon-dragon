import { describe, it, expect } from 'vitest';

import { CampaignSchema } from './campaign.schema';

describe('CampaignSchema — indexes', () => {
  it("définit l'index { 'members.userId': 1, 'members.status': 1 }", () => {
    const hasIndex = CampaignSchema.indexes().some(([fields]) => {
      const keys = Object.keys(fields);
      return (
        keys.length === 2 &&
        fields['members.userId'] === 1 &&
        fields['members.status'] === 1
      );
    });

    expect(hasIndex).toBe(true);
  });

  it('rend le tableau de membres sans _id de sous-document', () => {
    // Le .select('-_id') du repository ne porte que sur la racine : un _id de
    // sous-document remonterait jusqu'au snapshot, qui n'a pas ce champ.
    const memberSchema = CampaignSchema.path('members');

    expect(memberSchema.schema?.options._id).toBe(false);
  });
});
