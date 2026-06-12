import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from 'src/prisma/prisma.service';

import { CreateContactDto } from './dto/create-contact.dto';
import { MailService } from './mail.service';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Handles a contact-form submission: emails the site owner and records the
   * message in the database so it can be reviewed from the dashboard later.
   *
   * The message is always persisted (even when undelivered), with a `delivered`
   * flag reflecting whether the email actually went out. Recipient resolution:
   * CONTACT_TO env override → owner's settings.contactEmail. Returns
   * `{ delivered: false }` (rather than erroring) when email isn't configured or
   * no recipient exists, so the client can fall back to a pre-filled mailto:
   * link. A real provider failure persists the message, then surfaces as 503.
   */
  async submit(dto: CreateContactDto): Promise<{ delivered: boolean }> {
    const recipient = await this.resolveRecipient();
    let delivered = false;

    if (this.mailService.isConfigured && recipient) {
      try {
        delivered = await this.mailService.send({
          to: recipient,
          replyTo: dto.email,
          subject: `[Portfolio] ${dto.subject}`,
          text: this.buildBody(dto),
        });
      } catch {
        // Record the attempt before surfacing the failure so nothing is lost.
        await this.persist(dto, false);
        throw new ServiceUnavailableException(
          'Could not send your message right now. Please email me directly.',
        );
      }
    } else if (!recipient) {
      this.logger.warn(
        'Contact submission could not resolve a recipient email.',
      );
    }

    await this.persist(dto, delivered);
    return { delivered };
  }

  private persist(dto: CreateContactDto, delivered: boolean) {
    return this.prisma.contactMessage.create({
      data: {
        name: dto.name,
        email: dto.email,
        subject: dto.subject,
        message: dto.message,
        delivered,
      },
    });
  }

  private async resolveRecipient(): Promise<string | null> {
    const override = this.configService.get<string>('mail.to');
    if (override) return override;

    const settings = await this.prisma.settings.findFirst({
      select: { contactEmail: true },
    });
    return settings?.contactEmail?.trim() || null;
  }

  private buildBody(dto: CreateContactDto): string {
    return [
      'New message from your portfolio contact form',
      '',
      `From: ${dto.name} <${dto.email}>`,
      `Subject: ${dto.subject}`,
      '',
      dto.message,
    ].join('\n');
  }
}
