"use client";
import { Suspense } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiJson } from "@/lib/koala-client";
import type { StudentCredentials, TeamDetails } from "@/lib/koala-types";
import { LogoutButton } from "@/components/logout-button";
import s from "@/app/management.module.css";

export default function TeamDetailsPage() {
  return (
    <Suspense fallback={<p>Ładowanie drużyny...</p>}>
      <TeamDetailsContent />
    </Suspense>
  );
}

function TeamDetailsContent() {
  const { id } = useParams<{ id: string }>();
  const [team, setTeam] = useState<TeamDetails | null>(null);
  const [firstName, setFirstName] = useState("");
  const [credentials, setCredentials] = useState<StudentCredentials | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function loadTeam() {
    const data = await apiJson<TeamDetails>(`/api/teams/${encodeURIComponent(id)}`);
    setTeam(data);
  }

  useEffect(() => {
    let active = true;
    apiJson<TeamDetails>(`/api/teams/${encodeURIComponent(id)}`)
      .then((data) => { if (active) setTeam(data); })
      .catch((err: Error) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  const full = team !== null && team.students.length >= team.maxMembers;

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
        {loading && <p>Ładowanie...</p>}
        {error && <div role="alert" className={s.error}>{error}</div>}
        {team && <>
          <div className={s.top} style={{ marginTop: 20 }}><div><div className={s.eyebrow}>Zarządzanie drużyną</div><h1 className={s.title}>{team.name}</h1><p className={s.subtitle}>{team.categoryName}</p></div><span className={s.pill}>{team.students.length} / {team.maxMembers} uczniów</span></div>
          <div className={s.columns}>
            <section className={s.card}>
              <h2>Skład drużyny</h2>
              <p className={s.muted}>Limit: od {team.minMembers} do {team.maxMembers} osób.</p>
              {team.students.length === 0 ? <p>Nie dodano jeszcze uczniów.</p> : team.students.map((student) => (
                <div className={`${s.member} ${s.memberRow}`} key={student.id}>
                  <div className={s.memberInfo}>
                    <strong>{student.firstName}</strong>
                    <div className={s.muted}>Login: {student.login}</div>
                  </div>
                  <button
                    className={`${s.secondaryButton} ${s.memberAction}`}
                    type="button"
                    disabled={removingId !== null}
                    onClick={async () => {
                      if (!window.confirm(`Usunąć ucznia ${student.firstName} z drużyny?`)) return;
                      setError("");
                      setRemovingId(student.id);
                      try {
                        await apiJson<unknown>(`/api/teams/${encodeURIComponent(id)}/students/${encodeURIComponent(student.id)}`, {method: "DELETE"});
                        await loadTeam();
                      } catch (err) {
                        setError(err instanceof Error ? err.message : "Nie udało się usunąć ucznia.");
                      } finally {
                        setRemovingId(null);
                      }
                    }}
                  >{removingId === student.id ? "Usuwanie..." : "Usuń ucznia"}</button>
                </div>
              ))}
              {team.students.length < team.minMembers && <div className={s.notice}>Drużyna nie osiągnęła jeszcze minimalnej liczby uczniów.</div>}
            </section>
            <section className={s.card}>
              <h2>Dodaj ucznia</h2>
              {full ? <p className={s.notice}>Osiągnięto maksymalną liczbę uczniów.</p> : (
                <form className={s.form} onSubmit={async (event) => {
                  event.preventDefault();
                  setCredentials(null);
                  setError("");
                  if (!firstName.trim()) return setError("Podaj imię ucznia.");
                  setSaving(true);
                  try {
                    const result = await apiJson<StudentCredentials>(`/api/teams/${encodeURIComponent(id)}/students`, {
                      method: "POST",
                      body: JSON.stringify({ firstName: firstName.trim() }),
                    });
                    setCredentials(result);
                    setFirstName("");
                    await loadTeam();
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Nie udało się dodać ucznia.");
                  } finally { setSaving(false); }
                }}>
                  <label className={s.field}>Imię ucznia<input className={s.input} value={firstName} onChange={(event) => setFirstName(event.target.value)} maxLength={100} required /></label>
                  <button className={s.button} disabled={saving}>{saving ? "Dodawanie..." : "Dodaj ucznia"}</button>
                </form>
              )}
              {credentials && <div className={s.notice} role="status">
                <strong>Dane logowania nowego ucznia</strong>
                <p>Login: <strong>{credentials.login}</strong></p>
                <p>Hasło jednorazowe: <strong>{credentials.temporaryPassword}</strong></p>
                <p>Zapisz i przekaż dane uczniowi w bezpieczny sposób. Hasło nie będzie ponownie wyświetlane.</p>
              </div>}
            </section>
          </div>
        </>}
      </main>
    </div>
  );
}