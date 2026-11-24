import { randomInt } from 'node:crypto';

/** Znaki sufiksu loginu (KOALA-82). */
const LOGIN_SUFFIX_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';
const LOGIN_SUFFIX_LENGTH = 4;
const LOGIN_BASE_MAX_LENGTH = 20;
/** Gdy z imienia nie zostanie żadna litera (np. same cyfry/znaki). */
const LOGIN_FALLBACK_BASE = 'uczen';

/** Bez znaków łatwych do pomylenia przy przepisywaniu: 0/O, 1/l/I. */
const LOWER = 'abcdefghijkmnopqrstuvwxyz';
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const DIGITS = '23456789';
export const TEMPORARY_PASSWORD_LENGTH = 10;

const pick = (chars: string) => chars[randomInt(chars.length)];

/**
 * Część loginu z imienia: małe litery a–z bez polskich znaków
 * (np. „Łucja Żaneta” → „lucjazaneta”).
 */
export function loginBase(firstName: string): string {
  const base = firstName
    .toLowerCase()
    .replace(/ł/g, 'l')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z]/g, '')
    .slice(0, LOGIN_BASE_MAX_LENGTH);
  return base || LOGIN_FALLBACK_BASE;
}

/** Login ucznia: `imie.xxxx`, gdzie xxxx to losowe [a-z0-9] (np. „ola.k7f3”). */
export function generateStudentLogin(firstName: string): string {
  let suffix = '';
  for (let i = 0; i < LOGIN_SUFFIX_LENGTH; i++) {
    suffix += pick(LOGIN_SUFFIX_CHARS);
  }
  return `${loginBase(firstName)}.${suffix}`;
}

/**
 * Hasło jednorazowe ucznia (losowe, kryptograficznie). Zawsze ma małą
 * i wielką literę oraz cyfrę, więc spełnia te same zasady co hasło własne.
 */
export function generateTemporaryPassword(): string {
  const all = LOWER + UPPER + DIGITS;
  const chars = [pick(LOWER), pick(UPPER), pick(DIGITS)];
  while (chars.length < TEMPORARY_PASSWORD_LENGTH) {
    chars.push(pick(all));
  }
  // Fisher–Yates, żeby wymagane znaki nie stały zawsze na początku.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}
