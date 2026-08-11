import { describe, it, expect } from 'vitest';

import {
  CAMPAIGN_NAME_LENGTH,
  CampaignName,
  InvalidCampaignNameError,
} from './campaign-name';

const tooShort = 'a'.repeat(CAMPAIGN_NAME_LENGTH.min - 1);
const shortest = 'a'.repeat(CAMPAIGN_NAME_LENGTH.min);
const longest = 'a'.repeat(CAMPAIGN_NAME_LENGTH.max);
const tooLong = 'a'.repeat(CAMPAIGN_NAME_LENGTH.max + 1);

describe('CampaignName', () => {
  it.each([shortest, longest])('accepte un nom dans les bornes (%s)', (raw) => {
    expect(CampaignName.create(raw).value).toBe(raw);
  });

  it.each([tooShort, tooLong, ''])('refuse un nom hors bornes (%s)', (raw) => {
    expect(() => CampaignName.create(raw)).toThrow(InvalidCampaignNameError);
  });

  it('mesure le nom une fois détouré, pas avec ses espaces', () => {
    expect(() => CampaignName.create(`   ${tooShort}   `)).toThrow(
      InvalidCampaignNameError,
    );
  });

  it('conserve le nom détouré', () => {
    expect(CampaignName.create(`  ${shortest}  `).value).toBe(shortest);
  });

  it('compare deux noms par leur valeur', () => {
    expect(CampaignName.create(shortest).equals(CampaignName.create(shortest))).toBe(
      true,
    );
    expect(CampaignName.create(shortest).equals(CampaignName.create(longest))).toBe(
      false,
    );
  });
});
