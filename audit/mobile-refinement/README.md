# Mobile i hero usług — druga korekta PR #1

7 listopada 2026. Gałąź `refine/restore-original-visual-identity`. Ta korekta uzupełnia [pierwsze porównanie](../visual-refinement/README.md); znajdujące się tam zrzuty i wyniki opisują wcześniejszy stan PR.

## Diagnoza animacji

Błąd odtworzono w **Playwright WebKit 27.2 na Linuxie**, w profilu iPhone 13. W dotychczasowym buildzie Astro skrypt `AccordionMotion.astro` był modułem inline. WebKit wykonywał go przed udostępnieniem tokenów z arkusza CSS. Jednorazowy odczyt `getComputedStyle(document.documentElement)` zwracał puste wartości. Przy pierwszym kliknięciu do `details.animate()` trafiały `duration: NaN` i `easing: ''`, co powodowało `TypeError: Type error`. Ponieważ zdarzenie natywnego `summary` było już anulowane, `details` nie przechodził nawet do swojego stanu bez animacji. Odczyt tokenów po pełnym załadowaniu strony pokazywał poprawne `240` i `cubic-bezier(.22, .61, .36, 1)` — problem dotyczył momentu inicjalizacji, nie przeliczenia sekund.

Wspólny, niewielki moduł `src/scripts/motion.ts` odczytuje tokeny dopiero przy interakcji i obsługuje zapis w ms/s. Niepoprawna lub niedostępna wartość oznacza natychmiastowe ustalenie stanu, bez wyjątku. Test regresyjny w WebKit wstrzymuje odpowiedź CSS do czasu inicjalizacji kontrolek, a po jej zwolnieniu sprawdza pierwszą animację. Przypadek jest celowo pomijany w Chromium, który inaczej szereguje wykonanie tych skryptów.

Dodatkowe problemy poprzedniego kontrolera:

- Odwrócenie ruchu zawsze zaczynało opacity od 0 lub 1, zamiast od aktualnie wyrenderowanej wartości. Teraz wysokość, opacity i transform są mierzone przed anulowaniem animacji.
- Wysokość docelowa była jednorazowym pomiarem. `ResizeObserver` obserwuje naturalny rozmiar zawartości i nagłówka, więc doładowanie obrazu, zmiana tekstu i szerokości ekranu aktualizują cel podczas ruchu. Po zakończeniu usuwane są tymczasowe `height` i `overflow`; otwarty panel ponownie ma naturalną wysokość.
- Początkowa wysokość jest utrzymywana w trakcie otwierania natywnego `details`; `fill: both` zachowuje końcową klatkę do ustalenia stanu. Stary callback nie kończy nowej animacji. `display: flow-root` utrzymuje marginesy zawartości wewnątrz mierzonego panelu.

Nie dodano sztywnego limitu wysokości, timera do ukrywania paneli ani biblioteki animacji. Zachowane są `details`/`summary`, grupowanie bez JS, ARIA, `inert`, klawiatura i reakcja na zmianę `prefers-reduced-motion` także w trakcie ruchu.

## Menu mobilne

Przycisk używa Share Tech i trzech cienkich linii przechodzących w krzyżyk. Panel jest pozycjonowany pod nagłówkiem, animuje opacity i przesunięcie o 8 px, bez zmiany położenia treści strony. Zamykające `details` pozostaje otwarte do `Animation.onfinish`. Ponowne kliknięcie kontynuuje ruch od aktualnej klatki.

Enter/Space korzystają z natywnego `summary`. Escape zamyka panel i przywraca focus, Tab przechodzi przez linki, wyjście fokusu i kliknięcie poza menu zamykają panel. Panel ma limit wynikający z `100dvh` i przewija się w landscape. Nawigacja oraz powrót z cache przywracają zamknięty stan; przejście do desktopowego breakpointu również resetuje menu.

Dwie pułapki wykryte w WebKit podczas weryfikacji:

- Ustawienie `inert` na panelu podczas obsługi kliknięcia linku może anulować jego natywną nawigację. Reset po nawigacji odbywa się w `pagehide`/`pageshow`, po aktywacji linku.
- Mikrozadanie po `focusout` może wykonać się między `blur` i kolejnym `focus`, kiedy `activeElement` wskazuje jeszcze `body`. Kontroler sprawdza `FocusEvent.relatedTarget`, dzięki czemu nie zamyka menu pomiędzy jego linkami.

## Fotografie i kompozycja

Porównano oryginalne [hero klimatyzacji](../screenshots/before-klimatyzacja-desktop.jpg), [hero rekuperacji](../screenshots/before-rekuperacja-desktop.jpg), materiały w snapshotach audytu i fotografie aktualnych galerii. Oryginał używał szerokich fotografii tematycznych; hero klimatyzacji miało widoczny znak wodny stocku. Do poprawki wybrano zdjęcia realizacji już obecne w projekcie:

