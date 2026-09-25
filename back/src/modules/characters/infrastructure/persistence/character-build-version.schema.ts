import { Schema } from 'mongoose';

import type { CharacterSnapshot } from '../../domain/character';

export const CHARACTER_BUILD_VERSION_MODEL = 'CharacterBuildVersion';
export const CHARACTER_BUILD_VERSION_COLLECTION = 'character_build_versions';

export interface CharacterBuildVersionDocument {
  _id: string;
  schemaVersion: number;
  characterId: string;
  campaignId: string;
  ordinal: number;
  contentHash: string;
  snapshot: CharacterSnapshot;
  createdBy: string;
  createdAt: Date;
}

export const CharacterBuildVersionSchema = new Schema<CharacterBuildVersionDocument>(
  {
    _id: { type: String, required: true },
    schemaVersion: { type: Number, required: true, min: 1 },
    characterId: { type: String, required: true },
    campaignId: { type: String, required: true },
    ordinal: { type: Number, required: true, min: 1 },
    contentHash: { type: String, required: true },
    snapshot: { type: Schema.Types.Mixed, required: true },
    createdBy: { type: String, required: true },
    createdAt: { type: Date, required: true },
  },
  { collection: CHARACTER_BUILD_VERSION_COLLECTION, id: false, versionKey: false },
);

CharacterBuildVersionSchema.index({ characterId: 1, ordinal: 1 }, { unique: true });
CharacterBuildVersionSchema.index({ campaignId: 1, createdAt: 1 });
