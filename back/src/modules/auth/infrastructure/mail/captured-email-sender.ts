import { writeFile } from 'node:fs/promises';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { EmailSenderPort } from '../../application/ports/email-sender.port';

@Injectable()
export class CapturedEmailSender implements EmailSenderPort {
  constructor(private readonly config: ConfigService) {}

  async sendVerificationEmail(_to: string, verificationUrl: string): Promise<void> {
    const capturePath = this.config.getOrThrow<string>('mail.capturePath');
    await writeFile(capturePath, verificationUrl, 'utf8');
  }
}
