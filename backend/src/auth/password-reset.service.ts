import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'node:crypto';
import { Role, type User } from '../generated/prisma/client.js';
import { MailService } from '../mail/mail.service.js';
import { passwordResetMessage } from '../mail/templates/password-reset.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { UsersService } from '../users/users.service.js';
import { hashPassword } from './password.js';

const sha256 = (value: string) =>
  createHash('sha256').update(value).digest('hex');

/** Kolejny e-mail resetu dla tego samego konta najwcześniej po tym czasie. */
const RESEND_COOLDOWN_MS = 60_000;

export interface PasswordResetInfo {
  /** OWN – użytkownik zmienia własne hasło; STUDENT – opiekun nadaje hasło uczniowi. */
  kind: 'OWN' | 'STUDENT';
  firstName: string;
  login: string | null;
}

/**
 * Reset hasła linkiem z e-maila (KOALA-86, treść e-maila: KOALA-89).
 *
 * Nauczyciel dostaje link na własny adres. Uczeń nie ma e-maila, więc link
 * trafia do opiekuna drużyny, który nadaje nowe hasło jednorazowe – uczeń
 * musi je zmienić przy najbliższym logowaniu.
 */
@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);
  private readonly ttlMinutes: number;
  private readonly resetUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
    private readonly mail: MailService,
    config: ConfigService,
  ) {
    this.ttlMinutes = Number(config.get('PASSWORD_RESET_TTL_MINUTES', 60));
    this.resetUrl = config.get<string>(
      'PASSWORD_RESET_URL',
      'http://localhost:3001/reset-hasla',
    );
  }

  /**
   * Prośba o reset. Odpowiedź API jest zawsze taka sama, więc nie da się
   * sprawdzić, czy dany e-mail/login istnieje.
   */
  async request(identifier: string): Promise<void> {
    const user = identifier.includes('@')
      ? await this.users.findByEmail(identifier)
      : await this.users.findByLogin(identifier);
    if (!user) return;

    const recipient = await this.recipientFor(user);
    if (!recipient) return;

    const recent = await this.prisma.passwordResetToken.findFirst({
      where: {
        userId: user.id,
        usedAt: null,
        createdAt: { gt: new Date(Date.now() - RESEND_COOLDOWN_MS) },
      },
    });
    if (recent) return;

    const token = randomBytes(32).toString('base64url');
    await this.prisma.$transaction([
      this.prisma.passwordResetToken.deleteMany({
        where: { userId: user.id, usedAt: null },
      }),
      this.prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: sha256(token),
          expiresAt: new Date(Date.now() + this.ttlMinutes * 60_000),
        },
      }),
    ]);

    const link = `${this.resetUrl}?token=${encodeURIComponent(token)}`;
    try {
      await this.mail.send(
        passwordResetMessage({
          to: recipient.email,
          recipientFirstName: recipient.firstName,
          link,
          expiresInMinutes: this.ttlMinutes,
          student: recipient.student,
        }),
      );
    } catch (error) {
      this.logger.error(
        `Nie udało się wysłać e-maila resetu hasła (konto ${user.id})`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  /** Dane do formularza nowego hasła (dla czyjego konta jest link). */
  async inspect(token: string): Promise<PasswordResetInfo> {
    const { user } = await this.findValid(token);
    return {
      kind: user.role === Role.STUDENT ? 'STUDENT' : 'OWN',
      firstName: user.firstName,
      login: user.login,
    };
  }

  /** Ustawia nowe hasło i unieważnia link. */
  async confirm(
    token: string,
    newPassword: string,
  ): Promise<PasswordResetInfo> {
    const { record, user } = await this.findValid(token);
    const isStudent = user.role === Role.STUDENT;
    const now = new Date();
    const passwordHash = await hashPassword(newPassword);
    await this.prisma.$transaction(async (tx) => {
      // Warunek usedAt: null chroni przed dwukrotnym użyciem tego samego linku.
      const used = await tx.passwordResetToken.updateMany({
        where: { id: record.id, usedAt: null },
        data: { usedAt: now },
      });
      if (used.count === 0) throw new InvalidResetLinkException();
      await tx.passwordResetToken.deleteMany({
        where: { userId: user.id, usedAt: null },
      });
      await tx.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          // Hasło ucznia zna opiekun, więc uczeń musi je zmienić na własne.
          mustChangePassword: isStudent,
          // Link z e-maila potwierdza też dostęp do skrzynki.
          ...(!isStudent && !user.emailVerifiedAt
            ? { emailVerifiedAt: now }
            : {}),
        },
      });
    });
    return {
      kind: isStudent ? 'STUDENT' : 'OWN',
      firstName: user.firstName,
      login: user.login,
    };
  }

  private async recipientFor(user: User) {
    if (user.role !== Role.STUDENT) {
      return user.email
        ? { email: user.email, firstName: user.firstName, student: undefined }
        : null;
    }
    if (!user.teamId || !user.login) return null;
    const team = await this.prisma.team.findUnique({
      where: { id: user.teamId },
      select: {
        name: true,
        teacher: { select: { email: true, firstName: true } },
      },
    });
    if (!team?.teacher.email) return null;
    return {
      email: team.teacher.email,
      firstName: team.teacher.firstName,
      student: {
        firstName: user.firstName,
        login: user.login,
        teamName: team.name,
      },
    };
  }

  private async findValid(token: string) {
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash: sha256(token) },
      include: { user: true },
    });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new InvalidResetLinkException();
    }
    return { record, user: record.user };
  }
}

export class InvalidResetLinkException extends BadRequestException {
  constructor() {
    super('Link do zmiany hasła jest nieprawidłowy lub wygasł. Poproś o nowy.');
  }
}
