'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  AuthError,
  loginTeacher,
  resendVerificationEmail,
} from '@/lib/auth-client';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] =
    useState(false);

  async function handleSubmit() {
    setError('');
    setMessage('');

    if (!email.trim() || !password) {
      setError('Wypełnij wszystkie pola.');
      return;
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email.trim()
      )
    ) {
      setError('Podaj poprawny adres e-mail.');
      return;
    }

    setLoading(true);

    try {
      await loginTeacher({
        email: email.trim().toLowerCase(),
        password,
      });

      router.replace('/dashboard');
      router.refresh();
    } catch (err) {
      if (
        err instanceof AuthError &&
        err.code === 'EMAIL_NOT_VERIFIED'
      ) {
        setError(
          'Konto nie jest aktywne. Potwierdź adres e-mail.'
        );
      } else {
        setError(
          err instanceof Error
            ? err.message
            : 'Wystąpił błąd logowania.'
        );
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError('');
    setMessage('');

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email.trim()
      )
    ) {
      setError(
        'Najpierw podaj poprawny adres e-mail.'
      );
      return;
    }

    setResendLoading(true);

    try {
      await resendVerificationEmail(
        email.trim().toLowerCase()
      );

      setMessage(
        'Jeśli konto istnieje i nie jest aktywne, ' +
        'został przygotowany nowy link aktywacyjny. ' 
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Nie udało się ponowić weryfikacji.'
      );
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1 className="brand">KOALA</h1>

        <h2>Logowanie nauczyciela</h2>

        <p className="subtitle">
          Zaloguj się do systemu konkursowego KOALA.
        </p>

        <form
          noValidate
          onSubmit={event => {
            event.preventDefault();
            void handleSubmit();
          }}
        >
          <label htmlFor="loginEmail">
            Adres e-mail
          </label>

          <input
            id="loginEmail"
            type="email"
            value={email}
            onChange={event =>
              setEmail(event.target.value)
            }
            autoComplete="username"
            maxLength={254}
          />

          <label htmlFor="loginPassword">
            Hasło
          </label>

          <input
            id="loginPassword"
            type="password"
            value={password}
            onChange={event =>
              setPassword(event.target.value)
            }
            autoComplete="current-password"
          />

          {error && (
            <div
              className="alert error"
              role="alert"
            >
              {error}
            </div>
          )}

          {message && (
            <div
              className="alert success"
              role="status"
            >
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || resendLoading}
          >
            {loading
              ? 'Logowanie...'
              : 'Zaloguj się'}
          </button>

          <button
            type="button"
            className="secondary-button"
            disabled={loading || resendLoading}
            onClick={() => void handleResend()}
          >
            {resendLoading
              ? 'Wysyłanie...'
              : 'Wyślij ponownie link weryfikacyjny'}
          </button>
        </form>

        <p className="auth-footer">
          Nie masz konta?{' '}
          <Link href="/register">
            Zarejestruj się
          </Link>
        </p>
      </section>
    </main>
  );
}