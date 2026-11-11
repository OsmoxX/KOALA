'use client';

import {
  useEffect,
  useState,
} from 'react';

import { useRouter } from 'next/navigation';

import {
  logoutTeacher,
} from '@/lib/auth-client';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  emailVerifiedAt: string | null;
}

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] =
    useState<User | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [loggingOut, setLoggingOut] =
    useState(false);

  const [error, setError] =
    useState('');

  useEffect(() => {
    let active = true;

    async function loadUser() {
      try {
        const response = await fetch(
          '/api/auth/me',
          {
            cache: 'no-store',
          }
        );

        if (
          response.status === 401 ||
          response.status === 403
        ) {
          router.replace('/login');
          return;
        }

        if (!response.ok) {
          throw new Error(
            'Nie udało się pobrać danych użytkownika.'
          );
        }

        const data: User =
          await response.json();

        if (active) {
          setUser(data);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : 'Wystąpił błąd.'
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadUser();

    return () => {
      active = false;
    };
  }, [router]);

  async function handleLogout() {
    setError('');
    setLoggingOut(true);

    try {
      await logoutTeacher();

      router.replace('/login');
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Nie udało się wylogować.'
      );

      setLoggingOut(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1 className="brand">KOALA</h1>
        <h2>Panel nauczyciela</h2>

        {loading && (
          <p role="status">
            Ładowanie danych...
          </p>
        )}

        {error && (
          <div
            className="alert error"
            role="alert"
          >
            {error}
          </div>
        )}

        {user && (
          <>
            <div className="alert success">
              Jesteś zalogowany!
            </div>

            <p>
              <strong>
                Imię i nazwisko:
              </strong>{' '}
              {user.firstName} {user.lastName}
            </p>

            <p>
              <strong>E-mail:</strong>{' '}
              {user.email}
            </p>

            <p>
              <strong>Rola:</strong>{' '}
              {user.role}
            </p>

            <button
              type="button"
              disabled={loggingOut}
              onClick={() => void handleLogout()}
            >
              {loggingOut
                ? 'Wylogowywanie...'
                : 'Wyloguj się'}
            </button>
          </>
        )}
      </section>
    </main>
  );
}