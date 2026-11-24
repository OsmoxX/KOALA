"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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
  const router = useRouter();
  const [team, setTeam] = useState<TeamDetails | null>(null);
  const [firstName, setFirstName] = useState("");
  const [credentials, setCredentials] = useState<StudentCredentials | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [renaming, setRenaming] = useState(false);
  const skipBlurRef = useRef(false);
  const renamingRef = useRef(false);
  const [deletingTeam, setDeletingTeam] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function loadTeam() {
    const data = await apiJson<TeamDetails>(`/api/teams/${encodeURIComponent(id)}`);
    setTeam(data);
  }

  async function commitRename() {
    if (skipBlurRef.current) {
      skipBlurRef.current = false;
      return;
    }
    if (renamingRef.current || !team) return;

    const trimmed = teamName.trim();
    if (!trimmed || trimmed === team.name) {
      setEditingName(false);
      return;
    }

    renamingRef.current = true;
    setRenaming(true);
    setError("");
    try {
      const updated = await apiJson<TeamDetails>(`/api/teams/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify({ name: trimmed }),
        keepalive: true,
      });
      setTeam(updated);
      setEditingName(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się zmienić nazwy drużyny.");
      setEditingName(false);
    } finally {
      renamingRef.current = false;
      setRenaming(false);
    }
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
          <div className={s.top} style={{ marginTop: 20 }}>
            <div>
              <div className={s.eyebrow}>Zarządzanie drużyną</div>
              <div className={s.titleRow}>
                {editingName ? (
                  <input
                    className={s.titleInput}
                    aria-label="Nazwa drużyny"
                    value={teamName}
                    size={Math.max(12, teamName.length + 1)}
                    onChange={(event) => setTeamName(event.target.value)}
                    onBlur={() => void commitRename()}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void commitRename();
                      } else if (event.key === "Escape") {
                        skipBlurRef.current = true;
                        setEditingName(false);
                        setError("");
                      }
                    }}
                    disabled={renaming}
                    maxLength={100}
                    autoFocus
                  />
                ) : (
                  <>
                    <h1 className={s.title}>{team.name}</h1>
                    <button
                      className={`${s.iconButton} ${s.editIconButton}`}
                      type="button"
                      aria-label="Zmień nazwę drużyny"
                      title="Zmień nazwę drużyny"
                      disabled={deletingTeam || removingId !== null}
                      onClick={() => {
                        setError("");
                        setTeamName(team.name);
                        setEditingName(true);
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                      </svg>
                    </button>
                    <button
                      className={`${s.iconButton} ${s.deleteIconButton}`}
                      type="button"
                      aria-label="Usuń drużynę"
                      title="Usuń drużynę"
                      disabled={deletingTeam || renaming || removingId !== null}
                      onClick={async () => {
                        if (!window.confirm(`Usunąć drużynę "${team.name}"? Konta wszystkich jej uczniów również zostaną usunięte.`)) return;
                        setError("");
                        setDeletingTeam(true);
                        try {
                          await apiJson<unknown>(`/api/teams/${encodeURIComponent(id)}`, { method: "DELETE" });
                          router.replace("/dashboard/teams");
                        } catch (err) {
                          setError(err instanceof Error ? err.message : "Nie udało się usunąć drużyny.");
                          setDeletingTeam(false);
                        }
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        <path d="M10 11v6" />
                        <path d="M14 11v6" />
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
              <p className={s.subtitle}>{team.categoryName}</p>
            </div>
            <span className={s.pill}>{team.students.length} / {team.maxMembers} uczniów</span>
          </div>
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