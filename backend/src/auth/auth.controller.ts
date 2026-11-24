import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { PublicUser } from '../users/users.service.js';
import {
  AuthService,
  type LoginResult,
  type StudentLoginResult,
} from './auth.service.js';
import { CurrentUser } from './current-user.decorator.js';
import { LoginDto } from './dto/login.dto.js';
import { StudentLoginDto } from './dto/student-login.dto.js';
import {
  ResendVerificationDto,
  VerifyEmailDto,
} from './dto/verify-email.dto.js';
import { RegisterTeacherDto } from './dto/register-teacher.dto.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { AllowPendingPasswordChange, Roles } from './roles.decorator.js';
import {
  ChangePasswordDto,
  ConfirmPasswordResetDto,
  PasswordResetTokenDto,
  RequestPasswordResetDto,
} from './dto/password.dto.js';
import {
  type PasswordResetInfo,
  PasswordResetService,
} from './password-reset.service.js';
import { Role } from '../generated/prisma/client.js';
import type { AuthUser } from './jwt-payload.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly passwordReset: PasswordResetService,
  ) {}

  /** POST /api/auth/register – założenie konta nauczyciela. */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: RegisterTeacherDto): Promise<PublicUser> {
    return this.auth.registerTeacher(dto);
  }

  /** POST /api/auth/login – logowanie, zwraca token JWT. */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto): Promise<LoginResult> {
    return this.auth.login(dto);
  }

  /** POST /api/auth/student/login – logowanie ucznia loginem i hasłem. */
  @Post('student/login')
  @HttpCode(HttpStatus.OK)
  loginStudent(@Body() dto: StudentLoginDto): Promise<StudentLoginResult> {
    return this.auth.loginStudent(dto);
  }

  /** POST /api/auth/verify-email – aktywacja konta tokenem z linku. */
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() dto: VerifyEmailDto): Promise<{ message: string }> {
    await this.auth.verifyEmail(dto.token);
    return {
      message: 'Adres e-mail został potwierdzony. Możesz się zalogować.',
    };
  }

  /** POST /api/auth/resend-verification – ponowne wysłanie linku. */
  @Post('resend-verification')
  @HttpCode(HttpStatus.ACCEPTED)
  async resendVerification(
    @Body() dto: ResendVerificationDto,
  ): Promise<{ message: string }> {
    await this.auth.resendVerification(dto.email);
    return {
      message:
        'Jeśli konto istnieje i nie jest jeszcze aktywne, wysłaliśmy nowy link.',
    };
  }

  /**
   * POST /api/auth/student/change-password – zmiana hasła ucznia, także
   * wymuszona zmiana hasła jednorazowego po pierwszym logowaniu.
   * Po zmianie trzeba zalogować się ponownie (stary token nadal ma flagę).
   */
  @Post('student/change-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @Roles(Role.STUDENT)
  @AllowPendingPasswordChange()
  async changeStudentPassword(
    @CurrentUser() user: AuthUser,
    @Body() dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    await this.auth.changePassword(user, dto);
    return { message: 'Hasło zostało zmienione. Zaloguj się nowym hasłem.' };
  }

  /**
   * POST /api/auth/password-reset/request – prośba o link do nowego hasła.
   * Pole `login`: e-mail nauczyciela albo login ucznia (wtedy mail do opiekuna).
   */
  @Post('password-reset/request')
  @HttpCode(HttpStatus.ACCEPTED)
  async requestPasswordReset(
    @Body() dto: RequestPasswordResetDto,
  ): Promise<{ message: string }> {
    await this.passwordReset.request(dto.login);
    return {
      message:
        'Jeśli konto istnieje, wysłaliśmy link do ustawienia nowego hasła. Uczniowie: link otrzyma nauczyciel-opiekun drużyny.',
    };
  }

  /** POST /api/auth/password-reset/verify – sprawdza link i mówi, czyje to konto. */
  @Post('password-reset/verify')
  @HttpCode(HttpStatus.OK)
  verifyPasswordReset(
    @Body() dto: PasswordResetTokenDto,
  ): Promise<PasswordResetInfo> {
    return this.passwordReset.inspect(dto.token);
  }

  /** POST /api/auth/password-reset/confirm – ustawia nowe hasło z linku. */
  @Post('password-reset/confirm')
  @HttpCode(HttpStatus.OK)
  async confirmPasswordReset(
    @Body() dto: ConfirmPasswordResetDto,
  ): Promise<PasswordResetInfo & { message: string }> {
    const info = await this.passwordReset.confirm(dto.token, dto.newPassword);
    return {
      ...info,
      message:
        info.kind === 'STUDENT'
          ? 'Ustawiono nowe hasło jednorazowe. Przekaż je uczniowi – przy logowaniu ustawi własne.'
          : 'Hasło zostało zmienione. Możesz się zalogować.',
    };
  }

  /** GET /api/auth/me – dane zalogowanego użytkownika (dowolna rola). */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @AllowPendingPasswordChange()
  me(@CurrentUser() user: AuthUser): Promise<PublicUser> {
    return this.auth.me(user);
  }
}
