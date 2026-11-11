'use client';

import {
  useEffect,
  useRef,
  useState,
} from 'react';

import Link from 'next/link';
import { verifyEmail } from '@/lib/auth-client';

type Status =
  | 'loading'
  | 'success'
  | 'error';

export default function VerifyEmailPage() {
  const [status, setStatus] =
    useState<Status>('loading');

  const [error, setError] = useState('');

  const requestRef = useRef<
    Promise<void> | null
  >(null);

  useEffect(() => {
    const params = new URLSearchParams(
      window.location.search
    );

    const token = params.get('token');

    if (!token) {
      setStatus('error');
      setError(
        'Brak tokenu weryfikacyjnego w adresie.'
      );
      return;
    }

    // Token można wykorzystać tylko raz.
    // Ref zapobiega podwójnemu wysłaniu żądania
    // podczas ponownego uruchamiania efektu.
    if (!requestRef.current) {
      requestRef.current = verifyEmail(token);
    }

    let active = true;

    requestRef.current
      .then(() => {
        if (active) {
          setStatus('success');
        }
      })
      .catch(err => {
        if (active) {
          setStatus('error');
          setError(
            err instanceof Error
              ? err.message
              : 'Nie udało się zweryfikować konta.'
          );
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1 className="brand">KOALA</h1>

        <h2>
          Weryfikacja adresu e-mail
        </h2>

        {status === 'loading' && (
          <div
            className="alert info"
            role="status"
          >
            Trwa weryfikacja adresu e-mail...
          </div>
        )}

        {status === 'success' && (
          <div
            className="alert success"
            role="status"
          >
            <p>
              Adres e-mail został potwierdzony!
            </p>
            <p>
              Twoje konto jest już aktywne.
              Możesz się zalogować.
            </p>
          </div>
        )}

        {status === 'error' && (
          <div
            className="alert error"
            role="alert"
          >
            <p>
              Nie udało się zweryfikować
              adresu e-mail.
            </p>

            <p>{error}</p>

            <p>
              Jeśli link wygasł, poproś
              o nowy na stronie logowania.
            </p>
          </div>
        )}

        {status !== 'loading' && (
          <p className="auth-footer">
            <Link href="/login">
              Przejdź do logowania
            </Link>
          </p>
        )}
      </section>
    </main>
  );
}