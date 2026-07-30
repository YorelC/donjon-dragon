import type { EmailSenderPort } from '../../03-domain/email/email-sender.port';

export class InMemoryEmailSender implements EmailSenderPort {
  async sendVerificationEmail(_to: string, _verificationUrl: string): Promise<void> {
    // No-op for testing
  }
}
