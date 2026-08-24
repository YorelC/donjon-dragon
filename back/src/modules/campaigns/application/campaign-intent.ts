import { createHash } from 'crypto';

const CAMPAIGN_CREATION_INTENT = 'campaign.create';
const HASH_ALGORITHM = 'sha256';

export function hashCampaignCreation(name: string): string {
  const canonicalIntent = JSON.stringify({ type: CAMPAIGN_CREATION_INTENT, name });
  return createHash(HASH_ALGORITHM).update(canonicalIntent).digest('hex');
}
