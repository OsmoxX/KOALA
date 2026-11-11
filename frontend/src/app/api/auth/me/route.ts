import { NextRequest, NextResponse } from 'next/server';
import {
  backendError,
  backendRequest,
} from '@/lib/backend';

const COOKIE_NAME = 'koala_access_token';

export async function GET(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json(
      { message: 'Nie jesteś zalogowany.' },
      { status: 401 }
    );
  }

  const result = await backendRequest('/auth/me', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!result) {
    return NextResponse.json(
      {
        message:
          'Nie można połączyć się z backendem NestJS.',
      },
      { status: 502 }
    );
  }

  if (!result.ok) {
    const response = NextResponse.json(
      backendError(result.data),
      { status: result.status }
    );

    if (result.status === 401) {
      response.cookies.set(COOKIE_NAME, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
      });
    }

    return response;
  }

  return NextResponse.json(result.data, {
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}