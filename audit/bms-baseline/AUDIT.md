# Audyt przed migracją BMS Technik

**6 listopada 2026 r., 15:10–15:28 CET.** Zakres obejmuje publiczną witrynę `bmstechnik.pl` i wariant `www`. Audyt wykonano metodą GET oraz publicznymi zapytaniami DNS. Nie wysyłano formularza kontaktowego i nie wprowadzano zmian na produkcji.

## Najważniejsze ustalenia

- **Zachować pięć ścieżek biznesowych z końcowym ukośnikiem.** Strona główna, obie usługi, kontakt i polityka prywatności zwróciły 200 i wskazują na własny adres canonical w HTTPS bez `www`. Te adresy należy zachować jako 200. Nawigację i linki w treści należy kierować bezpośrednio na wersje kanoniczne.
- **Zachować publiczne ścieżki mediów.** Publiczne REST API zwróciło 31 pozycji biblioteki w jednej stronie wyników. Zawierają osobne strony załączników, obrazy pełnowymiarowe, oryginały przed skalowaniem i pochodne. Wszystkie 248 wykrytych URL-i pod `/wp-content/uploads/` zwróciło 200. Na stronach usług wykryto bezpośrednie użycie pochodnych w galeriach i linkach powiększenia. Dokładne adresy wraz z wielkością liter, MIME i SHA-256 są w inwentarzu.
- **WordPress publikuje też treści techniczne i przykładowe.** Indeks sitemap zawiera wpis startowy, jego kategorię i archiwum autora. Linkowanie w widżetach ujawnia również archiwum z marca 2022 r. Strony załączników pochodzą głównie z API. Przed zmianą ich statusów trzeba zdecydować, które zachować i gdzie istnieje rzeczywiście równoważny cel przekierowania.
- **Kontakt zależy od WordPressa.** Formularz WPForms Lite używa AJAX i Google reCAPTCHA v3. Ścieżka GET kontaktu, kategorie zapytań, zgoda, walidacja i dostarczenie wiadomości to osobne warunki odbioru.
- **Zmiana DNS może dotknąć poczty.** Zaobserwowane NS to `ns1.seohost.pl` i `ns2.seohost.pl`, a MX wskazuje `mail.bmstechnik.pl` z priorytetem 10. Obie nazwy WWW miały rekord A `188.210.222.99` w użytym resolverze. Dane punktowe są w [dns.json](dns.json). Jeżeli zmieniane będą serwery nazw, przed przełączeniem trzeba odtworzyć i zweryfikować całą strefę, w tym rekordy pocztowe.

## Strony i indeksowanie

| Ścieżka HTTPS bez `www` | Title | Canonical w HTML | H1 |
| --- | --- | --- | --- |
| `/` | BMS Technik • Rekuperacja, klimatyzacja, wentylacja, serwis | Własny adres | Brak |
| `/rekuperacja/` | Rekuperacja • BMS Technik | Własny adres | Brak |
| `/klimatyzacja/` | Klimatyzacja • BMS Technik | Własny adres | Brak |
| `/kontakt/` | Kontakt • BMS Technik | Własny adres | Brak |
| `/polityka-prywatnosci/` | Polityka prywatności • BMS Technik | Własny adres | Polityka prywatności |
| `/witaj-swiecie/` | Witaj, świecie! • BMS Technik | Własny adres | Witaj, świecie! |
| `/category/bez-kategorii/` | Bez kategorii • BMS Technik | Brak | Kategoria: Bez kategorii |
| `/author/ms_admin/` | ms_admin • BMS Technik | Brak | Autor: ms_admin |
| `/2022/03/` | marzec 2022 • BMS Technik | Brak | Miesiąc: marzec 2022 |

Na wymienionych stronach HTML nie wykryto `meta description`, Open Graph, metadanych Twitter ani danych strukturalnych w JSON-LD, Microdata lub RDFa. Wspólna dyrektywa meta robots to `max-image-preview:large`. Wprowadzenie nowych opisów, danych strukturalnych i H1 warto oddzielić w porównaniu od testów ciągłości migracji. Na części odpowiedzi WordPress REST występuje nagłówek `X-Robots-Tag: noindex`. Każda z 31 stron załączników zwróciła 200, ma własny canonical i w tym pomiarze nie zawiera `noindex`. Brak tych stron w sitemapie nie wyklucza ich indeksowania.

`/robots.txt` dopuszcza publiczne ścieżki, blokuje `/wp-admin/` z wyjątkiem `/wp-admin/admin-ajax.php` i podaje `/wp-sitemap.xml`. `/sitemap.xml` zwraca 301 do tego indeksu. Jego cztery mapy obejmują wpisy, strony, kategorie i autorów, łącznie osiem unikatowych adresów. `/sitemap_index.xml` zwraca 404. Po migracji oba publiczne punkty wejścia do działającej dziś mapy powinny nadal umożliwiać dotarcie do aktualnej mapy.

## Nawigacja i struktura treści

| Obszar | Elementy z publicznego HTML do uwzględnienia |
| --- | --- |
| Strona główna | Logo z linkiem do strony głównej, tło `bg-home.jpg`, dwa wejścia usługowe, sekcja kontaktowa, dwa adresy i link do polityki prywatności. Strona ma odrębny układ od podstron. |
| Wspólny nagłówek i stopka | Motyw `bms-technik`, logo, nawigacja desktopowa i mobilna, przycisk menu, linki do dwóch usług, skróty telefoniczne i pocztowe, link do kontaktu i polityki prywatności. Dane adresowe obejmują Skałę i Kraków. |
| Rekuperacja | Baner tła, wprowadzenie, pięć ikon etapów usługi, karuzela realizacji z pięcioma obrazami w wariancie `900x460` oraz nawigacją karuzeli, CTA do kontaktu, sekcja korzyści. HTML i skrypty wskazują Owl Carousel oraz własny komponent slidera. |
| Klimatyzacja | Baner, wprowadzenie i ikony obsługi serwisowej, akordeon z częścią domową i biurową, galerie z odpowiednio dwoma i trzema zdjęciami. Miniatury `270x270` mają linki do większych plików `1080x1080` i `1080x810`. Skrypty wskazują Owl Carousel, Magnific Popup i własny akordeon. Dalej są CTA, przeglądy i serwis, ilustracja oraz lista czynności serwisowych. |
| Kontakt | Baner, opis kontaktu, formularz i wspólna stopka. Brak osadzonej mapy w HTML. |
| Polityka prywatności | H1, sekcje danych osobowych i cookies. Treść jest w snapshocie. Przed wdrożeniem formularza trzeba potwierdzić zgodność opisu z rzeczywistymi integracjami i przetwarzaniem. |
| Wpis i archiwa | Wpis przykładowy, archiwa kategorii, autora i miesiąca, odsyłacze do wpisu i widżety WordPressa, w tym formularz wyszukiwania GET `/?s=…`. |

Na stronach usługowych nagłówki główne zaczynają się od H2. Tytuły akordeonu klimatyzacji są elementami `div` bez `aria-expanded` w odpowiedzi HTML. Zdjęcia obu galerii mają pusty atrybut `alt`, a linki do powiększeń w klimatyzacji opierają się na tych obrazach. W odbiorze warto sprawdzić nazwy linków, obsługę klawiatury, pozycję fokusu, kolejność zdjęć i czytelność struktury nagłówków. W nagłówku podstron wykryto błędny schemat `emailto:` i numery z odstępami w `tel:`. Stopka zawiera działające składniowo `mailto:` i numery bez odstępów w adresie linku.

### Formularz kontaktowy

WPForms Lite, identyfikator 56. HTML deklaruje `POST /kontakt/` z `multipart/form-data`, klasę formularza AJAX, a skrypt konfiguracyjny wskazuje `/wp-admin/admin-ajax.php`. Wymagane pola to imię, e-mail, kategoria, wiadomość i checkbox zgody. Kategorie to Rekuperacja, Klimatyzacja, Wentylacja i Inna. Wiadomość ma limit 4000 znaków. Widoczne są przycisk „Wyślij”, wskaźnik wysyłania i komunikat dla wyłączonego JavaScriptu. Zgoda odwołuje się tekstem do polityki prywatności, do której prowadzi link w stopce. HTML deklaruje reCAPTCHA v3 i ładuje publiczny skrypt Google.

Z publicznego HTML nie da się ustalić adresatów e-mail, ewentualnego routingu po kategorii, danych dostawcy poczty, retencji, treści potwierdzenia po poprawnym zapisie ani reguł walidacji serwerowej i obsługi spamu. W audycie nie wykonano próby wysyłki.

### Zasoby i zależności

- Publiczne ścieżki mediów są rozłożone w katalogach `/wp-content/uploads/2022/03/`, `/2022/06/` i `/2022/09/` pod tym samym prefiksem. Wielkość liter ma znaczenie, np. w nazwach `IMG_…` i `Wentylacja-…`. Inwentarz rozróżnia plik użyty w HTML, plik pełnowymiarowy z REST i wariant rozmiaru. Niektóre pozycje w bibliotece nie występują na pięciu stronach biznesowych.
- Wspólny HTML deklaruje logo SVG, ikony PNG w rozmiarach 32×32 i 192×192 oraz ikonę Apple Touch. Pliki wskazane przez HTML zwróciły 200, a konwencjonalny `/favicon.ico` zwrócił 404.
- Arkusz motywu wskazuje rodziny Monda w wagach 400 i 700 oraz Share Tech w Google Fonts. Zapisano arkusz dostawcy i cztery pliki WOFF2 wskazane dla użytego UA, wszystkie z odpowiedzią 200. Publiczne zależności obejmują też jQuery, jQuery Migrate, skrypty motywu, komponenty galerii, WPForms Lite, Google reCAPTCHA oraz zasoby feedów i osadzeń WordPressa.
- Dwa pliki używane przez reguły CSS zwracają 404 zarówno po HTTP, jak i po HTTPS. `owl.video.play.png` jest ikoną odtwarzania wideo w Owl Carousel, a `times-solid-white.svg` ikoną czyszczenia pola daty w WPForms. W wykrytych galeriach są obrazy, a formularz nie zawiera pola daty. Błędy potwierdzono dla adresów plików, a faktyczne wywołanie tych reguł zależy od renderowania i użycia komponentów.

## Routing i ryzyka dla Astro oraz Cloudflare

