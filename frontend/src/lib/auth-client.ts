export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  schoolName: string;
  schoolCity: string;
  acceptTerms: boolean;
}

export interface LoginData {
  email: string;
  password: string;
}

export class AuthError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

async function sendRequest(
  action: string,
  data: unknown
): Promise<void> {
  let response: Response;

  try {
    response = await fetch(`/api/auth/${action}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'same-origin',
      body: JSON.stringify(data),
    });
  } catch {
    throw new AuthError(
      'Nie można połączyć się z serwerem.',
      0
    );
  }

  if (!response.ok) {
    const result = await response
      .json()
      .catch(() => null);

    throw new AuthError(
      typeof result?.message === 'string'
        ? result.message
        : 'Wystąpił błąd.',
      response.status,
      typeof result?.code === 'string'
        ? result.code
        : undefined
    );
  }
}

export function registerTeacher(data: RegisterData) {
  return sendRequest('register', data);
}

export function loginTeacher(data: LoginData) {
  return sendRequest('login', data);
}

export function verifyEmail(token: string) {
  return sendRequest('verify-email', { token });
}

export function resendVerificationEmail(email: string) {
  return sendRequest('resend-verification', { email });
}

export function logoutTeacher() {
  return sendRequest('logout', {});
}