import { Injectable } from '@nestjs/common';
import {
  EmailTakenException,
  type PublicUser,
  toPublicUser,
  UsersService,
} from '../users/users.service.js';
import type { RegisterTeacherDto } from './dto/register-teacher.dto.js';
import { hashPassword } from './password.js';

@Injectable()
export class AuthService {
  constructor(private readonly users: UsersService) {}

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
    return toPublicUser(user);
  }
}
