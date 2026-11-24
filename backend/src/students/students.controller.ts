import { Controller, Get, UseGuards } from '@nestjs/common';
import { Role } from '../generated/prisma/client.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import type { AuthUser } from '../auth/jwt-payload.js';
import { Roles } from '../auth/roles.decorator.js';
import { type StudentProfile, StudentsService } from './students.service.js';

@Controller('students')
@UseGuards(JwtAuthGuard)
@Roles(Role.STUDENT)
export class StudentsController {
  constructor(private readonly students: StudentsService) {}

  /** GET /api/students/me – profil zalogowanego ucznia i jego drużyna. */
  @Get('me')
  me(@CurrentUser() user: AuthUser): Promise<StudentProfile> {
    return this.students.getProfile(user.sub);
  }
}
