# Stabilność pierwszego renderu i nawigacji — PR #1

7 listopada 2026. Gałąź `refine/restore-original-visual-identity`.

Domknięcie prac 8 listopada: [końcowa weryfikacja](completion.md). Poniższe
pomiary, `validation.json` i `preview-tests.txt` pochodzą z poprzedniej sesji;
pełny wynik 103 testów dotyczy commita `b391b42`, przed korektą miar tekstu
w `03255d4`. Katalogi CDP zachowują tylko ukończone nagrania desktopowe;
nie są dowodem wykonania całej macierzy CDP.

## Przyczyna

W poprzednim Preview każdy dokument odkrywał trzy fonty dopiero po pobraniu i zastosowaniu wspólnego CSS. `font-display: swap` pozwalał na kolejne przeliczenia tekstu: systemowy fallback → Monda → Share Tech. Szczególnie szeroki był początkowy fallback `monospace` nagłówków. Menu miało szerokość wynikającą z tekstu, więc zmieniał się również punkt położenia hamburgera. Na desktopie zmieniała się szerokość całej nawigacji, a w hero liczba wierszy tytułu i opisu.

To nie był wyłącznie problem widocznego przycisku: pomiar obejmuje nagłówek, logo, nawigację, telefon, tekst i ikonę Menu, main, hero, h1, lead, fotografię i kolejne sekcje. Zdarzenia `layout-shift` wskazywały tekst i nawigację. Fotografie miały już zarezerwowane proporcje i wymiary; nie wykazały samodzielnej zmiany rozmiaru. Ich przesunięcie w dół/górę wynikało ze zmiany tekstu nad zdjęciem. CSS był pojedynczym arkuszem blokującym renderowanie; pomiar FCP i odpowiedzi arkusza oraz test z opóźnionym CSS kontrolują również FOUC. Nie dodano asynchronicznego wstrzykiwania stylów.

Fonty i CSS miały `Cache-Control: public, max-age=0, must-revalidate`, mimo `CF-Cache-Status: HIT`. HIT na brzegu nie oznacza użycia bez walidacji w przeglądarce. Kolejne dokumenty mogły ponownie czekać na sieć. Chromium nadawał fontom wysoki priorytet, ale dopiero po CSS; problemem była też chwila ich odkrycia, a nie tylko sama wartość priorytetu.

## Typografia i rozwiązanie

| Zasób WOFF2 | Przed | Po | Wykorzystanie |
| --- | ---: | ---: | --- |
| Monda Latin | 22 288 B | 22 288 B | Tekst 400 i 700; rzeczywista zmienna oś wght 400–700 |
| Monda Latin Extended / Polish | 35 896 B | 3 052 B | 16 polskich znaków spoza Latin, bez usunięcia osi wght |
| Share Tech | 15 048 B | 15 048 B | Nagłówki, nawigacja, Menu; statyczne 400 |
| Razem | 73 232 B | 40 388 B | O 44,8% mniej danych fontów |

Share Tech zawiera `ó/Ó`, ale nie pozostałe polskie litery. Również nagłówki w tym foncie wymagają Mondy. Wszystkie trzy zasoby są więc potrzebne na polskich stronach, także nad linią zgięcia. Pokrycie znaków wszystkich pięciu dokumentów oraz zgodność konturów i szerokości polskich glifów przy 400 i 700 sprawdzono w [fonts.json](fonts.json). Oryginalne fonty i licencje pozostają w snapshotach oraz generowanych zasobach `/fonts/`. Subset powstaje z oryginalnego WOFF2, bez zmiany rysunku liter. Narzędzie odtworzenia: `python3 scripts/subset-polish-font.py` po `npm run prepare:audit`, z FontTools i Brotli. Zwykły build nie wymaga Pythona.

