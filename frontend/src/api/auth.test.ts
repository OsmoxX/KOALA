
import { describe, it, expect } from 'vitest';
import { registerTeacher } from './auth';

describe('Rejestracja nauczyciela', () => {
  const teacher = {
    firstName: 'Anna',
    lastName: 'Kowalska',
    email: 'anna@example.com',
    password: 'Haslo12345',
  };

  it('akceptuje pierwszą rejestrację', async () => {
    const result = await registerTeacher(teacher);

    expect(result.success).toBe(true);
  });

  it('odrzuca ponowną rejestrację tego samego e-maila', async () => {
    const data = {
      ...teacher,
      email: 'duplicate@example.com',
    };

    await registerTeacher(data);

    await expect(registerTeacher(data)).rejects.toThrow(
      'Konto z podanym adresem e-mail już istnieje.'
    );
  });
});
