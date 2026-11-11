import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { AuthUser, JwtPayload } from './jwt-payload.js';

export type AuthenticatedRequest = Request & { user: AuthUser };

/** Wymaga nagłówka `Authorization: Bearer <token>` z ważnym tokenem JWT. */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Brak tokenu dostępowego.');
    }
    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token);
      request.user = {
        sub: payload.sub,
        email: payload.email,
        role: payload.role,
      };
    } catch {
      throw new UnauthorizedException('Token jest nieprawidłowy lub wygasł.');
    }
    return true;
  }
}
