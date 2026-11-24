import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'node:crypto';
import type { User } from '../generated/prisma/client.js';
import { MailService } from '../mail/mail.service.js';
import { verifyEmailMessage } from '../mail/templates/verify-email.js';
import { PrismaService } from '../prisma/prisma.service.js';

const sha256 = (value: string) =>
  createHash('sha256').update(value).digest('hex');

/** Weryfikacja adresu e-mail linkiem aktywacyjnym (KOALA-10, KOALA-77). */
@Injectable()
export class EmailVerificationService {
  private readonly logger = new Logger(EmailVerificationService.name);
  private readonly ttlHours: number;
  private readonly verifyUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    config: ConfigService,
  ) {
    this.ttlHours = Number(config.get('EMAIL_VERIFICATION_TTL_HOURS', 24));
    this.verifyUrl = config.get<string>(
      'EMAIL_VERIFICATION_URL',
      'http://localhost:3001/weryfikacja-email',
    );
  }

  /**
   * Tworzy nowy token (unieważniając poprzednie) i wysyła link.
   * Błąd wysyłki jest logowany, ale nie przerywa rejestracji –
   * użytkownik może poprosić o ponowne wysłanie.
   */
  async sendVerificationEmail(user: User): Promise<void> {
    if (!user.email) return; // np. konto ucznia – nie ma czego weryfikować
    const { email } = user;
    const token = randomBytes(32).toString('base64url');
    await this.prisma.$transaction([
      this.prisma.emailVerificationToken.deleteMany({
        where: { userId: user.id, usedAt: null },
      }),
      this.prisma.emailVerificationToken.create({
        data: {
          userId: user.id,
          tokenHash: sha256(token),
          expiresAt: new Date(Date.now() + this.ttlHours * 3_600_000),
        },
      }),
    ]);

    const link = `${this.verifyUrl}?token=${encodeURIComponent(token)}`;
    try {
      await this.mail.send(
        verifyEmailMessage({
          to: email,
          firstName: user.firstName,
          link,
          expiresInHours: this.ttlHours,
        }),
      );
    } catch (error) {
      this.logger.error(
        `Nie udało się wysłać e-maila weryfikacyjnego do użytkownika ${user.id}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  /** Aktywuje konto na podstawie tokenu z linku. */
  async verify(token: string): Promise<void> {
    const record = await this.prisma.emailVerificationToken.findUnique({
      where: { tokenHash: sha256(token) },
    });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new BadRequestException(
        'Link weryfikacyjny jest nieprawidłowy lub wygasł. Poproś o nowy.',
      );
    }
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.emailVerificationToken.update({
        where: { id: record.id },
        data: { usedAt: now },
      }),
      this.prisma.user.updateMany({
        where: { id: record.userId, emailVerifiedAt: null },
        data: { emailVerifiedAt: now },
      }),
    ]);
  }
}
