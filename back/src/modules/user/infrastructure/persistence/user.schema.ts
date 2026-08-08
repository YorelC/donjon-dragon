import { Schema } from 'mongoose';
import type { UserSnapshot } from '../../domain/user';

export const USER_MODEL = 'User';

export const UserSchema = new Schema<UserSnapshot>(
  {
    id: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    displayName: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    emailVerified: { type: Boolean, required: true, default: false },
    createdAt: { type: String, required: true },
  },
  { versionKey: false },
);
