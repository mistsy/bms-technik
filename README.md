# BMS Technik

Strona statyczna w Astro. Cloudflare Worker odpowiada za routing, odpowiedzi błędów i formularz kontaktowy. HTML, arkusze, skrypty i media są serwowane z Workers Static Assets. Źródłem migracji jest [audyt](audit/bms-baseline/AUDIT.md) z 6 listopada 2026 r.

## Uruchomienie lokalne

Wymagany Node.js ≥ 22.23.4. W PowerShell można użyć `npm.cmd`.

Przed ponownym `npm ci` zatrzymaj działające `npm run dev` i `npm run preview` klawiszami Ctrl+C w ich terminalach. Windows może blokować podmianę uruchomionego `esbuild.exe`, co powoduje błąd `EPERM`.

```sh
npm ci
npm run dev
```

`npm run dev` służy do edycji widoków Astro. Do testowania przekierowań, statusów i formularza uruchom build z lokalnym Workerem.

```sh
npm test
npm run preview -- --port 8787
```

Podgląd działa pod `http://127.0.0.1:8787/`. W drugim terminalu uruchom `npm run test:http`. Ten zestaw wykonuje też testy POST z danymi testowymi, więc używaj go na instancji z wyłączoną wysyłką. Domyślnie używa lokalnego adresu. Zmienna `BMS_TEST_ORIGIN` pozwala wskazać odizolowany podgląd.

`npm run deploy:dry-run` buduje i pakuje projekt. Bazowy [wrangler.jsonc](wrangler.jsonc) ma osobną nazwę `bms-technik-preview` i jest przeznaczony dla podglądu na `workers.dev`. Do zdalnego podglądu potrzebne jest wskazanie właściwego konta i potwierdzenie, że ta nazwa Workera jest wolna na tym koncie.

### Źródła i zrzuty

- `scripts/prepare-audit.mjs` generuje katalog `generated/` na podstawie `manifest.json`, `pages.json`, `assets.json`, `discovery.json` i lokalnego snapshotu. Weryfikuje SHA-256 przed skopiowaniem plików. Artefakty builda powstają w `dist/`.
- Przy pierwszym renderowaniu strona korzysta z lokalnych fontów Monda i Share Tech oraz oryginalnego logo, ikon i wzoru technicznego. Licencje OFL są w [licenses](licenses/).
- [Zrzuty referencyjne i podgląd](audit/screenshots/) obejmują wszystkie pięć adresów starej strony na desktopie i mobile. Zrzuty `after-*` pokazują nową stronę główną, kontakt i powiększenie zdjęcia.
- [Korekta charakteru wizualnego](audit/visual-refinement/README.md) zawiera analizę pierwowzoru, porównania przed/po, zrzuty aktualnego builda oraz wyniki testów interakcji.

### Testy przeglądarkowe

```sh
npx playwright install chromium
npm run test:browser
```

Playwright buduje stronę i uruchamia lokalny Worker na porcie 8787, jeśli podgląd jeszcze nie działa. Testuje wybór obu usług na pierwszym ekranie, małe ekrany i landscape, akordeony, ARIA, klawiaturę, galerie, ograniczenie animacji oraz działanie bez JavaScriptu. Dostępny Chrome można wskazać przez `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` zamiast instalować przeglądarkę Playwright. Zależność Playwright jest używana wyłącznie do kontroli projektu.

## Polityka adresów

| Adres lub grupa | Zachowanie |
| --- | --- |
| `/`, `/rekuperacja/`, `/klimatyzacja/`, `/kontakt/`, `/polityka-prywatnosci/` | 200, dotychczasowy title i canonical w HTTPS bez `www`. Strony z końcowym ukośnikiem. |
| Warianty HTTP i `www`, brak ukośnika na stronach biznesowych, `index.html` tych stron | 301 dla GET/HEAD, w jednym kroku do docelowego adresu. Inne metody otrzymują 308 przy kanonikalizacji. Parametry pozostają w adresie. |
| `/wp-content/uploads/` | 247 dokładnych ścieżek z 248 wpisów URL. Bajty i nazwy plików zgodne ze snapshotem. Pliki stockowe pozostają pod historycznymi adresami mediów. Galerie pokazują zdjęcia z dotychczasowych sekcji realizacji. |
| 31 stron załączników | 301 bezpośrednio do konkretnego pliku `source_url` z publicznej biblioteki. Wybór usuwa strony pośrednie z WordPressa i zachowuje dostęp do odpowiadającego obrazu. |
| Rozpoznane `?page_id=`, `?p=`, `?attachment_id=` na `/` i `/index.php` | 301 do strony biznesowej lub właściwego pliku z pominięciem strony pośredniej. `?p=1` otrzymuje 410 po wycofaniu wpisu. Usuwany jest rozpoznany parametr sterujący. |
| `/przykladowa-strona/`, `/embed/` | Zachowane dwa udokumentowane przekierowania 301 do `/`. |
| `/sitemap.xml`, `/wp-sitemap.xml`, `/wp-sitemap-posts-page-1.xml` | Pierwszy adres serwuje nową mapę z pięcioma stronami. Dwa stare adresy zwracają 301 do nowej mapy. |
| Wpis startowy, archiwa, trzy pozostałe mapy WP, 36 osadzeń, odkryte feedy i wyszukiwanie `?s=` | 410. Dotyczy też udokumentowanych aliasów archiwów `?author=1`, `?cat=1` i `?m=202203`. |
| REST/oEmbed, `?rest_route=`, `/wp-admin/`, logowanie, cron, komentarze i XML-RPC WordPressa | 410. |
| Nieznane ścieżki, nieznane identyfikatory, wieloznaczne aliasy, `/sitemap_index.xml` | 404. |

