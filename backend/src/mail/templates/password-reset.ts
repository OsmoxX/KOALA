import type { MailMessage } from '../mail.service.js';
import {
  button,
  colors,
  emailLayout,
  escapeHtml,
  infoBox,
  mutedText,
  paragraph,
} from './layout.js';

/** Uczeń, dla którego nauczyciel-opiekun dostaje link do nadania nowego hasła. */
export interface ResetForStudent {
  firstName: string;
  login: string;
  teamName: string;
}

export interface PasswordResetMessageParams {
  to: string;
  /** Imię odbiorcy (właściciela konta albo opiekuna ucznia). */
  recipientFirstName: string;
  link: string;
  expiresInMinutes: number;
  /** Ustawione, gdy reset dotyczy konta ucznia (mail idzie do opiekuna). */
  student?: ResetForStudent;
}

/**
 * E-mail z linkiem do ustawienia nowego hasła (KOALA-89).
 *
 * Dwa warianty:
 * - reset własnego konta (nauczyciel) – mail na adres konta,
 * - reset konta ucznia – uczeń nie ma e-maila, więc mail trafia do
 *   nauczyciela-opiekuna drużyny, który nadaje nowe hasło jednorazowe.
 */
export function passwordResetMessage(
  params: PasswordResetMessageParams,
): MailMessage {
  return params.student
    ? studentResetMessage(params, params.student)
    : ownResetMessage(params);
}

const validity = (minutes: number) =>
  minutes % 60 === 0
    ? `${minutes / 60} ${minutes === 60 ? 'godzinę' : 'godz.'}`
    : `${minutes} min`;

const appUrlOf = (link: string) => {
  try {
    return new URL(link).origin;
  } catch {
    return undefined;
  }
};

const linkFallback = (href: string) =>
  mutedText(
    `Jeśli przycisk nie działa, skopiuj ten adres do przeglądarki:<br>
<a href="${href}" style="color:${colors.brandDark};word-break:break-all">${href}</a>`,
  );

function ownResetMessage(p: PasswordResetMessageParams): MailMessage {
  const name = escapeHtml(p.recipientFirstName);
  const href = escapeHtml(p.link);
  const valid = validity(p.expiresInMinutes);

  const content = [
    paragraph(`Dzień dobry ${name},`),
    paragraph(
      'otrzymaliśmy prośbę o zresetowanie hasła do Twojego konta w systemie konkursu KOALA. Kliknij przycisk poniżej, aby ustawić nowe hasło.',
    ),
    button(p.link, 'Ustaw nowe hasło'),
    infoBox(
      `⏱ Link jest ważny przez <strong>${valid}</strong> i działa tylko raz.`,
    ),
    linkFallback(href),
    infoBox(
      '<strong>To nie Ty?</strong> Zignoruj tę wiadomość – Twoje hasło pozostanie bez zmian. Nikt nie zmieni go bez dostępu do tej skrzynki.',
      'warning',
    ),
    paragraph('Pozdrawiamy,<br>Zespół konkursu KOALA', 'margin:24px 0 0'),
  ].join('\n');

  return {
    to: p.to,
    subject: 'Resetowanie hasła – Konkurs KOALA',
    html: emailLayout({
      title: 'Resetowanie hasła',
      preheader: `Ustaw nowe hasło do konta KOALA. Link jest ważny przez ${valid}.`,
      content,
      appUrl: appUrlOf(p.link),
    }),
    text: [
      `Dzień dobry ${p.recipientFirstName},`,
      '',
      'otrzymaliśmy prośbę o zresetowanie hasła do Twojego konta w systemie konkursu KOALA.',
      'Aby ustawić nowe hasło, otwórz link:',
      p.link,
      '',
      `Link jest ważny przez ${valid} i działa tylko raz.`,
      'Jeśli to nie Ty, zignoruj tę wiadomość – hasło pozostanie bez zmian.',
      '',
      'Zespół konkursu KOALA',
    ].join('\n'),
  };
}

function studentResetMessage(
  p: PasswordResetMessageParams,
  student: ResetForStudent,
): MailMessage {
  const name = escapeHtml(p.recipientFirstName);
  const href = escapeHtml(p.link);
  const valid = validity(p.expiresInMinutes);
  const s = {
    firstName: escapeHtml(student.firstName),
    login: escapeHtml(student.login),
    teamName: escapeHtml(student.teamName),
  };
  const row = (label: string, value: string) =>
    `<tr><td style="padding:2px 16px 2px 0;color:${colors.muted};white-space:nowrap">${label}</td><td style="padding:2px 0;font-weight:bold">${value}</td></tr>`;

  const content = [
    paragraph(`Dzień dobry ${name},`),
    paragraph(
      `uczeń z Twojej drużyny zgłosił, że nie pamięta hasła do konta w systemie konkursu KOALA. Jako opiekun możesz nadać mu nowe hasło jednorazowe.`,
    ),
    infoBox(
      `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="font-size:15px;line-height:1.6;color:${colors.text}">
${row('Uczeń', s.firstName)}
${row('Login', `<span style="font-family:Menlo,Consolas,monospace">${s.login}</span>`)}
${row('Drużyna', s.teamName)}
</table>`,
    ),
    button(p.link, 'Nadaj nowe hasło'),
    paragraph(
      'Przekaż uczniowi nowe hasło w bezpieczny sposób. Przy najbliższym logowaniu system poprosi go o ustawienie własnego hasła.',
    ),
    infoBox(
      `⏱ Link jest ważny przez <strong>${valid}</strong> i działa tylko raz.`,
    ),
    linkFallback(href),
    infoBox(
      '<strong>Uczeń nie prosił o reset?</strong> Zignoruj tę wiadomość – jego hasło pozostanie bez zmian.',
      'warning',
    ),
    paragraph('Pozdrawiamy,<br>Zespół konkursu KOALA', 'margin:24px 0 0'),
  ].join('\n');

  return {
    to: p.to,
    subject: `Nowe hasło dla ucznia ${student.firstName} – Konkurs KOALA`,
    html: emailLayout({
      title: 'Uczeń prosi o nowe hasło',
      preheader: `${student.firstName} (${student.login}) z drużyny „${student.teamName}” nie pamięta hasła.`,
      content,
      appUrl: appUrlOf(p.link),
    }),
    text: [
      `Dzień dobry ${p.recipientFirstName},`,
      '',
      'uczeń z Twojej drużyny zgłosił, że nie pamięta hasła do konta w systemie konkursu KOALA.',
      `Uczeń: ${student.firstName}`,
      `Login: ${student.login}`,
      `Drużyna: ${student.teamName}`,
      '',
      'Aby nadać mu nowe hasło jednorazowe, otwórz link:',
      p.link,
      '',
      `Link jest ważny przez ${valid} i działa tylko raz. Przy najbliższym logowaniu uczeń ustawi własne hasło.`,
      'Jeśli uczeń nie prosił o reset, zignoruj tę wiadomość.',
      '',
      'Zespół konkursu KOALA',
    ].join('\n'),
  };
}
