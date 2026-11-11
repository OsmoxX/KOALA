import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import type { PublicUser } from '../users/users.service.js';
import { AuthService } from './auth.service.js';
import { RegisterTeacherDto } from './dto/register-teacher.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** POST /api/auth/register – założenie konta nauczyciela. */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: RegisterTeacherDto): Promise<PublicUser> {
    return this.auth.registerTeacher(dto);
  }
}
