import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma, Role } from '../generated/prisma/client.js';
import { hashPassword } from '../auth/password.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  AddStudentDto,
  CreateTeamDto,
  UpdateTeamDto,
} from './dto/team.dto.js';
import {
  generateStudentLogin,
  generateTemporaryPassword,
} from './student-accounts.js';

/** Kształty odpowiedzi jak w frontend/src/lib/koala-types.ts. */
export interface TeamCategoryView {
  id: string;
  name: string;
  minMembers: number;
  maxMembers: number;
}

export interface TeamSummary {
  id: string;
  name: string;
  categoryName: string;
  studentsCount: number;
}

export interface TeamStudent {
  id: string;
  firstName: string;
  login: string;
}

export interface TeamDetails extends TeamSummary {
  minMembers: number;
  maxMembers: number;
  students: TeamStudent[];
}

/** Dane logowania nowego ucznia – hasło widać tylko w tej odpowiedzi. */
export interface StudentCredentials {
  student: TeamStudent;
  login: string;
  temporaryPassword: string;
}

/** Ile razy losujemy nowy login, gdy wylosowany jest już zajęty. */
const LOGIN_ATTEMPTS = 5;

/**
 * Drużyny nauczyciela i konta uczniów (KOALA-12: KOALA-80/81/82).
 *
 * Nauczyciel widzi i zmienia wyłącznie własne drużyny – cudza drużyna
 * wygląda jak nieistniejąca (404), żeby nie zdradzać jej istnienia.
 * Maksymalny limit składu jest twardy; minimalny to tylko informacja
 * (`minMembers` w odpowiedzi), bo uczniów dodaje się pojedynczo.
 */
