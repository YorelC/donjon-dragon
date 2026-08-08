import { Schema } from 'mongoose';

import type { EmailVerificationTokenDocument } from './email-verification-token.mapper';

export const EMAIL_VERIFICATION_TOKEN_MODEL = 'EmailVerificationToken';

export const EmailVerificationTokenSchema =
  new Schema<EmailVerificationTokenDocument>(
    {
      id: { type: String, required: true, unique: true },
      userId: { type: String, required: true, index: true },
      tokenHash: { type: String, required: true, unique: true },
      expiresAt: { type: String, required: true },
      createdAt: { type: String, required: true },
    },
    { versionKey: false },
  );
