import { createTransport } from 'nodemailer';
import type { EmailSenderPort } from '../../03-domain/email/email-sender.port';

export class NodemailerEmailSender implements EmailSenderPort {
  private transporter = createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });

  async sendVerificationEmail(to: string, verificationUrl: string): Promise<void> {
    const htmlBody = `
      <p>Bienvenue sur Donjon Dragon !</p>
      <p>Cliquez sur le lien ci-dessous pour vérifier votre adresse email :</p>
      <p><a href="${verificationUrl}">${verificationUrl}</a></p>
      <p>Ce lien expire dans 24 heures.</p>
    `;

    await this.transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject: 'Vérifiez votre adresse email - Donjon Dragon',
      html: htmlBody,
    });
  }
}
