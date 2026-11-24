/**
 * Wysyła przykładowe e-maile resetu hasła przez Resend (KOALA-89), żeby
 * można je było obejrzeć w historii Resend (Emails) i w skrzynce.
 * Zapisuje też podgląd HTML do katalogu mail-preview/.
 *
 *   npm run mail:sample -- --to twoj@adres.pl
 *
 * Wymaga RESEND_API_KEY w .env. Przy nadawcy onboarding@resend.dev Resend
 * pozwala wysyłać tylko na adres właściciela konta Resend.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../mail/mail.service.js';
import { passwordResetMessage } from '../mail/templates/password-reset.js';

const { values } = parseArgs({
  options: {
    to: { type: 'string', default: process.env.MAIL_SAMPLE_TO },
    variant: { type: 'string', default: 'all' },
  },
});

const to = values.to;
if (!to) {
  console.error(
    'Podaj adresata: npm run mail:sample -- --to adres@example.com',
  );
  process.exit(1);
}

const appUrl = (
  process.env.PASSWORD_RESET_URL ?? 'http://localhost:3001/reset-hasla'
).replace(/\/+$/, '');
const link = `${appUrl}?token=przykladowy-token-do-prezentacji`;

const messages = {
  nauczyciel: passwordResetMessage({
    to,
    recipientFirstName: 'Anna',
    link,
    expiresInMinutes: 60,
  }),
  uczen: passwordResetMessage({
    to,
    recipientFirstName: 'Anna',
    link,
    expiresInMinutes: 60,
    student: {
      firstName: 'Ola',
      login: 'ola.k7f3',
      teamName: 'Pitagorejczycy',
    },
  }),
};

const selected = Object.entries(messages).filter(
  ([name]) => values.variant === 'all' || values.variant === name,
);

mkdirSync('mail-preview', { recursive: true });
const mail = new MailService(new ConfigService());
for (const [name, message] of selected) {
  writeFileSync(`mail-preview/reset-hasla-${name}.html`, message.html);
  await mail.send(message);
  console.log(`✓ ${name}: „${message.subject}” → ${to}`);
}
console.log('Podgląd HTML: mail-preview/');
