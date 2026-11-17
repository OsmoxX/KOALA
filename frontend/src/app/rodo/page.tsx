import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Klauzula RODO – KOALA',
  description:
    'Informacja o przetwarzaniu danych osobowych (RODO) w systemie konkursowym KOALA.',
};

export default function RodoPage() {
  return (
    <main className="auth-page">
      <article className="auth-card rodo-card">
        <h1 className="brand">KOALA</h1>
        <h2>Informacja o przetwarzaniu danych osobowych (RODO)</h2>

        <p className="subtitle">
          Zgodnie z art. 13 Rozporządzenia Parlamentu Europejskiego i Rady (UE)
          2016/679 z dnia 27 kwietnia 2016 r. (RODO) informujemy o zasadach
          przetwarzania danych osobowych w ramach konkursu{' '}
          <strong>KOALA (KOmbinatoryka, Algorytmika i LOgika)</strong>.
        </p>

        <section className="rodo-section">
          <h3>1. Administrator danych osobowych</h3>
          <p>
            Administratorem Twoich danych osobowych jest organizator konkursu
            KOALA –{' '}
            <strong>
              Uniwersytet im. Adama Mickiewicza w Poznaniu, Wydział Matematyki
              i Informatyki
            </strong>{' '}
            (ul. Uniwersytetu Poznańskiego 4, 61-614 Poznań).
          </p>
        </section>

        <section className="rodo-section">
          <h3>2. Zakres przetwarzanych danych</h3>
          <p>W systemie konkursowym przetwarzane są w szczególności:</p>
          <ul>
            <li>
              dane nauczycieli-opiekunów: imię, nazwisko, adres e-mail, nazwa
              oraz miejscowość szkoły,
            </li>
            <li>
              dane uczniów zgłoszonych do udziału w konkursie (w zakresie
              niezbędnym do przeprowadzenia konkursu i ogłoszenia wyników),
            </li>
            <li>
              dane techniczne związane z obsługą konta i bezpieczeństwem
              (zaszyfrowane hasło, tokeny weryfikacji adresu e-mail, sesja
              logowania).
            </li>
          </ul>
        </section>

        <section className="rodo-section">
          <h3>3. Cel i podstawa prawna przetwarzania</h3>
          <p>Dane osobowe są przetwarzane w celu:</p>
          <ul>
            <li>
              rejestracji konta, weryfikacji adresu e-mail oraz organizacji i
              przeprowadzenia konkursu KOALA (art. 6 ust. 1 lit. a RODO – zgoda
              wyrażona podczas rejestracji, oraz art. 6 ust. 1 lit. e/f RODO –
              realizacja wydarzenia edukacyjnego i prawnie uzasadniony interes
              organizatora),
            </li>
            <li>
              kontaktu organizacyjnego z opiekunami drużyn, oceny zadań,
              publikacji list laureatów oraz wydania dyplomów i zaświadczeń,
            </li>
            <li>
              wypełnienia obowiązków prawnych i archiwizacyjnych ciążących na
              Administratorze (art. 6 ust. 1 lit. c RODO).
            </li>
          </ul>
        </section>

        <section className="rodo-section">
          <h3>4. Okres przechowywania danych</h3>
          <p>
            Dane będą przechowywane przez okres trwania danej edycji konkursu
            KOALA, a następnie przez czas niezbędny do rozliczenia konkursu,
            ewentualnego rozpatrzenia odwołań oraz realizacji obowiązków
            archiwizacyjnych, lub do momentu cofnięcia zgody / usunięcia konta
            (o ile nie zachodzi inna podstawa prawna dalszego przetwarzania).
          </p>
        </section>

        <section className="rodo-section">
          <h3>5. Odbiorcy danych</h3>
          <p>
            Dostęp do danych mają wyłącznie upoważnieni członkowie Komitetu
            Organizacyjnego i Jury konkursu KOALA oraz podmioty zapewniające
            utrzymanie techniczne systemu i obsługę wiadomości e-mail. Dane nie
            są sprzedawane ani przekazywane podmiotom trzecim w celach
            marketingowych.
          </p>
        </section>

        <section className="rodo-section">
          <h3>6. Prawa osób, których dane dotyczą</h3>
          <p>Przysługuje Ci prawo do:</p>
          <ul>
            <li>dostępu do treści swoich danych oraz otrzymania ich kopii,</li>
            <li>sprostowania (poprawiania) nieprawidłowych danych,</li>
            <li>
              usunięcia danych lub ograniczenia ich przetwarzania w przypadkach
              przewidzianych prawem,
            </li>
            <li>przenoszenia danych oraz wniesienia sprzeciwu,</li>
            <li>
              cofnięcia zgody w dowolnym momencie (bez wpływu na zgodność z
              prawem przetwarzania dokonanego przed jej cofnięciem),
            </li>
            <li>
              wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych
              (PUODO), jeśli uznasz, że przetwarzanie narusza przepisy RODO.
            </li>
          </ul>
        </section>

        <section className="rodo-section">
          <h3>7. Dobrowolność podania danych</h3>
          <p>
            Podanie danych osobowych jest dobrowolne, jednak niezbędne do
            utworzenia konta w systemie i udziału w konkursie KOALA.
          </p>
        </section>

        <p className="auth-footer">
          <Link href="/login">Przejdź do logowania</Link>
          {' · '}
          <Link href="/register">Rejestracja nauczyciela</Link>
        </p>
      </article>
    </main>
  );
}

