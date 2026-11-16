# FitPlan — wspólny model ruchu

Stan kodu: 22.10.2026. Wspólny suwak obsługuje fotograficzne sekwencje Push-Up i Hip Thrust z jednego manifestu oraz oddzielne wektorowe szkice pozostałych ćwiczeń. Następne ćwiczenie fotograficzne wymaga tylko własnych klatek i wpisu manifestu; rejestracja, ręczne sterowanie oraz świadomie pobierany pakiet offline działają wspólnie. Nie jest to pełny rig 3D. Fotorealizm nie jest gwarancją biomechanicznej dokładności na poziomie motion capture. Każde nowe ćwiczenie wymaga osobnej kontroli ruchu i kontaktu z podłożem/sprzętem.

## Podział odpowiedzialności

| Plik | Odpowiedzialność |
| --- | --- |
| `apps/fitplan/motion/library.js` | Rejestr postaci i ćwiczeń, aliasy, walidacja, mapowanie procentu na sąsiednie klatki |
| `apps/fitplan/motion/photographic-manifest.js` | Czyste dane JSON postaci, zasobów, sekwencji, faz, markerów i kontroli wszystkich ruchów fotograficznych |
| `apps/fitplan/motion/photographic-catalog.js` | Ogólny rejestrator manifestu; zamienia `sequence` na klatki czasowe bez logiki konkretnego ćwiczenia |
| `apps/fitplan/motion/renderer.js` | WebGL z mapą przepływu lub bezpieczny crossfade dwóch klatek; oba warianty reagują wyłącznie na suwak |
| `apps/fitplan/exercise-motion-embed.js` | Dostępny suwak i opisy faz; żadnego zegara ani autoplay |
| `scripts/fitplan/create-motion-entry.mjs` | Generator roboczego wpisu sześcioklatkowego; wypisuje JSON i nie modyfikuje manifestu |
| `scripts/fitplan/validate-motion-manifest.mjs` | Kontrola schematu, aliasów, ścieżek, wymiarów obrazów, sekwencji, flow i statusu przeglądu |
| `scripts/fitplan/build-motion-flow.py` | Narzędzie autora do wyliczenia map przemieszczeń; nie działa w przeglądarce |

Publiczny kontrakt: `FitPlanMotionLibrary.registerActor(actor)`, `registerExercise(definition)`, `resolve(name)`, `sample(definition, progress)` oraz `FitPlanPoseRenderer.create(host, definition, onState)`. Renderer zwraca `setPose(pose)`, `loaded`, `dispose()`. Zakończenie ładowania nie zmienia wybranego procentu.

Wpis manifestu zawiera `id`, `aliases`, `actorId`, `category`, `title`, `subtitle`, `visual`, `sequence`, `phases`, `markers` i `review`. Rejestrator zamienia `sequence` na równomierne punkty `keyframes` o postaci `{at, frame}`. Wartości suwaka są ograniczane do 0–1, nie zawijane modulo. Ostatnia klatka może być taka sama jak pierwsza, ale wartość suwaka 100% pozostaje 100%.

## Dodanie nowego ćwiczenia fotograficznego

1. Dopasuj co najmniej jeden alias do dokładnej nazwy istniejącej w `data/exercise-catalog.js`. Nie dodawaj nowej pozycji katalogu bez osobnej decyzji.
2. Opcjonalnie wygeneruj bezpieczny szkic wpisu:

   ```sh
   npm run fitplan:motion:new -- --id squat --catalog-name Przysiady --category legs --title Squat
   ```

   Wynik ma status `draft`, pola `TODO` i nie zmienia pliku źródłowego.
