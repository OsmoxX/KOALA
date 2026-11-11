
export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

// Konta utworzone podczas bieżącej sesji aplikacji.
// Nie przechowujemy haseł.
const registeredEmails = new Set<string>();

function delay() {
  return new Promise<void>((resolve) => setTimeout(resolve, 500));
}

// REJESTRACJA
export async function registerTeacher(data: RegisterData) {
  await delay();

  const email = data.email.trim().toLowerCase();

  if (registeredEmails.has(email)) {
    throw new Error('Konto z podanym adresem e-mail już istnieje.');
  }

  registeredEmails.add(email);

  return {
    success: true,
    message: 'Dane rejestracyjne zostały przyjęte.',
  };
}

// LOGOWANIE
export async function loginTeacher(data: LoginData) {
  await delay();

  const email = data.email.trim().toLowerCase();

  // Konto niepotwierdzone
  if (
    registeredEmails.has(email) ||
    email === 'niepotwierdzony@example.com'
  ) {
    throw Object.assign(
      new Error('Aby się zalogować, potwierdź adres e-mail.'),
      { code: 'EMAIL_NOT_VERIFIED' }
    );
  }

  // Przykładowe konto testowe, które przechodzi logowanie
  if (email === 'demo@example.com' && data.password) {
    return {
      success: true,
      demo: true,
    };
  }

  throw new Error('Nieprawidłowy adres e-mail lub hasło.');
}

// PONOWNA WYSYŁKA LINKU - SYMULACJA
export async function resendVerificationEmail(email: string) {
  await delay();

  if (!email.trim()) {
    throw new Error('Podaj adres e-mail.');
  }

  return {
    success: true,
    simulated: true,
  };
}
