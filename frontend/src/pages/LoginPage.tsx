
import { useState, type SubmitEvent } from 'react';
import { Link, useSearchParams } from 'react-router';
import {
  loginTeacher,
  resendVerificationEmail,
} from '../api/auth';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  const [searchParams] = useSearchParams();
  const verified = searchParams.get('verified');

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    setError('');
    setSuccess(false);
    setNeedsVerification(false);
    setResendMessage('');

    if (!email.trim() || !password) {
      setError('Wypełnij wszystkie pola.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Podaj poprawny adres e-mail.');
      return;
    }

    setLoading(true);

    try {
      await loginTeacher({
        email: email.trim(),
        password,
      });

      setSuccess(true);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Wystąpił błąd logowania.'
      );

      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'EMAIL_NOT_VERIFIED'
      ) {
        setNeedsVerification(true);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResendLoading(true);
    setResendMessage('');

    try {
      await resendVerificationEmail(email.trim());

      setResendMessage(
        'Symulacja ponowienia weryfikacji zakończona. ' +
        'Żaden e-mail nie został wysłany.'
      );
    } catch (error) {
      setResendMessage(
        error instanceof Error
          ? error.message
          : 'Nie udało się ponowić weryfikacji.'
      );
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>KOALA</h1>
        <h2>Logowanie</h2>
        <p>Zaloguj się na swoje konto nauczyciela.</p>

        {verified === 'success' && (
          <div className="alert success" role="status">
            Adres e-mail został pomyślnie zweryfikowany.
            Możesz się zalogować.
          </div>
        )}

        {verified === 'error' && (
          <div className="alert error" role="alert">
            Link weryfikacyjny jest nieprawidłowy lub wygasł.
          </div>
        )}

        {verified === 'pending' && (
          <div className="alert info" role="status">
            Aby się zalogować, potwierdź swój adres e-mail.
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <label htmlFor="loginEmail">Adres e-mail</label>
          <input
            id="loginEmail"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setNeedsVerification(false);
              setResendMessage('');
            }}
          />

          <label htmlFor="loginPassword">Hasło</label>
          <input
            id="loginPassword"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && (
            <div className="alert error" role="alert">
              {error}
            </div>
          )}

          {needsVerification && (
            <div className="verification-actions">
              <p>Nie otrzymano wiadomości weryfikacyjnej?</p>

              <button
                type="button"
                className="secondary-button"
                disabled={resendLoading || loading}
                onClick={handleResend}
              >
                {resendLoading
                  ? 'Ponawianie...'
                  : 'Wyślij ponownie link weryfikacyjny'}
              </button>
            </div>
          )}

          {resendMessage && (
            <div className="alert info" role="status">
              {resendMessage}
            </div>
          )}

          {success && (
            <div className="alert success" role="status">
              Dane demonstracyjnego logowania zostały zaakceptowane.
            </div>
          )}

          <button type="submit" disabled={loading || resendLoading}>
            {loading ? 'Logowanie...' : 'Zaloguj się'}
          </button>
        </form>

        <p className="auth-footer">
          Nie masz konta? <Link to="/register">Zarejestruj się</Link>
        </p>
      </section>
    </main>
  );
}

export default LoginPage;
