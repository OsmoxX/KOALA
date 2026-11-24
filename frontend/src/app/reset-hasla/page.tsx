"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiJson } from "@/lib/koala-client";
import s from "@/app/management.module.css";

type ResetInfo = { kind: "OWN" | "STUDENT"; firstName: string; login: string | null };

/** Strona z linku w e-mailu resetu hasła (?token=...). */
export default function SetNewPasswordPage() {
  return <Suspense fallback={null}><SetNewPassword /></Suspense>;
}

function SetNewPassword() {
  const token = useSearchParams().get("token");
  const [info, setInfo] = useState<ResetInfo | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(token ? "" : "Brak tokenu w adresie. Otwórz link z e-maila jeszcze raz.");
  const [done, setDone] = useState("");
  const [loading, setLoading] = useState(Boolean(token));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) return;
    let active = true;
    apiJson<ResetInfo>("/api/password-reset/verify", { method: "POST", body: JSON.stringify({ token }) })
      .then((data) => { if (active) setInfo(data); })
      .catch((err: Error) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]);

  const forStudent = info?.kind === "STUDENT";

  return <div className={s.page}>
    <header className={s.nav}><Link href="/" className={s.logo}>KOALA</Link></header>
    <main className={s.main} style={{ maxWidth: 620 }}>
      <section className={s.card}>
        <div className={s.eyebrow}>Resetowanie hasła</div>
        <h1 className={s.title}>{forStudent ? `Nowe hasło dla ucznia ${info.firstName}` : "Ustaw nowe hasło"}</h1>
        {loading && <p>Sprawdzanie linku...</p>}
        {info && !done && <p className={s.subtitle}>
          {forStudent
            ? <>Nadajesz nowe hasło jednorazowe dla loginu <strong>{info.login}</strong>. Przy najbliższym logowaniu uczeń ustawi własne.</>
            : <>Cześć {info.firstName}! Wpisz nowe hasło do swojego konta.</>}
        </p>}
        {done && <>
          <div className={s.notice} role="status">{done}</div>
          <Link href={forStudent ? "/dashboard" : "/login"} className={s.button}>{forStudent ? "Przejdź do panelu" : "Przejdź do logowania"}</Link>
        </>}
        {info && !done && <form className={s.form} style={{ marginTop: 24 }} onSubmit={async (event) => {
          event.preventDefault(); setError("");
          if (newPassword !== confirmPassword) return setError("Hasła muszą być identyczne.");
          setSaving(true);
          try {
            const data = await apiJson<{ message: string }>("/api/password-reset/confirm", {
              method: "POST", body: JSON.stringify({ token, newPassword }),
            });
            setDone(data.message);
          } catch (err) { setError(err instanceof Error ? err.message : "Nie udało się zmienić hasła."); }
          finally { setSaving(false); }
        }}>
          <label className={s.field}>Nowe hasło
            <input className={s.input} type={forStudent ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" required minLength={8} maxLength={128} />
          </label>
          <label className={s.field}>Powtórz nowe hasło
            <input className={s.input} type={forStudent ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" required minLength={8} maxLength={128} />
          </label>
          <p className={s.muted}>Co najmniej 8 znaków, w tym mała i wielka litera oraz cyfra.</p>
          {error && <div role="alert" className={s.error}>{error}</div>}
          <button className={s.button} disabled={saving}>{saving ? "Zapisywanie..." : "Zapisz nowe hasło"}</button>
        </form>}
        {!info && !loading && error && <>
          <div role="alert" className={s.error}>{error}</div>
          <Link href="/nie-pamietam-hasla" className={s.secondaryButton}>Poproś o nowy link</Link>
        </>}
      </section>
    </main>
  </div>;
}