3. Przygotuj sześć własnych, równowymiarowych klatek PNG/WebP w `apps/fitplan/assets/motion/<exercise>-v1/`. Użyj postaci `fitplan-athlete-01` i obrazu Push-Up jako odniesienia wyglądu. Zachowaj identyczną kamerę, proporcje, ubranie, oświetlenie, sprzęt i nieruchome punkty podparcia. Nie kopiuj toru ruchu innego ćwiczenia.
4. Obejrzyj całą sekwencję pod kątem tożsamości, dłoni, stóp, osi stawów, kontaktu ze sprzętem i ciągłości. Dopiero wtedy usuń `TODO` i ustaw `review.status: "reviewed"`.
5. Dodaj jeden wpis do `motion/photographic-manifest.js`. Dla osobnych klatek użyj `visual.frames`; renderer zastosuje crossfade. Nie zmieniaj `legacy.html`, `sw.js`, renderera ani rejestratora — zasoby są odkrywane z manifestu.
6. Uruchom:

   ```sh
   npm run fitplan:motion:validate
   node --test tests/fitplan-animation-builder.test.cjs
   ```

7. Opcjonalnie, gdy dostępne są NumPy i OpenCV, połącz klatki w atlas i wylicz prawdziwe mapy dla sąsiadujących klatek:

   ```sh
   python scripts/fitplan/build-motion-flow.py atlas.webp flow.png --columns 2 --rows 3
   ```

   Narzędzie autora wymaga NumPy i OpenCV (`opencv-python-headless`; dla obecnych zasobów użyto wersji 4.13.0.92 i 5.0.0.93). Przeglądarka nie ma tych zależności. Mapy są danymi RGB bez profilu barwnego i przezroczystości: cztery kolumny oznaczają x/y ruchu naprzód i x/y ruchu wstecz, każdy wiersz kolejną parę. R i G przechowują signed fixed point `(R*256+G-32768)/128` pikseli oryginału, z kwantyzacją do 1/8 piksela. `visual.flow.pairs` wiąże wiersze mapy z numerami klatek; odwrócone przejście korzysta z tej samej pary.
   Nie twórz mapy flow przez zgadywanie danych obrazu. Brak flow jest pełnoprawnym wariantem dostarczania nowej animacji.

Umiejętność **FitPlan Animation Builder** prowadzi ten sam proces w zwykłym Chat: odczytuje aktualny `develop` przez GitHub, wykorzystuje generator obrazów i postać referencyjną, pokazuje sekwencję do akceptacji, waliduje wpis, a następnie tworzy jeden atomowy commit z kontrolą oczekiwanego SHA. Nie publikuje Netlify i nie zapisuje na `main`.

## Weryfikacja systemu manifestu 23.10.2026

- `npm run fitplan:motion:validate`: PASS — 2 ćwiczenia fotograficzne, 1 postać, 4 lokalne zasoby.
- `node --test tests/fitplan-animation-builder.test.cjs`: PASS — 7/7, w tym osobne klatki z crossfade, dynamiczne zastąpienie jednego szkicu, cache z manifestu, generator i odrzucenie błędnego aliasu.
- `npm run check:fitplan`: PASS — 200/200 testów.
- `npm run verify -- --changed <pliki systemu>`: PASS dla bramek `quick` i `fitplan`; audyt składni 68 plików, audyt 106 odwołań do zasobów bez błędów i 200/200 testów FitPlan.
- Automatyczny `node tests/fitplan-motion.browser.cjs` nie mógł zostać uruchomiony lokalnie, ponieważ środowisko nie zawiera binarnego Chromium Playwright. Zamiast pomijać kontrolę interfejsu wykonano test w zarządzanej przeglądarce Chrome na lokalnym serwerze QA z atrapą konta. PASS: Push-Up i Hip Thrust pozostają nieruchome po puszczeniu suwaka, reagują na 0%, 45% i 100%, mają pośredni crossfade `0.5` przy 45% oraz wracają do właściwej pozycji końcowej. Dodatkowo sprawdzono ruchomy szkic Przysiadów, nieruchomą Izometrię i rzeczywisty wygląd klatki Hip Thrust. Przeglądarka QA nie udostępniała WebGL, więc potwierdzono ścieżkę crossfade; ścieżkę flow/WebGL nadal pokrywają testy modułowe, a nie pełny automatyczny test Playwright. Nie wykonywano publikacji ani testu Netlify.

