/**
 * Wspólny układ e-maili HTML konkursu KOALA.
 *
 * Klienty pocztowe (Gmail, Outlook, Apple Mail) mocno ograniczają CSS, dlatego:
 * układ oparty na tabelach, style inline, szerokość maks. 600 px, bez obrazków
 * zewnętrznych (logo jest tekstowe) i bez skryptów. Kolory jak we frontendzie.
 */

export const colors = {
  brand: '#87a1e6',
  /** Ciemniejszy niebieski – biały tekst na nim ma kontrast > 4.5:1. */
  brandDark: '#4d6bc4',
  brandSoft: '#e7e9f5',
  text: '#233b32',
  muted: '#617068',
  background: '#f3f6f4',
  border: '#e1e4ef',
  warningSoft: '#fff7e6',
  warning: '#b7791f',
} as const;

const font = "Helvetica, Arial, 'Segoe UI', sans-serif";

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/** Przycisk działający także w Outlooku (tabela z tłem zamiast samego <a>). */
export function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px auto">
  <tr>
    <td align="center" bgcolor="${colors.brandDark}" style="border-radius:10px">
      <a href="${escapeHtml(href)}" target="_blank" style="display:inline-block;padding:15px 32px;font-family:${font};font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:10px">${escapeHtml(label)}</a>
    </td>
  </tr>
</table>`;
}

/** Ramka z informacją (np. dane ucznia, ważność linku). */
export function infoBox(html: string, tone: 'info' | 'warning' = 'info') {
  const bg = tone === 'info' ? colors.brandSoft : colors.warningSoft;
  const bar = tone === 'info' ? colors.brand : colors.warning;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0">
  <tr>
    <td style="background:${bg};border-left:4px solid ${bar};border-radius:10px;padding:16px 20px;font-family:${font};font-size:15px;line-height:1.6;color:${colors.text}">${html}</td>
  </tr>
</table>`;
}

export interface EmailLayoutParams {
  /** Tytuł karty (nagłówek h1). */
  title: string;
  /** Krótki tekst widoczny w skrzynce obok tematu. */
  preheader: string;
  /** Treść HTML (już z escapowanymi danymi). */
  content: string;
  /** Adres frontendu – do linków w stopce. */
  appUrl?: string;
}

export function emailLayout({
  title,
  preheader,
  content,
  appUrl,
}: EmailLayoutParams): string {
  const year = new Date().getFullYear();
  const footerLinks = appUrl
    ? `<a href="${escapeHtml(appUrl)}" style="color:${colors.brandDark};text-decoration:none">Strona konkursu</a>
       &nbsp;·&nbsp;
       <a href="${escapeHtml(`${appUrl}/rodo`)}" style="color:${colors.brandDark};text-decoration:none">Ochrona danych (RODO)</a>`
    : '';
  return `<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:${colors.background};-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${colors.background}">
  <tr>
    <td align="center" style="padding:32px 16px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px">
        <tr>
          <td style="padding:0 8px 20px;font-family:${font}">
            <span style="font-size:30px;font-weight:800;letter-spacing:-0.5px;color:${colors.brand}">KOALA</span>
            <span style="font-size:13px;color:${colors.muted};padding-left:8px">Konkurs matematyczno-informatyczny</span>
          </td>
        </tr>
        <tr>
          <td style="background:#ffffff;border:1px solid ${colors.border};border-radius:16px;overflow:hidden">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr><td style="height:6px;background:${colors.brand};font-size:0;line-height:0">&nbsp;</td></tr>
              <tr>
                <td style="padding:36px 40px 32px;font-family:${font};font-size:16px;line-height:1.6;color:${colors.text}">
                  <h1 style="margin:0 0 20px;font-size:26px;line-height:1.3;color:${colors.text}">${escapeHtml(title)}</h1>
                  ${content}
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 16px;font-family:${font};font-size:12px;line-height:1.6;color:${colors.muted};text-align:center">
            Wiadomość wysłana automatycznie przez system konkursu KOALA – prosimy na nią nie odpowiadać.<br>
            ${footerLinks}${footerLinks ? '<br>' : ''}© ${year} Konkurs KOALA
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

export const paragraph = (html: string, style = '') =>
  `<p style="margin:0 0 16px;${style}">${html}</p>`;

export const mutedText = (html: string) =>
  `<p style="margin:0 0 12px;font-size:13px;line-height:1.6;color:${colors.muted}">${html}</p>`;
