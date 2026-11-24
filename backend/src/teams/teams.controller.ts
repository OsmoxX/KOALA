import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Role } from '../generated/prisma/client.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import type { AuthUser } from '../auth/jwt-payload.js';
import { Roles } from '../auth/roles.decorator.js';
import { AddStudentDto, CreateTeamDto, UpdateTeamDto } from './dto/team.dto.js';
import {
  type StudentCredentials,
  StudentNotInTeamException,
  type TeamCategoryView,
  type TeamDetails,
  TeamNotFoundException,
  TeamsService,
  type TeamSummary,
} from './teams.service.js';

/** Niepoprawne id w ścieżce traktujemy jak nieistniejący zasób (404). */
const TeamIdPipe = new ParseUUIDPipe({
  exceptionFactory: () => new TeamNotFoundException(),
});
const StudentIdPipe = new ParseUUIDPipe({
  exceptionFactory: () => new StudentNotInTeamException(),
});

/** Zarządzanie drużynami przez nauczyciela-opiekuna (KOALA-12). */
@Controller('teams')
@UseGuards(JwtAuthGuard)
@Roles(Role.TEACHER)
export class TeamsController {
  constructor(private readonly teams: TeamsService) {}

  /** GET /api/teams/categories – kategorie wiekowe z limitami składu. */
  @Get('categories')
  categories(): Promise<TeamCategoryView[]> {
    return this.teams.listCategories();
  }

  /** GET /api/teams – drużyny zalogowanego nauczyciela. */
  @Get()
  list(@CurrentUser() user: AuthUser): Promise<TeamSummary[]> {
    return this.teams.listTeams(user.sub);
  }

  /** POST /api/teams – nowa drużyna `{ name, categoryId }`. */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateTeamDto,
  ): Promise<TeamSummary> {
    return this.teams.createTeam(user.sub, dto);
  }

  /** GET /api/teams/:id – szczegóły drużyny ze składem i limitami. */
  @Get(':id')
  details(
    @CurrentUser() user: AuthUser,
    @Param('id', TeamIdPipe) id: string,
  ): Promise<TeamDetails> {
    return this.teams.getTeam(user.sub, id);
  }

  /** PATCH /api/teams/:id – zmiana nazwy drużyny `{ name }`. */
  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', TeamIdPipe) id: string,
    @Body() dto: UpdateTeamDto,
  ): Promise<TeamDetails> {
    return this.teams.updateTeam(user.sub, id, dto);
  }

  /** DELETE /api/teams/:id – usuwa drużynę i konta wszystkich jej uczniów. */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id', TeamIdPipe) id: string,
  ): Promise<void> {
    return this.teams.deleteTeam(user.sub, id);
  }

  /**
   * POST /api/teams/:id/students – dodaje ucznia `{ firstName }` i zwraca
   * jego login oraz hasło jednorazowe (pokazywane tylko raz).
   */
  @Post(':id/students')
  @HttpCode(HttpStatus.CREATED)
  addStudent(
    @CurrentUser() user: AuthUser,
    @Param('id', TeamIdPipe) id: string,
    @Body() dto: AddStudentDto,
  ): Promise<StudentCredentials> {
    return this.teams.addStudent(user.sub, id, dto);
  }

  /** DELETE /api/teams/:id/students/:studentId – usuwa ucznia i jego konto. */
  @Delete(':id/students/:studentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeStudent(
    @CurrentUser() user: AuthUser,
    @Param('id', TeamIdPipe) id: string,
    @Param('studentId', StudentIdPipe) studentId: string,
  ): Promise<void> {
    return this.teams.removeStudent(user.sub, id, studentId);
  }
}
