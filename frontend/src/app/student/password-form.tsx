"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiJson } from "@/lib/koala-client";
import { LogoutButton } from "@/components/logout-button";
import s from "@/app/management.module.css";

type Props = { firstLogin: boolean };

export default function StudentPasswordForm({ firstLogin }: Props) {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  return <div className={s.page}>
    <header className={s.nav}>
      {firstLogin ? (
        <span className={s.logo}>KOALA</span>
      ) : (
        <Link href="/student/dashboard" className={s.logo}>KOALA</Link>
      )}
      <nav className={s.navLinks}>
        {!firstLogin && <Link href="/student/dashboard">Moja drużyna</Link>}
        <LogoutButton kind="student" className={s.logoutButton} onError={setError} />
      </nav>
    </header>
    <main className={s.main} style={{ maxWidth: 620 }}>
      <section className={s.card}>
        <div className={s.eyebrow}>Strefa ucznia</div>
        <h1 className={s.title}>{firstLogin ? "Ustaw nowe hasło" : "Zmień hasło"}</h1>
        <p className={s.subtitle}>{firstLogin ? "Przy pierwszym logowaniu musisz zmienić hasło jednorazowe." : "Podaj aktualne i nowe hasło."}</p>
        <form className={s.form} style={{ marginTop: 24 }} onSubmit={async (event) => {
          event.preventDefault(); setError("");
          if (newPassword.length < 8) return setError("Nowe hasło musi mieć co najmniej 8 znaków.");
          if (newPassword !== confirmPassword) return setError("Hasła muszą być identyczne.");
          if (newPassword === currentPassword) return setError("Nowe hasło musi różnić się od poprzedniego.");
          setSaving(true);
          try {
            await apiJson<unknown>("/api/student/password", {
              method: "POST",
              body: JSON.stringify({ currentPassword, newPassword }),
            });
            // Po zmianie hasła wymagamy ponownego zalogowania.
            await apiJson<unknown>("/api/student/logout", { method: "POST", body: "{}" });
            router.replace("/student/login");
          } catch (err) { setError(err instanceof Error ? err.message : "Nie udało się zmienić hasła."); }
          finally { setSaving(false); }
        }}>
          <label className={s.field}>{firstLogin ? "Hasło jednorazowe" : "Aktualne hasło"}
            <input className={s.input} type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" required />
          </label>
          <label className={s.field}>Nowe hasło<input className={s.input} type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" required minLength={8} /></label>
          <label className={s.field}>Powtórz nowe hasło<input className={s.input} type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" required minLength={8} /></label>
          {error && <div className={s.error} role="alert">{error}</div>}
          <button className={s.button} disabled={saving}>{saving ? "Zapisywanie..." : "Zapisz nowe hasło"}</button>
        </form>
      </section>
    </main>
  </div>;
}