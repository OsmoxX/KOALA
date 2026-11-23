"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiJson } from "@/lib/koala-client";
import type { StudentProfile } from "@/lib/koala-types";
import s from "@/app/management.module.css";

export default function StudentDashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    apiJson<StudentProfile>("/api/student/me")
      .then((data) => { if (active) setProfile(data); })
      .catch((err: Error) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return <div className={s.page}>
    <header className={s.nav}>
      <Link href="/student/dashboard" className={s.logo}>KOALA</Link>
      <nav className={s.navLinks} aria-label="Nawigacja ucznia">
        <span className={s.muted}>Zadania (wkrótce)</span>
        <span className={s.muted}>Ranking (wkrótce)</span>
        <Link href="/student/dashboard">Moja drużyna</Link>
        <Link href="/student/change-password">Zmień hasło</Link>
        <button className={s.secondaryButton} onClick={async () => {
          try { await apiJson<unknown>("/api/student/logout", { method: "POST", body: "{}" }); }
          finally { router.replace("/student/login"); }
        }}>Wyloguj</button>
      </nav>
    </header>
    <main className={s.main}>
      <div className={s.eyebrow}>Panel ucznia</div>
      <h1 className={s.title}>Moja drużyna</h1>
      {loading && <p>Ładowanie danych...</p>}
      {error && <div role="alert" className={s.error}>{error} <Link href="/student/login">Przejdź do logowania</Link></div>}
      {profile && <div className={s.columns} style={{ marginTop: 24 }}>
        <section className={s.card}>
          <h2>Skład drużyny</h2>
          {profile.team.members.length === 0 ? <p className={s.muted}>Brak członków w danych z API.</p> :
            profile.team.members.map((member) => <div key={member.id} className={s.member}>{member.firstName}</div>)}
          <h2 style={{marginTop: 24}}>Zadania</h2>
          {!profile.tasks ? (
            <p className={s.muted}>Endpoint profilu nie udostępnia jeszcze zadań.</p>
          ) : profile.tasks.length === 0 ? (
            <p className={s.muted}>Brak udostępnionych zadań.</p>
          ) : profile.tasks.map((task) => (
            <div key={task.id} className={s.member}>
              <strong>{task.title}</strong>
              <div className={s.muted}>Status: {task.status}</div>
            </div>
          ))}
        </section>
        <aside className={s.card}>
          <p className={s.label}>Twoja drużyna</p><h2>{profile.team.name}</h2>
          <p className={s.label}>Szkoła</p><p className={s.value}>{profile.team.schoolName}</p>
          <p className={s.label}>Kategoria</p><p className={s.value}>{profile.team.categoryName}</p>
          <p className={s.label}>Zalogowano jako</p><p className={s.value}>{profile.firstName} ({profile.login})</p>
        </aside>
      </div>}
    </main>
  </div>;
}