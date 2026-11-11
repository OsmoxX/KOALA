import type { MailMessage } from '../mail.service.js';

/**
 * Wiadomość z linkiem aktywacyjnym. Treść robocza – docelową przygotowuje
 * KOALA-133 (projekt treści e-maila); wystarczy podmienić ten szablon.
 */
export function verifyEmailMessage(params: {
  to: string;
  firstName: string;
  link: string;
  expiresInHours: number;
}): MailMessage {
  const { to, firstName, link, expiresInHours } = params;
  const name = escapeHtml(firstName);
  const href = escapeHtml(link);
  return {
    to,
    subject: 'Potwierdź adres e-mail – Konkurs KOALA',
    text: [
      `Dzień dobry ${firstName},`,
      '',
      'dziękujemy za założenie konta w systemie konkursu KOALA.',
      'Aby je aktywować, otwórz poniższy link:',
      link,
      '',
      `Link jest ważny przez ${expiresInHours} godz. Jeśli to nie Ty zakładałeś(-aś) konto, zignoruj tę wiadomość.`,
      '',
      'Zespół konkursu KOALA',
    ].join('\n'),
    html: `<p>Dzień dobry ${name},</p>
<p>dziękujemy za założenie konta w systemie konkursu KOALA. Aby je aktywować, kliknij przycisk poniżej.</p>
<p><a href="${href}" style="display:inline-block;padding:10px 18px;background:#2f6b3a;color:#fff;text-decoration:none;border-radius:6px">Potwierdzam adres e-mail</a></p>
<p>Jeśli przycisk nie działa, skopiuj link do przeglądarki:<br><a href="${href}">${href}</a></p>
<p>Link jest ważny przez ${expiresInHours} godz. Jeśli to nie Ty zakładałeś(-aś) konto, zignoruj tę wiadomość.</p>
<p>Zespół konkursu KOALA</p>`,
  };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