@Injectable()
export class TeamsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Kategorie wiekowe z limitami składu (do formularza nowej drużyny). */
  listCategories(): Promise<TeamCategoryView[]> {
    return this.prisma.teamCategory.findMany({
      select: { id: true, name: true, minMembers: true, maxMembers: true },
      orderBy: { name: 'asc' },
    });
  }

  /** Drużyny zalogowanego nauczyciela. */
  async listTeams(teacherId: string): Promise<TeamSummary[]> {
    const teams = await this.prisma.team.findMany({
      where: { teacherId },
      select: {
        id: true,
        name: true,
        category: { select: { name: true } },
        _count: { select: { students: true } },
      },
      orderBy: [{ createdAt: 'asc' }, { name: 'asc' }],
    });
    return teams.map((team) => ({
      id: team.id,
      name: team.name,
      categoryName: team.category.name,
      studentsCount: team._count.students,
    }));
  }

  /** Nowa (pusta) drużyna; nazwa unikalna w obrębie nauczyciela i kategorii. */
  async createTeam(
    teacherId: string,
    dto: CreateTeamDto,
  ): Promise<TeamSummary> {
    const category = await this.prisma.teamCategory.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category) {
      throw new BadRequestException('Wybrana kategoria wiekowa nie istnieje.');
    }
    const duplicate = await this.prisma.team.findFirst({
      where: {
        teacherId,
        categoryId: category.id,
        name: { equals: dto.name, mode: 'insensitive' },
      },
      select: { id: true },
    });
    if (duplicate) {
      throw new TeamNameTakenException();
    }
    try {
      const team = await this.prisma.team.create({
        data: { name: dto.name, categoryId: category.id, teacherId },
      });
      return {
        id: team.id,
        name: team.name,
        categoryName: category.name,
        studentsCount: 0,
      };
    } catch (error) {
      // Unikalny indeks (teacher_id, name) chroni przed wyścigiem dwóch żądań.
      if (isUniqueViolation(error)) {
        throw new TeamNameTakenException();
      }
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new UnauthorizedException(
          'Sesja wygasła lub konto nie istnieje. Zaloguj się ponownie.',
        );
      }
      throw error;
    }
  }

  /** Szczegóły drużyny ze składem i limitami kategorii. */
  async getTeam(teacherId: string, teamId: string): Promise<TeamDetails> {
    const team = await this.prisma.team.findFirst({
      where: { id: teamId, teacherId },
      select: {
        id: true,
        name: true,
        category: {
          select: { name: true, minMembers: true, maxMembers: true },
        },
        students: {
          select: { id: true, firstName: true, login: true },
          orderBy: [{ createdAt: 'asc' }, { firstName: 'asc' }],
        },
      },
    });
    if (!team) {
      throw new TeamNotFoundException();
    }
    return {
      id: team.id,
      name: team.name,
      categoryName: team.category.name,
      studentsCount: team.students.length,
      minMembers: team.category.minMembers,
      maxMembers: team.category.maxMembers,
      students: team.students.map(toTeamStudent),
    };
  }

  /**
   * Dodaje ucznia do drużyny: zakłada konto z unikalnym loginem i hasłem
   * jednorazowym (KOALA-82). Uczeń zmienia je przy pierwszym logowaniu.
   */
  async addStudent(
    teacherId: string,
    teamId: string,
    dto: AddStudentDto,
  ): Promise<StudentCredentials> {
    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await hashPassword(temporaryPassword);

    for (let attempt = 1; ; attempt++) {
      const login = generateStudentLogin(dto.firstName);
      try {
        const student = await this.prisma.$transaction(async (tx) => {
          // Blokada wiersza drużyny: równoległe dodawanie uczniów nie
          // przekroczy limitu, bo liczenie i zapis idą po kolei.
          const [team] = await tx.$queryRaw<Array<{ maxMembers: number }>>`
            SELECT c.max_members AS "maxMembers"
            FROM teams t
            JOIN team_categories c ON c.id = t.category_id
            WHERE t.id = ${teamId}::uuid AND t.teacher_id = ${teacherId}::uuid
            FOR UPDATE OF t`;
          if (!team) {
            throw new TeamNotFoundException();
          }
          const count = await tx.user.count({ where: { teamId } });
          if (count >= team.maxMembers) {
            throw new TeamFullException(team.maxMembers);
          }
          return tx.user.create({
            data: {
              login,
              passwordHash,
              mustChangePassword: true,
              role: Role.STUDENT,
              firstName: dto.firstName,
              lastName: '',
              teamId,
            },
            select: { id: true, firstName: true, login: true },
          });
        });
        return {
          student: toTeamStudent(student),
          login,
          temporaryPassword,
        };
      } catch (error) {
        // Wylosowany login jest zajęty – losujemy ponownie.
        if (isUniqueViolation(error) && attempt < LOGIN_ATTEMPTS) {
          continue;
        }
        throw error;
      }
    }
  }

  /** Zmienia nazwę drużyny (unikalna w obrębie nauczyciela i kategorii). */
  async updateTeam(
    teacherId: string,
    teamId: string,
    dto: UpdateTeamDto,
  ): Promise<TeamDetails> {
    const existing = await this.prisma.team.findFirst({
      where: { id: teamId, teacherId },
      select: { id: true, categoryId: true },
    });
    if (!existing) {
      throw new TeamNotFoundException();
    }
    const duplicate = await this.prisma.team.findFirst({
      where: {
        teacherId,
        categoryId: existing.categoryId,
        id: { not: teamId },
        name: { equals: dto.name, mode: 'insensitive' },
      },
      select: { id: true },
    });
    if (duplicate) {
      throw new TeamNameTakenException();
    }
    try {
      await this.prisma.team.update({
        where: { id: teamId },
        data: { name: dto.name },
      });
      return this.getTeam(teacherId, teamId);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new TeamNameTakenException();
      }
      throw error;
    }
  }

  /** Usuwa drużynę razem z kontami wszystkich jej uczniów. */
  async deleteTeam(teacherId: string, teamId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const team = await tx.team.findFirst({
        where: { id: teamId, teacherId },
        select: { id: true },
      });
      if (!team) {
        throw new TeamNotFoundException();
      }
      await tx.user.deleteMany({
        where: { teamId: team.id, role: Role.STUDENT },
      });
      await tx.team.delete({ where: { id: team.id } });
    });
  }

  /** Usuwa ucznia z drużyny razem z jego kontem (login się zwalnia). */
  async removeStudent(
    teacherId: string,
    teamId: string,
    studentId: string,
  ): Promise<void> {
    const team = await this.prisma.team.findFirst({
      where: { id: teamId, teacherId },
      select: { id: true },
    });
    if (!team) {
      throw new TeamNotFoundException();
    }
    const { count } = await this.prisma.user.deleteMany({
      where: { id: studentId, teamId: team.id, role: Role.STUDENT },
    });
    if (count === 0) {
      throw new StudentNotInTeamException();
    }
  }
}

function toTeamStudent(student: {
  id: string;
  firstName: string;
  login: string | null;
}): TeamStudent {
  return {
    id: student.id,
    firstName: student.firstName,
    login: student.login ?? '',
  };
}

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}

export class TeamNotFoundException extends NotFoundException {
  constructor() {
    super('Drużyna nie istnieje.');
  }
}

export class StudentNotInTeamException extends NotFoundException {
  constructor() {
    super('Uczeń nie należy do tej drużyny.');
  }
}

export class TeamNameTakenException extends ConflictException {
  constructor() {
    super('Masz już drużynę o tej nazwie w tej kategorii.');
  }
}

export class TeamFullException extends ConflictException {
  constructor(maxMembers: number) {
    super(
      `Drużyna ma już maksymalną liczbę uczniów (${maxMembers}) dla swojej kategorii.`,
    );
  }
}
