import { Schema } from 'mongoose';
import type { User } from '@donjon-dragon/shared/user-schema';

export const USER_MODEL = 'User';

export const UserSchema = new Schema<User>(
  {
    id: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    displayName: { type: String, required: true },
    passwordHash: { type: String, required: true },
    emailVerified: { type: Boolean, required: true, default: false },
    createdAt: { type: String, required: true },
  },
  { versionKey: false },
);
