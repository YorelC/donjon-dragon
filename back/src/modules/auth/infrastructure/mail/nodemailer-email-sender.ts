import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';
import type { EmailSenderPort } from '../../application/ports/email-sender.port';

@Injectable()
export class NodemailerEmailSender implements EmailSenderPort {
  private readonly transporter: Transporter;
  private readonly from: string;

  constructor(config: ConfigService) {
    this.from = config.getOrThrow<string>('mail.user');
    this.transporter = createTransport({
      service: 'gmail',
      auth: {
        user: this.from,
        pass: config.getOrThrow<string>('mail.appPassword'),
      },
    });
  }

  async sendVerificationEmail(to: string, verificationUrl: string): Promise<void> {
    await this.transporter.sendMail({
      from: this.from,
      to,
      subject: 'Vérifiez votre adresse email - Donjon Dragon',
      html: verificationEmailBody(verificationUrl),
    });
  }
}

function verificationEmailBody(verificationUrl: string): string {
  return `
    <p>Bienvenue sur Donjon Dragon !</p>
    <p>Cliquez sur le lien ci-dessous pour vérifier votre adresse email :</p>
    <p><a href="${verificationUrl}">${verificationUrl}</a></p>
    <p>Ce lien expire dans 24 heures.</p>
  `;
}
