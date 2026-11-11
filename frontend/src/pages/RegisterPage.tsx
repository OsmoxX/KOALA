
import { useState, type SubmitEvent } from 'react';
import { Link } from 'react-router';
import { registerTeacher } from '../api/auth';

function RegisterPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    setSuccess(false);
    setServerError('');

    const newErrors: Record<string, string> = {};

    if (firstName.trim().length < 2) {
      newErrors.firstName = 'Imię musi mieć minimum 2 znaki.';
    }

    if (lastName.trim().length < 2) {
      newErrors.lastName = 'Nazwisko musi mieć minimum 2 znaki.';
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Podaj poprawny adres e-mail.';
    }

    if (password.length < 8) {
      newErrors.password = 'Hasło musi mieć minimum 8 znaków.';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Potwierdź hasło.';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Podane hasła nie są identyczne.';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    setLoading(true);

    try {
      await registerTeacher({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      setSuccess(true);

      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      setServerError(
        error instanceof Error
          ? error.message
          : 'Wystąpił błąd rejestracji.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>KOALA</h1>
        <h2>Rejestracja nauczyciela</h2>
        <p>Utwórz konto, aby zgłaszać drużyny do konkursu.</p>

        {success && (
          <div className="alert success" role="status">
            Dane zostały poprawnie wprowadzone.
            Aby dokończyć rejestrację, potwierdź swój adres e-mail.
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <label htmlFor="firstName">Imię</label>
          <input
            id="firstName"
            type="text"
            autoComplete="given-name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            aria-invalid={Boolean(errors.firstName)}
          />
          {errors.firstName && (
            <small role="alert">{errors.firstName}</small>
          )}

          <label htmlFor="lastName">Nazwisko</label>
          <input
            id="lastName"
            type="text"
            autoComplete="family-name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            aria-invalid={Boolean(errors.lastName)}
          />
          {errors.lastName && (
            <small role="alert">{errors.lastName}</small>
          )}

          <label htmlFor="email">Adres e-mail</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={Boolean(errors.email)}
          />
          {errors.email && (
            <small role="alert">{errors.email}</small>
          )}

          <label htmlFor="password">Hasło</label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={Boolean(errors.password)}
          />
          {errors.password && (
            <small role="alert">{errors.password}</small>
          )}

          <label htmlFor="confirmPassword">Potwierdź hasło</label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            aria-invalid={Boolean(errors.confirmPassword)}
          />
          {errors.confirmPassword && (
            <small role="alert">{errors.confirmPassword}</small>
          )}

          {serverError && (
            <div className="alert error" role="alert">
              {serverError}
            </div>
          )}

          <button type="submit" disabled={loading}>
            {loading ? 'Rejestrowanie...' : 'Zarejestruj się'}
          </button>
        </form>

        <p className="auth-footer">
          Masz już konto? <Link to="/login">Zaloguj się</Link>
        </p>
      </section>
    </main>
  );
}

export default RegisterPage;
