import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma, Role, type User } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

export interface CreateTeacherInput {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  schoolName: string;
  schoolCity: string;
}

/** Dane użytkownika bezpieczne do zwrócenia przez API (bez skrótu hasła). */
export type PublicUser = Omit<User, 'passwordHash'>;

export function toPublicUser(user: User): PublicUser {
  const { passwordHash: _passwordHash, ...rest } = user;
  return rest;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
  }

  /** Konto po loginie ucznia (bez rozróżniania wielkości liter). */
  findByLogin(login: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { login: login.trim().toLowerCase() },
    });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  /** Nowe hasło wybrane przez użytkownika – kończy tryb hasła jednorazowego. */
  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { passwordHash, mustChangePassword: false },
    });
  }

  async createTeacher(input: CreateTeacherInput): Promise<User> {
    try {
      return await this.prisma.user.create({
        data: {
          email: input.email.trim().toLowerCase(),
          passwordHash: input.passwordHash,
          role: Role.TEACHER,
          firstName: input.firstName,
          lastName: input.lastName,
          termsAcceptedAt: new Date(),
          teacherProfile: {
            create: {
              schoolName: input.schoolName,
              schoolCity: input.schoolCity,
            },
          },
        },
      });
    } catch (error) {
      // Unikalny indeks na e-mailu chroni też przed wyścigiem dwóch rejestracji.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new EmailTakenException();
      }
      throw error;
    }
  }
}

export class EmailTakenException extends ConflictException {
  constructor() {
    super('Konto z tym adresem e-mail już istnieje.');
  }
}
