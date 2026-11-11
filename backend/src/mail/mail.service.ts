import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

export interface MailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/**
 * Wysyłka e-maili przez Resend. Bez RESEND_API_KEY (lokalnie, w testach)
 * wiadomość nie jest wysyłana, tylko wypisywana w logach.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend?: Resend;
  private readonly from: string;

  constructor(config: ConfigService) {
    const apiKey = config.get<string>('RESEND_API_KEY');
    this.resend = apiKey ? new Resend(apiKey) : undefined;
    this.from = config.get<string>(
      'MAIL_FROM',
      'Konkurs KOALA <onboarding@resend.dev>',
    );
  }

  async send(message: MailMessage): Promise<void> {
    if (!this.resend) {
      this.logger.warn(
        `Brak RESEND_API_KEY – e-mail nie został wysłany.\nDo: ${message.to}\nTemat: ${message.subject}\n${message.text}`,
      );
      return;
    }
    const { error } = await this.resend.emails.send({
      from: this.from,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });
    if (error) {
      throw new Error(`Resend: ${error.name}: ${error.message}`);
    }
  }
}
