import type { EmailSenderPort } from '../application/ports/email-sender.port';

export interface SentEmail {
  to: string;
  verificationUrl: string;
}

/** Enregistre les envois pour que les tests puissent les vérifier. */
export class InMemoryEmailSender implements EmailSenderPort {
  readonly sent: SentEmail[] = [];

  async sendVerificationEmail(to: string, verificationUrl: string): Promise<void> {
    this.sent.push({ to, verificationUrl });
  }
}
