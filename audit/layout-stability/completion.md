# Domknięcie stabilizacji layoutu — 8 listopada 2026

PR [#1](https://github.com/mistsy/bms-technik/pull/1), gałąź
`refine/restore-original-visual-identity`. Sprawdzony kod aplikacji:
`03255d434b9b50bf6f52053c430c0c1c3070a207`.

## Odziedziczony stan

Drzewo robocze nie zawierało zmian w śledzonych plikach. Niezatwierdzony
katalog `audit/layout-stability/` zawierał dokumentację, wyniki, zrzuty
i nagrania wcześniejszych eksperymentów; zachowano je w całości.

Gotowe były preloady trzech lokalnych fontów, `font-display: optional`,
dopasowane metryki fallbacków i polski subset Mondy. CSS blokuje pierwszy
render, a fingerprintowane CSS/JS/fonty mają immutable przy 200 i 304.
Nagłówek, logo, nawigacja i Menu mają zarezerwowaną geometrię; miary tekstu
nie zależą od gotowości fontu ani jednostki `ch`. Scrollbar ma rezerwację
miejsca. Pozostały natywne linki i historia przeglądarki, bez loadera,
oczekiwania na fonty, ukrywania strony lub opóźniania nawigacji.

Wcześniejszy pełny wynik 103 zaliczonych / 2 pominiętych dotyczył `b391b42`.
Ostatni lokalny przebieg po `03255d4` miał status `interrupted`, a zapisany
błąd `Test ended` wynikał z przerwania. Nie uznano go za ukończoną walidację.

## Dokończone prace

Zweryfikowano końcową implementację bez dalszych zmian w kodzie aplikacji.
Zapisano audyt w repozytorium, dodano odsyłacz w głównym README i oddzielono
wcześniejsze wyniki od końcowej kontroli. Skorygowano rozmiar subsetu
w opisie na 3052 B, zgodnie z plikiem i zachowanym `fonts.json`.

## Końcowe wyniki

| Kontrola | Wynik |
| --- | --- |
| `npm test` (wraz z buildem Astro) | 19/19, bez błędów |
| `npm run test:http`, lokalny Worker | 4/4, bez błędów |
| `BMS_BROWSER_ORIGIN=… npm run test:browser -- --project=desktop --project=mobile --workers=1` | 42 zaliczone, 2 pominięte, 0 błędów; 2,1 min |
| Geometria pierwszego renderu, fontów i nawigacji | wszystkie 8 testów layoutu zaliczone, tolerancja 0,5 px, CLS ≤ 0,001 |
| Menu i brak błędów JS na pięciu stronach | zaliczone w obu profilach |
| `git diff --check` i kontrola staged diff | bez błędów |

Dwa pominięcia dotyczą testu kolejności inicjalizacji CSS przeznaczonego
wyłącznie dla WebKit. Zapis przebiegów: [Playwright](final-browser-tests.txt)
i [HTTP](final-http-tests.txt). Build i testy jednostkowe zakończyły się
kodem 0; nie wykonywano dodatkowego builda tylko w celu utworzenia logu.

## Cloudflare Preview

[Podgląd gałęzi](https://refine-restore-original-visual-identity-bms-technik.michal-steff.workers.dev)
zwraca 200. Pięć dokumentów HTML oraz wspólne CSS, JS i wszystkie trzy WOFF2
mają SHA-256 zgodne z lokalnym buildem. Cloudflare API potwierdziło udany
build `0137d8e7-a41c-476c-befb-bfaad799181e` dla `03255d4`.

## Zakres i ograniczenia

Końcowy przebieg przeglądarkowy ograniczono do Chromium desktop 1440×1000
i mobile 390×844, z jednym workerem, na rzeczywistym Preview. Obejmuje
istniejące testy funkcjonalne oraz zimny start z wstrzymanymi fontami,
opóźnionymi CSS/obrazami, niezależnym ładowaniem subsetów, przejściami
przez pięć stron i historią wstecz. Testy kontrolują pozycję i rozmiar
Menu, nagłówka i treści od pierwszej ostylowanej klatki, CLS, dostępność
fontów, przepełnienia i błędy JS. Formularza na Preview nie wysyłano.

Nie ponawiano pełnej macierzy WebKit ani nagrywanych benchmarków sieciowych.
Zachowano ich wcześniejsze wyniki; nie opisują one końcowego commita.
Fizyczny Safari/iPhone i VoiceOver pozostają do ręcznej weryfikacji.
