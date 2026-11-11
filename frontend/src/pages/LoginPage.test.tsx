
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';

import LoginPage from './LoginPage';
import {
  loginTeacher,
  resendVerificationEmail,
} from '../api/auth';

vi.mock('../api/auth', () => ({
  loginTeacher: vi.fn(),
  resendVerificationEmail: vi.fn(),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  function renderLogin(url = '/login') {
    render(
      <MemoryRouter initialEntries={[url]}>
        <LoginPage />
      </MemoryRouter>
    );
  }

  it('wyświetla formularz logowania', () => {
    renderLogin();

    expect(screen.getByLabelText('Adres e-mail')).toBeInTheDocument();
    expect(screen.getByLabelText('Hasło')).toBeInTheDocument();
  });

  it('sprawdza puste pola', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.click(screen.getByRole('button', { name: 'Zaloguj się' }));

    expect(
      screen.getByText('Wypełnij wszystkie pola.')
    ).toBeInTheDocument();
  });

  it('wyświetla błąd logowania', async () => {
    const user = userEvent.setup();

    vi.mocked(loginTeacher).mockRejectedValueOnce(
      new Error('Nieprawidłowy adres e-mail lub hasło.')
    );

    renderLogin();

    await user.type(
      screen.getByLabelText('Adres e-mail'),
      'bledny@example.com'
    );
    await user.type(screen.getByLabelText('Hasło'), 'Haslo12345');
    await user.click(screen.getByRole('button', { name: 'Zaloguj się' }));

    expect(
      await screen.findByText('Nieprawidłowy adres e-mail lub hasło.')
    ).toBeInTheDocument();
  });

  it('wyświetla komunikat pomyślnej weryfikacji', () => {
    renderLogin('/login?verified=success');

    expect(
      screen.getByText(/Adres e-mail został pomyślnie zweryfikowany/)
    ).toBeInTheDocument();
  });

  it('wyświetla komunikat niepotwierdzonego e-maila', async () => {
    const user = userEvent.setup();

    vi.mocked(loginTeacher).mockRejectedValueOnce(
      Object.assign(
        new Error('Aby się zalogować, potwierdź adres e-mail.'),
        { code: 'EMAIL_NOT_VERIFIED' }
      )
    );

    renderLogin();

    await user.type(
      screen.getByLabelText('Adres e-mail'),
      'niepotwierdzony@example.com'
    );
    await user.type(screen.getByLabelText('Hasło'), 'Haslo12345');
    await user.click(screen.getByRole('button', { name: 'Zaloguj się' }));

    expect(
      await screen.findByText('Aby się zalogować, potwierdź adres e-mail.')
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', {
        name: 'Wyślij ponownie link weryfikacyjny',
      })
    ).toBeInTheDocument();
  });

  it('obsługuje ponowienie prośby o weryfikację', async () => {
    const user = userEvent.setup();

    vi.mocked(loginTeacher).mockRejectedValueOnce(
      Object.assign(
        new Error('Aby się zalogować, potwierdź adres e-mail.'),
        { code: 'EMAIL_NOT_VERIFIED' }
      )
    );

    vi.mocked(resendVerificationEmail).mockResolvedValueOnce({
      success: true,
      simulated: true,
    });

    renderLogin();

    await user.type(
      screen.getByLabelText('Adres e-mail'),
      'niepotwierdzony@example.com'
    );
    await user.type(screen.getByLabelText('Hasło'), 'Haslo12345');
    await user.click(screen.getByRole('button', { name: 'Zaloguj się' }));

    await user.click(
      await screen.findByRole('button', {
        name: 'Wyślij ponownie link weryfikacyjny',
      })
    );

    expect(
      await screen.findByText(/Żaden e-mail nie został wysłany/)
    ).toBeInTheDocument();

    expect(resendVerificationEmail).toHaveBeenCalledWith(
      'niepotwierdzony@example.com'
    );
  });
});
