"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiJson } from "@/lib/koala-client";
import s from "@/app/management.module.css";

export default function StudentLoginPage() {
  const router = useRouter();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  return <div className={s.page}>
    <header className={s.nav}><Link href="/" className={s.logo}>KOALA</Link><span className={s.muted}>Konkurs matematyczno-informatyczny</span></header>
    <main className={s.main} style={{ maxWidth: 590 }}>
      <section className={s.card}>
        <div className={s.eyebrow}>Strefa ucznia</div>
        <h1 className={s.title}>Logowanie ucznia</h1>
        <p className={s.subtitle}>Wpisz login i hasło otrzymane od nauczyciela.</p>
        <form className={s.form} style={{ marginTop: 24 }} onSubmit={async (event) => {
          event.preventDefault(); setError(""); setLoading(true);
          try {
            const data = await apiJson<{ mustChangePassword: boolean }>("/api/student/login", {
              method: "POST", body: JSON.stringify({ login: login.trim(), password }),
            });
            router.replace(data.mustChangePassword ? "/student/set-password" : "/student/dashboard");
          } catch (err) { setError(err instanceof Error ? err.message : "Nie udało się zalogować."); }
          finally { setLoading(false); }
        }}>
          <label className={s.field}>Login<input className={s.input} value={login} onChange={(e) => setLogin(e.target.value)} required autoComplete="username" /></label>
          <label className={s.field}>Hasło<input className={s.input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" /></label>
          {error && <div role="alert" className={s.error}>{error}</div>}
          <button className={s.button} disabled={loading}>{loading ? "Logowanie..." : "Zaloguj się"}</button>
        </form>
        <p><Link href="/student/reset-password">Nie pamiętam hasła</Link></p>
        <p className={s.muted}>Jesteś nauczycielem? <Link href="/login">Zaloguj się tutaj</Link>.</p>
      </section>
    </main>
  </div>;
}