"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { logoutTeacher } from "@/lib/auth-client";
import styles from "./page.module.css";

type Teacher = {
  firstName?: string;
  lastName?: string;
  email: string;
  role?: string;
};

export default function DashboardPage() {
  const router = useRouter();

  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState("");

  console.log("CSS MODULE:", styles);
  console.log("KLASA PAGE:", styles.page);
  console.log("KLASA CARD:", styles.card);
  console.log("TEST STYLE:", styles.testStyle);

  useEffect(() => {
    async function loadTeacher() {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "same-origin",
        });

        if (response.status === 401) {
          router.replace("/login");
          return;
        }

        if (!response.ok) {
          throw new Error("Nie udało się pobrać danych użytkownika.");
        }

        const data = await response.json();
        setTeacher(data.user ?? data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Wystąpił błąd podczas pobierania danych."
        );
      } finally {
        setLoading(false);
      }
    }

    loadTeacher();
  }, [router]);

  async function handleLogout() {
    setLoggingOut(true);
    setError("");

    try {
      await logoutTeacher();
      window.location.assign("/login");
    } catch {
      setError("Nie udało się wylogować.");
      setLoggingOut(false);
    }
  }

  if (loading) {
    return (
      <main className={styles.loading}>
        Ładowanie panelu nauczyciela...
      </main>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.navbar}>
        <Link href="/dashboard" className={styles.logo}>
          KOALA
        </Link>

        <span className={styles.appName}>
          Konkurs matematyczno-informatyczny
        </span>

        <div className={styles.navRight}>
          {teacher && (
            <span className={styles.userName}>
              {teacher.firstName} {teacher.lastName}
            </span>
          )}

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className={styles.logoutButton}
          >
            {loggingOut ? "Wylogowywanie..." : "Wyloguj"}
          </button>
        </div>
      </header>

      <main className={styles.container}>
        <p className={styles.sectionLabel}>Strefa nauczyciela</p>

        <h1 className={styles.title}>Panel nauczyciela</h1>

        <p className={styles.subtitle}>
          Zarządzaj swoimi drużynami i uczniami biorącymi udział
          w konkursie KOALA.
        </p>

        {error && (
          <div className={styles.error} role="alert">
            {error}
          </div>
        )}

        {teacher && (
          <>
            <section className={styles.card}>
              <h2>Twoje konto</h2>

              <div className={styles.userInfo}>
                <p>
                  <strong>Imię i nazwisko:</strong>{" "}
                  {`${teacher.firstName ?? ""} ${teacher.lastName ?? ""}`.trim() ||
                    "Brak danych"}
                </p>

                <p>
                  <strong>E-mail:</strong> {teacher.email}
                </p>

                {teacher.role && (
                  <p>
                    <strong>Rola:</strong> {teacher.role}
                  </p>
                )}
              </div>
            </section>

            <section className={styles.card}>
              <h2>Zarządzanie drużynami</h2>

              <p className={styles.cardDescription}>
                Twórz nowe drużyny, przeglądaj ich składy
                i zarządzaj uczniami.
              </p>

              <div className={styles.actions}>
                <Link
                  href="/dashboard/teams"
                  className={styles.primaryButton}
                >
                  Moje drużyny
                </Link>

                <Link
                  href="/dashboard/teams/new"
                  className={styles.secondaryButton}
                >
                  + Utwórz drużynę
                </Link>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}