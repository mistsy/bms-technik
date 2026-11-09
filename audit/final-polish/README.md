# Końcowy visual polish — 8 listopada 2026

PR [#1](https://github.com/mistsy/bms-technik/pull/1), gałąź `refine/restore-original-visual-identity`. Punkt odniesienia: `06d2af4`, aktualny Cloudflare Preview, działający [oryginał](https://bmstechnik.pl/) oraz wcześniejsze [zrzuty usług](../screenshots/) i [audyt mobile](../mobile-refinement/README.md).

Zmiany aplikacji ograniczają się do CSS i pozycji dwóch fotografii:

- Nagłówek ma miękki cień o przezroczystości 9%. Zachowana ramka rezerwuje dotychczasowy wymiar; sticky i jednopoziomowy układ pozostają bez zmian.
- Akcenty dekoracyjne korzystają z czerwieni logo `#ff2d23`, przyciski z `#df3026`, a tekst i aktywne linki z dostępnego `#ca271e`. Kolor hover linków również zachowuje kontrast. Etykiety stopki uwzględniają jaśniejsze przecięcia siatki.
- Zdjęcia hero otrzymały jeden wspólny, bardzo delikatny cień (5%) oraz przesunięcie kadru: klimatyzacja `50% 38% → 50% 60%`, rekuperacja `50% 44% → 50% 54%`. W pierwszym ujęciu jest mniej sufitu, w drugim centrala jest bliżej środka kadru. Inne autentyczne ujęcia w galerii były ciemniejsze albo mniej czytelne, dlatego pozostawiono obecne pliki, bez filtrów i zmiany ekspozycji.

Zachowano kolory białych powierzchni i wzór techniczny, wymiary sekcji, treści, fonty, rezerwacje geometrii, preloady, animacje i kontrolery. Worker, SEO, formularz i konfiguracja Cloudflare nie były modyfikowane. Nie dodano bibliotek do projektu.

## Porównanie przed/po

Chromium, desktop **1440×1000**, mobile **390×844**, DPR 1. `before-*` pochodzi z publicznego Preview przed zmianami; `after-*` z końcowego lokalnego builda. Zrzuty obejmują pierwszy ekran, w tym header i całe hero usług.

| Widok | Przed | Po |
| --- | --- | --- |
| Klimatyzacja desktop | [Przed](before-klimatyzacja-desktop.jpg) | [Po](after-klimatyzacja-desktop.jpg) |
| Klimatyzacja mobile | [Przed](before-klimatyzacja-mobile.jpg) | [Po](after-klimatyzacja-mobile.jpg) |
| Rekuperacja desktop | [Przed](before-rekuperacja-desktop.jpg) | [Po](after-rekuperacja-desktop.jpg) |
| Rekuperacja mobile | [Przed](before-rekuperacja-mobile.jpg) | [Po](after-rekuperacja-mobile.jpg) |
| Strona główna desktop | [Przed](before-home-desktop.jpg) | [Po](after-home-desktop.jpg) |
| Strona główna mobile | [Przed](before-home-mobile.jpg) | [Po](after-home-mobile.jpg) |

[Świeży zrzut oryginalnej klimatyzacji](original-klimatyzacja-desktop.jpg) pokazuje miękką separację nagłówka i żywą czerwień. Pozostałe próby wejścia na podstrony oryginału zwróciły 429; wykorzystano zachowane referencje [desktop/mobile klimatyzacji](../screenshots/before-klimatyzacja-mobile.jpg) oraz [rekuperacji](../screenshots/before-rekuperacja-desktop.jpg).

## Weryfikacja

Wyniki builda, testów projektu i przeglądarkowych są zachowane w tym katalogu. Macierz Chromium desktop/mobile i WebKit desktop/iPhone 13/iPhone SE obejmuje interakcje, responsywność, fotografie hero, zimny start, niezależne subsety fontów, historię i CLS. Po tym przebiegu doprecyzowano wyłącznie końcowe kolory tekstów; końcowy build, skan dostępności i kontrola Preview weryfikują również te odcienie. Wynik kontroli po pushu znajduje się w opisie PR #1.

| Kontrola | Wynik |
| --- | --- |
| [Build i testy projektu](build-tests.txt), `npm test` | 19/19 |
| [Testy HTTP](http-tests.txt), lokalny Worker | 4/4 |
| [Macierz Playwright](browser-tests.txt), pięć profili | 108 zaliczonych, 2 celowo pominięte w Chromium, 0 błędów |

- 27 widoków: trzy strony przy 320, 375, 390, 667 (landscape), 768, 848, 849, 1024 i 1440 px. Brak poziomego overflow, header pozostaje przyklejony podczas przewijania. [Pomiary](responsive.json).
- axe-core, WCAG 2 A/AA i 2.1 AA: pięć stron × desktop/mobile. [Wyniki](accessibility.json). Tła obrazowe i gradienty wymagają uzupełniającego pomiaru kontrastu; zerowa liczba zgłoszeń nie jest deklaracją pełnej zgodności.
- [Pomiar kontrastu](contrast.json) obejmuje wszystkie piksele oryginalnego wzoru po istniejącej białej nakładce oraz najjaśniejsze przecięcie siatki stopki. Tekst czerwony: **5,50:1** na bieli, minimum **4,53:1** na wzorze; biały tekst przycisku: **4,58:1**; etykiety stopki: minimum **4,63:1**. Ozdobne kreski: minimum **3,06:1**.
- `git diff --check`: bez błędów. Nie testowano na fizycznym iPhonie; WebKit na Linuxie sprawdza silnik i geometrię.

Odtworzenie zrzutów: `node audit/final-polish/capture.mjs` przy działającym lokalnym Workerze. `BMS_POLISH_ORIGIN` pozwala wskazać Preview, a opcjonalne `BMS_AXE_PATH` — zewnętrzną instalację `axe.min.js` używaną tylko podczas audytu.

[Cloudflare Preview](https://refine-restore-original-visual-identity-bms-technik.michal-steff.workers.dev/klimatyzacja/). Zmiany pozostają na gałęzi PR, bez merge do `main` i bez ręcznych zmian hostingu.