- W head są trzy wczesne `rel=preload`, `as=font`, `type=font/woff2`, `crossorigin=anonymous`. Vite nadaje plikom hash, a CSS i preload odnoszą się do dokładnie tego samego URL. Wyłączono inlining małego subsetu, żeby nie tworzyć dwóch różnych zasobów. Nie preloaduje się pełnego Extended ani dodatkowych wag.
- `font-display: optional` ustala politykę bez późnej podmiany po pokazaniu fallbacku. Przy szczególnie wolnym pierwszym pobraniu przeglądarka może zachować fallback w tym dokumencie; fonty są pobierane przez preload i używane w kolejnych dokumentach. Test sprawdza zarówno ten przypadek, jak i dostępność Monda/Share Tech po rozgrzaniu cache. Chromium dodatkowo zapisuje rzeczywiście renderowane fonty przez `CSS.getPlatformFontsForNode`. Nie ma JS czekającego na fonty ani ukrywania strony.
- Fallbacki Arial / Liberation Sans mają `size-adjust`, `ascent-override`, `descent-override`, `line-gap-override`. Współczynniki szerokości policzono z sum advance widths ważonych tekstem pięciu stron; pionowe metryki pochodzą z oryginalnych fontów. Dla Mondy osobno 400 i 700. Wersaliki nawigacji mają własny współczynnik 73,436869%; mieszany tekst Share Tech 88,4627%. To przybliżenie kształtu i składu tekstu, nie twierdzenie o identyczności każdego glifu. Fallback Share Tech ma zakres znaków oryginału, więc polskie litery nadal pochodzą z Mondy, gdy fonty są dostępne.
- Menu ma 98×44 px przy bazowych 16 px, pole etykiety 40 px i nierozciągliwą ikonę. Wymiary używają rem. Odpowiadają dotychczasowemu ustalonemu przyciskowi, także podczas otwierania/zamykania. Wysokość nagłówka nadal wynika z istniejącego tokenu; logo ma jawne proporcje. Nie utrwalono wysokości tekstowych sekcji.
- Linki desktopowe i telefon mają własne pola odpowiadające ich końcowym wymiarom. To usuwa redystrybucję wolnego miejsca przez flex w pierwszych cyklach WebKit — sam preload/optional nie wystarczył w każdym takim cyklu. Podpisy zdjęć wyrównują elementy do środka: mieszane metryki Monda i Share Tech nie zmieniają już wysokości wiersza przy wyrównywaniu baseline.
- Mobilny tytuł strony głównej ma miarę `13.16em`, równą dotychczasowym `28ch` w Share Tech (advance cyfry 0 = 0,47em). Miarę tę oddzielono od fontu fallbacku: w profilu iPhone SE zmiana `ch` powodowała przejście z trzech wierszy do dwóch i przesunięcie kart o 20 px. Fallback wersalików jest używany także w tym tytule i eyebrow.
- Pozostałe miary tekstowe również są niezależne od `ch`: bazują na nominalnym advance cyfry 0 Mondy, `1250/2048em = 0.6103515625em`. Dotyczy to leadów, prose i banerów. [Pomiar zależnej miary](font-dependent-measure.json) pokazuje, że samo doładowanie Latin po Polish mogło zmienić szerokość opisu i jego h1 o 16,484375 px przy zerowym CLS. Nowy test uwalnia wcześniej pobrane bajty Latin tuż po pierwszej ostylowanej klatce i niezależnie porównuje miary przy wymuszonym fallbacku.
- `scrollbar-gutter: stable` rezerwuje szerokość klasycznego scrollbara. Osobny test usuwa i przywraca overflow dokumentu, porównując położenie nagłówka i treści. Scrollbar nakładkowy nie wymaga dodatkowego miejsca.
- Tylko istniejące fingerprintowane CSS/JS/WOFF2 z `/_astro/` otrzymują `public, max-age=31536000, immutable`, zarówno przy 200, jak i warunkowym 304. Nieistniejący fingerprintowany URL z odpowiedzią 404 nie otrzymuje immutable. Te przypadki sprawdza test HTTP. HTML, kontakt i historyczne zasoby zachowują swoje zasady cache. Kolejne zwykłe nawigacje korzystają z tych samych fontów i CSS bez rundy walidacji.

Nie zmieniono kontrolerów animacji, semantyki details/summary, aktywacji linków, treści, canonicali ani formularza. Nie ma loadera, opóźniania kliknięć, przechwytywania nawigacji ani animacji przejść stron. Prefetch dokumentów nie był potrzebny po usunięciu walidacji wspólnych zasobów.

## Jak wykonano pomiar

`scripts/measure-layout.mjs` uruchamia Chromium desktop 1440×1000, Chromium mobile 390×844 DPR 3, WebKit desktop 1440×1000 i WebKit iPhone 13 390×844 DPR 3. Każdy profil przechodzi przez `/`, `/rekuperacja/`, `/klimatyzacja/`, `/kontakt/`, `/polityka-prywatnosci/` i wraca cztery razy natywną historią — 9 dokumentów na scenariusz, 72 na wersję. Aktywowane są prawdziwe odnośniki HTML. Osobne istniejące testy sprawdzają także kliknięcia/tapnięcia linków w animowanym menu.

Pełny zestaw regresyjny ma pięć projektów: Chromium 1440×1000 i 390×844, WebKit 1440×1000, iPhone 13 z viewportem 390×664 (ekran 390×844) oraz iPhone SE 320×568. Poszczególne istniejące testy dodatkowo zmieniają viewport, m.in. na 375×667, 320×568 i landscape. Nagrania audytu jawnie ustawiają 390×844, niezależnie od domyślnego viewportu profilu urządzenia.

