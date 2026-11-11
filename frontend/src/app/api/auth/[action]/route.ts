import { NextRequest, NextResponse } from 'next/server';
import {
  backendError,
  backendRequest,
} from '@/lib/backend';

const COOKIE_NAME = 'koala_access_token';

const AUTH_PATHS: Record<string, string> = {
  register: '/auth/register',
  login: '/auth/login',
  'verify-email': '/auth/verify-email',
  'resend-verification': '/auth/resend-verification',
};

const noStore = {
  'Cache-Control': 'no-store',
};

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ action: string }> }
) {
  const { action } = await context.params;

  const origin = request.headers.get('origin');

  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json(
      { message: 'Niedozwolone pochodzenie żądania.' },
      { status: 403 }
    );
  }

  // Wylogowanie odbywa się po stronie Next.js.
  if (action === 'logout') {
    const response = NextResponse.json(
      { success: true },
      { headers: noStore }
    );

    response.cookies.set(COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    return response;
  }

  const backendPath = AUTH_PATHS[action];

  if (!backendPath) {
    return NextResponse.json(
      { message: 'Nieznany endpoint.' },
      { status: 404 }
    );
  }

  if (
    !request.headers
      .get('content-type')
      ?.includes('application/json')
  ) {
    return NextResponse.json(
      { message: 'Wymagany format JSON.' },
      { status: 415 }
    );
  }

  let input: Record<string, unknown>;

  try {
    const parsed: unknown = await request.json();

    if (
      !parsed ||
      typeof parsed !== 'object' ||
      Array.isArray(parsed)
    ) {
      throw new Error('Invalid JSON');
    }

    input = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { message: 'Niepoprawne dane JSON.' },
      { status: 400 }
    );
  }

  // Przekazujemy wyłącznie pola oczekiwane przez NestJS.
  const fields =
    action === 'register'
      ? [
          'firstName',
          'lastName',
          'email',
          'password',
          'schoolName',
          'schoolCity',
        ]
      : action === 'login'
        ? ['email', 'password']
        : action === 'verify-email'
          ? ['token']
          : ['email'];

  const payload: Record<string, string | boolean> = {};

  for (const field of fields) {
    if (typeof input[field] !== 'string') {
      return NextResponse.json(
        {
          message: `Brak lub niepoprawne pole: ${field}`,
        },
        { status: 400 }
      );
    }

    payload[field] = input[field] as string;
  }

  if (action === 'register') {
    if (input.acceptTerms !== true) {
      return NextResponse.json(
        {
          message:
            'Musisz zaakceptować regulamin i informacje RODO.',
        },
        { status: 400 }
      );
    }

    payload.acceptTerms = true;
  }

  const result = await backendRequest(backendPath, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!result) {
    return NextResponse.json(
      {
        message:
          'Nie można połączyć się z backendem NestJS.',
      },
      {
        status: 502,
        headers: noStore,
      }
    );
  }

  if (!result.ok) {
    const error = backendError(result.data);

    // W obecnym backendzie nieaktywne konto zwraca 403.
    const code =
      action === 'login' && result.status === 403
        ? 'EMAIL_NOT_VERIFIED'
        : error.code;

    return NextResponse.json(
      {
        message: error.message,
        code,
      },
      {
        status: result.status,
        headers: noStore,
      }
    );
  }

  if (action === 'login') {
    const data =
      result.data && typeof result.data === 'object'
        ? (result.data as Record<string, unknown>)
        : {};

    const token = data.accessToken;

    if (typeof token !== 'string' || !token) {
      return NextResponse.json(
        {
          message:
            'Backend nie zwrócił tokenu JWT.',
        },
        {
          status: 502,
          headers: noStore,
        }
      );
    }

    const response = NextResponse.json(
      { success: true },
      { headers: noStore }
    );

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60,
    });

    return response;
  }

  return NextResponse.json(
    { success: true },
    { headers: noStore }
  );
}