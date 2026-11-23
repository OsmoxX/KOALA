import Link from "next/link";
import s from "@/app/management.module.css";

export default function ResetPasswordPage() {
  return <div className={s.page}>
    <header className={s.nav}><Link href="/" className={s.logo}>KOALA</Link></header>
    <main className={s.main} style={{ maxWidth: 620 }}>
      <section className={s.card}>
        <div className={s.eyebrow}>Strefa ucznia</div>
        <h1 className={s.title}>Odzyskiwanie dostępu</h1>
        <p>Jeśli nie pamiętasz hasła, skontaktuj się z nauczycielem-opiekunem swojej drużyny.</p>
        <p className={s.muted}>Sposób wydawania nowego hasła zostanie dodany po przygotowaniu bezpiecznego procesu resetu w backendzie.</p>
        <Link href="/student/login" className={s.secondaryButton}>Wróć do logowania</Link>
      </section>
    </main>
  </div>;
}