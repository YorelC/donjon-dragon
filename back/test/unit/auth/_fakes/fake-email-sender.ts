import type { EmailSenderPort } from '../../../../src/auth/domain/email-sender.port.js';

// Double de test : enregistre les envois pour permettre l'assertion
// (destinataire + URL de vérification) sans SMTP réel.
export type SentEmail = { to: string; verificationUrl: string };

export class FakeEmailSender implements EmailSenderPort {
  readonly sent: SentEmail[] = [];

  async sendVerificationEmail(
    to: string,
    verificationUrl: string,
  ): Promise<void> {
    this.sent.push({ to, verificationUrl });
  }
}
