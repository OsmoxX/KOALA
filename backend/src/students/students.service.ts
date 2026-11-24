import { Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

/** Profil ucznia zwracany przez GET /api/students/me (kształt jak we frontendzie). */
export interface StudentProfile {
  id: string;
  firstName: string;
  login: string;
  team: {
    id: string;
    name: string;
    schoolName: string;
    categoryName: string;
    members: Array<{ id: string; firstName: string }>;
  } | null;
}

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Profil zalogowanego ucznia: dane, jego drużyna i jej członkowie.
   * Zwraca wyłącznie drużynę tego ucznia – nigdy innych (KOALA-14).
   */
  async getProfile(userId: string): Promise<StudentProfile> {
    const student = await this.prisma.user.findFirst({
      where: { id: userId, role: Role.STUDENT },
      select: {
        id: true,
        firstName: true,
        login: true,
        team: {
          select: {
            id: true,
            name: true,
            category: { select: { name: true } },
            teacher: { select: { teacherProfile: true } },
            students: {
              select: { id: true, firstName: true },
              orderBy: [{ firstName: 'asc' }, { createdAt: 'asc' }],
            },
          },
        },
      },
    });
    if (!student?.login) {
      throw new NotFoundException('Konto ucznia nie istnieje.');
    }
    const { team } = student;
    return {
      id: student.id,
      firstName: student.firstName,
      login: student.login,
      team: team && {
        id: team.id,
        name: team.name,
        schoolName: team.teacher.teacherProfile?.schoolName ?? '',
        categoryName: team.category.name,
        members: team.students,
      },
    };
  }
}
