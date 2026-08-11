import { Schema } from 'mongoose';

import type { CampaignSnapshot } from '../../domain/campaign';
import type { CampaignMemberSnapshot } from '../../domain/campaign-member';
import { CAMPAIGN_ROLES } from '../../domain/campaign-role';
import { MEMBERSHIP_STATUSES } from '../../domain/membership-status';

export const CAMPAIGN_MODEL = 'Campaign';

/**
 * `_id: false` est porteur : sans lui Mongoose colle un ObjectId à chaque membre,
 * et le `.select('-_id')` du repository — qui ne porte que sur la racine — le
 * laisserait remonter jusqu'au snapshot, qui n'a pas ce champ.
 */
const CampaignMemberSubSchema = new Schema<CampaignMemberSnapshot>(
  {
    userId: { type: String, required: true },
    role: { type: String, enum: [...CAMPAIGN_ROLES], required: true },
    status: { type: String, enum: [...MEMBERSHIP_STATUSES], required: true },
    // Nullable et non absent : « personne ne m'a invité » est le cas du fondateur,
    // pas une donnée manquante.
    invitedBy: { type: String, default: null },
  },
  { _id: false, versionKey: false },
);

export const CampaignSchema = new Schema<CampaignSnapshot>(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    // Pas `required` : les campagnes antérieures à la notion de propriétaire n'ont
    // pas ce champ, et `Campaign.restore` retombe alors sur le premier MJ.
    ownerId: { type: String },
    members: { type: [CampaignMemberSubSchema], required: true },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
  },
  { versionKey: false },
);

/**
 * Index composé sur le tableau de membres : il porte les trois lectures du module
 * — mes campagnes, mes invitations, leur compteur — qui filtrent toutes sur le
 * couple (userId, status) d'un même élément.
 */
CampaignSchema.index({ 'members.userId': 1, 'members.status': 1 });
