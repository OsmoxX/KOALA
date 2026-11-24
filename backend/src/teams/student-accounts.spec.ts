import {
  generateStudentLogin,
  generateTemporaryPassword,
  loginBase,
  TEMPORARY_PASSWORD_LENGTH,
} from './student-accounts.js';

describe('generowanie kont uczniów (KOALA-82)', () => {
  describe('loginBase', () => {
    it('zamienia imię na małe litery bez polskich znaków', () => {
      expect(loginBase('Ola')).toBe('ola');
      expect(loginBase('Łucja')).toBe('lucja');
      expect(loginBase('ŻANETA')).toBe('zaneta');
      expect(loginBase('Gżegżółka Ćma')).toBe('gzegzolkacma');
    });

    it('usuwa znaki spoza a–z i skraca długie imiona', () => {
      expect(loginBase("Anna-Maria O'Neil")).toBe('annamariaoneil');
      expect(loginBase('a'.repeat(50))).toHaveLength(20);
    });

    it('bez liter używa zastępczej nazwy', () => {
      expect(loginBase('123 !!')).toBe('uczen');
      expect(loginBase('李')).toBe('uczen');
    });
  });

  describe('generateStudentLogin', () => {
    it('ma format imie.xxxx', () => {
      expect(generateStudentLogin('Zofia')).toMatch(/^zofia\.[a-z0-9]{4}$/);
    });

    it('sufiks jest losowy', () => {
      const logins = new Set(
        Array.from({ length: 50 }, () => generateStudentLogin('Ola')),
      );
      expect(logins.size).toBeGreaterThan(45);
    });
  });

  describe('generateTemporaryPassword', () => {
    it('spełnia zasady hasła i nie zawiera mylących znaków', () => {
      for (let i = 0; i < 200; i++) {
        const password = generateTemporaryPassword();
        expect(password).toHaveLength(TEMPORARY_PASSWORD_LENGTH);
        expect(password).toMatch(/[a-z]/);
        expect(password).toMatch(/[A-Z]/);
        expect(password).toMatch(/\d/);
        expect(password).not.toMatch(/[0O1lI]/);
      }
    });

    it('każde hasło jest inne', () => {
      const passwords = new Set(
        Array.from({ length: 100 }, () => generateTemporaryPassword()),
      );
      expect(passwords.size).toBe(100);
    });
  });
});
