import { Schema } from 'mongoose';

import type { EmailVerificationTokenDocument } from './email-verification-token.mapper';

export const EMAIL_VERIFICATION_TOKEN_MODEL = 'EmailVerificationToken';

export const EmailVerificationTokenSchema =
  new Schema<EmailVerificationTokenDocument>(
    {
      id: { type: String, required: true, unique: true },
      userId: { type: String, required: true, index: true },
      tokenHash: { type: String, required: true, unique: true },
      createdAt: { type: String, required: true },

      // Ces tokens n'avaient AUCUNE purge : un lien de vérification jamais
      // cliqué restait en base indéfiniment.
      expiresAt: { type: Date, required: true, expires: 0 },
    },
    { versionKey: false },
  );
