
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';

import RegisterPage from './RegisterPage';
import { registerTeacher } from '../api/auth';

vi.mock('../api/auth', () => ({
  registerTeacher: vi.fn(),
}));

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  function renderRegister() {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );
  }

  async function fillForm(email = 'anna@example.com') {
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('Imię'), 'Anna');
    await user.type(screen.getByLabelText('Nazwisko'), 'Kowalska');
    await user.type(screen.getByLabelText('Adres e-mail'), email);
    await user.type(screen.getByLabelText('Hasło'), 'Haslo12345');
    await user.type(
      screen.getByLabelText('Potwierdź hasło'),
      'Haslo12345'
    );

    return user;
  }

  it('wyświetla błędy dla pustego formularza', async () => {
    const user = userEvent.setup();
    renderRegister();

    await user.click(
      screen.getByRole('button', { name: 'Zarejestruj się' })
    );

    expect(
      screen.getByText('Imię musi mieć minimum 2 znaki.')
    ).toBeInTheDocument();

    expect(registerTeacher).not.toHaveBeenCalled();
  });

  it('odrzuca niepoprawny e-mail', async () => {
    const user = userEvent.setup();
    renderRegister();

    await user.type(screen.getByLabelText('Adres e-mail'), 'abc');
    await user.click(
      screen.getByRole('button', { name: 'Zarejestruj się' })
    );

    expect(
      screen.getByText('Podaj poprawny adres e-mail.')
    ).toBeInTheDocument();
  });

  it('wysyła poprawnie wypełniony formularz', async () => {
    vi.mocked(registerTeacher).mockResolvedValueOnce({
      success: true,
      message: 'Dane rejestracyjne zostały przyjęte.',
    });

    renderRegister();
    const user = await fillForm();

    await user.click(
      screen.getByRole('button', { name: 'Zarejestruj się' })
    );

    expect(
      await screen.findByText(/Dane zostały poprawnie wprowadzone/)
    ).toBeInTheDocument();

    expect(registerTeacher).toHaveBeenCalledWith({
      firstName: 'Anna',
      lastName: 'Kowalska',
      email: 'anna@example.com',
      password: 'Haslo12345',
    });
  });

  it('wyświetla błąd zajętego e-maila', async () => {
    vi.mocked(registerTeacher).mockRejectedValueOnce(
      new Error('Konto z podanym adresem e-mail już istnieje.')
    );

    renderRegister();
    const user = await fillForm();

    await user.click(
      screen.getByRole('button', { name: 'Zarejestruj się' })
    );

    expect(
      await screen.findByText(
        'Konto z podanym adresem e-mail już istnieje.'
      )
    ).toBeInTheDocument();
  });
});
