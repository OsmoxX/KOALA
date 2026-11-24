import { passwordResetMessage } from './password-reset.js';

describe('passwordResetMessage (KOALA-89)', () => {
  const base = {
    to: 'anna.nowak@example.com',
    recipientFirstName: 'Anna',
    link: 'http://localhost:3001/reset-hasla?token=abc_DEF-123',
    expiresInMinutes: 60,
  };

  it('reset własnego konta: link w HTML i w wersji tekstowej', () => {
    const mail = passwordResetMessage(base);
    expect(mail.to).toBe(base.to);
    expect(mail.subject).toBe('Resetowanie hasła – Konkurs KOALA');
    expect(mail.html).toContain('<!DOCTYPE html>');
    expect(mail.html).toContain(`href="${base.link}"`);
    expect(mail.text).toContain(base.link);
    expect(mail.text).toContain('1 godzinę');
    expect(mail.html).toContain('http://localhost:3001/rodo');
  });

  it('reset konta ucznia: mail do opiekuna z danymi ucznia', () => {
    const mail = passwordResetMessage({
      ...base,
      student: {
        firstName: 'Ola',
        login: 'ola.k7f3',
        teamName: 'Pitagorejczycy',
      },
    });
    expect(mail.subject).toBe('Nowe hasło dla ucznia Ola – Konkurs KOALA');
    expect(mail.html).toContain('ola.k7f3');
    expect(mail.html).toContain('Pitagorejczycy');
    expect(mail.text).toContain('Login: ola.k7f3');
  });

  it('escapuje dane wpisane przez użytkowników', () => {
    const mail = passwordResetMessage({
      ...base,
      recipientFirstName: '<b>Anna</b>',
      student: {
        firstName: '<script>x</script>',
        login: 'ola',
        teamName: '"Zespół" & spółka',
      },
    });
    expect(mail.html).not.toContain('<script>');
    expect(mail.html).not.toContain('<b>Anna</b>');
    expect(mail.html).toContain('&lt;script&gt;');
    expect(mail.html).toContain('&quot;Zespół&quot; &amp; spółka');
  });
});
