"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiJson } from "@/lib/koala-client";
import type { TeamCategory, TeamSummary } from "@/lib/koala-types";
import { LogoutButton } from "@/components/logout-button";
import s from "@/app/management.module.css";

export default function NewTeamPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<TeamCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    apiJson<TeamCategory[]>("/api/teams/categories")
      .then((data) => {
        if (!Array.isArray(data)) throw new Error("Niepoprawna lista kategorii.");
        if (active) setCategories(data);
      })
      .catch((err: Error) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <div className={s.page}>
      <header className={s.nav}>
        <Link href="/dashboard" className={s.logo}>KOALA</Link>
        <nav className={s.navLinks}>
          <Link href="/dashboard/teams">Moje drużyny</Link>
          <LogoutButton className={s.logoutButton} onError={setError} />
        </nav>
      </header>
      <main className={s.main}>
        <Link href="/dashboard/teams" className={s.back}>← Wróć do drużyn</Link>
        <div className={s.top} style={{ marginTop: 20 }}><div><div className={s.eyebrow}>Panel nauczyciela</div><h1 className={s.title}>Nowa drużyna</h1><p className={s.subtitle}>Podaj nazwę i wybierz kategorię wiekową.</p></div></div>
        <section className={s.card}>
          <form className={s.form} onSubmit={async (event) => {
            event.preventDefault();
            setError("");
            if (!name.trim() || !categoryId) return setError("Uzupełnij nazwę i kategorię.");
            setSaving(true);
            try {
              const team = await apiJson<TeamSummary>("/api/teams", {
                method: "POST",
                body: JSON.stringify({ name: name.trim(), categoryId }),
              });
              router.push(`/dashboard/teams/${team.id}`);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Nie udało się utworzyć drużyny.");
            } finally { setSaving(false); }
          }}>
            <label className={s.field}>Nazwa drużyny
              <input className={s.input} value={name} onChange={(event) => setName(event.target.value)} maxLength={100} placeholder="np. Pitagorejczycy" required />
            </label>
            <label className={s.field}>Kategoria wiekowa
              <select className={s.select} value={categoryId} onChange={(event) => setCategoryId(event.target.value)} required disabled={loading || categories.length === 0}>
                <option value="">Wybierz kategorię</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </label>
            {loading && <p className={s.muted}>Pobieranie kategorii...</p>}
            {!loading && !error && categories.length === 0 && <div className={s.notice}>Brak kategorii. Muszą zostać skonfigurowane w backendzie zgodnie z regulaminem.</div>}
            {categoryId && categories.find((item) => item.id === categoryId) && (
              <p className={s.muted}>Liczba uczniów w wybranej kategorii: {categories.find((item) => item.id === categoryId)?.minMembers}–{categories.find((item) => item.id === categoryId)?.maxMembers}.</p>
            )}
            {error && <div role="alert" className={s.error}>{error}</div>}
            <button className={s.button} disabled={saving || loading || !categoryId}>{saving ? "Zapisywanie..." : "Utwórz drużynę"}</button>
          </form>
        </section>
      </main>
    </div>
  );
}