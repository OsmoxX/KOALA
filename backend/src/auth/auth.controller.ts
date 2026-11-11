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
import { AuthService, type LoginResult } from './auth.service.js';
import { CurrentUser } from './current-user.decorator.js';
import { LoginDto } from './dto/login.dto.js';
import {
  ResendVerificationDto,
  VerifyEmailDto,
} from './dto/verify-email.dto.js';
import { RegisterTeacherDto } from './dto/register-teacher.dto.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import type { AuthUser } from './jwt-payload.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

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

  /** GET /api/auth/me – dane zalogowanego użytkownika. */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthUser): Promise<PublicUser> {
    return this.auth.me(user);
  }
}