Żądania na host podglądu zachowują jego origin podczas przekierowań. Na podglądzie Worker zwraca `X-Robots-Tag: noindex, nofollow` i `robots.txt` blokujący crawl. Na hoście biznesowym `robots.txt` wskazuje nową mapę.

## Formularz

Formularz zachowuje wymagane pola, cztery kategorie, zgodę z linkiem do polityki oraz limit 4000 znaków. POST obsługuje Worker pod `/kontakt/`. Worker sprawdza origin i treść zgłoszenia, odrzuca pułapkę antyspamową oraz weryfikuje jednorazowy token Turnstile wraz z akcją i hostem. Do przyjęcia wiadomości do wysłania używa Resend. Odpowiedź dostawcy i dostarczenie do skrzynki to osobne warunki odbioru. Publiczne adresy i telefon są dostępne bezpośrednio na stronie kontaktowej i w stopce.

Bez pełnej konfiguracji widoczne są komunikat i nieaktywne pola. Przykład ustawień lokalnych jest w [.dev.vars.example](.dev.vars.example). Aby uruchomić wysyłkę na odizolowanym podglądzie, potrzebne są:

- Potwierdzony adres odbiorcy w `CONTACT_TO`, zatwierdzony adres nadawcy w `CONTACT_FROM` oraz dostęp do dostawcy i klucz `RESEND_API_KEY`. Obecna implementacja używa jednego odbiorcy. Jeśli kategorie mają mieć osobnych adresatów, trzeba uzgodnić mapę i uzupełnić routing. [Dokumentacja Resend](https://resend.com/docs/api-reference/emails/send-email)
- Klucz publiczny `TURNSTILE_SITE_KEY` i sekret `TURNSTILE_SECRET_KEY` widgetu skonfigurowanego dla dokładnego hosta, na którym działa formularz. [Dokumentacja Turnstile](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)
- Sekrety w ustawieniach odizolowanego Workera i jawne włączenie `CONTACT_ENABLED=1` po uzupełnieniu konfiguracji. [Dokumentacja sekretów Workers](https://developers.cloudflare.com/workers/configuration/secrets/)

Przed aktywacją należy potwierdzić retencję i dostęp do wiadomości, treść polityki prywatności dla faktycznego przetwarzania przez Turnstile i dostawcę poczty, a następnie wykonać próbę z docelową skrzynką. Testy automatyczne symulują odpowiedzi zewnętrznych usług. Podgląd testowany na potrzeby projektu ma wysyłkę wyłączoną.

## Odbiór przed przełączeniem

- Zweryfikuj decyzje 301/404/410 na podstawie logów, danych o indeksacji, linków przychodzących i wykorzystania osadzeń. Audyt obejmuje odkryte publiczne adresy.
- Potwierdź prawa do istniejących mediów, również do plików stockowych utrzymywanych dla zgodności adresów.
- Zweryfikuj odpowiedzi na podglądzie Cloudflare i na planowanych trasach dla HTTPS i `www`. Rzeczywista kolejność zależy od konfiguracji strefy. [Routing statycznych zasobów Workers](https://developers.cloudflare.com/workers/static-assets/binding/)
- Uzgodnij plan przełączenia i wycofania zmiany. Zachowaj i zweryfikuj strefę oraz rekordy pocztowe, w tym MX, host poczty, SPF, DKIM i DMARC. Punkt odniesienia zawiera [snapshot DNS](audit/bms-baseline/dns.json).
