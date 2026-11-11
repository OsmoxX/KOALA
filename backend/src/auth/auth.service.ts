import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  EmailTakenException,
  type PublicUser,
  toPublicUser,
  UsersService,
} from '../users/users.service.js';
import type { LoginDto } from './dto/login.dto.js';
import { EmailVerificationService } from './email-verification.service.js';
import type { RegisterTeacherDto } from './dto/register-teacher.dto.js';
import type { AuthUser, JwtPayload } from './jwt-payload.js';
import { hashPassword, verifyPassword } from './password.js';

export interface LoginResult {
  accessToken: string;
  tokenType: 'Bearer';
  user: PublicUser;
}

@Injectable()
export class AuthService {
  /** Skrót używany, gdy konto nie istnieje, żeby czas odpowiedzi nie zdradzał e-maili. */
  private dummyHash?: Promise<string>;

  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly emailVerification: EmailVerificationService,
  ) {}

  /** Rejestracja nauczyciela (KOALA-10). Konto czeka na weryfikację e-mail. */
  async registerTeacher(dto: RegisterTeacherDto): Promise<PublicUser> {
    if (await this.users.findByEmail(dto.email)) {
      throw new EmailTakenException();
    }
    const user = await this.users.createTeacher({
      email: dto.email,
      passwordHash: await hashPassword(dto.password),
      firstName: dto.firstName,
      lastName: dto.lastName,
      schoolName: dto.schoolName,
      schoolCity: dto.schoolCity,
    });
    await this.emailVerification.sendVerificationEmail(user);
    return toPublicUser(user);
  }

  /** Logowanie e-mailem i hasłem; zwraca token dostępowy JWT. */
  async login(dto: LoginDto): Promise<LoginResult> {
    const user = await this.users.findByEmail(dto.email);
    if (!user) {
      this.dummyHash ??= hashPassword('koala-dummy-password');
      await verifyPassword(await this.dummyHash, dto.password);
      throw new InvalidCredentialsException();
    }
    if (!(await verifyPassword(user.passwordHash, dto.password))) {
      throw new InvalidCredentialsException();
    }
    if (!user.emailVerifiedAt) {
      throw new ForbiddenException(
        'Konto nie jest aktywne. Potwierdź adres e-mail, klikając link z wiadomości.',
      );
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    return {
      accessToken: await this.jwt.signAsync(payload),
      tokenType: 'Bearer',
      user: toPublicUser(user),
    };
  }

  verifyEmail(token: string): Promise<void> {
    return this.emailVerification.verify(token);
  }

  /** Ponowna wysyłka linku; odpowiedź nie zdradza, czy konto istnieje. */
  async resendVerification(email: string): Promise<void> {
    const user = await this.users.findByEmail(email);
    if (user && !user.emailVerifiedAt) {
      await this.emailVerification.sendVerificationEmail(user);
    }
  }

  async me(authUser: AuthUser): Promise<PublicUser> {
    const user = await this.users.findById(authUser.sub);
    if (!user) {
      throw new NotFoundException('Użytkownik nie istnieje.');
    }
    return toPublicUser(user);
  }
}

export class InvalidCredentialsException extends UnauthorizedException {
  constructor() {
    super('Nieprawidłowy e-mail lub hasło.');
  }
}
