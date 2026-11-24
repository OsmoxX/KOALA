"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiJson } from "@/lib/koala-client";
import type { TeamSummary } from "@/lib/koala-types";
import { LogoutButton } from "@/components/logout-button";
import s from "@/app/management.module.css";

export default function TeamsPage() {
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    apiJson<TeamSummary[]>("/api/teams")
      .then((data) => {
        if (!Array.isArray(data)) throw new Error("Niepoprawny format listy drużyn.");
        if (active) setTeams(data);
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
          <Link href="/dashboard">Panel nauczyciela</Link>
          <LogoutButton className={s.logoutButton} onError={setError} />
        </nav>
      </header>
      <main className={s.main}>
        <div className={s.top}>
          <div><div className={s.eyebrow}>Panel nauczyciela</div><h1 className={s.title}>Moje drużyny</h1><p className={s.subtitle}>Zarządzaj drużynami reprezentującymi Twoją szkołę.</p></div>
          <Link href="/dashboard/teams/new" className={s.button}>+ Utwórz drużynę</Link>
        </div>
        {loading && <p>Ładowanie drużyn...</p>}
        {error && <div role="alert" className={s.error}>{error}</div>}
        {!loading && !error && (teams.length === 0 ? (
          <section className={`${s.card} ${s.center}`}>
            <h2>Nie masz jeszcze żadnych drużyn</h2>
            <p className={s.muted}>Utwórz pierwszą drużynę, aby móc dodawać do niej uczniów.</p>
            <Link href="/dashboard/teams/new" className={s.button}>Utwórz pierwszą drużynę</Link>
          </section>
        ) : (
          <section className={s.grid}>
            {teams.map((team) => (
              <article className={s.card} key={team.id}>
                <h2>{team.name}</h2>
                <p className={s.muted}>Kategoria: {team.categoryName}</p>
                <p>Liczba uczniów: {team.studentsCount}</p>
                <Link href={`/dashboard/teams/${team.id}`} className={s.secondaryButton}>Zarządzaj drużyną</Link>
              </article>
            ))}
          </section>
        ))}
      </main>
    </div>
  );
}