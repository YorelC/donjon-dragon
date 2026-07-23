import type { EmailSenderPort } from '../../03-domain/email/email-sender.port';

/**
 * Stub adapter pour le dev/test. Sera remplacé par nodemailer/Gmail SMTP
 * en production (passe suivante). Pour l'instant, c'est un no-op.
 */
export class NullEmailSender implements EmailSenderPort {
  async sendVerificationEmail(): Promise<void> {
    // No-op. À remplacer par nodemailer en production.
  }
}