## Zasoby fotograficzne Push-Up i Hip Thrust

`push-up-v1/athlete.webp`: sześć klatek 724 × 362 w układzie 2 × 3, fotografowany z boku atleta w grafitowej koszulce, czarnych spodenkach i szarych butach. Obraz został stworzony w tej sesji wbudowanym narzędziem generowania obrazów na potrzeby FitPlan. Nie pobierano komercyjnego modelu/zdjęć stockowych. Skrócony opis generacji: ten sam dorosły atleta, stała kamera i oświetlenie studia, sześć kolejnych pozycji zejścia pompki, identyczne dłonie i stopy jako punkty podparcia, naturalna skóra i tkaniny, brak napisów i znaków marek.

Powrót od 50 do 100% jest odwróceniem zejścia. Ruch innych ćwiczeń może wymagać oddzielnych klatek powrotu, sprzętu i innych punktów podparcia. System nie generuje nowych ruchów automatycznie na podstawie nazwy.

`hip-thrust-v1/athlete.webp`: sześć osobno wygenerowanych klatek 724 × 362 w układzie 2 × 3. Zachowano tę samą postać, strój, neutralne studio i stały boczny kadr co w Push-Up, ale przygotowano całkowicie nowy ruch, ławkę i sztangę z osłoną bioder. Sekwencja prowadzi od pozycji dolnej przez cztery etapy unoszenia do pełnego wyprostu. Górna część pleców pozostaje na ławce, całe stopy na podłożu, sztanga w zgięciu bioder, a pozycja końcowa nie zawiera przeprostu lędźwi. `hip-thrust-v1/flow.png` zawiera pięć par map przepływu. Powrót 50–100% odtwarza te same klatki w odwrotnej kolejności.

Renderer przelicza tylko zmianę suwaka, rozmiaru lub gotowości zasobu. Nie ma `requestAnimationFrame`, interwału ani pętli odtwarzania. Fotograficzna klatka początkowa pozostaje widoczna podczas ładowania danych interpolacji. Przy osobnych plikach, braku WebGL, utracie kontekstu lub nieprawidłowym flow dwie sąsiednie klatki są łączone crossfade zgodnie z dokładną pozycją suwaka. Po odzyskaniu kontekstu wraca wybrana pozycja. Żadna informacja o postępie treningowym ani koncie nie jest zapisywana przez ten moduł.

## Weryfikacja 21.10.2026

- `node --test tests/fitplan-exercise-embed.test.cjs tests/fitplan-exercise-motion.test.cjs`: PASS, 8 testów.
- `node tests/fitplan-motion.browser.cjs`: PASS w Chromium 138. Sprawdzono bezruch, klawiaturę, przeciąganie dotykiem i zatrzymanie po puszczeniu, 0–100%, pozycje pośrednie, szerokości 320/390/768/1280, zamknięcie/otwarcie, sterowanie po odłączeniu sieci i brak WebGL. Test jest także częścią `test:regression`.
- Etapy `quick`, `fitplan`, `portal` w `npm run verify:full`: PASS, w tym 166 testów FitPlanu/wspólnego stanu, 30 testów portalu oraz przeglądarkowe kontrole strony głównej, preferencji i wcześniejszych poprawek.
- `npm run verify:full`: **FAIL całego polecenia**. Pełny etap Node zakończył się wynikiem 610 PASS, 0 FAIL, 1 SKIP (opcjonalny test PostgreSQL/RLS wymaga `DEVICE_SESSION_PGLITE`). Następnie przeszły testy przeglądarkowe portalu, animacji, panelu AI, preferencji i nauki. Łańcuch zatrzymał się w `tests/law-citations.browser.cjs:40`, `visual regression 1920/uwagi-ogolne`. Ten sam błąd odtworzono osobno na niezmienionym snapshotcie `eb8d6c3fb0f955b50b0fb8e7ea1e6c62c277552b`; nie dotyczy nowej animacji. Dalsze polecenia łańcucha pełnej regresji nie zostały wykonane.
- Wcześniejsze nieaktualne oczekiwania testów dopasowano do już istniejących funkcji: jedenastu planów FitPlanu, opcjonalnego Trybu nauki CCNA i dziewięciu aplikacji portalu (dziesięciu po dodaniu karty testowej). Nie zmieniano tych funkcji aplikacji.