- Strona główna po HTTP zwraca 301 do HTTPS. Osiem podstron i archiwów z tabeli, z ukośnikiem na hoście bez `www`, zwróciło 200 także po HTTP, z tym samym skrótem tekstu głównego jak po HTTPS. Na pięciu z nich canonical w HTML wskazuje wersję HTTPS, a na trzech archiwach go brakuje. Testowane wersje z `www` tych podstron przekierowują na host bez `www`, zachowując protokół żądania. Szczegóły są w macierzy.
- Na obu stronach usługowych CTA do kontaktu prowadzi do `http://bmstechnik.pl/kontakt/`. W HTML klimatyzacji ilustracja serwisu ma również adres `http://…`, a plik zwrócił 200 pod oboma protokołami. To ryzyko mixed content. W nowym HTML linki i źródła zasobów powinny używać bezpośrednio HTTPS.
- Ścieżki WordPressa z parametrami `?p=` i `?page_id=`, adresy stron załączników, feedy i punkty API trzeba potraktować osobno. Pięć aliasów `?page_id=` prowadzi kodem 301 do właściwych stron biznesowych, a dawny slug `/przykladowa-strona/` prowadzi kodem 301 do `/`. Mapa poniżej zapisuje ich faktyczne odpowiedzi i cele. Przy świadomym wycofaniu ścieżki bez trafnego odpowiednika użyć 404 lub 410 po sprawdzeniu wykorzystania. Zbiorcze przekierowanie starych ścieżek do strony głównej może zostać odczytane jako soft 404. [Google Search Central](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes)
- Odpowiedzi oEmbed ujawniają 37 osobnych widoków `/embed/` i archiwum `/author/bms_michal/`. Archiwum zwraca 200, ale wyświetla komunikat o braku wyników i nie ma canonical. Jest kandydatem do weryfikacji jako soft 404. Wskazany przez nie endpoint REST `/wp-json/wp/v2/users/2` zwraca 401. Z 37 adresów osadzeń 36 zwraca 200 z `noindex, follow`, a `/embed/` strony głównej zwraca 301 do `/`. Pięć osadzeń linkuje do brakującej kotwicy `#respond`. Wykorzystanie osadzeń poza domeną pozostaje do potwierdzenia.
- Próbka `/?s=rekuperacja` zwraca 200 z `noindex, follow`. Aliasy `?author=1`, `?cat=1` i `?m=202203` prowadzą kodem 301 do odpowiednich archiwów. Dodatkowa sonda `/2022/` ujawniła działające archiwum roczne.
- Astro opisuje oddzielne zachowanie ukośników dla tras renderowanych na żądanie i stron prerenderowanych. Dla tych drugich odpowiedź zależy od hostingu. Domyślne reguły HTML w Workers Static Assets mogą zwrócić 307 przy zmianie ukośnika, a domyślne zachowanie Cloudflare Pages bez własnego 404 może obsłużyć nieznaną trasę jak aplikację SPA. Przed przełączeniem zmierzyć rzeczywiste odpowiedzi na preview, łącznie ze statusem i pełnym `Location`. [Astro](https://docs.astro.build/en/reference/configuration-reference/#trailingslash), [Cloudflare Workers](https://developers.cloudflare.com/workers/static-assets/routing/advanced/html-handling/), [Cloudflare Pages](https://developers.cloudflare.com/pages/configuration/serving-pages/)
- Jeżeli routing przejmą funkcje, sprawdzić kolejność reguł na trasach statycznych i dynamicznych. Reguły `_redirects` dla zasobów nie obsługują odpowiedzi przejętych przez Pages Functions lub kod Workera. [Cloudflare Pages](https://developers.cloudflare.com/pages/configuration/redirects/), [Cloudflare Workers](https://developers.cloudflare.com/workers/static-assets/redirects/)

## Checklista migracyjna

### Przed implementacją

- [ ] Zatwierdzić pięć kanonicznych URL-i biznesowych i politykę dla wpisu, archiwów, stron załączników, feedów, wyszukiwania i publicznych API.
- [ ] Zweryfikować historyczne URL-e i pliki spoza crawla na podstawie dostępnych danych o indeksacji, linkach przychodzących, logach i ruchu. Przypisać każdy używany wariant do docelowego statusu lub równoważnego URL-a.
- [ ] Zatwierdzić listę zachowanych ścieżek `/wp-content/uploads/`, w tym wariantów zdjęć, plików logo, ikon i favicon. Sprawdzić pochodzenie i licencje materiałów oraz fontów.
- [ ] Uzgodnić działanie formularza i ochronę przed spamem, odbiorców, retencję, potwierdzenia, obsługę błędów i obsługę awarii poczty.
- [ ] Przygotować kopię strefy DNS, plan przełączenia i powrotu oraz niezależną weryfikację rekordów pocztowych, w tym MX, hosta poczty, SPF, DKIM i DMARC.

### Przed przełączeniem i po nim

- [ ] Porównać publiczny build z manifestem po pełnych URL-ach: status pierwszej odpowiedzi, łańcuch, docelowy URL, canonical, title, robots, język, nagłówki, treść główną i odsyłacze. Jawnie oznaczyć zatwierdzone różnice SEO.
- [ ] Sprawdzić macierz protokołu, hosta i ukośników na rzeczywistych odpowiedziach hostingu. Dla niekanonicznych wariantów użyć trwałego przekierowania bez zbędnych etapów, zachowując wymagane parametry i ścieżki.
- [ ] Porównać oryginalne ścieżki zasobów, MIME, rozmiar i SHA-256 dla plików zachowywanych bajt w bajt. Sprawdzić `srcset`, tła, obrazy powiększenia, ikony i fonty. Oddzielić zamierzone optymalizacje od przypadkowej utraty zasobów.
- [ ] Sprawdzić menu mobilne, akordeon i karuzele na dotyku i klawiaturze, zdjęcia bez JavaScriptu w zakresie przyjętego projektu, CTA, adresy, telefon i pocztę.
- [ ] Na środowisku testowym sprawdzić poprawne i błędne wysyłki formularza, zgodę, limit długości, zabezpieczenie antyspamowe, routing i realne dostarczenie.
- [ ] Zweryfikować 404 dla fikcyjnej ścieżki i brak miękkich 404. Sprawdzić mapę sitemap i robots.txt na docelowym hoście, usunięcie ewentualnego stagingowego `noindex` z adresów biznesowych oraz monitoring błędów i indeksacji po zmianie.

## Metoda, artefakty i ograniczenia

- [manifest.json](manifest.json) zawiera wszystkie rozpoznane adresy HTTP(S), role odkrycia, próby, nagłówki, przekierowania i wynik końcowy. `urls` jest słownikiem po dokładnym URL-u. `http` opisuje ostatnią odpowiedź na ten URL, `chain` kolejne kroki, a `http.body` wskazuje plik i sumę kontrolną. Rozróżniono odpowiedź HTTP, błąd transportu i referencję bez żądania.
- [pages.json](pages.json) zapisuje metadane, H1–H6, elementy strukturalne, tekst obszaru głównego z SHA-256, obrazy, osadzenia, formularze, linki, ich kotwice i identyfikatory celu. Zawiera także przeanalizowane dokumenty błędów. Brak tagu jest pustą listą. Linki `mailto:`, `tel:` i lokalne kotwice są zapisane tutaj wraz z surowym `href`.
- [assets.json](assets.json) to inwentarz URL-i zasobów z flagą `wp_upload`, typem MIME, statusem i odsyłaczem do pobranej treści. [references.json](references.json) zawiera graf odkrycia, a [discovery.json](discovery.json) źródła sitemap i publiczne metadane mediów WordPressa. Nagłówki kolekcji, m.in. `X-WP-Total`, są zachowane w manifeście.
- `snapshot/sha256/` zawiera treści HTTP zapisane lokalnie według SHA-256. Wiele adresów może wskazywać ten sam plik. Przy porównaniu stron odczytać zarówno odpowiedź HTTP, jak i dane semantyczne w `pages.json`. Sam hash HTML może się zmienić przez znaczniki czasu, tokeny formularza lub zmianę szablonu. Dla zasobów o zachowanych bajtach hash pozwala stwierdzić ich zgodność.
- [crawl.py](crawl.py) to lokalny crawler audytowy korzystający z Pythona i `lxml`, z domeną produkcyjną ustawioną w kodzie. Kolejny crawl produkcji można zapisać do odrębnego katalogu opcją `--output`. W porównaniu ze środowiskiem preview należy podmienić host żądania, zachowując ścieżkę i parametry z manifestu oraz sprawdzając oczekiwaną wartość produkcyjnego canonical.

Crawl obejmował robots.txt, indeksy XML, HTML, widoczne nagłówki HTTP, publiczne kolekcje WordPressa, feedy, arkusze CSS i statyczne odwołania do plików w JavaScript. Rekurencja dotyczyła wewnętrznych URL-i i zależności zasobów. Zewnętrzne odsyłacze nawigacyjne, usługi zapisu i wskazane endpointy administracyjne odnotowano bez ich wykonywania. Pomiar nie uruchamiał JavaScriptu w przeglądarce. Zależności odkrywane dopiero po interakcji, żądania zależne od cookies, regionu lub UA oraz rzeczywiste zachowanie galerii i formularza mogą wymagać późniejszego testu. Publiczne dane nie ustalają kompletności biblioteki dyskowej, historycznych przekierowań, wykorzystania API, widoczności w indeksach, ruchu, wartości linków przychodzących ani działania backendu. **Brak wykrycia adresu nie oznacza jego nieistnienia.**

## Wynik pomiaru HTTP

Crawler zamknął kolejkę. Manifest zawiera **662 unikatowych URL-i HTTP(S)**, w tym 653 wewnętrznych, 9 zewnętrznych oraz 5 odnotowanych bez żądania. Zapisano 657 prób GET. Rozkład pierwszej odpowiedzi dla adresów wewnętrznych po ponowieniach to 200: 532, 301: 110, 401: 1, 404: 7, bez kodu HTTP: 3.

Zapisano **497 plików odpowiedzi** o łącznym rozmiarze 77.55 MiB. Zweryfikowano istnienie, rozmiar i SHA-256 każdego zapisanego pliku oraz zgodność wpisów o końcu łańcuchów przekierowań z manifestem.

Przeanalizowano 89 wewnętrznych URL-i z HTML 200, w tym warianty protokołu, wyniki wyszukiwania i widoki osadzeń. Wśród 31 adresów stron załączników rozkład to 200: 31.

Inwentarz zasobów obejmuje **320 URL-i**, z czego 248 w `/wp-content/uploads/`. Zapisano odpowiedzi 200 z treścią dla 315 URL-i zasobów. Rozkład dla ścieżek uploads to 200: 248. Typy MIME zapisanych zasobów to `image/jpeg` (227), `application/javascript` (34), `text/css` (23), `image/png` (13), `image/svg+xml` (10), `font/woff2` (4), `application/xml` (2), `text/javascript` (2).

- `http://bmstechnik.pl/` → **301** → `https://bmstechnik.pl/` (wynik 200).

- `https://bmstechnik.pl/` → **200**, canonical `https://bmstechnik.pl/`.

- `http://www.bmstechnik.pl/` → **301** → `https://bmstechnik.pl/` (wynik 200).

- `https://www.bmstechnik.pl/` → **301** → `https://bmstechnik.pl/` (wynik 200).



W poniższej macierzy komórka zawiera status odpowiedzi dla danego hosta i protokołu w formacie **bez ukośnika / z ukośnikiem**. Dokładne cele przekierowań są w pełnej mapie.

| Ścieżka | http bmstechnik.pl | https bmstechnik.pl | http www.bmstechnik.pl | https www.bmstechnik.pl |
| --- | --- | --- | --- | --- |
| `/` | 301 | 200 | 301 | 301 |
| `/2022/` | 301 / 200 | 301 / 200 | 301 / 301 | 301 / 301 |
| `/2022/03/` | 301 / 200 | 301 / 200 | 301 / 301 | 301 / 301 |
| `/author/bms_michal/` | 301 / 200 | 301 / 200 | 301 / 301 | 301 / 301 |
| `/author/ms_admin/` | 301 / 200 | 301 / 200 | 301 / 301 | 301 / 301 |
| `/category/bez-kategorii/` | 301 / 200 | 301 / 200 | 301 / 301 | 301 / 301 |
| `/klimatyzacja/` | 301 / 200 | 301 / 200 | 301 / 301 | 301 / 301 |
| `/kontakt/` | 301 / 200 | 301 / 200 | 301 / 301 | 301 / 301 |
| `/polityka-prywatnosci/` | 301 / 200 | 301 / 200 | 301 / 301 | 301 / 301 |
| `/rekuperacja/` | 301 / 200 | 301 / 200 | 301 / 301 | 301 / 301 |
| `/witaj-swiecie/` | 301 / 200 | 301 / 200 | 301 / 301 | 301 / 301 |

### Błędy i przerwane ścieżki

| Adres | GET | Błąd transportu lub odczytu | Źródło odwołania lub rola |
| --- | --- | --- | --- |
| `http://bmstechnik.pl/wp-content/plugins/wpforms-lite/assets/pro/images/times-solid-white.svg` | 404 | — | `http://bmstechnik.pl/wp-content/plugins/wpforms-lite/assets/css/frontend/classic/wpforms-full.min.css?ver=1.9.0.4` |
| `http://bmstechnik.pl/wp-content/themes/bms-technik/components/dependencies/owl-carousel/owl.video.play.png` | 404 | — | `http://bmstechnik.pl/wp-content/themes/bms-technik/components/dependencies/owl-carousel/index.css?ver=1.0.2` |
| `https://bmstechnik.pl/audit-bms-baseline-404-check-20261106/` | 404 | — | probe-404 |
| `https://bmstechnik.pl/favicon.ico` | 404 | — | asset |
| `https://bmstechnik.pl/sitemap_index.xml` | 404 | — | probe |
| `https://bmstechnik.pl/wp-content/plugins/wpforms-lite/assets/pro/images/times-solid-white.svg` | 404 | — | `https://bmstechnik.pl/wp-content/plugins/wpforms-lite/assets/css/frontend/classic/wpforms-full.min.css?ver=1.9.0.4` |
| `https://bmstechnik.pl/wp-content/themes/bms-technik/components/dependencies/owl-carousel/owl.video.play.png` | 404 | — | `https://bmstechnik.pl/wp-content/themes/bms-technik/components/dependencies/owl-carousel/index.css?ver=1.0.2` |
| `https://bmstechnik.pl/wp-json/wp/v2/users/2` | 401 | — | `http://bmstechnik.pl/author/bms_michal/`, `https://bmstechnik.pl/author/bms_michal/`, `https://bmstechnik.pl/author/bms_michal/feed/` |

Źródła wszystkich odwołań i nagłówki błędów są w JSON. Sondy kontrolne obejmują celowo nieistniejący adres, popularny wariant mapy i standardowy adres favicon.

Odwołania do wewnętrznych adresów z błędem HTTP lub transportu bezpośrednio z pięciu kanonicznych stron biznesowych: 0.

W manifeście brak błędów parsowania dokumentów XML, JSON kolekcji i HTML.

Brak kotwicy w docelowym HTML dla następujących odwołań. Identyfikatory tworzone przez JavaScript pozostają poza tym testem.

| Źródło | href | Dokument docelowy |
| --- | --- | --- |
| `https://bmstechnik.pl/przykladowa-strona/maintenance/embed/` | `https://bmstechnik.pl/przykladowa-strona/maintenance/#respond` | `https://bmstechnik.pl/przykladowa-strona/maintenance/` |
| `https://bmstechnik.pl/przykladowa-strona/wentylacja-1/embed/` | `https://bmstechnik.pl/przykladowa-strona/wentylacja-1/#respond` | `https://bmstechnik.pl/przykladowa-strona/wentylacja-1/` |
| `https://bmstechnik.pl/przykladowa-strona/wentylacja-2/embed/` | `https://bmstechnik.pl/przykladowa-strona/wentylacja-2/#respond` | `https://bmstechnik.pl/przykladowa-strona/wentylacja-2/` |
| `https://bmstechnik.pl/przykladowa-strona/wentylacja-3/embed/` | `https://bmstechnik.pl/przykladowa-strona/wentylacja-3/#respond` | `https://bmstechnik.pl/przykladowa-strona/wentylacja-3/` |
| `https://bmstechnik.pl/przykladowa-strona/wentylacja-4/embed/` | `https://bmstechnik.pl/przykladowa-strona/wentylacja-4/#respond` | `https://bmstechnik.pl/przykladowa-strona/wentylacja-4/` |

Hosty wykrytych zasobów zewnętrznych: `fonts.googleapis.com`, `fonts.gstatic.com`, `www.google.com`, `www.gstatic.com`.

Pierwszy odczyt rozpoznawczy w terminalu izolowanym zakończył się błędem DNS. Odczyt rozpoznawczy serwera poza izolacją zwrócił też 429 z `Retry-After: 300` przy szybkiej serii. Crawl właściwy wykonano po tym oknie, z odstępem między odpowiedzią a kolejnym żądaniem i zapisem każdej jego próby.

## Pełna mapa odkrytych URL-i

Każdy URL HTTP(S) z manifestu występuje poniżej jeden raz. Kod dotyczy pierwszego adresu po ewentualnym ponowieniu. Przy przekierowaniu podano adres z `Location` po rozwiązaniu względem źródła i wynik końca łańcucha. Role są kluczami z JSON. Endpointy używane do wysyłania danych zapisano jako referencje.

### Strony, archiwa i sonda 404 (11)

| URL | GET | Cel lub wynik | Role odkrycia |
| --- | --- | --- | --- |
| `https://bmstechnik.pl/` | 200 | canonical `https://bmstechnik.pl/` | `seed`, `sitemap-entry`, `wp-shortlink`, `canonical`, `link`, `form-action`, `alternate`, `wp-content-link`, `redirect` |
| `https://bmstechnik.pl/2022/03/` | 200 | `text/html` | `link`, `redirect`, `variant` |
| `https://bmstechnik.pl/audit-bms-baseline-404-check-20261106/` | 404 | `text/html` | `probe-404` |
| `https://bmstechnik.pl/author/bms_michal/` | 200 | `text/html` | `link`, `redirect` |
| `https://bmstechnik.pl/author/ms_admin/` | 200 | `text/html` | `sitemap-entry`, `link`, `redirect`, `variant` |
| `https://bmstechnik.pl/category/bez-kategorii/` | 200 | `text/html` | `sitemap-entry`, `link`, `redirect`, `variant` |
| `https://bmstechnik.pl/klimatyzacja/` | 200 | canonical `https://bmstechnik.pl/klimatyzacja/` | `sitemap-entry`, `link`, `canonical`, `alternate`, `redirect`, `wp-content-link`, `variant` |
| `https://bmstechnik.pl/kontakt/` | 200 | canonical `https://bmstechnik.pl/kontakt/` | `sitemap-entry`, `link`, `canonical`, `form-action`, `alternate`, `redirect`, `wp-content-link`, `variant` |
| `https://bmstechnik.pl/polityka-prywatnosci/` | 200 | canonical `https://bmstechnik.pl/polityka-prywatnosci/` | `sitemap-entry`, `link`, `canonical`, `alternate`, `redirect`, `wp-content-link`, `variant` |
| `https://bmstechnik.pl/rekuperacja/` | 200 | canonical `https://bmstechnik.pl/rekuperacja/` | `sitemap-entry`, `link`, `canonical`, `alternate`, `redirect`, `wp-content-link`, `variant` |
| `https://bmstechnik.pl/witaj-swiecie/` | 200 | canonical `https://bmstechnik.pl/witaj-swiecie/` | `sitemap-entry`, `canonical`, `link`, `alternate`, `redirect`, `wp-content-link`, `variant` |

### Publiczne strony załączników (31)

| URL | GET | Cel lub wynik | Role odkrycia |
| --- | --- | --- | --- |
| `https://bmstechnik.pl/fav/` | 200 | canonical `https://bmstechnik.pl/fav/` | `wp-attachment`, `canonical`, `link`, `alternate`, `redirect` |
| `https://bmstechnik.pl/klimatyzacja/20220701_093138/` | 200 | canonical `https://bmstechnik.pl/klimatyzacja/20220701_093138/` | `wp-attachment`, `canonical`, `alternate`, `redirect`, `link` |
| `https://bmstechnik.pl/klimatyzacja/20220701_093226/` | 200 | canonical `https://bmstechnik.pl/klimatyzacja/20220701_093226/` | `wp-attachment`, `canonical`, `alternate`, `redirect`, `link` |
| `https://bmstechnik.pl/klimatyzacja/20220701_093236/` | 200 | canonical `https://bmstechnik.pl/klimatyzacja/20220701_093236/` | `wp-attachment`, `canonical`, `alternate`, `redirect`, `link` |
| `https://bmstechnik.pl/klimatyzacja/cropped-maintenance-png/` | 200 | canonical `https://bmstechnik.pl/klimatyzacja/cropped-maintenance-png/` | `wp-attachment`, `canonical`, `alternate`, `redirect`, `link` |
| `https://bmstechnik.pl/klimatyzacja/gwarancja/` | 200 | canonical `https://bmstechnik.pl/klimatyzacja/gwarancja/` | `wp-attachment`, `canonical`, `alternate`, `redirect`, `link` |
| `https://bmstechnik.pl/klimatyzacja/img_20220301_105108/` | 200 | canonical `https://bmstechnik.pl/klimatyzacja/img_20220301_105108/` | `wp-attachment`, `canonical`, `alternate`, `redirect`, `link` |
| `https://bmstechnik.pl/klimatyzacja/img_20220301_110450/` | 200 | canonical `https://bmstechnik.pl/klimatyzacja/img_20220301_110450/` | `wp-attachment`, `canonical`, `alternate`, `redirect`, `link` |
| `https://bmstechnik.pl/klimatyzacja/stock-photo-air-conditioner-inside-the-room-with-woman-operating-remote-controller-air-conditioner-with-507015844/` | 200 | canonical `https://bmstechnik.pl/klimatyzacja/stock-photo-air-conditioner-inside-the-room-with-woman-operating-remote-controller-air-conditioner-with-507015844/` | `wp-attachment`, `canonical`, `alternate`, `redirect`, `link` |
| `https://bmstechnik.pl/klimatyzacja/stock-photo-electrician-repairing-air-conditioner-indoors-1303903513-2/` | 200 | canonical `https://bmstechnik.pl/klimatyzacja/stock-photo-electrician-repairing-air-conditioner-indoors-1303903513-2/` | `wp-attachment`, `canonical`, `alternate`, `redirect`, `link` |
| `https://bmstechnik.pl/klimatyzacja/stock-photo-electrician-repairing-air-conditioner-indoors-1303903513/` | 200 | canonical `https://bmstechnik.pl/klimatyzacja/stock-photo-electrician-repairing-air-conditioner-indoors-1303903513/` | `wp-attachment`, `canonical`, `alternate`, `redirect`, `link` |
| `https://bmstechnik.pl/kontakt/stock-photo-man-work-using-computer-hand-typing-laptop-keyboard-contact-us-online-chatting-search-form-internet-1888674034/` | 200 | canonical `https://bmstechnik.pl/kontakt/stock-photo-man-work-using-computer-hand-typing-laptop-keyboard-contact-us-online-chatting-search-form-internet-1888674034/` | `wp-attachment`, `canonical`, `alternate`, `redirect`, `link` |
| `https://bmstechnik.pl/logo/` | 200 | canonical `https://bmstechnik.pl/logo/` | `wp-attachment`, `canonical`, `link`, `alternate`, `redirect` |
| `https://bmstechnik.pl/przykladowa-strona/bg-home/` | 200 | canonical `https://bmstechnik.pl/przykladowa-strona/bg-home/` | `wp-attachment`, `canonical`, `alternate`, `redirect`, `link` |
| `https://bmstechnik.pl/przykladowa-strona/maintenance/` | 200 | canonical `https://bmstechnik.pl/przykladowa-strona/maintenance/` | `wp-attachment`, `canonical`, `alternate`, `redirect`, `link` |
| `https://bmstechnik.pl/przykladowa-strona/wentylacja-1/` | 200 | canonical `https://bmstechnik.pl/przykladowa-strona/wentylacja-1/` | `wp-attachment`, `canonical`, `alternate`, `redirect`, `link` |
| `https://bmstechnik.pl/przykladowa-strona/wentylacja-2/` | 200 | canonical `https://bmstechnik.pl/przykladowa-strona/wentylacja-2/` | `wp-attachment`, `canonical`, `alternate`, `redirect`, `link` |
| `https://bmstechnik.pl/przykladowa-strona/wentylacja-3/` | 200 | canonical `https://bmstechnik.pl/przykladowa-strona/wentylacja-3/` | `wp-attachment`, `canonical`, `alternate`, `redirect`, `link` |
| `https://bmstechnik.pl/przykladowa-strona/wentylacja-4/` | 200 | canonical `https://bmstechnik.pl/przykladowa-strona/wentylacja-4/` | `wp-attachment`, `canonical`, `alternate`, `redirect`, `link` |
| `https://bmstechnik.pl/rekuperacja/dobor-urzadzen/` | 200 | canonical `https://bmstechnik.pl/rekuperacja/dobor-urzadzen/` | `wp-attachment`, `canonical`, `alternate`, `redirect`, `link` |
| `https://bmstechnik.pl/rekuperacja/dostawa-montaz/` | 200 | canonical `https://bmstechnik.pl/rekuperacja/dostawa-montaz/` | `wp-attachment`, `canonical`, `alternate`, `redirect`, `link` |
| `https://bmstechnik.pl/rekuperacja/img_20220216_135304/` | 200 | canonical `https://bmstechnik.pl/rekuperacja/img_20220216_135304/` | `wp-attachment`, `canonical`, `alternate`, `redirect`, `link` |
| `https://bmstechnik.pl/rekuperacja/img_20220216_135322/` | 200 | canonical `https://bmstechnik.pl/rekuperacja/img_20220216_135322/` | `wp-attachment`, `canonical`, `alternate`, `redirect`, `link` |
| `https://bmstechnik.pl/rekuperacja/img_20220216_135344/` | 200 | canonical `https://bmstechnik.pl/rekuperacja/img_20220216_135344/` | `wp-attachment`, `canonical`, `alternate`, `redirect`, `link` |
| `https://bmstechnik.pl/rekuperacja/img_20220216_135409/` | 200 | canonical `https://bmstechnik.pl/rekuperacja/img_20220216_135409/` | `wp-attachment`, `canonical`, `alternate`, `redirect`, `link` |
| `https://bmstechnik.pl/rekuperacja/img_20220216_135446/` | 200 | canonical `https://bmstechnik.pl/rekuperacja/img_20220216_135446/` | `wp-attachment`, `canonical`, `alternate`, `redirect`, `link` |
| `https://bmstechnik.pl/rekuperacja/project-1/` | 200 | canonical `https://bmstechnik.pl/rekuperacja/project-1/` | `wp-attachment`, `canonical`, `alternate`, `redirect`, `link` |
| `https://bmstechnik.pl/rekuperacja/regulacja/` | 200 | canonical `https://bmstechnik.pl/rekuperacja/regulacja/` | `wp-attachment`, `canonical`, `alternate`, `redirect`, `link` |
| `https://bmstechnik.pl/rekuperacja/stock-photo-hvac-worker-install-ducted-pipe-system-for-ventilation-and-air-conditioning-copy-space-1984711982/` | 200 | canonical `https://bmstechnik.pl/rekuperacja/stock-photo-hvac-worker-install-ducted-pipe-system-for-ventilation-and-air-conditioning-copy-space-1984711982/` | `wp-attachment`, `canonical`, `alternate`, `redirect`, `link` |
| `https://bmstechnik.pl/rekuperacja/stock-photo-ventilation-system-on-ceiling-of-industrial-room-air-purification-system-in-restaurant-pipes-from-1894119517/` | 200 | canonical `https://bmstechnik.pl/rekuperacja/stock-photo-ventilation-system-on-ceiling-of-industrial-room-air-purification-system-in-restaurant-pipes-from-1894119517/` | `wp-attachment`, `canonical`, `alternate`, `redirect`, `link` |
| `https://bmstechnik.pl/rekuperacja/system/` | 200 | canonical `https://bmstechnik.pl/rekuperacja/system/` | `wp-attachment`, `canonical`, `alternate`, `redirect`, `link` |

### Warianty protokołu, hosta i ukośnika (73)

| URL | GET | Cel lub wynik | Role odkrycia |
| --- | --- | --- | --- |
| `http://bmstechnik.pl/` | 301 | `https://bmstechnik.pl/` → 200 | `variant`, `link` |
| `http://bmstechnik.pl/2022` | 301 | `http://bmstechnik.pl/2022/` → 200 | `variant` |
| `http://bmstechnik.pl/2022/` | 200 | `text/html` | `variant`, `redirect` |
| `http://bmstechnik.pl/2022/03` | 301 | `http://bmstechnik.pl/2022/03/` → 200 | `variant` |
| `http://bmstechnik.pl/2022/03/` | 200 | `text/html` | `variant`, `redirect` |
| `http://bmstechnik.pl/author/bms_michal` | 301 | `http://bmstechnik.pl/author/bms_michal/` → 200 | `variant` |
| `http://bmstechnik.pl/author/bms_michal/` | 200 | `text/html` | `variant`, `redirect` |
| `http://bmstechnik.pl/author/ms_admin` | 301 | `http://bmstechnik.pl/author/ms_admin/` → 200 | `variant` |
| `http://bmstechnik.pl/author/ms_admin/` | 200 | `text/html` | `variant`, `redirect` |
| `http://bmstechnik.pl/category/bez-kategorii` | 301 | `http://bmstechnik.pl/category/bez-kategorii/` → 200 | `variant` |
| `http://bmstechnik.pl/category/bez-kategorii/` | 200 | `text/html` | `variant`, `redirect` |
| `http://bmstechnik.pl/klimatyzacja` | 301 | `http://bmstechnik.pl/klimatyzacja/` → 200 | `variant` |
| `http://bmstechnik.pl/klimatyzacja/` | 200 | canonical `https://bmstechnik.pl/klimatyzacja/` | `variant`, `redirect` |
| `http://bmstechnik.pl/kontakt` | 301 | `http://bmstechnik.pl/kontakt/` → 200 | `variant` |
| `http://bmstechnik.pl/kontakt/` | 200 | canonical `https://bmstechnik.pl/kontakt/` | `link`, `variant`, `form-action`, `redirect` |
| `http://bmstechnik.pl/polityka-prywatnosci` | 301 | `http://bmstechnik.pl/polityka-prywatnosci/` → 200 | `variant` |
| `http://bmstechnik.pl/polityka-prywatnosci/` | 200 | canonical `https://bmstechnik.pl/polityka-prywatnosci/` | `variant`, `redirect` |
| `http://bmstechnik.pl/rekuperacja` | 301 | `http://bmstechnik.pl/rekuperacja/` → 200 | `variant` |
| `http://bmstechnik.pl/rekuperacja/` | 200 | canonical `https://bmstechnik.pl/rekuperacja/` | `variant`, `redirect` |
| `http://bmstechnik.pl/witaj-swiecie` | 301 | `http://bmstechnik.pl/witaj-swiecie/` → 200 | `variant` |
| `http://bmstechnik.pl/witaj-swiecie/` | 200 | canonical `https://bmstechnik.pl/witaj-swiecie/` | `variant`, `redirect` |
| `http://www.bmstechnik.pl/` | 301 | `https://bmstechnik.pl/` → 200 | `variant` |
| `http://www.bmstechnik.pl/2022` | 301 | `http://bmstechnik.pl/2022/` → 200 | `variant` |
| `http://www.bmstechnik.pl/2022/` | 301 | `http://bmstechnik.pl/2022/` → 200 | `variant` |
| `http://www.bmstechnik.pl/2022/03` | 301 | `http://bmstechnik.pl/2022/03/` → 200 | `variant` |
| `http://www.bmstechnik.pl/2022/03/` | 301 | `http://bmstechnik.pl/2022/03/` → 200 | `variant` |
| `http://www.bmstechnik.pl/author/bms_michal` | 301 | `http://bmstechnik.pl/author/bms_michal/` → 200 | `variant` |
| `http://www.bmstechnik.pl/author/bms_michal/` | 301 | `http://bmstechnik.pl/author/bms_michal/` → 200 | `variant` |
| `http://www.bmstechnik.pl/author/ms_admin` | 301 | `http://bmstechnik.pl/author/ms_admin/` → 200 | `variant` |
| `http://www.bmstechnik.pl/author/ms_admin/` | 301 | `http://bmstechnik.pl/author/ms_admin/` → 200 | `variant` |
| `http://www.bmstechnik.pl/category/bez-kategorii` | 301 | `http://bmstechnik.pl/category/bez-kategorii/` → 200 | `variant` |
| `http://www.bmstechnik.pl/category/bez-kategorii/` | 301 | `http://bmstechnik.pl/category/bez-kategorii/` → 200 | `variant` |
| `http://www.bmstechnik.pl/klimatyzacja` | 301 | `http://bmstechnik.pl/klimatyzacja/` → 200 | `variant` |
| `http://www.bmstechnik.pl/klimatyzacja/` | 301 | `http://bmstechnik.pl/klimatyzacja/` → 200 | `variant` |
| `http://www.bmstechnik.pl/kontakt` | 301 | `http://bmstechnik.pl/kontakt/` → 200 | `variant` |
| `http://www.bmstechnik.pl/kontakt/` | 301 | `http://bmstechnik.pl/kontakt/` → 200 | `variant` |
| `http://www.bmstechnik.pl/polityka-prywatnosci` | 301 | `http://bmstechnik.pl/polityka-prywatnosci/` → 200 | `variant` |
| `http://www.bmstechnik.pl/polityka-prywatnosci/` | 301 | `http://bmstechnik.pl/polityka-prywatnosci/` → 200 | `variant` |
| `http://www.bmstechnik.pl/rekuperacja` | 301 | `http://bmstechnik.pl/rekuperacja/` → 200 | `variant` |
| `http://www.bmstechnik.pl/rekuperacja/` | 301 | `http://bmstechnik.pl/rekuperacja/` → 200 | `variant` |
| `http://www.bmstechnik.pl/witaj-swiecie` | 301 | `http://bmstechnik.pl/witaj-swiecie/` → 200 | `variant` |
| `http://www.bmstechnik.pl/witaj-swiecie/` | 301 | `http://bmstechnik.pl/witaj-swiecie/` → 200 | `variant` |
| `https://bmstechnik.pl/2022` | 301 | `https://bmstechnik.pl/2022/` → 200 | `variant` |
| `https://bmstechnik.pl/2022/03` | 301 | `https://bmstechnik.pl/2022/03/` → 200 | `variant` |
| `https://bmstechnik.pl/author/bms_michal` | 301 | `https://bmstechnik.pl/author/bms_michal/` → 200 | `variant` |
| `https://bmstechnik.pl/author/ms_admin` | 301 | `https://bmstechnik.pl/author/ms_admin/` → 200 | `variant` |
| `https://bmstechnik.pl/category/bez-kategorii` | 301 | `https://bmstechnik.pl/category/bez-kategorii/` → 200 | `variant` |
| `https://bmstechnik.pl/klimatyzacja` | 301 | `https://bmstechnik.pl/klimatyzacja/` → 200 | `variant` |
| `https://bmstechnik.pl/kontakt` | 301 | `https://bmstechnik.pl/kontakt/` → 200 | `variant` |
| `https://bmstechnik.pl/polityka-prywatnosci` | 301 | `https://bmstechnik.pl/polityka-prywatnosci/` → 200 | `variant` |
| `https://bmstechnik.pl/rekuperacja` | 301 | `https://bmstechnik.pl/rekuperacja/` → 200 | `variant` |
| `https://bmstechnik.pl/witaj-swiecie` | 301 | `https://bmstechnik.pl/witaj-swiecie/` → 200 | `variant` |
| `https://www.bmstechnik.pl/` | 301 | `https://bmstechnik.pl/` → 200 | `variant` |
| `https://www.bmstechnik.pl/2022` | 301 | `https://bmstechnik.pl/2022/` → 200 | `variant` |
| `https://www.bmstechnik.pl/2022/` | 301 | `https://bmstechnik.pl/2022/` → 200 | `variant` |
| `https://www.bmstechnik.pl/2022/03` | 301 | `https://bmstechnik.pl/2022/03/` → 200 | `variant` |
| `https://www.bmstechnik.pl/2022/03/` | 301 | `https://bmstechnik.pl/2022/03/` → 200 | `variant` |
| `https://www.bmstechnik.pl/author/bms_michal` | 301 | `https://bmstechnik.pl/author/bms_michal/` → 200 | `variant` |
| `https://www.bmstechnik.pl/author/bms_michal/` | 301 | `https://bmstechnik.pl/author/bms_michal/` → 200 | `variant` |
| `https://www.bmstechnik.pl/author/ms_admin` | 301 | `https://bmstechnik.pl/author/ms_admin/` → 200 | `variant` |
| `https://www.bmstechnik.pl/author/ms_admin/` | 301 | `https://bmstechnik.pl/author/ms_admin/` → 200 | `variant` |
| `https://www.bmstechnik.pl/category/bez-kategorii` | 301 | `https://bmstechnik.pl/category/bez-kategorii/` → 200 | `variant` |
| `https://www.bmstechnik.pl/category/bez-kategorii/` | 301 | `https://bmstechnik.pl/category/bez-kategorii/` → 200 | `variant` |
| `https://www.bmstechnik.pl/klimatyzacja` | 301 | `https://bmstechnik.pl/klimatyzacja/` → 200 | `variant` |
| `https://www.bmstechnik.pl/klimatyzacja/` | 301 | `https://bmstechnik.pl/klimatyzacja/` → 200 | `variant` |
| `https://www.bmstechnik.pl/kontakt` | 301 | `https://bmstechnik.pl/kontakt/` → 200 | `variant` |
| `https://www.bmstechnik.pl/kontakt/` | 301 | `https://bmstechnik.pl/kontakt/` → 200 | `variant` |
| `https://www.bmstechnik.pl/polityka-prywatnosci` | 301 | `https://bmstechnik.pl/polityka-prywatnosci/` → 200 | `variant` |
| `https://www.bmstechnik.pl/polityka-prywatnosci/` | 301 | `https://bmstechnik.pl/polityka-prywatnosci/` → 200 | `variant` |
| `https://www.bmstechnik.pl/rekuperacja` | 301 | `https://bmstechnik.pl/rekuperacja/` → 200 | `variant` |
| `https://www.bmstechnik.pl/rekuperacja/` | 301 | `https://bmstechnik.pl/rekuperacja/` → 200 | `variant` |
| `https://www.bmstechnik.pl/witaj-swiecie` | 301 | `https://bmstechnik.pl/witaj-swiecie/` → 200 | `variant` |
| `https://www.bmstechnik.pl/witaj-swiecie/` | 301 | `https://bmstechnik.pl/witaj-swiecie/` → 200 | `variant` |

### Aliasy, parametry i wyszukiwanie (47)

| URL | GET | Cel lub wynik | Role odkrycia |
| --- | --- | --- | --- |
| `https://bmstechnik.pl/2022/` | 200 | `text/html` | `probe-alias`, `redirect` |
| `https://bmstechnik.pl/?author=1` | 301 | `https://bmstechnik.pl/author/ms_admin/` → 200 | `probe-alias` |
| `https://bmstechnik.pl/?cat=1` | 301 | `https://bmstechnik.pl/category/bez-kategorii/` → 200 | `probe-alias` |
| `https://bmstechnik.pl/?m=202203` | 301 | `https://bmstechnik.pl/2022/03/` → 200 | `probe-alias` |
| `https://bmstechnik.pl/?p=1` | 301 | `https://bmstechnik.pl/witaj-swiecie/` → 200 | `wp-shortlink` |
| `https://bmstechnik.pl/?p=111` | 301 | `https://bmstechnik.pl/kontakt/stock-photo-man-work-using-computer-hand-typing-laptop-keyboard-contact-us-online-chatting-search-form-internet-1888674034/` → 200 | `wp-shortlink` |
| `https://bmstechnik.pl/?p=118` | 301 | `https://bmstechnik.pl/rekuperacja/stock-photo-ventilation-system-on-ceiling-of-industrial-room-air-purification-system-in-restaurant-pipes-from-1894119517/` → 200 | `wp-shortlink` |
| `https://bmstechnik.pl/?p=120` | 301 | `https://bmstechnik.pl/klimatyzacja/stock-photo-electrician-repairing-air-conditioner-indoors-1303903513/` → 200 | `wp-shortlink` |
| `https://bmstechnik.pl/?p=122` | 301 | `https://bmstechnik.pl/rekuperacja/stock-photo-hvac-worker-install-ducted-pipe-system-for-ventilation-and-air-conditioning-copy-space-1984711982/` → 200 | `wp-shortlink` |
| `https://bmstechnik.pl/?p=125` | 301 | `https://bmstechnik.pl/klimatyzacja/stock-photo-air-conditioner-inside-the-room-with-woman-operating-remote-controller-air-conditioner-with-507015844/` → 200 | `wp-shortlink` |
| `https://bmstechnik.pl/?p=126` | 301 | `https://bmstechnik.pl/klimatyzacja/stock-photo-electrician-repairing-air-conditioner-indoors-1303903513-2/` → 200 | `wp-shortlink` |
| `https://bmstechnik.pl/?p=156` | 301 | `https://bmstechnik.pl/klimatyzacja/img_20220301_105108/` → 200 | `wp-shortlink` |
| `https://bmstechnik.pl/?p=157` | 301 | `https://bmstechnik.pl/klimatyzacja/img_20220301_110450/` → 200 | `wp-shortlink` |
| `https://bmstechnik.pl/?p=159` | 301 | `https://bmstechnik.pl/rekuperacja/img_20220216_135304/` → 200 | `wp-shortlink` |
| `https://bmstechnik.pl/?p=160` | 301 | `https://bmstechnik.pl/rekuperacja/img_20220216_135322/` → 200 | `wp-shortlink` |
| `https://bmstechnik.pl/?p=161` | 301 | `https://bmstechnik.pl/rekuperacja/img_20220216_135344/` → 200 | `wp-shortlink` |
| `https://bmstechnik.pl/?p=162` | 301 | `https://bmstechnik.pl/rekuperacja/img_20220216_135409/` → 200 | `wp-shortlink` |
| `https://bmstechnik.pl/?p=163` | 301 | `https://bmstechnik.pl/rekuperacja/img_20220216_135446/` → 200 | `wp-shortlink` |
| `https://bmstechnik.pl/?p=168` | 301 | `https://bmstechnik.pl/klimatyzacja/20220701_093138/` → 200 | `wp-shortlink` |
| `https://bmstechnik.pl/?p=169` | 301 | `https://bmstechnik.pl/klimatyzacja/20220701_093226/` → 200 | `wp-shortlink` |
| `https://bmstechnik.pl/?p=170` | 301 | `https://bmstechnik.pl/klimatyzacja/20220701_093236/` → 200 | `wp-shortlink` |
| `https://bmstechnik.pl/?p=26` | 301 | `https://bmstechnik.pl/przykladowa-strona/maintenance/` → 200 | `wp-shortlink` |
| `https://bmstechnik.pl/?p=3` | 301 | `https://bmstechnik.pl/polityka-prywatnosci/` → 200 | `wp-shortlink` |
| `https://bmstechnik.pl/?p=30` | 301 | `https://bmstechnik.pl/przykladowa-strona/wentylacja-1/` → 200 | `wp-shortlink` |
| `https://bmstechnik.pl/?p=31` | 301 | `https://bmstechnik.pl/przykladowa-strona/wentylacja-2/` → 200 | `wp-shortlink` |
| `https://bmstechnik.pl/?p=34` | 301 | `https://bmstechnik.pl/przykladowa-strona/wentylacja-3/` → 200 | `wp-shortlink` |
| `https://bmstechnik.pl/?p=35` | 301 | `https://bmstechnik.pl/przykladowa-strona/wentylacja-4/` → 200 | `wp-shortlink` |
| `https://bmstechnik.pl/?p=40` | 301 | `https://bmstechnik.pl/rekuperacja/` → 200 | `wp-shortlink` |
| `https://bmstechnik.pl/?p=43` | 301 | `https://bmstechnik.pl/klimatyzacja/` → 200 | `wp-shortlink` |
| `https://bmstechnik.pl/?p=52` | 301 | `https://bmstechnik.pl/kontakt/` → 200 | `wp-shortlink` |
| `https://bmstechnik.pl/?p=67` | 301 | `https://bmstechnik.pl/logo/` → 200 | `wp-shortlink` |
| `https://bmstechnik.pl/?p=69` | 301 | `https://bmstechnik.pl/fav/` → 200 | `wp-shortlink` |
| `https://bmstechnik.pl/?p=70` | 301 | `https://bmstechnik.pl/klimatyzacja/cropped-maintenance-png/` → 200 | `wp-shortlink` |
| `https://bmstechnik.pl/?p=87` | 301 | `https://bmstechnik.pl/rekuperacja/project-1/` → 200 | `wp-shortlink` |
| `https://bmstechnik.pl/?p=88` | 301 | `https://bmstechnik.pl/rekuperacja/dobor-urzadzen/` → 200 | `wp-shortlink` |
| `https://bmstechnik.pl/?p=89` | 301 | `https://bmstechnik.pl/rekuperacja/dostawa-montaz/` → 200 | `wp-shortlink` |
| `https://bmstechnik.pl/?p=90` | 301 | `https://bmstechnik.pl/rekuperacja/system/` → 200 | `wp-shortlink` |
| `https://bmstechnik.pl/?p=91` | 301 | `https://bmstechnik.pl/rekuperacja/regulacja/` → 200 | `wp-shortlink` |
| `https://bmstechnik.pl/?p=96` | 301 | `https://bmstechnik.pl/przykladowa-strona/bg-home/` → 200 | `wp-shortlink` |
| `https://bmstechnik.pl/?p=98` | 301 | `https://bmstechnik.pl/klimatyzacja/gwarancja/` → 200 | `wp-shortlink` |
| `https://bmstechnik.pl/?page_id=2` | 301 | `https://bmstechnik.pl/` → 200 | `wp-shortlink` |
| `https://bmstechnik.pl/?page_id=3` | 301 | `https://bmstechnik.pl/polityka-prywatnosci/` → 200 | `wp-shortlink` |
| `https://bmstechnik.pl/?page_id=40` | 301 | `https://bmstechnik.pl/rekuperacja/` → 200 | `wp-shortlink` |
| `https://bmstechnik.pl/?page_id=43` | 301 | `https://bmstechnik.pl/klimatyzacja/` → 200 | `wp-shortlink` |
| `https://bmstechnik.pl/?page_id=52` | 301 | `https://bmstechnik.pl/kontakt/` → 200 | `wp-shortlink` |
| `https://bmstechnik.pl/?s=rekuperacja` | 200 | `text/html` | `probe-search` |
| `https://bmstechnik.pl/przykladowa-strona/` | 301 | `https://bmstechnik.pl/` → 200 | `variant` |

### Robots, sitemap, feedy, oEmbed i WordPress API (175)

| URL | GET | Cel lub wynik | Role odkrycia |
| --- | --- | --- | --- |
| `https://bmstechnik.pl/author/bms_michal/feed/` | 200 | `application/rss+xml` | `alternate`, `link` |
| `https://bmstechnik.pl/author/ms_admin/feed/` | 200 | `application/rss+xml` | `alternate`, `link` |
| `https://bmstechnik.pl/category/bez-kategorii/feed/` | 200 | `application/rss+xml` | `alternate`, `link` |
| `https://bmstechnik.pl/comments/feed/` | 200 | `application/rss+xml` | `alternate`, `link` |
| `https://bmstechnik.pl/embed/` | 301 | `https://bmstechnik.pl/` → 200 | `wp-embed` |
| `https://bmstechnik.pl/fav/embed/` | 200 | `text/html` | `wp-embed` |
| `https://bmstechnik.pl/feed/` | 200 | `application/rss+xml` | `alternate`, `link` |
| `https://bmstechnik.pl/klimatyzacja/20220701_093138/embed/` | 200 | `text/html` | `wp-embed` |
| `https://bmstechnik.pl/klimatyzacja/20220701_093226/embed/` | 200 | `text/html` | `wp-embed` |
| `https://bmstechnik.pl/klimatyzacja/20220701_093236/embed/` | 200 | `text/html` | `wp-embed` |
| `https://bmstechnik.pl/klimatyzacja/cropped-maintenance-png/embed/` | 200 | `text/html` | `wp-embed` |
| `https://bmstechnik.pl/klimatyzacja/embed/` | 200 | `text/html` | `wp-embed` |
| `https://bmstechnik.pl/klimatyzacja/gwarancja/embed/` | 200 | `text/html` | `wp-embed` |
| `https://bmstechnik.pl/klimatyzacja/img_20220301_105108/embed/` | 200 | `text/html` | `wp-embed` |
| `https://bmstechnik.pl/klimatyzacja/img_20220301_110450/embed/` | 200 | `text/html` | `wp-embed` |
| `https://bmstechnik.pl/klimatyzacja/stock-photo-air-conditioner-inside-the-room-with-woman-operating-remote-controller-air-conditioner-with-507015844/embed/` | 200 | `text/html` | `wp-embed` |
| `https://bmstechnik.pl/klimatyzacja/stock-photo-electrician-repairing-air-conditioner-indoors-1303903513-2/embed/` | 200 | `text/html` | `wp-embed` |
| `https://bmstechnik.pl/klimatyzacja/stock-photo-electrician-repairing-air-conditioner-indoors-1303903513/embed/` | 200 | `text/html` | `wp-embed` |
| `https://bmstechnik.pl/kontakt/embed/` | 200 | `text/html` | `wp-embed` |
| `https://bmstechnik.pl/kontakt/stock-photo-man-work-using-computer-hand-typing-laptop-keyboard-contact-us-online-chatting-search-form-internet-1888674034/embed/` | 200 | `text/html` | `wp-embed` |
| `https://bmstechnik.pl/logo/embed/` | 200 | `text/html` | `wp-embed` |
| `https://bmstechnik.pl/polityka-prywatnosci/embed/` | 200 | `text/html` | `wp-embed` |
| `https://bmstechnik.pl/przykladowa-strona/bg-home/embed/` | 200 | `text/html` | `wp-embed` |
| `https://bmstechnik.pl/przykladowa-strona/feed/` | 200 | `application/rss+xml` | `alternate`, `link` |
| `https://bmstechnik.pl/przykladowa-strona/maintenance/embed/` | 200 | `text/html` | `wp-embed` |
| `https://bmstechnik.pl/przykladowa-strona/maintenance/feed/` | 200 | `application/rss+xml` | `alternate`, `link` |
| `https://bmstechnik.pl/przykladowa-strona/wentylacja-1/embed/` | 200 | `text/html` | `wp-embed` |
| `https://bmstechnik.pl/przykladowa-strona/wentylacja-1/feed/` | 200 | `application/rss+xml` | `alternate`, `link` |
| `https://bmstechnik.pl/przykladowa-strona/wentylacja-2/embed/` | 200 | `text/html` | `wp-embed` |
| `https://bmstechnik.pl/przykladowa-strona/wentylacja-2/feed/` | 200 | `application/rss+xml` | `alternate`, `link` |
| `https://bmstechnik.pl/przykladowa-strona/wentylacja-3/embed/` | 200 | `text/html` | `wp-embed` |
| `https://bmstechnik.pl/przykladowa-strona/wentylacja-3/feed/` | 200 | `application/rss+xml` | `alternate`, `link` |
| `https://bmstechnik.pl/przykladowa-strona/wentylacja-4/embed/` | 200 | `text/html` | `wp-embed` |
| `https://bmstechnik.pl/przykladowa-strona/wentylacja-4/feed/` | 200 | `application/rss+xml` | `alternate`, `link` |
| `https://bmstechnik.pl/rekuperacja/dobor-urzadzen/embed/` | 200 | `text/html` | `wp-embed` |
| `https://bmstechnik.pl/rekuperacja/dostawa-montaz/embed/` | 200 | `text/html` | `wp-embed` |
| `https://bmstechnik.pl/rekuperacja/embed/` | 200 | `text/html` | `wp-embed` |
| `https://bmstechnik.pl/rekuperacja/img_20220216_135304/embed/` | 200 | `text/html` | `wp-embed` |
| `https://bmstechnik.pl/rekuperacja/img_20220216_135322/embed/` | 200 | `text/html` | `wp-embed` |
| `https://bmstechnik.pl/rekuperacja/img_20220216_135344/embed/` | 200 | `text/html` | `wp-embed` |
| `https://bmstechnik.pl/rekuperacja/img_20220216_135409/embed/` | 200 | `text/html` | `wp-embed` |
| `https://bmstechnik.pl/rekuperacja/img_20220216_135446/embed/` | 200 | `text/html` | `wp-embed` |
| `https://bmstechnik.pl/rekuperacja/project-1/embed/` | 200 | `text/html` | `wp-embed` |
| `https://bmstechnik.pl/rekuperacja/regulacja/embed/` | 200 | `text/html` | `wp-embed` |
| `https://bmstechnik.pl/rekuperacja/stock-photo-hvac-worker-install-ducted-pipe-system-for-ventilation-and-air-conditioning-copy-space-1984711982/embed/` | 200 | `text/html` | `wp-embed` |
| `https://bmstechnik.pl/rekuperacja/stock-photo-ventilation-system-on-ceiling-of-industrial-room-air-purification-system-in-restaurant-pipes-from-1894119517/embed/` | 200 | `text/html` | `wp-embed` |
| `https://bmstechnik.pl/rekuperacja/system/embed/` | 200 | `text/html` | `wp-embed` |
| `https://bmstechnik.pl/robots.txt` | 200 | `text/plain` | `robots` |
| `https://bmstechnik.pl/search/rekuperacja/feed/rss2/` | 200 | `application/rss+xml` | `alternate`, `link` |
| `https://bmstechnik.pl/sitemap.xml` | 301 | `https://bmstechnik.pl/wp-sitemap.xml` → 200 | `sitemap` |
| `https://bmstechnik.pl/sitemap_index.xml` | 404 | `text/html` | `probe` |
| `https://bmstechnik.pl/witaj-swiecie/embed/` | 200 | `text/html` | `wp-embed` |
| `https://bmstechnik.pl/wp-json/` | 200 | `application/json` | `api` |
| `https://bmstechnik.pl/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fbmstechnik.pl%2F` | 200 | `application/json` | `alternate` |
| `https://bmstechnik.pl/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fbmstechnik.pl%2F&format=xml` | 200 | `text/xml` | `alternate` |
| `https://bmstechnik.pl/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fbmstechnik.pl%2Ffav%2F` | 200 | `application/json` | `alternate` |
| `https://bmstechnik.pl/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fbmstechnik.pl%2Ffav%2F&format=xml` | 200 | `text/xml` | `alternate` |
| `https://bmstechnik.pl/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fbmstechnik.pl%2Fklimatyzacja%2F` | 200 | `application/json` | `alternate` |
| `https://bmstechnik.pl/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fbmstechnik.pl%2Fklimatyzacja%2F&format=xml` | 200 | `text/xml` | `alternate` |
| `https://bmstechnik.pl/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fbmstechnik.pl%2Fklimatyzacja%2F20220701_093138%2F` | 200 | `application/json` | `alternate` |
| `https://bmstechnik.pl/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fbmstechnik.pl%2Fklimatyzacja%2F20220701_093138%2F&format=xml` | 200 | `text/xml` | `alternate` |
| `https://bmstechnik.pl/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fbmstechnik.pl%2Fklimatyzacja%2F20220701_093226%2F` | 200 | `application/json` | `alternate` |
| `https://bmstechnik.pl/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fbmstechnik.pl%2Fklimatyzacja%2F20220701_093226%2F&format=xml` | 200 | `text/xml` | `alternate` |
| `https://bmstechnik.pl/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fbmstechnik.pl%2Fklimatyzacja%2F20220701_093236%2F` | 200 | `application/json` | `alternate` |
| `https://bmstechnik.pl/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fbmstechnik.pl%2Fklimatyzacja%2F20220701_093236%2F&format=xml` | 200 | `text/xml` | `alternate` |
| `https://bmstechnik.pl/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fbmstechnik.pl%2Fklimatyzacja%2Fcropped-maintenance-png%2F` | 200 | `application/json` | `alternate` |
| `https://bmstechnik.pl/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fbmstechnik.pl%2Fklimatyzacja%2Fcropped-maintenance-png%2F&format=xml` | 200 | `text/xml` | `alternate` |
| `https://bmstechnik.pl/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fbmstechnik.pl%2Fklimatyzacja%2Fgwarancja%2F` | 200 | `application/json` | `alternate` |
| `https://bmstechnik.pl/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fbmstechnik.pl%2Fklimatyzacja%2Fgwarancja%2F&format=xml` | 200 | `text/xml` | `alternate` |
| `https://bmstechnik.pl/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fbmstechnik.pl%2Fklimatyzacja%2Fimg_20220301_105108%2F` | 200 | `application/json` | `alternate` |
| `https://bmstechnik.pl/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fbmstechnik.pl%2Fklimatyzacja%2Fimg_20220301_105108%2F&format=xml` | 200 | `text/xml` | `alternate` |
| `https://bmstechnik.pl/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fbmstechnik.pl%2Fklimatyzacja%2Fimg_20220301_110450%2F` | 200 | `application/json` | `alternate` |
| `https://bmstechnik.pl/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fbmstechnik.pl%2Fklimatyzacja%2Fimg_20220301_110450%2F&format=xml` | 200 | `text/xml` | `alternate` |
| `https://bmstechnik.pl/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fbmstechnik.pl%2Fklimatyzacja%2Fstock-photo-air-conditioner-inside-the-room-with-woman-operating-remote-controller-air-conditioner-with-507015844%2F` | 200 | `application/json` | `alternate` |
| `https://bmstechnik.pl/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fbmstechnik.pl%2Fklimatyzacja%2Fstock-photo-air-conditioner-inside-the-room-with-woman-operating-remote-controller-air-conditioner-with-507015844%2F&format=xml` | 200 | `text/xml` | `alternate` |
| `https://bmstechnik.pl/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fbmstechnik.pl%2Fklimatyzacja%2Fstock-photo-electrician-repairing-air-conditioner-indoors-1303903513%2F` | 200 | `application/json` | `alternate` |
| `https://bmstechnik.pl/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fbmstechnik.pl%2Fklimatyzacja%2Fstock-photo-electrician-repairing-air-conditioner-indoors-1303903513%2F&format=xml` | 200 | `text/xml` | `alternate` |
| `https://bmstechnik.pl/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fbmstechnik.pl%2Fklimatyzacja%2Fstock-photo-electrician-repairing-air-conditioner-indoors-1303903513-2%2F` | 200 | `application/json` | `alternate` |
| `https://bmstechnik.pl/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fbmstechnik.pl%2Fklimatyzacja%2Fstock-photo-electrician-repairing-air-conditioner-indoors-1303903513-2%2F&format=xml` | 200 | `text/xml` | `alternate` |
| `https://bmstechnik.pl/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fbmstechnik.pl%2Fkontakt%2F` | 200 | `application/json` | `alternate` |
| `https://bmstechnik.pl/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fbmstechnik.pl%2Fkontakt%2F&format=xml` | 200 | `text/xml` | `alternate` |
| `https://bmstechnik.pl/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fbmstechnik.pl%2Fkontakt%2Fstock-photo-man-work-using-computer-hand-typing-laptop-keyboard-contact-us-online-chatting-search-form-internet-1888674034%2F` | 200 | `application/json` | `alternate` |
| `https://bmstechnik.pl/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fbmstechnik.pl%2Fkontakt%2Fstock-photo-man-work-using-computer-hand-typing-laptop-keyboard-contact-us-online-chatting-search-form-internet-1888674034%2F&format=xml` | 200 | `text/xml` | `alternate` |
| `https://bmstechnik.pl/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fbmstechnik.pl%2Flogo%2F` | 200 | `application/json` | `alternate` |
| `https://bmstechnik.pl/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fbmstechnik.pl%2Flogo%2F&format=xml` | 200 | `text/xml` | `alternate` |
| `https://bmstechnik.pl/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fbmstechnik.pl%2Fpolityka-prywatnosci%2F` | 200 | `application/json` | `alternate` |
| `https://bmstechnik.pl/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fbmstechnik.pl%2Fpolityka-prywatnosci%2F&format=xml` | 200 | `text/xml` | `alternate` |
| `https://bmstechnik.pl/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fbmstechnik.pl%2Fprzykladowa-strona%2Fbg-home%2F` | 200 | `application/json` | `alternate` |
| `https://bmstechnik.pl/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fbmstechnik.pl%2Fprzykladowa-strona%2Fbg-home%2F&format=xml` | 200 | `text/xml` | `alternate` |
| `https://bmstechnik.pl/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fbmstechnik.pl%2Fprzykladowa-strona%2Fmaintenance%2F` | 200 | `application/json` | `alternate` |
| `https://bmstechnik.pl/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fbmstechnik.pl%2Fprzykladowa-strona%2Fmaintenance%2F&format=xml` | 200 | `text/xml` | `alternate` |
| `https://bmstechnik.pl/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fbmstechnik.pl%2Fprzykladowa-strona%2Fwentylacja-1%2F` | 200 | `application/json` | `alternate` |
| `https://bmstechnik.pl/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fbmstechnik.pl%2Fprzykladowa-strona%2Fwentylacja-1%2F&format=xml` | 200 | `text/xml` | `alternate` |
| `https://bmstechnik.pl/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fbmstechnik.pl%2Fprzykladowa-strona%2Fwentylacja-2%2F` | 200 | `application/json` | `alternate` |
| `https://bmstechnik.pl/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fbmstechnik.pl%2Fprzykladowa-strona%2Fwentylacja-2%2F&format=xml` | 200 | `text/xml` | `alternate` |
| `https://bmstechnik.pl/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fbmstechnik.pl%2Fprzykladowa-strona%2Fwentylacja-3%2F` | 200 | `application/json` | `alternate` |
| `https://bmstechnik.pl/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fbmstechnik.pl%2Fprzykladowa-strona%2Fwentylacja-3%2F&format=xml` | 200 | `text/xml` | `alternate` |
| `https://bmstechnik.pl/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fbmstechnik.pl%2Fprzykladowa-strona%2Fwentylacja-4%2F` | 200 | `application/json` | `alternate` |
| `https://bmstechnik.pl/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fbmstechnik.pl%2Fprzykladowa-strona%2Fwentylacja-4%2F&format=xml` | 200 | `text/xml` | `alternate` |
| `https://bmstechnik.pl/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fbmstechnik.pl%2Frekuperacja%2F` | 200 | `application/json` | `alternate` |
| `https://bmstechnik.pl/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fbmstechnik.pl%2Frekuperacja%2F&format=xml` | 200 | `text/xml` | `alternate` |
| `https://bmstechnik.pl/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fbmstechnik.pl%2Frekuperacja%2Fdobor-urzadzen%2F` | 200 | `application/json` | `alternate` |
| `https://bmstechnik.pl/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fbmstechnik.pl%2Frekuperacja%2Fdobor-urzadzen%2F&format=xml` | 200 | `text/xml` | `alternate` |
| `https://bmstechnik.pl/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fbmstechnik.pl%2Frekuperacja%2Fdostawa-montaz%2F` | 200 | `application/json` | `alternate` |
| `https://bmstechnik.pl/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fbmstechnik.pl%2Frekuperacja%2Fdostawa-montaz%2F&format=xml` | 200 | `text/xml` | `alternate` |
| `https://bmstechnik.pl/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fbmstechnik.pl%2Frekuperacja%2Fimg_20220216_135304%2F` | 200 | `application/json` | `alternate` |
| `https://bmstechnik.pl/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fbmstechnik.pl%2Frekuperacja%2Fimg_20220216_135304%2F&format=xml` | 200 | `text/xml` | `alternate` |
| `https://bmstechnik.pl/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fbmstechnik.pl%2Frekuperacja%2Fimg_20220216_135322%2F` | 200 | `application/json` | `alternate` |
| `https://bmstechnik.pl/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fbmstechnik.pl%2Frekuperacja%2Fimg_20220216_135322%2F&format=xml` | 200 | `text/xml` | `alternate` |
| `https://bmstechnik.pl/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fbmstechnik.pl%2Frekuperacja%2Fimg_20220216_135344%2F` | 200 | `application/json` | `alternate` |
| `https://bmstechnik.pl/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fbmstechnik.pl%2Frekuperacja%2Fimg_20220216_135344%2F&format=xml` | 200 | `text/xml` | `alternate` |
| `https://bmstechnik.pl/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fbmstechnik.pl%2Frekuperacja%2Fimg_20220216_135409%2F` | 200 | `application/json` | `alternate` |
| `https://bmstechnik.pl/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fbmstechnik.pl%2Frekuperacja%2Fimg_20220216_135409%2F&format=xml` | 200 | `text/xml` | `alternate` |
| `https://bmstechnik.pl/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fbmstechnik.pl%2Frekuperacja%2Fimg_20220216_135446%2F` | 200 | `application/json` | `alternate` |
| `https://bmstechnik.pl/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fbmstechnik.pl%2Frekuperacja%2Fimg_20220216_135446%2F&format=xml` | 200 | `text/xml` | `alternate` |
| `https://bmstechnik.pl/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fbmstechnik.pl%2Frekuperacja%2Fproject-1%2F` | 200 | `application/json` | `alternate` |
| `https://bmstechnik.pl/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fbmstechnik.pl%2Frekuperacja%2Fproject-1%2F&format=xml` | 200 | `text/xml` | `alternate` |
| `https://bmstechnik.pl/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fbmstechnik.pl%2Frekuperacja%2Fregulacja%2F` | 200 | `application/json` | `alternate` |
| `https://bmstechnik.pl/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fbmstechnik.pl%2Frekuperacja%2Fregulacja%2F&format=xml` | 200 | `text/xml` | `alternate` |
| `https://bmstechnik.pl/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fbmstechnik.pl%2Frekuperacja%2Fstock-photo-hvac-worker-install-ducted-pipe-system-for-ventilation-and-air-conditioning-copy-space-1984711982%2F` | 200 | `application/json` | `alternate` |
| `https://bmstechnik.pl/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fbmstechnik.pl%2Frekuperacja%2Fstock-photo-hvac-worker-install-ducted-pipe-system-for-ventilation-and-air-conditioning-copy-space-1984711982%2F&format=xml` | 200 | `text/xml` | `alternate` |
| `https://bmstechnik.pl/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fbmstechnik.pl%2Frekuperacja%2Fstock-photo-ventilation-system-on-ceiling-of-industrial-room-air-purification-system-in-restaurant-pipes-from-1894119517%2F` | 200 | `application/json` | `alternate` |
| `https://bmstechnik.pl/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fbmstechnik.pl%2Frekuperacja%2Fstock-photo-ventilation-system-on-ceiling-of-industrial-room-air-purification-system-in-restaurant-pipes-from-1894119517%2F&format=xml` | 200 | `text/xml` | `alternate` |
| `https://bmstechnik.pl/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fbmstechnik.pl%2Frekuperacja%2Fsystem%2F` | 200 | `application/json` | `alternate` |
| `https://bmstechnik.pl/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fbmstechnik.pl%2Frekuperacja%2Fsystem%2F&format=xml` | 200 | `text/xml` | `alternate` |
| `https://bmstechnik.pl/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fbmstechnik.pl%2Fwitaj-swiecie%2F` | 200 | `application/json` | `alternate` |
| `https://bmstechnik.pl/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fbmstechnik.pl%2Fwitaj-swiecie%2F&format=xml` | 200 | `text/xml` | `alternate` |
| `https://bmstechnik.pl/wp-json/wp/v2/categories/1` | 200 | `application/json` | `alternate` |
| `https://bmstechnik.pl/wp-json/wp/v2/media/111` | 200 | `application/json` | `alternate` |
| `https://bmstechnik.pl/wp-json/wp/v2/media/118` | 200 | `application/json` | `alternate` |
| `https://bmstechnik.pl/wp-json/wp/v2/media/120` | 200 | `application/json` | `alternate` |
| `https://bmstechnik.pl/wp-json/wp/v2/media/122` | 200 | `application/json` | `alternate` |
| `https://bmstechnik.pl/wp-json/wp/v2/media/125` | 200 | `application/json` | `alternate` |
| `https://bmstechnik.pl/wp-json/wp/v2/media/126` | 200 | `application/json` | `alternate` |
| `https://bmstechnik.pl/wp-json/wp/v2/media/156` | 200 | `application/json` | `alternate` |
| `https://bmstechnik.pl/wp-json/wp/v2/media/157` | 200 | `application/json` | `alternate` |
| `https://bmstechnik.pl/wp-json/wp/v2/media/159` | 200 | `application/json` | `alternate` |
| `https://bmstechnik.pl/wp-json/wp/v2/media/160` | 200 | `application/json` | `alternate` |
| `https://bmstechnik.pl/wp-json/wp/v2/media/161` | 200 | `application/json` | `alternate` |
| `https://bmstechnik.pl/wp-json/wp/v2/media/162` | 200 | `application/json` | `alternate` |
| `https://bmstechnik.pl/wp-json/wp/v2/media/163` | 200 | `application/json` | `alternate` |
| `https://bmstechnik.pl/wp-json/wp/v2/media/168` | 200 | `application/json` | `alternate` |
| `https://bmstechnik.pl/wp-json/wp/v2/media/169` | 200 | `application/json` | `alternate` |
| `https://bmstechnik.pl/wp-json/wp/v2/media/170` | 200 | `application/json` | `alternate` |
| `https://bmstechnik.pl/wp-json/wp/v2/media/26` | 200 | `application/json` | `alternate` |
| `https://bmstechnik.pl/wp-json/wp/v2/media/30` | 200 | `application/json` | `alternate` |
| `https://bmstechnik.pl/wp-json/wp/v2/media/31` | 200 | `application/json` | `alternate` |
| `https://bmstechnik.pl/wp-json/wp/v2/media/34` | 200 | `application/json` | `alternate` |
| `https://bmstechnik.pl/wp-json/wp/v2/media/35` | 200 | `application/json` | `alternate` |
| `https://bmstechnik.pl/wp-json/wp/v2/media/67` | 200 | `application/json` | `alternate` |
| `https://bmstechnik.pl/wp-json/wp/v2/media/69` | 200 | `application/json` | `alternate` |
| `https://bmstechnik.pl/wp-json/wp/v2/media/70` | 200 | `application/json` | `alternate` |
| `https://bmstechnik.pl/wp-json/wp/v2/media/87` | 200 | `application/json` | `alternate` |
| `https://bmstechnik.pl/wp-json/wp/v2/media/88` | 200 | `application/json` | `alternate` |
| `https://bmstechnik.pl/wp-json/wp/v2/media/89` | 200 | `application/json` | `alternate` |
| `https://bmstechnik.pl/wp-json/wp/v2/media/90` | 200 | `application/json` | `alternate` |
| `https://bmstechnik.pl/wp-json/wp/v2/media/91` | 200 | `application/json` | `alternate` |
| `https://bmstechnik.pl/wp-json/wp/v2/media/96` | 200 | `application/json` | `alternate` |
| `https://bmstechnik.pl/wp-json/wp/v2/media/98` | 200 | `application/json` | `alternate` |
| `https://bmstechnik.pl/wp-json/wp/v2/media?per_page=100&_fields=id,slug,link,source_url,media_details,mime_type,alt_text,post` | 200 | `application/json` | `api-media` |
| `https://bmstechnik.pl/wp-json/wp/v2/pages/2` | 200 | `application/json` | `alternate` |
| `https://bmstechnik.pl/wp-json/wp/v2/pages/3` | 200 | `application/json` | `alternate` |
| `https://bmstechnik.pl/wp-json/wp/v2/pages/40` | 200 | `application/json` | `alternate` |
| `https://bmstechnik.pl/wp-json/wp/v2/pages/43` | 200 | `application/json` | `alternate` |
| `https://bmstechnik.pl/wp-json/wp/v2/pages/52` | 200 | `application/json` | `alternate` |
| `https://bmstechnik.pl/wp-json/wp/v2/pages?per_page=100&_fields=id,slug,link,parent` | 200 | `application/json` | `api-list` |
| `https://bmstechnik.pl/wp-json/wp/v2/posts/1` | 200 | `application/json` | `alternate` |
| `https://bmstechnik.pl/wp-json/wp/v2/posts?per_page=100&_fields=id,slug,link` | 200 | `application/json` | `api-list` |
| `https://bmstechnik.pl/wp-json/wp/v2/users/1` | 200 | `application/json` | `alternate` |
| `https://bmstechnik.pl/wp-json/wp/v2/users/2` | 401 | `application/json` | `alternate` |
| `https://bmstechnik.pl/wp-sitemap-posts-page-1.xml` | 200 | `application/xml` | `sitemap` |
| `https://bmstechnik.pl/wp-sitemap-posts-post-1.xml` | 200 | `application/xml` | `sitemap` |
| `https://bmstechnik.pl/wp-sitemap-taxonomies-category-1.xml` | 200 | `application/xml` | `sitemap` |
| `https://bmstechnik.pl/wp-sitemap-users-1.xml` | 200 | `application/xml` | `sitemap` |
| `https://bmstechnik.pl/wp-sitemap.xml` | 200 | `application/xml` | `sitemap`, `redirect` |

### Pliki pod /wp-content/uploads/ (248)

| URL | GET | Cel lub wynik | Role odkrycia |
| --- | --- | --- | --- |
| `http://bmstechnik.pl/wp-content/uploads/2022/03/stock-photo-electrician-repairing-air-conditioner-indoors-1303903513-1.jpg` | 200 | `image/jpeg` | `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/Wentylacja-1-1024x768.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/Wentylacja-1-1080x810.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/Wentylacja-1-150x150.jpg` | 200 | `image/jpeg` | `media-size` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/Wentylacja-1-1536x1152.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/Wentylacja-1-2048x1536.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/Wentylacja-1-2560x1920.jpg` | 200 | `image/jpeg` | `media-size` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/Wentylacja-1-270x270.jpg` | 200 | `image/jpeg` | `media-size` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/Wentylacja-1-300x225.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/Wentylacja-1-768x576.jpg` | 200 | `image/jpeg` | `media-size`, `asset`, `embed-thumbnail` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/Wentylacja-1-900x460.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/Wentylacja-1-scaled.jpg` | 200 | `image/jpeg` | `media-original`, `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/Wentylacja-1.jpg` | 200 | `image/jpeg` | `media-original` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/Wentylacja-2-1024x768.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/Wentylacja-2-1080x810.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/Wentylacja-2-150x150.jpg` | 200 | `image/jpeg` | `media-size` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/Wentylacja-2-1536x1152.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/Wentylacja-2-2048x1536.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/Wentylacja-2-2560x1920.jpg` | 200 | `image/jpeg` | `media-size` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/Wentylacja-2-270x270.jpg` | 200 | `image/jpeg` | `media-size` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/Wentylacja-2-300x225.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/Wentylacja-2-768x576.jpg` | 200 | `image/jpeg` | `media-size`, `asset`, `embed-thumbnail` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/Wentylacja-2-900x460.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/Wentylacja-2-scaled.jpg` | 200 | `image/jpeg` | `media-original`, `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/Wentylacja-2.jpg` | 200 | `image/jpeg` | `media-original` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/Wentylacja-3-1024x768.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/Wentylacja-3-1080x810.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/Wentylacja-3-150x150.jpg` | 200 | `image/jpeg` | `media-size` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/Wentylacja-3-1536x1152.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/Wentylacja-3-2048x1536.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/Wentylacja-3-2560x1920.jpg` | 200 | `image/jpeg` | `media-size` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/Wentylacja-3-270x270.jpg` | 200 | `image/jpeg` | `media-size` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/Wentylacja-3-300x225.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/Wentylacja-3-768x576.jpg` | 200 | `image/jpeg` | `media-size`, `asset`, `embed-thumbnail` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/Wentylacja-3-900x460.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/Wentylacja-3-scaled.jpg` | 200 | `image/jpeg` | `media-original`, `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/Wentylacja-3.jpg` | 200 | `image/jpeg` | `media-original` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/Wentylacja-4-1024x768.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/Wentylacja-4-1080x810.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/Wentylacja-4-150x150.jpg` | 200 | `image/jpeg` | `media-size` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/Wentylacja-4-1536x1152.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/Wentylacja-4-2048x1536.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/Wentylacja-4-2560x1920.jpg` | 200 | `image/jpeg` | `media-size` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/Wentylacja-4-270x270.jpg` | 200 | `image/jpeg` | `media-size` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/Wentylacja-4-300x225.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/Wentylacja-4-768x576.jpg` | 200 | `image/jpeg` | `media-size`, `asset`, `embed-thumbnail` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/Wentylacja-4-900x460.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/Wentylacja-4-scaled.jpg` | 200 | `image/jpeg` | `media-original`, `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/Wentylacja-4.jpg` | 200 | `image/jpeg` | `media-original` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/bg-home-1024x683.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/bg-home-1080x720.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/bg-home-150x150.jpg` | 200 | `image/jpeg` | `media-size` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/bg-home-1536x1024.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/bg-home-2048x1366.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/bg-home-270x270.jpg` | 200 | `image/jpeg` | `media-size` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/bg-home-300x200.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/bg-home-768x512.jpg` | 200 | `image/jpeg` | `media-size`, `asset`, `embed-thumbnail` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/bg-home-900x460.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/bg-home.jpg` | 200 | `image/jpeg` | `css`, `media-original`, `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/cropped-maintenance-150x150.png` | 200 | `image/png` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/cropped-maintenance-180x180.png` | 200 | `image/png` | `asset`, `media-size` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/cropped-maintenance-192x192.png` | 200 | `image/png` | `asset`, `media-size` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/cropped-maintenance-270x270.png` | 200 | `image/png` | `og-asset`, `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/cropped-maintenance-300x300.png` | 200 | `image/png` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/cropped-maintenance-32x32.png` | 200 | `image/png` | `asset`, `media-size` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/cropped-maintenance-512x460.png` | 200 | `image/png` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/cropped-maintenance.png` | 200 | `image/png` | `media-original`, `media-size`, `asset`, `embed-thumbnail` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/dobor-urzadzen.svg` | 200 | `image/svg+xml` | `asset`, `media-original`, `media-size`, `embed-thumbnail` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/dostawa-montaz.svg` | 200 | `image/svg+xml` | `asset`, `media-original`, `media-size`, `embed-thumbnail` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/fav.svg` | 200 | `image/svg+xml` | `media-original`, `media-size`, `asset`, `embed-thumbnail` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/gwarancja.svg` | 200 | `image/svg+xml` | `asset`, `media-original`, `media-size`, `embed-thumbnail` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/logo.svg` | 200 | `image/svg+xml` | `asset`, `media-original`, `media-size`, `embed-thumbnail` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/maintenance-150x150.png` | 200 | `image/png` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/maintenance-270x270.png` | 200 | `image/png` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/maintenance-300x300.png` | 200 | `image/png` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/maintenance-512x460.png` | 200 | `image/png` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/maintenance.png` | 200 | `image/png` | `asset`, `media-original`, `media-size`, `embed-thumbnail` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/project-1.svg` | 200 | `image/svg+xml` | `asset`, `media-original`, `media-size`, `embed-thumbnail` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/regulacja.svg` | 200 | `image/svg+xml` | `asset`, `media-original`, `media-size`, `embed-thumbnail` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/stock-photo-air-conditioner-inside-the-room-with-woman-operating-remote-controller-air-conditioner-with-507015844-1024x752.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/stock-photo-air-conditioner-inside-the-room-with-woman-operating-remote-controller-air-conditioner-with-507015844-1080x793.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/stock-photo-air-conditioner-inside-the-room-with-woman-operating-remote-controller-air-conditioner-with-507015844-150x150.jpg` | 200 | `image/jpeg` | `media-size` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/stock-photo-air-conditioner-inside-the-room-with-woman-operating-remote-controller-air-conditioner-with-507015844-270x270.jpg` | 200 | `image/jpeg` | `media-size` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/stock-photo-air-conditioner-inside-the-room-with-woman-operating-remote-controller-air-conditioner-with-507015844-300x220.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/stock-photo-air-conditioner-inside-the-room-with-woman-operating-remote-controller-air-conditioner-with-507015844-768x564.jpg` | 200 | `image/jpeg` | `media-size`, `asset`, `embed-thumbnail` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/stock-photo-air-conditioner-inside-the-room-with-woman-operating-remote-controller-air-conditioner-with-507015844-900x460.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/stock-photo-air-conditioner-inside-the-room-with-woman-operating-remote-controller-air-conditioner-with-507015844.jpg` | 200 | `image/jpeg` | `css`, `media-original`, `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/stock-photo-electrician-repairing-air-conditioner-indoors-1303903513-1-1024x481.jpg` | 200 | `image/jpeg` | `asset`, `media-size` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/stock-photo-electrician-repairing-air-conditioner-indoors-1303903513-1-1080x507.jpg` | 200 | `image/jpeg` | `asset`, `media-size` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/stock-photo-electrician-repairing-air-conditioner-indoors-1303903513-1-150x150.jpg` | 200 | `image/jpeg` | `media-size` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/stock-photo-electrician-repairing-air-conditioner-indoors-1303903513-1-270x270.jpg` | 200 | `image/jpeg` | `media-size` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/stock-photo-electrician-repairing-air-conditioner-indoors-1303903513-1-300x141.jpg` | 200 | `image/jpeg` | `asset`, `media-size` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/stock-photo-electrician-repairing-air-conditioner-indoors-1303903513-1-768x360.jpg` | 200 | `image/jpeg` | `asset`, `media-size`, `embed-thumbnail` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/stock-photo-electrician-repairing-air-conditioner-indoors-1303903513-1-900x460.jpg` | 200 | `image/jpeg` | `media-size` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/stock-photo-electrician-repairing-air-conditioner-indoors-1303903513-1.jpg` | 200 | `image/jpeg` | `asset`, `media-original`, `media-size` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/stock-photo-electrician-repairing-air-conditioner-indoors-1303903513-1024x752.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/stock-photo-electrician-repairing-air-conditioner-indoors-1303903513-1080x793.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/stock-photo-electrician-repairing-air-conditioner-indoors-1303903513-150x150.jpg` | 200 | `image/jpeg` | `media-size` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/stock-photo-electrician-repairing-air-conditioner-indoors-1303903513-270x270.jpg` | 200 | `image/jpeg` | `media-size` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/stock-photo-electrician-repairing-air-conditioner-indoors-1303903513-300x220.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/stock-photo-electrician-repairing-air-conditioner-indoors-1303903513-768x564.jpg` | 200 | `image/jpeg` | `media-size`, `asset`, `embed-thumbnail` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/stock-photo-electrician-repairing-air-conditioner-indoors-1303903513-900x460.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/stock-photo-electrician-repairing-air-conditioner-indoors-1303903513.jpg` | 200 | `image/jpeg` | `media-original`, `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/stock-photo-hvac-worker-install-ducted-pipe-system-for-ventilation-and-air-conditioning-copy-space-1984711982-1024x556.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/stock-photo-hvac-worker-install-ducted-pipe-system-for-ventilation-and-air-conditioning-copy-space-1984711982-1080x586.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/stock-photo-hvac-worker-install-ducted-pipe-system-for-ventilation-and-air-conditioning-copy-space-1984711982-150x150.jpg` | 200 | `image/jpeg` | `media-size` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/stock-photo-hvac-worker-install-ducted-pipe-system-for-ventilation-and-air-conditioning-copy-space-1984711982-270x270.jpg` | 200 | `image/jpeg` | `media-size` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/stock-photo-hvac-worker-install-ducted-pipe-system-for-ventilation-and-air-conditioning-copy-space-1984711982-300x163.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/stock-photo-hvac-worker-install-ducted-pipe-system-for-ventilation-and-air-conditioning-copy-space-1984711982-768x417.jpg` | 200 | `image/jpeg` | `media-size`, `asset`, `embed-thumbnail` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/stock-photo-hvac-worker-install-ducted-pipe-system-for-ventilation-and-air-conditioning-copy-space-1984711982-900x460.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/stock-photo-hvac-worker-install-ducted-pipe-system-for-ventilation-and-air-conditioning-copy-space-1984711982.jpg` | 200 | `image/jpeg` | `css`, `media-original`, `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/stock-photo-man-work-using-computer-hand-typing-laptop-keyboard-contact-us-online-chatting-search-form-internet-1888674034-1024x707.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/stock-photo-man-work-using-computer-hand-typing-laptop-keyboard-contact-us-online-chatting-search-form-internet-1888674034-1080x746.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/stock-photo-man-work-using-computer-hand-typing-laptop-keyboard-contact-us-online-chatting-search-form-internet-1888674034-150x150.jpg` | 200 | `image/jpeg` | `media-size` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/stock-photo-man-work-using-computer-hand-typing-laptop-keyboard-contact-us-online-chatting-search-form-internet-1888674034-270x270.jpg` | 200 | `image/jpeg` | `media-size` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/stock-photo-man-work-using-computer-hand-typing-laptop-keyboard-contact-us-online-chatting-search-form-internet-1888674034-300x207.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/stock-photo-man-work-using-computer-hand-typing-laptop-keyboard-contact-us-online-chatting-search-form-internet-1888674034-768x530.jpg` | 200 | `image/jpeg` | `media-size`, `asset`, `embed-thumbnail` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/stock-photo-man-work-using-computer-hand-typing-laptop-keyboard-contact-us-online-chatting-search-form-internet-1888674034-900x460.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/stock-photo-man-work-using-computer-hand-typing-laptop-keyboard-contact-us-online-chatting-search-form-internet-1888674034.jpg` | 200 | `image/jpeg` | `css`, `media-original`, `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/stock-photo-ventilation-system-on-ceiling-of-industrial-room-air-purification-system-in-restaurant-pipes-from-1894119517-1024x836.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/stock-photo-ventilation-system-on-ceiling-of-industrial-room-air-purification-system-in-restaurant-pipes-from-1894119517-1080x882.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/stock-photo-ventilation-system-on-ceiling-of-industrial-room-air-purification-system-in-restaurant-pipes-from-1894119517-150x150.jpg` | 200 | `image/jpeg` | `media-size` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/stock-photo-ventilation-system-on-ceiling-of-industrial-room-air-purification-system-in-restaurant-pipes-from-1894119517-270x270.jpg` | 200 | `image/jpeg` | `media-size` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/stock-photo-ventilation-system-on-ceiling-of-industrial-room-air-purification-system-in-restaurant-pipes-from-1894119517-300x245.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/stock-photo-ventilation-system-on-ceiling-of-industrial-room-air-purification-system-in-restaurant-pipes-from-1894119517-768x627.jpg` | 200 | `image/jpeg` | `media-size`, `asset`, `embed-thumbnail` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/stock-photo-ventilation-system-on-ceiling-of-industrial-room-air-purification-system-in-restaurant-pipes-from-1894119517-900x460.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/stock-photo-ventilation-system-on-ceiling-of-industrial-room-air-purification-system-in-restaurant-pipes-from-1894119517.jpg` | 200 | `image/jpeg` | `media-original`, `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/03/system.svg` | 200 | `image/svg+xml` | `asset`, `media-original`, `media-size`, `embed-thumbnail` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220216_135304-1024x1024.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220216_135304-1080x1080.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220216_135304-150x150.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220216_135304-1536x1536.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220216_135304-2048x2048.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220216_135304-2560x2560.jpg` | 200 | `image/jpeg` | `media-size` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220216_135304-270x270.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220216_135304-300x300.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220216_135304-768x768.jpg` | 200 | `image/jpeg` | `media-size`, `asset`, `embed-thumbnail` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220216_135304-900x460.jpg` | 200 | `image/jpeg` | `asset`, `media-size` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220216_135304-scaled.jpg` | 200 | `image/jpeg` | `media-original`, `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220216_135304.jpg` | 200 | `image/jpeg` | `media-original` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220216_135322-1024x1024.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220216_135322-1080x1080.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220216_135322-150x150.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220216_135322-1536x1536.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220216_135322-2048x2048.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220216_135322-2560x2560.jpg` | 200 | `image/jpeg` | `media-size` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220216_135322-270x270.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220216_135322-300x300.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220216_135322-768x768.jpg` | 200 | `image/jpeg` | `media-size`, `asset`, `embed-thumbnail` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220216_135322-900x460.jpg` | 200 | `image/jpeg` | `asset`, `media-size` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220216_135322-scaled.jpg` | 200 | `image/jpeg` | `media-original`, `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220216_135322.jpg` | 200 | `image/jpeg` | `media-original` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220216_135344-1024x1024.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220216_135344-1080x1080.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220216_135344-150x150.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220216_135344-1536x1536.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220216_135344-2048x2048.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220216_135344-2560x2560.jpg` | 200 | `image/jpeg` | `media-size` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220216_135344-270x270.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220216_135344-300x300.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220216_135344-768x768.jpg` | 200 | `image/jpeg` | `media-size`, `asset`, `embed-thumbnail` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220216_135344-900x460.jpg` | 200 | `image/jpeg` | `asset`, `media-size` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220216_135344-scaled.jpg` | 200 | `image/jpeg` | `media-original`, `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220216_135344.jpg` | 200 | `image/jpeg` | `media-original` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220216_135409-1024x1024.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220216_135409-1080x1080.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220216_135409-150x150.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220216_135409-1536x1536.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220216_135409-2048x2048.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220216_135409-2560x2560.jpg` | 200 | `image/jpeg` | `media-size` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220216_135409-270x270.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220216_135409-300x300.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220216_135409-768x768.jpg` | 200 | `image/jpeg` | `media-size`, `asset`, `embed-thumbnail` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220216_135409-900x460.jpg` | 200 | `image/jpeg` | `asset`, `media-size` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220216_135409-scaled.jpg` | 200 | `image/jpeg` | `media-original`, `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220216_135409.jpg` | 200 | `image/jpeg` | `media-original` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220216_135446-1024x1024.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220216_135446-1080x1080.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220216_135446-150x150.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220216_135446-1536x1536.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220216_135446-2048x2048.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220216_135446-2560x2560.jpg` | 200 | `image/jpeg` | `media-size` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220216_135446-270x270.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220216_135446-300x300.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220216_135446-768x768.jpg` | 200 | `image/jpeg` | `media-size`, `asset`, `embed-thumbnail` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220216_135446-900x460.jpg` | 200 | `image/jpeg` | `asset`, `media-size` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220216_135446-scaled.jpg` | 200 | `image/jpeg` | `media-original`, `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220216_135446.jpg` | 200 | `image/jpeg` | `media-original` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220301_105108-1024x1024.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220301_105108-1080x1080.jpg` | 200 | `image/jpeg` | `asset`, `media-size` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220301_105108-150x150.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220301_105108-1536x1536.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220301_105108-2048x2048.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220301_105108-2560x2560.jpg` | 200 | `image/jpeg` | `media-size` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220301_105108-270x270.jpg` | 200 | `image/jpeg` | `asset`, `media-size` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220301_105108-300x300.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220301_105108-768x768.jpg` | 200 | `image/jpeg` | `media-size`, `asset`, `embed-thumbnail` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220301_105108-900x460.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220301_105108-scaled.jpg` | 200 | `image/jpeg` | `media-original`, `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220301_105108.jpg` | 200 | `image/jpeg` | `media-original` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220301_110450-1024x1024.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220301_110450-1080x1080.jpg` | 200 | `image/jpeg` | `asset`, `media-size` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220301_110450-150x150.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220301_110450-1536x1536.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220301_110450-2048x2048.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220301_110450-2560x2560.jpg` | 200 | `image/jpeg` | `media-size` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220301_110450-270x270.jpg` | 200 | `image/jpeg` | `asset`, `media-size` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220301_110450-300x300.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220301_110450-768x768.jpg` | 200 | `image/jpeg` | `media-size`, `asset`, `embed-thumbnail` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220301_110450-900x460.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220301_110450-scaled.jpg` | 200 | `image/jpeg` | `media-original`, `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/06/IMG_20220301_110450.jpg` | 200 | `image/jpeg` | `media-original` |
| `https://bmstechnik.pl/wp-content/uploads/2022/09/20220701_093138-1024x768.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/09/20220701_093138-1080x810.jpg` | 200 | `image/jpeg` | `asset`, `media-size` |
| `https://bmstechnik.pl/wp-content/uploads/2022/09/20220701_093138-150x150.jpg` | 200 | `image/jpeg` | `media-size` |
| `https://bmstechnik.pl/wp-content/uploads/2022/09/20220701_093138-1536x1152.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/09/20220701_093138-2048x1536.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/09/20220701_093138-2560x1920.jpg` | 200 | `image/jpeg` | `media-size` |
| `https://bmstechnik.pl/wp-content/uploads/2022/09/20220701_093138-270x270.jpg` | 200 | `image/jpeg` | `asset`, `media-size` |
| `https://bmstechnik.pl/wp-content/uploads/2022/09/20220701_093138-300x225.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/09/20220701_093138-768x576.jpg` | 200 | `image/jpeg` | `media-size`, `asset`, `embed-thumbnail` |
| `https://bmstechnik.pl/wp-content/uploads/2022/09/20220701_093138-900x460.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/09/20220701_093138-scaled.jpg` | 200 | `image/jpeg` | `media-original`, `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/09/20220701_093138.jpg` | 200 | `image/jpeg` | `media-original` |
| `https://bmstechnik.pl/wp-content/uploads/2022/09/20220701_093226-1024x768.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/09/20220701_093226-1080x810.jpg` | 200 | `image/jpeg` | `asset`, `media-size` |
| `https://bmstechnik.pl/wp-content/uploads/2022/09/20220701_093226-150x150.jpg` | 200 | `image/jpeg` | `media-size` |
| `https://bmstechnik.pl/wp-content/uploads/2022/09/20220701_093226-1536x1152.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/09/20220701_093226-2048x1536.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/09/20220701_093226-2560x1920.jpg` | 200 | `image/jpeg` | `media-size` |
| `https://bmstechnik.pl/wp-content/uploads/2022/09/20220701_093226-270x270.jpg` | 200 | `image/jpeg` | `asset`, `media-size` |
| `https://bmstechnik.pl/wp-content/uploads/2022/09/20220701_093226-300x225.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/09/20220701_093226-768x576.jpg` | 200 | `image/jpeg` | `media-size`, `asset`, `embed-thumbnail` |
| `https://bmstechnik.pl/wp-content/uploads/2022/09/20220701_093226-900x460.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/09/20220701_093226-scaled.jpg` | 200 | `image/jpeg` | `media-original`, `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/09/20220701_093226.jpg` | 200 | `image/jpeg` | `media-original` |
| `https://bmstechnik.pl/wp-content/uploads/2022/09/20220701_093236-1024x768.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/09/20220701_093236-1080x810.jpg` | 200 | `image/jpeg` | `asset`, `media-size` |
| `https://bmstechnik.pl/wp-content/uploads/2022/09/20220701_093236-150x150.jpg` | 200 | `image/jpeg` | `media-size` |
| `https://bmstechnik.pl/wp-content/uploads/2022/09/20220701_093236-1536x1152.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/09/20220701_093236-2048x1536.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/09/20220701_093236-2560x1920.jpg` | 200 | `image/jpeg` | `media-size` |
| `https://bmstechnik.pl/wp-content/uploads/2022/09/20220701_093236-270x270.jpg` | 200 | `image/jpeg` | `asset`, `media-size` |
| `https://bmstechnik.pl/wp-content/uploads/2022/09/20220701_093236-300x225.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/09/20220701_093236-768x576.jpg` | 200 | `image/jpeg` | `media-size`, `asset`, `embed-thumbnail` |
| `https://bmstechnik.pl/wp-content/uploads/2022/09/20220701_093236-900x460.jpg` | 200 | `image/jpeg` | `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/09/20220701_093236-scaled.jpg` | 200 | `image/jpeg` | `media-original`, `media-size`, `asset` |
| `https://bmstechnik.pl/wp-content/uploads/2022/09/20220701_093236.jpg` | 200 | `image/jpeg` | `media-original` |

### Pozostałe zasoby własne (65)

| URL | GET | Cel lub wynik | Role odkrycia |
| --- | --- | --- | --- |
| `http://bmstechnik.pl/wp-content/plugins/wpforms-lite/assets/css/frontend/classic/wpforms-full.min.css?ver=1.9.0.4` | 200 | `text/css` | `asset` |
| `http://bmstechnik.pl/wp-content/plugins/wpforms-lite/assets/images/submit-spin.svg` | 200 | `image/svg+xml` | `asset` |
| `http://bmstechnik.pl/wp-content/plugins/wpforms-lite/assets/js/frontend/fields/text-limit.es5.min.js?ver=1.9.0.4` | 200 | `application/javascript` | `asset` |
| `http://bmstechnik.pl/wp-content/plugins/wpforms-lite/assets/js/frontend/wpforms.min.js?ver=1.9.0.4` | 200 | `application/javascript` | `asset` |
| `http://bmstechnik.pl/wp-content/plugins/wpforms-lite/assets/js/share/utils.min.js?ver=1.9.0.4` | 200 | `application/javascript` | `asset` |
| `http://bmstechnik.pl/wp-content/plugins/wpforms-lite/assets/lib/jquery.validate.min.js?ver=1.20.1` | 200 | `application/javascript` | `asset` |
| `http://bmstechnik.pl/wp-content/plugins/wpforms-lite/assets/lib/mailcheck.min.js?ver=1.1.2` | 200 | `application/javascript` | `asset` |
| `http://bmstechnik.pl/wp-content/plugins/wpforms-lite/assets/lib/punycode.min.js?ver=1.0.0` | 200 | `application/javascript` | `asset` |
| `http://bmstechnik.pl/wp-content/plugins/wpforms-lite/assets/pro/images/times-solid-white.svg` | 404 | `text/html` | `css` |
| `http://bmstechnik.pl/wp-content/themes/bms-technik/404.css?ver=1.0.2` | 200 | `text/css` | `asset` |
| `http://bmstechnik.pl/wp-content/themes/bms-technik/components/accordion/index.css?ver=1.0.2` | 200 | `text/css` | `asset` |
| `http://bmstechnik.pl/wp-content/themes/bms-technik/components/accordion/index.js?ver=1.0.2` | 200 | `application/javascript` | `asset` |
| `http://bmstechnik.pl/wp-content/themes/bms-technik/components/banner/index.css?ver=1.0.2` | 200 | `text/css` | `asset` |
| `http://bmstechnik.pl/wp-content/themes/bms-technik/components/cta/index.css?ver=1.0.2` | 200 | `text/css` | `asset` |
| `http://bmstechnik.pl/wp-content/themes/bms-technik/components/dependencies/magnific-popup/index.css?ver=1.0.2` | 200 | `text/css` | `asset` |
| `http://bmstechnik.pl/wp-content/themes/bms-technik/components/dependencies/magnific-popup/index.js?ver=1.0.2` | 200 | `application/javascript` | `asset` |
| `http://bmstechnik.pl/wp-content/themes/bms-technik/components/dependencies/owl-carousel/index.css?ver=1.0.2` | 200 | `text/css` | `asset` |
| `http://bmstechnik.pl/wp-content/themes/bms-technik/components/dependencies/owl-carousel/index.js?ver=1.0.2` | 200 | `application/javascript` | `asset` |
| `http://bmstechnik.pl/wp-content/themes/bms-technik/components/dependencies/owl-carousel/owl.video.play.png` | 404 | `text/html` | `css` |
| `http://bmstechnik.pl/wp-content/themes/bms-technik/components/infographics/index.css?ver=1.0.2` | 200 | `text/css` | `asset` |
| `http://bmstechnik.pl/wp-content/themes/bms-technik/components/slider/index.css?ver=1.0.2` | 200 | `text/css` | `asset` |
| `http://bmstechnik.pl/wp-content/themes/bms-technik/components/slider/index.js?ver=1.0.2` | 200 | `application/javascript` | `asset` |
| `http://bmstechnik.pl/wp-content/themes/bms-technik/css/style.css?ver=1.0.2` | 200 | `text/css` | `asset` |
| `http://bmstechnik.pl/wp-content/themes/bms-technik/dist/js/bundle.min.js?ver=1.0.2` | 200 | `application/javascript` | `asset` |
| `http://bmstechnik.pl/wp-content/themes/bms-technik/dist/js/scripts.min.js?ver=1.0.2` | 200 | `application/javascript` | `asset` |
| `http://bmstechnik.pl/wp-content/themes/bms-technik/js/navigation.js?ver=1.0.2` | 200 | `application/javascript` | `asset` |
| `http://bmstechnik.pl/wp-includes/js/jquery/jquery-migrate.min.js?ver=3.4.1` | 200 | `application/javascript` | `asset` |
| `http://bmstechnik.pl/wp-includes/js/jquery/jquery.min.js?ver=3.7.1` | 200 | `application/javascript` | `asset` |
| `http://bmstechnik.pl/wp-includes/js/wp-emoji-release.min.js?ver=7.1.4` | 200 | `application/javascript` | `js-asset` |
| `https://bmstechnik.pl/favicon.ico` | 404 | `text/html` | `asset` |
| `https://bmstechnik.pl/wp-content/plugins/wpforms-lite/assets/css/frontend/classic/wpforms-full.min.css?ver=1.9.0.4` | 200 | `text/css` | `asset` |
| `https://bmstechnik.pl/wp-content/plugins/wpforms-lite/assets/images/submit-spin.svg` | 200 | `image/svg+xml` | `asset` |
| `https://bmstechnik.pl/wp-content/plugins/wpforms-lite/assets/js/frontend/fields/text-limit.es5.min.js?ver=1.9.0.4` | 200 | `application/javascript` | `asset` |
| `https://bmstechnik.pl/wp-content/plugins/wpforms-lite/assets/js/frontend/wpforms.min.js?ver=1.9.0.4` | 200 | `application/javascript` | `asset` |
| `https://bmstechnik.pl/wp-content/plugins/wpforms-lite/assets/js/share/utils.min.js?ver=1.9.0.4` | 200 | `application/javascript` | `asset` |
| `https://bmstechnik.pl/wp-content/plugins/wpforms-lite/assets/lib/jquery.validate.min.js?ver=1.20.1` | 200 | `application/javascript` | `asset` |
| `https://bmstechnik.pl/wp-content/plugins/wpforms-lite/assets/lib/mailcheck.min.js?ver=1.1.2` | 200 | `application/javascript` | `asset` |
| `https://bmstechnik.pl/wp-content/plugins/wpforms-lite/assets/lib/punycode.min.js?ver=1.0.0` | 200 | `application/javascript` | `asset` |
| `https://bmstechnik.pl/wp-content/plugins/wpforms-lite/assets/pro/images/times-solid-white.svg` | 404 | `text/html` | `css` |
| `https://bmstechnik.pl/wp-content/themes/bms-technik/404.css?ver=1.0.2` | 200 | `text/css` | `asset` |
| `https://bmstechnik.pl/wp-content/themes/bms-technik/components/accordion/index.css?ver=1.0.2` | 200 | `text/css` | `asset` |
| `https://bmstechnik.pl/wp-content/themes/bms-technik/components/accordion/index.js?ver=1.0.2` | 200 | `application/javascript` | `asset` |
| `https://bmstechnik.pl/wp-content/themes/bms-technik/components/banner/index.css?ver=1.0.2` | 200 | `text/css` | `asset` |
| `https://bmstechnik.pl/wp-content/themes/bms-technik/components/cta/index.css?ver=1.0.2` | 200 | `text/css` | `asset` |
| `https://bmstechnik.pl/wp-content/themes/bms-technik/components/dependencies/magnific-popup/index.css?ver=1.0.2` | 200 | `text/css` | `asset` |
| `https://bmstechnik.pl/wp-content/themes/bms-technik/components/dependencies/magnific-popup/index.js?ver=1.0.2` | 200 | `application/javascript` | `asset` |
| `https://bmstechnik.pl/wp-content/themes/bms-technik/components/dependencies/owl-carousel/index.css?ver=1.0.2` | 200 | `text/css` | `asset` |
| `https://bmstechnik.pl/wp-content/themes/bms-technik/components/dependencies/owl-carousel/index.js?ver=1.0.2` | 200 | `application/javascript` | `asset` |
| `https://bmstechnik.pl/wp-content/themes/bms-technik/components/dependencies/owl-carousel/owl.video.play.png` | 404 | `text/html` | `css` |
| `https://bmstechnik.pl/wp-content/themes/bms-technik/components/infographics/index.css?ver=1.0.2` | 200 | `text/css` | `asset` |
| `https://bmstechnik.pl/wp-content/themes/bms-technik/components/slider/index.css?ver=1.0.2` | 200 | `text/css` | `asset` |
| `https://bmstechnik.pl/wp-content/themes/bms-technik/components/slider/index.js?ver=1.0.2` | 200 | `application/javascript` | `asset` |
| `https://bmstechnik.pl/wp-content/themes/bms-technik/css/style.css?ver=1.0.2` | 200 | `text/css` | `asset` |
| `https://bmstechnik.pl/wp-content/themes/bms-technik/dist/js/bundle.min.js?ver=1.0.2` | 200 | `application/javascript` | `asset` |
| `https://bmstechnik.pl/wp-content/themes/bms-technik/dist/js/scripts.min.js?ver=1.0.2` | 200 | `application/javascript` | `asset` |
| `https://bmstechnik.pl/wp-content/themes/bms-technik/js/navigation.js?ver=1.0.2` | 200 | `application/javascript` | `asset` |
| `https://bmstechnik.pl/wp-includes/blocks/heading/style.min.css?ver=7.1.4` | 200 | `text/css` | `asset` |
| `https://bmstechnik.pl/wp-includes/blocks/paragraph/style.min.css?ver=7.1.4` | 200 | `text/css` | `asset` |
| `https://bmstechnik.pl/wp-includes/js/comment-reply.min.js?ver=7.1.4` | 200 | `application/javascript` | `asset` |
| `https://bmstechnik.pl/wp-includes/js/jquery/jquery-migrate.min.js?ver=3.4.1` | 200 | `application/javascript` | `asset` |
| `https://bmstechnik.pl/wp-includes/js/jquery/jquery.min.js?ver=3.7.1` | 200 | `application/javascript` | `asset` |
| `https://bmstechnik.pl/wp-includes/js/wp-embed.min.js` | 200 | `application/javascript` | `js-asset` |
| `https://bmstechnik.pl/wp-includes/js/wp-emoji-release.min.js?ver=7.1.4` | 200 | `application/javascript` | `js-asset` |
| `https://bmstechnik.pl/wp-sitemap-index.xsl` | 200 | `application/xml` | `asset` |
| `https://bmstechnik.pl/wp-sitemap.xsl` | 200 | `application/xml` | `asset` |

### Zasoby zewnętrzne i referencje bez żądania (12)

| URL | GET | Cel lub wynik | Role odkrycia |
| --- | --- | --- | --- |
| `https://bmstechnik.pl/wp-admin/admin-ajax.php` | — | `reference-only` | `runtime-endpoint` |
| `https://bmstechnik.pl/xmlrpc.php` | — | `reference-only` | `pingback` |
| `https://bmstechnik.pl/xmlrpc.php?rsd` | — | `reference-only` | `external-link` |
| `https://fonts.googleapis.com/css2?family=Monda:wght@400;700&family=Share+Tech&display=swap` | 200 | `text/css` | `css` |
| `https://fonts.gstatic.com/` | — | `external-navigation-or-redirect` | `link` |
| `https://fonts.gstatic.com/s/monda/v19/TK3tWkYFABsmjsphPho.woff2` | 200 | `font/woff2` | `css` |
| `https://fonts.gstatic.com/s/monda/v19/TK3tWkYFABsmjspuPho7vA.woff2` | 200 | `font/woff2` | `css` |
| `https://fonts.gstatic.com/s/monda/v19/TK3tWkYFABsmjspvPho7vA.woff2` | 200 | `font/woff2` | `css` |
| `https://fonts.gstatic.com/s/sharetech/v23/7cHtv4Uyi5K0OeZ7bohU8H0JmA.woff2` | 200 | `font/woff2` | `css` |
| `https://gmpg.org/xfn/11` | — | `reference-only` | `external-link` |
| `https://www.google.com/recaptcha/api.js?render=6Lcl3BMfAAAAAL46ur2WBRd9Mbh5wUQzchYBTzty` | 200 | `text/javascript` | `asset` |
| `https://www.gstatic.com/recaptcha/releases/bSuJ2xBC8cFy7pM4Z3Hu9boH/recaptcha__en.js` | 200 | `text/javascript` | `js-asset` |
