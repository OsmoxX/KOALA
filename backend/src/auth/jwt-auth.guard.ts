import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { Role } from '../generated/prisma/client.js';
import type { AuthUser, JwtPayload } from './jwt-payload.js';
import {
  ALLOW_PENDING_PASSWORD_CHANGE_KEY,
  ROLES_KEY,
} from './roles.decorator.js';

export type AuthenticatedRequest = Request & { user: AuthUser };

/**
 * Wymaga nagłówka `Authorization: Bearer <token>` z ważnym tokenem JWT.
 * Sprawdza też role z `@Roles(...)` oraz blokuje konta, które muszą
 * najpierw zmienić hasło jednorazowe.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Brak tokenu dostępowego.');
    }
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Token jest nieprawidłowy lub wygasł.');
    }
    request.user = {
      sub: payload.sub,
      role: payload.role,
      email: payload.email ?? null,
      login: payload.login ?? null,
      ...(payload.pwdChange ? { pwdChange: true } : {}),
    };

    const targets = [context.getHandler(), context.getClass()];
    if (
      payload.pwdChange &&
      !this.reflector.getAllAndOverride<boolean>(
        ALLOW_PENDING_PASSWORD_CHANGE_KEY,
        targets,
      )
    ) {
      throw new ForbiddenException({
        message: 'Najpierw zmień hasło jednorazowe na własne.',
        code: 'PASSWORD_CHANGE_REQUIRED',
      });
    }

    const roles = this.reflector.getAllAndOverride<Role[] | undefined>(
      ROLES_KEY,
      targets,
    );
    if (roles?.length && !roles.includes(payload.role)) {
      throw new ForbiddenException('Brak uprawnień do tego zasobu.');
    }
    return true;
  }
}
