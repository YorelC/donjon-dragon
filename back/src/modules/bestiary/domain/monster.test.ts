import { describe, expect, it } from 'vitest';

import { Monster } from './monster';
import {
  InvalidArmorClassError,
  InvalidHitPointsError,
  InvalidMonsterNameError,
  InvalidMonsterScopeError,
} from './monster.errors';
import { InvalidMonsterKeyError } from './monster-key';
import { aMonster, aMonsterSnapshot, aHomebrewMonster } from '../testing/monster.fixture';

const A_CAMPAIGN = 'campaign-1';
const ANOTHER_CAMPAIGN = 'campaign-2';

describe('Monster', () => {
  it('accepte un profil du manuel', () => {
    const monster = aMonster();

    expect(monster.key).toBe('gobelin');
    expect(monster.challengeRating).toBe('1/4');
    expect(monster.isHomebrew).toBe(false);
  });

  it('refuse une clé qui ne passerait pas dans une URL', () => {
    expect(() => aMonster({ key: 'Gobelin Royal' })).toThrow(InvalidMonsterKeyError);
  });

  it('refuse un profil sans nom', () => {
    expect(() => aMonster({ name: '   ' })).toThrow(InvalidMonsterNameError);
  });

  it('rogne le nom au lieu de le refuser', () => {
    expect(aMonster({ name: '  Gobelin  ' }).name).toBe('Gobelin');
  });

  it('refuse une classe d’armure négative', () => {
    expect(() => aMonster({ armorClass: -1 })).toThrow(InvalidArmorClassError);
  });

  it('refuse un profil déjà mort', () => {
    expect(() => aMonster({ hitPoints: 0 })).toThrow(InvalidHitPointsError);
  });

  /** Les profils d'invocation tirent leurs points de vie de l'incantateur. */
  it('accepte des points de vie inconnus', () => {
    expect(() => aMonster({ hitPoints: null })).not.toThrow();
  });
});

describe('Monster — portée', () => {
  it('refuse un profil du manuel rattaché à une campagne', () => {
    expect(() => aMonster({ origin: 'srd', campaignId: A_CAMPAIGN })).toThrow(
      InvalidMonsterScopeError,
    );
  });

  it('refuse un profil de campagne sans campagne', () => {
    expect(() => aMonster({ origin: 'campaign', campaignId: null })).toThrow(
      InvalidMonsterScopeError,
    );
  });

  it('montre un profil du manuel à toutes les campagnes', () => {
    expect(aMonster().isVisibleIn(A_CAMPAIGN)).toBe(true);
  });

  it('réserve un profil inventé à sa campagne', () => {
    const homebrew = aHomebrewMonster(A_CAMPAIGN);

    expect(homebrew.isVisibleIn(A_CAMPAIGN)).toBe(true);
    expect(homebrew.isVisibleIn(ANOTHER_CAMPAIGN)).toBe(false);
  });
});

describe('Monster — snapshot', () => {
  it('ne laisse fuir ni les actions ni les caractéristiques par référence', () => {
    const monster = aMonster();
    const snapshot = monster.snapshot();

    snapshot.actions[0]!.name = 'Modifié';
    snapshot.abilities.str = 99;

    expect(monster.snapshot().actions[0]!.name).toBe('Cimeterre');
    expect(monster.snapshot().abilities.str).toBe(8);
  });

  it('réhydrate sans rejouer les invariants', () => {
    const restored = Monster.restore(aMonsterSnapshot({ armorClass: -5 }));

    expect(restored.key).toBe('gobelin');
  });
});
