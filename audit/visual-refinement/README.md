# Korekta wizualna BMS Technik

Porównanie z 7 listopada 2026 r. Punkty odniesienia: działająca [strona oryginalna](https://bmstechnik.pl/), [audyt i snapshot](../bms-baseline/AUDIT.md), [wcześniejsze zrzuty](../screenshots/) oraz implementacja Astro z `main` (`8fdbe08`).

## Porównanie

| Obszar | Pierwowzór | Astro przed korektą | Po korekcie |
| --- | --- | --- | --- |
| Pierwszy ekran | Dwa równe, białe pola wyboru usług na tle rysunku technicznego | Duży, pogrubiony nagłówek i jedno zdjęcie; wybór usług poniżej realizacji | Dwa dominujące, równorzędne pola prowadzące bezpośrednio do usług. Na mobile oba widoczne bez przewijania |
| Kolor i jasność | Biel, delikatne szarości, czerwień logo | Ciemniejsza, ceglana czerwień; pełne bordowe CTA, mocne kontrasty | Jaśniejsze, neutralne powierzchnie, delikatniejszy rysunek w tle, czerwień bliższa logo. CTA na jasnym tle |
| Typografia | Monda i Share Tech; regularne napisy usług, duże litery w menu | Ciężkie, ciasne nagłówki do 84 px | Te same lokalne fonty, lżejsze nagłówki i menu Share Tech, regularne napisy usług oraz czerwone inicjały jak w oryginale |
| Proporcje i kompozycja | Spokojna, centralna kompozycja, cienkie ramki | Asymetryczny hero, duże numery i dodatkowe karty oferty | Centralny wybór usług, cieńsze wizualnie separatory, usunięte wielkie ozdobne numery; zachowany przyklejony nagłówek z nawigacją |
| Zdjęcia | Dużo zdjęć stockowych, osobne realizacje usług | Autentyczne zdjęcia, jedno dominujące w hero | Cztery autentyczne realizacje tuż po wyborze oferty, wspólne powiększanie i responsywne źródła obrazów na stronie głównej |
| Stopka | Grafitowa siatka i biały dolny pasek | Ciemniejsza siatka obejmująca całą stopkę | Grafit bliższy oryginałowi, białe dolne pole i czytelne dane kontaktowe |
| Interakcje | Podświetlenie i lekkie uniesienie pól, rozwijanie treści; loader | Brak animacji akordeonu i większości mikrointerakcji | Krótkie animacje lokalne, bez loadera i opóźniania nawigacji |

Cel porównania wizualnego jest spełniony: pierwszy ekran odzyskał charakterystyczny układ oryginału, jego jasność, regularne etykiety z czerwonym inicjałem i dyskretne ramki. Rozbudowane podstrony usług, oryginalne logo, zdjęcia realizacji, SEO i adresy pozostały zachowane. Nie zmieniono Workera, formularza, przekierowań ani konfiguracji hostingu.

## Zrzuty

Wszystkie nowe porównania powstały w Chrome: desktop **1440×1000**, mobile **390×844**, skala 1. `original-home-*` pokazują produkcyjny pierwowzór; `before-*` to osobny statyczny build wskazanego wyżej commita; `after-*` to build zmian serwowany przez lokalny Worker, bez paska narzędzi Astro. Pliki `*-viewport.jpg` pokazują pierwszy ekran, pozostałe — pełną stronę. Oryginalną klimatyzację porównano ze zrzutami audytowymi **1425×910** i **375×812**; produkcyjna podstrona podczas nowej próby zwróciła HTTP 429, więc jej obrazy referencyjne pochodzą z audytu.

| Widok | Oryginał | Przed korektą | Po korekcie |
| --- | --- | --- | --- |
| Pierwszy ekran desktop | [Oryginał](original-home-desktop-viewport.jpg) | [Przed](before-home-desktop-viewport.jpg) | [Po](after-home-desktop-viewport.jpg) |
| Pierwszy ekran mobile | [Oryginał](original-home-mobile-viewport.jpg) | [Przed](before-home-mobile-viewport.jpg) | [Po](after-home-mobile-viewport.jpg) |
| Pełna strona główna desktop | [Oryginał](original-home-desktop.jpg) | [Przed](before-home-desktop.jpg) | [Po](after-home-desktop.jpg) |
| Pełna strona główna mobile | [Oryginał](original-home-mobile.jpg) | [Przed](before-home-mobile.jpg) | [Po](after-home-mobile.jpg) |
| Klimatyzacja desktop | [Oryginał z audytu](../screenshots/before-klimatyzacja-desktop.jpg) | [Przed](before-klimatyzacja-desktop.jpg) | [Po](after-klimatyzacja-desktop.jpg) |
| Klimatyzacja mobile | [Oryginał z audytu](../screenshots/before-klimatyzacja-mobile.jpg) | [Przed](before-klimatyzacja-mobile.jpg) | [Po](after-klimatyzacja-mobile.jpg) |

Dodatkowe zrzuty po zmianach: [rekuperacja desktop](after-rekuperacja-desktop.jpg), [rekuperacja mobile](after-rekuperacja-mobile.jpg), [kontakt desktop](after-kontakt-desktop.jpg), [kontakt mobile](after-kontakt-mobile.jpg), [polityka desktop](after-prywatnosc-desktop.jpg), [polityka mobile](after-prywatnosc-mobile.jpg), [akordeon po zmianie sekcji](after-accordion-mobile.jpg), [powiększenie zdjęcia](after-lightbox-mobile.jpg).

## Ruch i dostępność

- Wspólny czas **240 ms** i easing `cubic-bezier(0.22, 0.61, 0.36, 1)`.
- Akordeon animuje wysokość, przezroczystość i lekkie przesunięcie treści oraz obrót ikony. Pozwala odwrócić trwającą animację i płynnie zamknąć poprzednią sekcję.
- Zachowano natywne `details`/`summary` i wyłączność grupy bez JavaScriptu. Ulepszona wersja synchronizuje `aria-expanded`, `aria-controls` i `aria-labelledby`; zamykana treść jest `inert`, więc jej linki wypadają z kolejności Tab.
- Hover i focus: czerwona ramka, uniesienie wyboru usługi o 3 px, przesunięcie strzałki i delikatne powiększenie fotografii. Focus ma wyraźny obrys.
- `prefers-reduced-motion` wyłącza animacje i ozdobne przesunięcia; zmiana ustawienia podczas animacji kończy ją od razu.
- Galerie zachowują natywny dialog, strzałki klawiatury, Escape i powrót fokusu. Nie dodano biblioteki do kodu strony.

## Wyniki kontroli

| Kontrola | Wynik |
| --- | --- |
| `npm test` (obejmuje build) | **19/19**, w tym HTML/SEO, kolejność galerii, 247 ścieżek mediów i ich SHA-256, routing i formularz |
| `npm run test:http`, lokalny Worker z wyłączoną wysyłką | **4/4**, rzeczywiste odpowiedzi HTTP, media, przekierowania i formularz |
| `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/google-chrome npm run test:browser` | **16/16**, dwa profile: desktop i mobile |
| Dwa wybory na pierwszym ekranie | Sprawdzone przy 1440×900, 1024×768, 768×1024, 390×844, 375×667, **320×568** i **667×375**; równe rozmiary pól |
| Obsługa interakcji | Weryfikacja pośrednich wysokości w obu kierunkach animacji, szybkich przełączeń, wyłączności, ARIA/inert, klawiatury, focus, reduced motion, galerii i wariantu bez JS |
| Responsywność i zasoby | Pięć stron w obu profilach: bez przewijania poziomego, uszkodzonych widocznych obrazów i błędów skryptów |
| Dodatkowy skan axe-core (WCAG 2 A/AA, 2.1 AA) | **0 wykrytych naruszeń** na pięciu stronach w obu profilach. Skan automatyczny nie stanowi pełnego audytu zgodności |
| `npm run deploy:dry-run` | Poprawne pakowanie Workera i 273 zasobów; bez wdrożenia |
| `git diff --check` | Poprawny |

Przeglądarkowa weryfikacja została wykonana w Chrome. Formularz pozostaje w dotychczasowym trybie niedostępności bez konfiguracji integracji; jego obsługa i konfiguracja nie były zmieniane. Zdalny Cloudflare Preview, jeśli zostanie utworzony przez istniejącą integrację repozytorium, jest wskazany w PR; do tej korekty nie włączano podglądów ani wdrożeń ręcznie.

## Odtworzenie zrzutów

Przy uruchomionym podglądzie pod `http://127.0.0.1:8787`:

```sh
node scripts/capture-visual-refinement.mjs
```

Opcjonalne zmienne: `BMS_AFTER_ORIGIN` wskazuje inny lokalny podgląd, `BMS_BEFORE_ORIGIN` osobno uruchomiony build referencyjny, `BMS_CAPTURE_ORIGINAL=1` dodaje odczyt publicznej strony głównej pierwowzoru. `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` pozwala użyć zainstalowanego Chrome. Skrypt zastępuje odpowiadające mu zrzuty w tym katalogu i odrzuca odpowiedzi HTTP z błędem.
