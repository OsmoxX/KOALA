import type { Role } from '../generated/prisma/client.js';

/** Zawartość tokenu dostępowego JWT. */
export interface JwtPayload {
  /** id użytkownika */
  sub: string;
  role: Role;
  /** E-mail (nauczyciel i pozostałe role); uczeń go nie ma. */
  email: string | null;
  /** Login ucznia; u pozostałych ról null. */
  login: string | null;
  /**
   * Konto ma hasło jednorazowe do zmiany. Taki token pozwala tylko na
   * endpointy oznaczone `@AllowPendingPasswordChange()` (KOALA-85).
   */
  pwdChange?: boolean;
}

/** Użytkownik dołączany do żądania przez JwtAuthGuard. */
export type AuthUser = JwtPayload;