- Klimatyzacja: `IMG_20220301_110450`, jednostka naścienna we wnętrzu, punkt skupienia `50% 38%`.
- Rekuperacja: `IMG_20220216_135304`, centrala z izolowanymi przewodami na poddaszu, punkt skupienia `50% 44%`.

Na desktopie tekst i fotografia tworzą dwie kolumny. Na mobile zdjęcie jest pod opisem. Kadry mają proporcje 4:3 / 16:10 i podpis z cienkim czerwonym akcentem. Nagłówki pozostają na jasnej powierzchni z oryginalnym tłem technicznym. Po hero następują białe sekcje o innej strukturze: akordeon realizacji albo kroki procesu. Pozostałe sekcje nie wymagały przebudowy.

Wykorzystano istniejące, lokalne pliki JPEG 300/768/1080 px, `srcset`/`sizes`, wymiary obrazu, eager loading i `fetchpriority="high"`. Galerie pozostają ładowane leniwie. Nie dodano nowych mediów do strony, nie zmieniono historycznych plików i ich adresów.

## Zrzuty

Desktop: Chromium, 1440×1000. Mobile: WebKit, iPhone 13, 390×844, DPR 3; zrzuty zapisano w skali CSS. Źródło: lokalny Worker z końcowym buildem tej korekty.

| Widok | Pierwszy ekran | Pełna strona |
| --- | --- | --- |
| Klimatyzacja desktop | [Hero](klimatyzacja-desktop-viewport.jpg) | [Strona](klimatyzacja-desktop.jpg) |
| Klimatyzacja iPhone | [Hero](klimatyzacja-iphone-viewport.jpg) | [Strona](klimatyzacja-iphone.jpg) |
| Rekuperacja desktop | [Hero](rekuperacja-desktop-viewport.jpg) | [Strona](rekuperacja-desktop.jpg) |
| Rekuperacja iPhone | [Hero](rekuperacja-iphone-viewport.jpg) | [Strona](rekuperacja-iphone.jpg) |

[Menu iPhone](menu-iphone.jpg), [akordeon iPhone](accordion-iphone.jpg). Poprzedni stan obu podstron: [klimatyzacja](../visual-refinement/after-klimatyzacja-mobile.jpg), [rekuperacja](../visual-refinement/after-rekuperacja-mobile.jpg).

## Weryfikacja

Wyniki końcowego przebiegu zapisano w opisie PR #1. Zestaw obejmuje build i 19 testów projektu, 4 testy rzeczywistych odpowiedzi lokalnego Workera, pakowanie `wrangler deploy --dry-run` oraz rozszerzone testy Playwright w czterech profilach: Chromium desktop/mobile i WebKit iPhone 13/SE. Kontrolowane są również rzeczywiste pośrednie klatki wysokości i opacity, szybkie kliknięcia, przełączenie grupy w połowie ruchu, przyrost treści i obrót w trakcie animacji, menu po nawigacji i powrocie, zmiana reduced motion podczas zamykania, brak JS, uszkodzone obrazy i poziomy overflow pięciu stron.

Test zbierający klatki przez `requestAnimationFrame` wydłuża wyłącznie w swoim kontekście token animacji do 1000 ms, aby uniknąć pomijania całego okna pomiaru przez programowy renderer WebKit przy DPR 3. Pozostałe testy sprawdzają produkcyjne 240 ms i pośrednie klatki przez kontrolę osi czasu Web Animations API. Dodatkowy lokalny pomiar rzeczywistego ruchu przy 240 ms potwierdził pośrednie wysokości i opacity w obu kierunkach.

Nie przeprowadzono testu na fizycznym iPhonie, Safari na iOS ani VoiceOver. Emulacja profilu telefonu w WebKit na Linuxie sprawdza silnik i geometrię; nie weryfikuje zachowania systemowego paska Safari, klawiatury i gestów rzeczywistego iOS. Publiczny Cloudflare Preview jest sprawdzany po pushu na istniejącą gałąź; wynik oraz adres są w opisie PR. Nie wdrażano na main.

Odtworzenie przy uruchomionym lokalnym podglądzie:

```sh
npx playwright install --with-deps chromium webkit
npm run test:browser
node scripts/capture-mobile-refinement.mjs
```

`BMS_BROWSER_ORIGIN` wskazuje zdalny podgląd zarówno dla testów, jak i skryptu zrzutów. Nie przebudowuj równolegle `dist/` używanego przez testowany lokalny Worker.