`cold-slow` pobiera dokumenty i zasoby z rzeczywistego Preview przez `route.fetch()`. Każda odpowiedź otrzymuje dodatkowe 120 ms i opóźnienie zależne od rozmiaru przy 100 KiB/s. Routing wyłącza cache HTTP przeglądarki na całej trasie. Jest to powtarzalny model opóźnień odpowiedzi dla obu silników, **nie** emulacja wspólnej przepustowości połączenia. `warm-native` ma świeży kontekst na początku, następnie zwykły cache, bez routingu i bez dodanych opóźnień. Dodatkowy wariant `cold-cdp` używa prawdziwego throttlingu sieci Chromium: 150 ms, wspólne 100 KiB/s pobierania, 50 KiB/s wysyłania i wyłączony cache.

Obserwator jest instalowany przed parsowaniem. Próbkuje requestAnimationFrame od pierwszej ostylowanej klatki, zapisuje geometrię, stan `document.fonts`, zdarzenia loading/loadingdone/loadingerror, layout-shift ze źródłami, Paint/Resource/Navigation Timing, nagłówki odpowiedzi, kolejność i priorytety CSS/fontów (CDP w Chromium). Rozmiar elementu wciąż dopisywanego przez parser nie jest mylony z przemieszczeniem ukończonego elementu. WebKit nie udostępnia `layout-shift`; jego CLS ma wartość `null`, a regresję wykrywa geometria.

Filmstrip obejmuje cztery zrzuty rekuperacji podczas ładowania i pełne nagranie trasy dla każdego profilu/scenariusza. Czas każdej klatki jest w JSON. Wyłączono domyślne czekanie Playwright screenshot na `fonts.ready`, które inaczej ukrywałoby problem. Końcowy pomiar czeka na rzeczywiste transfery fontów lub już załadowane twarze: w WebKit początkowe `fonts.ready` może rozwiązać się jeszcze przed odkryciem fontów przez CSS.

Nowy `test/layout.spec.ts` niezależnie blokuje odpowiedzi fontów, opóźnia CSS i obrazy, sprawdza geometrię **przed** ich zwolnieniem i ponownie po transferach. Tolerancja geometrii wynosi 0,5 px, limit CLS i sumy wszystkich przesunięć (również z `hadRecentInput`) 0,001. Nowy test uruchomiony na starej wersji Preview nie przeszedł: szerokość Menu zmieniła się o 2,53125 px.

Osobny wariant nierównomiernego ładowania uwalnia Latin od razu po pierwszej ostylowanej klatce. Sprawdza geometrię widocznego obszaru (przecięcie prostokątów z viewportem) i niezależność wszystkich miar lead/prose od fontu fallbacku. Pełne prostokąty są zachowane w załączniku JSON. W tym sztucznie sterowanym oknie WebKit może jeszcze składać tekst poniżej ekranu w swoim natywnym okresie blokowania fontu. Zwykłe testy zimnego startu i historii porównują także pełne wysokości sekcji i dokumentu. Test nierównomiernego ładowania wykrył regresję w poprzednim Preview również po dodaniu preloadów i optional.

## Odtworzenie

```sh
BMS_BROWSER_ORIGIN=https://567ab9c4-bms-technik.michal-steff.workers.dev \
  BMS_AUDIT_LABEL=before node scripts/measure-layout.mjs
BMS_BROWSER_ORIGIN=https://refine-restore-original-visual-identity-bms-technik.michal-steff.workers.dev \
  BMS_AUDIT_LABEL=after node scripts/measure-layout.mjs
BMS_BROWSER_ORIGIN=https://refine-restore-original-visual-identity-bms-technik.michal-steff.workers.dev \
  BMS_AUDIT_LABEL=after-cdp BMS_AUDIT_CDP=1 node scripts/measure-layout.mjs
BMS_BROWSER_ORIGIN=https://refine-restore-original-visual-identity-bms-technik.michal-steff.workers.dev \
  npm run test:browser -- --workers=1
BMS_TEST_ORIGIN=https://refine-restore-original-visual-identity-bms-technik.michal-steff.workers.dev \
  node --test --test-name-pattern='Worker serwuje|Worker zwraca' test/http.test.mjs
```

Nie uruchamiać równocześnie kilku nagrań i pełnego WebKit na maszynie o małej pamięci. Nie przebudowywać dist podczas testów lokalnego Workera. WebKit na Linuxie nie zastępuje fizycznego Safari/iOS; testy nie wysyłają formularza na Preview.

Podstawa wyboru polityki: [preload + optional, Chrome/web.dev](https://web.dev/articles/preload-optional-fonts), [metryki fallbacków](https://developer.chrome.com/blog/font-fallbacks), [CORS preload](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/rel/preload), [scrollbar-gutter](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/scrollbar-gutter).
