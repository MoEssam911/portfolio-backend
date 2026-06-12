import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

export interface SendMailInput {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
}

/**
 * Thin wrapper around Resend. Kept separate from ContactService so email
 * delivery can be reused or swapped (e.g. another provider) without touching the
 * contact orchestration. When no API key is configured `isConfigured` is false
 * and callers should degrade gracefully (mailto: fallback on the client).
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend: Resend | null;
  private readonly from: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('mail.resendApiKey') ?? '';
    this.from = this.configService.get<string>('mail.from') ?? '';
    this.resend = apiKey ? new Resend(apiKey) : null;
  }

  get isConfigured(): boolean {
    return this.resend !== null;
  }

  /**
   * Sends an email. Returns true on success. Throws on a real provider failure so
   * the caller can surface a 5xx; returns false only when the mailer is unconfigured.
   */
  async send(input: SendMailInput): Promise<boolean> {
    if (!this.resend) {
      return false;
    }

    const { error } = await this.resend.emails.send({
      from: this.from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      replyTo: input.replyTo,
    });

    if (error) {
      this.logger.error(
        `Resend delivery failed: ${error.name} — ${error.message}`,
      );
      throw new Error('Email delivery failed');
    }

    return true;
  }
}