Implementacja zapisana na `develop` jako `02e03e3d4a432c594c72f440c272104a56fef54b`. Testy używały lokalnej atrapy konta, nie produkcyjnej sesji. Brak publikacji Netlify tej zmiany i brak testu wdrożonego modelu; publikacja wymaga zatwierdzenia zgodnie z `docs/CI_COST_POLICY.md`. `main` nie było zmieniane.

## Hip Thrust — fotograficzna sekwencja

Wpis `hip-thrust` w `motion/photographic-manifest.js` korzysta z tego samego kontraktu fotograficznego i renderera co Push-Up, ale wskazuje własny atlas, własną mapę przepływu i własną oś jedenastu klatek logicznych `[0,1,2,3,4,5,4,3,2,1,0]`. Pozycje 0%, 50% i 100% oznaczają odpowiednio dół, pełny wyprost i powrót do dołu. Renderer reaguje wyłącznie na zmianę suwaka; nie uruchamia automatycznego odtwarzania ani zegara.

Kontrola autora obejmuje sześć klatek źródłowych i pozycje pośrednie: stały kontakt górnej części pleców z ławką, nieruchome pełne stopy, zgodny kierunek kolan i stóp, sztangę utrzymywaną w zgięciu bioder oraz końcową linię bark–biodro–kolano bez przeprostu lędźwi. To wizualny materiał instruktażowy, nie pomiar motion capture ani zastępstwo oceny trenera.

Kod `landmark-rig`, `motion/landmark-constraints.js` i `motion/rig-renderer.js` pozostaje obsługiwanym kontraktem dla ewentualnych definicji wektorowych, ale bieżący Hip Thrust już z niego nie korzysta.


## Pełny szkic mechaniczny katalogu — 95 ćwiczeń

OBECNIE na develop funkcja FitPlanMotionLibrary.registerExercise obsługuje typ visual.kind = "full-body-rig" obok fotograficznych atlasów Push-Up i Hip Thrust. Każda pozycja szkicu wektorowego przechowuje współrzędne 14 węzłów: głowa, szyja, lewy i prawy bark, łokieć, dłoń, biodro, kolano i kostka. Renderer motion/full-body-renderer.js rysuje segmenty i proste akcesoria jako SVG. Nie stosuje pętli renderowania, licznika czasu ani requestAnimationFrame. Suwak i dialog pozostają wspólne; przejścia obliczane są wyłącznie na zmianę procentu.

W motion/full-body-poses.js opisano **67 wzorców mechanicznych** (m.in. squat, lunge, hinge, walk, overhead, row, pullUp, curl, legRaise, deadBug, birdDog, sidePlank, stabilizacja i oddech). motion/exercises/catalog-rigs.js zawiera **jawne przypisania 95 nazw katalogowych** oraz podstawowe rekwizyty sceny, bez zgadywania ruchu na podstawie samej partii mięśniowej. Zachowano trzy wcześniejsze modele: Push-Up, Hip Thrust i Barbell Bench Press. Raport window.FitPlanMotionCoverage obejmuje liczbę elementów, pokrycie, brakujące i powtórzone przypisania. Zmiana katalogu nie może cicho utworzyć nieprawidłowego wzorca. Nowe ćwiczenia potrzebują ręcznej klasyfikacji i przetestowania.

