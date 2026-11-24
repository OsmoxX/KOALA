"use client";

import { useState } from "react";
import Link from "next/link";
import { apiJson } from "@/lib/koala-client";
import s from "@/app/management.module.css";

type Props = { student: boolean };

/** Formularz „Nie pamiętam hasła” – nauczyciel podaje e-mail, uczeń login. */
export default function ForgotPasswordForm({ student }: Props) {
  const [login, setLogin] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState("");
  const [loading, setLoading] = useState(false);

  return <div className={s.page}>
    <header className={s.nav}><Link href="/" className={s.logo}>KOALA</Link></header>
    <main className={s.main} style={{ maxWidth: 620 }}>
      <section className={s.card}>
        <div className={s.eyebrow}>{student ? "Strefa ucznia" : "Strefa nauczyciela"}</div>
        <h1 className={s.title}>Nie pamiętasz hasła?</h1>
        <p className={s.subtitle}>
          {student
            ? "Podaj swój login. Link do nadania nowego hasła otrzyma e-mailem Twój nauczyciel-opiekun."
            : "Podaj adres e-mail konta. Wyślemy na niego link do ustawienia nowego hasła."}
        </p>
        {sent ? <div className={s.notice} role="status">{sent}</div> : (
          <form className={s.form} style={{ marginTop: 24 }} onSubmit={async (event) => {
            event.preventDefault(); setError("");
            if (!login.trim()) return setError(student ? "Podaj login." : "Podaj adres e-mail.");
            setLoading(true);
            try {
              const data = await apiJson<{ message: string }>("/api/password-reset/request", {
                method: "POST", body: JSON.stringify({ login: login.trim() }),
              });
              setSent(data.message);
            } catch (err) { setError(err instanceof Error ? err.message : "Nie udało się wysłać prośby."); }
            finally { setLoading(false); }
          }}>
            <label className={s.field}>{student ? "Login" : "Adres e-mail"}
              <input className={s.input} type={student ? "text" : "email"} value={login}
                onChange={(e) => setLogin(e.target.value)} autoComplete={student ? "username" : "email"} required maxLength={254} />
            </label>
            {error && <div role="alert" className={s.error}>{error}</div>}
            <button className={s.button} disabled={loading}>{loading ? "Wysyłanie..." : "Wyślij link"}</button>
          </form>
        )}
        <p style={{ marginTop: 20 }}><Link href={student ? "/student/login" : "/login"}>← Wróć do logowania</Link></p>
      </section>
    </main>
  </div>;
}
