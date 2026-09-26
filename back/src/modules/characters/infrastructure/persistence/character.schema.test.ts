import { describe, expect, it } from 'vitest';

import { CharacterSchema } from './character.schema';

describe('CharacterSchema', () => {
  it('persiste une révision optimiste obligatoire', () => {
    const revision = CharacterSchema.path('revision');

    expect(revision).toBeDefined();
    expect('isRequired' in revision ? revision.isRequired : false).toBe(true);
  });

  it('garantit une seule attribution par joueur et campagne', () => {
    const index = CharacterSchema.indexes().find(
      ([fields]) => fields.campaignId === 1 && fields.assignedTo === 1,
    );

    expect(index?.[1]).toMatchObject({
      unique: true,
      partialFilterExpression: { assignedTo: { $type: 'string' } },
    });
  });

  it('borne et initialise les détails narratifs facultatifs', () => {
    const identity = CharacterSchema.path('identity') as unknown as {
      schema: { path(field: string): { options: Record<string, unknown> } };
    };
    const personalityTraits = identity.schema.path('personalityTraits');

    expect(personalityTraits.options).toMatchObject({ default: null, maxlength: 1_000 });
  });
});