Te szkice są **wersją roboczą**. Dwie kluczowe pozycje wyznaczają zamierzony tor. Od 22.10.2026 `motion/pose-constraints.js` koryguje pozę w każdym punkcie suwaka, zachowując długości ramion, nóg i obu boków tułowia oraz stały kierunek zgięcia łokci i kolan. Nie gwarantuje to nadal poprawnego toru fizjologicznego, kontaktu stóp z podłożem, pracy dłoni ani szczegółów rotacji stawów. Izometrie mogą pozostać bez ruchu. Nie należy ich przedstawiać jako 95 pełnych animacji o fotograficznym realizmie lub zweryfikowanej technice. Kolejny etap: osobne klatki, niezależne fazy ruchu, biomechaniczna kontrola podpór i szczegółowa geometria sprzętu dla poszczególnych wzorców.

Nowe skrypty są ładowane z legacy.html i dołączone do listy offline sw.js. Testy: node --test tests/fitplan-mechanical-drafts.test.cjs, node --test tests/fitplan-exercise-embed.test.cjs tests/fitplan-exercise-motion.test.cjs, następnie npm run verify i przy pełnym wydaniu npm run verify:full; przeglądarka i Netlify wymagają niezależnego potwierdzenia.

## Audyt mechaniczny 22.10.2026

Kontrola 95 modeli ujawniła przed naprawą 83 modele ze zmianą długości co najmniej jednego segmentu ponad 10%, a 27 ponad 50%; największy zaobserwowany błąd wynosił 212,4% (Dead Bug). Dodano solver ograniczeń z zachowaniem długości kończyn i orientacji zgięcia, poprawiono podwójne przesunięcie głowy, oddzielono ławkę od rodzaju ciężaru oraz rozróżniono kilka mylonych wariantów: sumo squat, Arnold press, Face Pull z rotacją, Carries.

Kontrola skryptowa wszystkich 95 modeli dla 101 pozycji suwaka (0–100% co 1%): brak zmian długości dziesięciu kontrolowanych segmentów w granicy błędu numerycznego, brak stawów poza kadrem i brak skoków pojedynczych stawów ponad 15 jednostek obrazu między kolejnymi pozycjami. Wszystkie 95 instancji renderera SVG przeszło kontrolę tworzenia, suwaka i usunięcia w symulowanym DOM. **To nie jest wynik `npm run verify`, test Playwright ani dowód poprawności biomechaniki**. Osobny raport: `docs/FITPLAN_MECHANICAL_AUDIT.md`. Publikacja Netlify nie została wywołana w tym zadaniu.

## Kontrola w kolejności 1–98 (22.10.2026)

Każde z 98 ćwiczeń ma w docs/FITPLAN_EXERCISE_REVIEW_1_98.md numeryczną ocenę kodu i otwarte wymagania. Aktualnie 67 wzorców, z których 63 są przypisane do katalogu.

Historyczny moduł motion/landmark-constraints.js zachowuje kontrakt dawnego szkicu punktowego; bieżący Hip Thrust używa już fotograficznego atlasu i map przepływu. Dla pozostałych modeli zmieniono niektóre wzorce, typy wyposażenia i podparcia. Odtwarzacze pompek i wyciskania sztangi zachowano.

Nie należy traktować Clamshell i rotacji biodra/przedramion jako prawidłowych 2D demonstracji techniki; brak właściwej osi głębokości lub anatomii drobnych stawów. Program wyświetla ostrzeżenia. Pomyślnie przeprowadzono kontrolę numeryczną i symulację renderowania wszystkich 95 szkiców. Nie uruchomiono pełnego npm run verify, testów Chromium ani Netlify.

### Weryfikacja ponowna — ograniczenia

Po drugim przeglądzie liczba wzorców wynosi 67, wykorzystanych 63. Naprawiono nachodzenie stóp pod podłogę w Dips, podparcie przy Step-Up, ścianę Wall Slides, podwójny kierunek ruchów inwersji/ewersji stopy oraz zgięcia/wyprostu nadgarstka. Landmine Press ma stałą długość sztangi. Wyciskanie wąsko ma większy zakres ruchu rąk i stałą długość segmentów. Dla Clamshell suwak jest nieaktywny, bo obecna projekcja nie przedstawia ruchu 3D; Copenhagen Plank nie ma jeszcze właściwej podpory. Aktualny zapis: docs/FITPLAN_EXERCISE_REVIEW_1_98.md. Nie wykonywano npm verify ani testów w realnej przeglądarce.

