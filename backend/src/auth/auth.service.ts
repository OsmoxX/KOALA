import {
  BadRequestException,
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
import { Role, type User } from '../generated/prisma/client.js';
import type { LoginDto } from './dto/login.dto.js';
import type { ChangePasswordDto } from './dto/password.dto.js';
import type { StudentLoginDto } from './dto/student-login.dto.js';
import { EmailVerificationService } from './email-verification.service.js';
import type { RegisterTeacherDto } from './dto/register-teacher.dto.js';
import type { AuthUser, JwtPayload } from './jwt-payload.js';
import { hashPassword, verifyPassword } from './password.js';

export interface LoginResult {
  accessToken: string;
  tokenType: 'Bearer';
  /** true – trzeba najpierw zmienić hasło jednorazowe (token ma ograniczony dostęp). */
  mustChangePassword: boolean;
  user: PublicUser;
}

export interface StudentLoginResult {
  accessToken: string;
  tokenType: 'Bearer';
  mustChangePassword: boolean;
  user: { id: string; firstName: string; login: string; role: Role };
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
    const user = await this.checkPassword(
      await this.users.findByEmail(dto.email),
      dto.password,
    );
    if (!user) {
      throw new InvalidCredentialsException();
    }
    if (!user.emailVerifiedAt) {
      throw new ForbiddenException(
        'Konto nie jest aktywne. Potwierdź adres e-mail, klikając link z wiadomości.',
      );
    }
    return {
      accessToken: await this.issueToken(user),
      tokenType: 'Bearer',
      mustChangePassword: user.mustChangePassword,
      user: toPublicUser(user),
    };
  }

  /**
   * Logowanie ucznia loginem i hasłem od nauczyciela (KOALA-14, KOALA-85).
   * Przy haśle jednorazowym token pozwala tylko na zmianę hasła.
   */
  async loginStudent(dto: StudentLoginDto): Promise<StudentLoginResult> {
    const found = await this.users.findByLogin(dto.login);
    const user = await this.checkPassword(
      found?.role === Role.STUDENT ? found : null,
      dto.password,
    );
    if (!user?.login) {
      throw new InvalidStudentCredentialsException();
    }
    return {
      accessToken: await this.issueToken(user),
      tokenType: 'Bearer',
      mustChangePassword: user.mustChangePassword,
      user: {
        id: user.id,
        firstName: user.firstName,
        login: user.login,
        role: user.role,
      },
    };
  }

  /**
   * Sprawdza hasło. Gdy konta nie ma, i tak liczy skrót, żeby czas
   * odpowiedzi nie zdradzał, czy e-mail/login istnieje.
   */
  private async checkPassword(
    user: User | null,
    password: string,
  ): Promise<User | null> {
    if (!user) {
      this.dummyHash ??= hashPassword('koala-dummy-password');
      await verifyPassword(await this.dummyHash, password);
      return null;
    }
    return (await verifyPassword(user.passwordHash, password)) ? user : null;
  }

  private issueToken(user: User): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      role: user.role,
      email: user.email,
      login: user.login,
      ...(user.mustChangePassword ? { pwdChange: true } : {}),
    };
    return this.jwt.signAsync(payload);
  }

  /**
   * Zmiana hasła po zalogowaniu (m.in. wymuszona zmiana hasła jednorazowego
   * ucznia przy pierwszym logowaniu – KOALA-14).
   */
  async changePassword(
    authUser: AuthUser,
    dto: ChangePasswordDto,
  ): Promise<void> {
    const user = await this.users.findById(authUser.sub);
    if (
      !user ||
      !(await verifyPassword(user.passwordHash, dto.currentPassword))
    ) {
      throw new BadRequestException('Aktualne hasło jest nieprawidłowe.');
    }
    if (dto.newPassword === dto.currentPassword) {
      throw new BadRequestException(
        'Nowe hasło musi różnić się od poprzedniego.',
      );
    }
    await this.users.updatePassword(
      user.id,
      await hashPassword(dto.newPassword),
    );
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

export class InvalidStudentCredentialsException extends UnauthorizedException {
  constructor() {
    super('Nieprawidłowy login lub hasło.');
  }
}
