import { SetMetadata } from '@nestjs/common';
import type { Role } from '../generated/prisma/client.js';

export const ROLES_KEY = 'koala:roles';
export const ALLOW_PENDING_PASSWORD_CHANGE_KEY =
  'koala:allow-pending-password-change';

/**
 * Ogranicza endpoint do podanych ról (RBAC, FR-05). Wymaga JwtAuthGuard,
 * który odrzuca też role spoza listy.
 *
 * @example
 * @UseGuards(JwtAuthGuard)
 * @Roles(Role.STUDENT)
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

/**
 * Endpoint dostępny również wtedy, gdy użytkownik musi jeszcze zmienić
 * hasło jednorazowe (np. sama zmiana hasła). Domyślnie taki token jest
 * odrzucany wszędzie indziej.
 */
export const AllowPendingPasswordChange = () =>
  SetMetadata(ALLOW_PENDING_PASSWORD_CHANGE_KEY, true);
