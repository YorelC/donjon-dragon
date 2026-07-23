// Port agnostique du fournisseur. L'adapter (nodemailer/Gmail SMTP) est un
// détail d'infra (GREEN) : le domaine ne connaît que cette interface.
export interface EmailSenderPort {
  sendVerificationEmail(to: string, verificationUrl: string): Promise<void>;
}
