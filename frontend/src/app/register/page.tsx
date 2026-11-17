'use client';

import { useState } from 'react';
import Link from 'next/link';

import {
  registerTeacher,
  type RegisterData,
} from '@/lib/auth-client';

type FormValues = RegisterData & {
  confirmPassword: string;
};

type FormErrors = Partial<
  Record<keyof FormValues, string>
>;

const initialValues: FormValues = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  schoolName: '',
  schoolCity: '',
  acceptTerms: false,
};

const passwordPattern =
  /(?=.*[a-ząćęłńóśźż])(?=.*[A-ZĄĆĘŁŃÓŚŹŻ])(?=.*\d)/u;

export default function RegisterPage() {
  const [form, setForm] = useState<FormValues>(
    initialValues
  );

  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function updateField<K extends keyof FormValues>(
    field: K,
    value: FormValues[K]
  ) {
    setForm(previous => ({
      ...previous,
      [field]: value,
    }));
  }

  async function handleSubmit() {
    setErrors({});
    setServerError('');

    const newErrors: FormErrors = {};

    if (!form.firstName.trim()) {
      newErrors.firstName = 'Imię jest wymagane.';
    } else if (form.firstName.trim().length > 100) {
      newErrors.firstName =
        'Imię może mieć maksymalnie 100 znaków.';
    }

    if (!form.lastName.trim()) {
      newErrors.lastName = 'Nazwisko jest wymagane.';
    } else if (form.lastName.trim().length > 100) {
      newErrors.lastName =
        'Nazwisko może mieć maksymalnie 100 znaków.';
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) ||
      form.email.trim().length > 254
    ) {
      newErrors.email =
        'Podaj poprawny adres e-mail.';
    }

    if (
      form.password.length < 8 ||
      form.password.length > 128 ||
      !passwordPattern.test(form.password)
    ) {
      newErrors.password =
        'Hasło musi mieć 8–128 znaków oraz zawierać ' +
        'małą literę, wielką literę i cyfrę.';
    }

    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword =
        'Hasła muszą być identyczne.';
    }

    if (!form.schoolName.trim()) {
      newErrors.schoolName =
        'Nazwa szkoły jest wymagana.';
    } else if (form.schoolName.trim().length > 200) {
      newErrors.schoolName =
        'Nazwa szkoły może mieć maksymalnie 200 znaków.';
    }

    if (!form.schoolCity.trim()) {
      newErrors.schoolCity =
        'Miejscowość szkoły jest wymagana.';
    } else if (form.schoolCity.trim().length > 100) {
      newErrors.schoolCity =
        'Miejscowość może mieć maksymalnie 100 znaków.';
    }

    if (!form.acceptTerms) {
      newErrors.acceptTerms =
        'Musisz zaakceptować regulamin i informacje RODO.';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    setLoading(true);

    try {
      await registerTeacher({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        schoolName: form.schoolName.trim(),
        schoolCity: form.schoolCity.trim(),
        acceptTerms: true,
      });

      setSuccess(true);
      setForm(initialValues);
    } catch (error) {
      setServerError(
        error instanceof Error
          ? error.message
          : 'Nie udało się utworzyć konta.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1 className="brand">KOALA</h1>
        <h2>Rejestracja nauczyciela</h2>

        <p className="subtitle">
          Utwórz konto w systemie konkursowym KOALA.
        </p>

        {success ? (
          <div className="alert success" role="status">
            <p>Konto zostało utworzone!</p>
            <p>
              Aby móc się zalogować, potwierdź
              adres e-mail za pomocą linku aktywacyjnego.
            </p>
            <Link href="/login">
              Przejdź do logowania
            </Link>
          </div>
        ) : (
          <form
            noValidate
            onSubmit={event => {
              event.preventDefault();
              void handleSubmit();
            }}
          >
            <label htmlFor="firstName">
              Imię
            </label>
            <input
              id="firstName"
              value={form.firstName}
              onChange={event =>
                updateField(
                  'firstName',
                  event.target.value
                )
              }
              autoComplete="given-name"
              maxLength={100}
              aria-invalid={!!errors.firstName}
            />
            {errors.firstName && (
              <small role="alert">
                {errors.firstName}
              </small>
            )}

            <label htmlFor="lastName">
              Nazwisko
            </label>
            <input
              id="lastName"
              value={form.lastName}
              onChange={event =>
                updateField(
                  'lastName',
                  event.target.value
                )
              }
              autoComplete="family-name"
              maxLength={100}
              aria-invalid={!!errors.lastName}
            />
            {errors.lastName && (
              <small role="alert">
                {errors.lastName}
              </small>
            )}

            <label htmlFor="email">
              Adres e-mail
            </label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={event =>
                updateField('email', event.target.value)
              }
              autoComplete="email"
              maxLength={254}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <small role="alert">
                {errors.email}
              </small>
            )}

            <label htmlFor="schoolName">
              Nazwa szkoły
            </label>
            <input
              id="schoolName"
              value={form.schoolName}
              onChange={event =>
                updateField(
                  'schoolName',
                  event.target.value
                )
              }
              maxLength={200}
              aria-invalid={!!errors.schoolName}
            />
            {errors.schoolName && (
              <small role="alert">
                {errors.schoolName}
              </small>
            )}

            <label htmlFor="schoolCity">
              Miejscowość szkoły
            </label>
            <input
              id="schoolCity"
              value={form.schoolCity}
              onChange={event =>
                updateField(
                  'schoolCity',
                  event.target.value
                )
              }
              maxLength={100}
              aria-invalid={!!errors.schoolCity}
            />
            {errors.schoolCity && (
              <small role="alert">
                {errors.schoolCity}
              </small>
            )}

            <label htmlFor="password">
              Hasło
            </label>
            <input
              id="password"
              type="password"
              value={form.password}
              onChange={event =>
                updateField(
                  'password',
                  event.target.value
                )
              }
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              aria-invalid={!!errors.password}
            />
            {errors.password && (
              <small role="alert">
                {errors.password}
              </small>
            )}

            <label htmlFor="confirmPassword">
              Potwierdź hasło
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={event =>
                updateField(
                  'confirmPassword',
                  event.target.value
                )
              }
              autoComplete="new-password"
              aria-invalid={!!errors.confirmPassword}
            />
            {errors.confirmPassword && (
              <small role="alert">
                {errors.confirmPassword}
              </small>
            )}

            <div className="terms-field">
              <label htmlFor="acceptTerms">
                <input
                  id="acceptTerms"
                  type="checkbox"
                  checked={form.acceptTerms}
                  onChange={event =>
                    updateField(
                      'acceptTerms',
                      event.target.checked
                    )
                  }
                  aria-invalid={!!errors.acceptTerms}
                />
                <span>
                  Akceptuję regulamin konkursu i potwierdzam
                  zapoznanie się z{' '}
                  <Link
                    href="/rodo"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    informacjami dotyczącymi przetwarzania
                    danych osobowych (RODO)
                  </Link>
                  .
                </span>
              </label>
            </div>

            {errors.acceptTerms && (
              <small role="alert">
                {errors.acceptTerms}
              </small>
            )}

            {serverError && (
              <div className="alert error" role="alert">
                {serverError}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
            >
              {loading
                ? 'Rejestrowanie...'
                : 'Zarejestruj się'}
            </button>
          </form>
        )}

        <p className="auth-footer">
          Masz już konto?{' '}
          <Link href="/login">
            Zaloguj się
          </Link>
        </p>
      </section>
    </main>
  );
}