## Side Step — interpolowany ruch fotograficzny (23.10.2026)

OBECNIE: Side Step używa sześciu pozycji tej samej postaci, atlasu `assets/motion/side-step-v2/athlete.webp` (3×2 klatki po 512×512) i pięciu dwukierunkowych map przemieszczeń `flow.png` (4×5 płytek po 256×256). Mapy obliczono repozytoryjnym skryptem OpenCV DIS; nie są ręcznie zgadywanymi danymi. Wspólny renderer WebGL przemieszcza obraz między pozycjami zamiast jedynie przenikać trzy odległe zdjęcia. Nowa grafika ma neutralne tło i całe stopy w kadrze. Nie zmieniono renderera ani zasobów Push-Up i Hip Thrust.

Suwak `[0,1,2,3,4,5,4,3,2,1,0]` pokazuje odstawienie nogi, szeroką pozycję przy 50% i kontrolowany powrót tej samej nogi. Po puszczeniu pozostaje nieruchomy. Bez WebGL pozostaje awaryjne przenikanie sześciu klatek. To interpolacja fotograficzna, nie film ani motion capture; kontakt stopy podporowej i zgodność biomechaniczna wymagają dalszej oceny, nie są gwarantowane przez mapę przepływu.

Manifest obsługuje dwie istniejące pozycje katalogu: `Side step` (pośladki) i `Chód bokiem` (nogi). Kategorie katalogowe pozostają bez zmian. `Chód bokiem z gumą` ma własny szkic i nie korzysta z tej fotografii. Katalog obejmuje 98 pozycji: pięć korzysta z czterech oddzielnych modeli (w tym dwa aliasy Side Step), 93 pozostają szkicami mechanicznymi. Manifest zawiera trzy definicje fotograficzne i dwie postacie. HTML i pakiet offline używają zgodnych wersji skryptów `20261023-side-step-2`.

Weryfikacja: `npm run fitplan:motion:validate`, `node --test tests/fitplan-side-step.test.cjs tests/fitplan-animation-builder.test.cjs`, `npm run check:fitplan`, `npm run verify` oraz `node tests/fitplan-motion.browser.cjs`. Wynik lokalny nie oznacza publikacji Netlify.

### Wynik kontroli lokalnej Side Step v2

PASS: walidator manifestu (3 definicje, 2 postacie, 6 zasobów), 11 testów Side Step/systemu, 204 testy `check:fitplan` oraz `npm run verify -- --changed apps/fitplan/motion/photographic-manifest.js,apps/fitplan/assets/motion/side-step-v2/athlete.webp,apps/fitplan/assets/motion/side-step-v2/flow.png,apps/fitplan/index.html,apps/fitplan/legacy.html,apps/fitplan/sw.js` (quick + fitplan). W Chromium 138 z WebGL/SwiftShader przeszedł rozszerzony `tests/fitplan-motion.browser.cjs`: interpolacja także między 15% a 15,1%, identyczny obraz po zatrzymaniu i przy powrocie 100%, suwaki i brak poziomego przepełnienia przy 320/390/768/1280 px, działanie po odłączeniu sieci, zamknięcie/ponowne otwarcie. Obejrzano obrazy pośrednie przy 5/15/25/45%; możliwe są drobne artefakty interpolacji na obrysie ruchomego buta. Test korzystał z lokalnej atrapy konta. Nie testowano tego wydania na Netlify i nie uruchamiano pełnej regresji wszystkich aplikacji.

Obiekty manifestu i SHA wszystkich czterech zasobów Push-Up/Hip Thrust pozostały bez zmian. Poprawiono wcześniejszą rozbieżność wersji HTML/cache, założenie testów o jednej postaci oraz licznik nieuwzględniający dwóch katalogowych aliasów Side Step. Kategorii i danych katalogu nie zmieniono.
