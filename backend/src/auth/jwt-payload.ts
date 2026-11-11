import type { Role } from '../generated/prisma/client.js';

/** Zawartość tokenu dostępowego JWT. */
export interface JwtPayload {
  /** id użytkownika */
  sub: string;
  email: string;
  role: Role;
}

/** Użytkownik dołączany do żądania przez JwtAuthGuard. */
export type AuthUser = JwtPayload;
