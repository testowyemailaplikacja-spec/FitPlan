# FitPlan — audyt mechaniki 95 szkiców (22.10.2026)

## Zakres i wynik

Gałąź: `develop`; bez publikacji na Netlify i bez zmian `main`.

- W katalogu: **98** pozycji, z czego trzy wcześniejsze implementacje (Push-Up, Hip Thrust, Barbell Bench Press) pozostają odrębne.
- Zweryfikowano pokrycie **95/95** przypisanych szkiców, **67** dostępnych wzorców, **63** wykorzystywane wzorców; brak niezmapowanych nazw, duplikatów i konfliktu z wcześniejszymi trzema modelami.
- Przed poprawką **83/95** miało odchylenie długości co najmniej jednego segmentu ponad 10%, **27/95** ponad 50%; rekord wynosił **212,4%** dla segmentu ręki Dead Bug.
- Po dodaniu `motion/pose-constraints.js`: 95 modeli, po 101 próbek suwaka 0–100%, dziesięć kontrolowanych długości każdego modelu: **brak odchylenia poza tolerancją numeryczną** (maksimum około `3.1×10⁻¹³%`).
- Po ustaleniu kierunku zgięcia: największe przesunięcie pojedynczego stawu na jeden punkt procentowy suwaka wyniosło ok. **10,66 jednostek obrazu** (przed naprawą ok. **180,28**). Brak skoków powyżej 15 jednostek.
- Wszystkie 95 rendererów przechodzą test mechaniczny tworzenia SVG, pięciu pozycji suwaka, poprawnego umiejscowienia głowy i sprzątania obiektów w symulowanym DOM.
- Sprawdzono wersjonowanie wymaganych zasobów i obecność nowych skryptów w pakiecie offline.
- Dodano test powtarzalny `tests/fitplan-mechanical-geometry.test.cjs`. Pełnego `npm run verify`, `npm run verify:full` i Playwright w tej sesji nie uruchomiono. Testów jako zalogowany użytkownik na Netlify również nie wykonano.

## Wdrożone naprawy

1. Solver ograniczeń utrzymuje długości segmentów i stabilny kierunek zgięcia stawów.
2. Usunięto podwójne przesunięcie elipsy głowy względem grupy SVG.
3. Oddzielono podparcie (np. ławka) od wyposażenia trzymanego w dłoniach (hantle/sztanga).
4. Osobne wzorce dla Sumo Squat, Arnold Press i Face Pull z rotacją; Carries nie jest już przedstawiane jako nieruchome trzymanie.
5. Ujednolicono wersję iframe i wykaz offline; poprawiono asercje regresji, które odnosiły się do starej wersji.

## Pozostałe ograniczenia

**Nadal nie można uznać tych 95 modeli za kompletne demonstracje techniki.** Mechanizm ma 14 punktów ciała, bez pełnej geometrii palców, nadgarstków, stóp, powierzchni kontaktowych i dokładnego toru obciążenia. Zachowanie długości kości nie gwarantuje fizjologicznych zakresów stawów, rozkładu ciężaru ani prawidłowego ustawienia sprzętu. Wiele wzorców ma tylko dwie główne pozycje, a podgląd 2D może źle przekazywać ruchy rotacyjne i wielopłaszczyznowe.

Ocena poniżej to **priorytet następnego etapu**, nie certyfikat błędu dla konkretnej osoby i nie ocena ruchu biomechanicznego wykonana na nagraniu.

Legenda: **D** — szczegółowe ruchy stawów i rotacje wymagają dodatkowych punktów; **F** — potrzeba większej liczby faz/klatek; **S** — głównie izometria lub postawa ogólna; **P** — podstawowy ruch widoczny w szkicu, nadal wymaga kontroli technicznej.

Zestawienie grup: D = 23, F = 28, S = 8, P = 36.

| Ćwiczenie | Kategoria | Wzorzec | Priorytet |
| --- | --- | --- | :---: |
| Ab Wheel Rollout | abs | `rollout` | F |
| Anti-Rotation Hold | abs | `antiRotation` | P |
| Controlled Trunk Rotation | abs | `rotation` | D |
| Crunch | abs | `crunch` | P |
| Dead bug | abs | `deadBug` | F |
| Hollow hold | abs | `hollow` | S |
| Leg Raise | abs | `legRaise` | F |
| Pallof press | abs | `antiRotation` | P |
| Side plank | abs | `sidePlank` | S |
| Side Plank | abs | `sidePlank` | S |
| Suitcase Carry | abs | `walk` | F |
| Woodchopper | abs | `woodchop` | F |
| Barbell Biceps Curl | arms | `curl` | P |
| Cable Triceps Pushdown | arms | `triceps` | P |
| Chin-Up | arms | `pullUp` | F |
| Close-Grip Bench Press | arms | `push` | P |
| Dips | arms | `dip` | F |
| Dumbbell Biceps Curl | arms | `curl` | P |
| Hammer Curl | arms | `curl` | P |
| Reverse Curl | arms | `curl` | P |
| Anti-Rotation Exercises | back | `antiRotation` | P |
| Back extension | back | `backExtension` | P |
| Bird dog | back | `birdDog` | F |
| Deadlift | back | `hinge` | P |
| Face pull | back | `facePull` | P |
| Hip hinge | back | `hinge` | P |
| Isometric Holds | back | `staticHold` | S |
| Lat Pulldown | back | `pulldown` | P |
| Pull-Up | back | `pullUp` | F |
| Row | back | `row` | F |
| Scapular Elevation | back | `shrug` | D |
| Scapular Retraction | back | `shoulder` | D |
| Shrugs | back | `shrug` | D |
| Bracing | chest | `staticHold` | S |
| Breathing Exercises | chest | `breathing` | D |
| Carries | chest | `walk` | F |
| Diaphragmatic Breathing | chest | `breathing` | D |
| Dumbbell Chest Fly | chest | `fly` | P |
| Incline Dumbbell Bench Press | chest | `push` | P |
| Landmine press | chest | `overhead` | P |
| Push-up plus | chest | `scapPush` | D |
| Scapular Depression | chest | `depression` | D |
| Scapular Stabilization | chest | `shoulder` | D |
| Shoulder Control Drills | chest | `shoulder` | D |
| Wall slides | chest | `armRaise` | P |
| Band Finger Extension | forearms | `fingers` | D |
| Dead Hang | forearms | `hang` | S |
| Farmer's Carry | forearms | `walk` | F |
| Hammer Curl | forearms | `curl` | P |
| Resisted Forearm Pronation | forearms | `forearmRotate` | D |
| Resisted Forearm Supination | forearms | `forearmRotate` | D |
| Reverse Curl | forearms | `curl` | P |
| Wrist Curl | forearms | `wrist` | D |
| Wrist Extension | forearms | `wrist` | D |
| Clamshell | glutes | `clamshell` | D |
| Controlled Hip Rotation | glutes | `hipRotation` | D |
| Hip Abduction | glutes | `abduction` | P |
| Lateral Band Walk | glutes | `sideStep` | F |
| Monster walk | glutes | `sideStep` | F |
| Side step | glutes | `sideStep` | F |
| Single-leg work | glutes | `balance` | S |
| Band Ankle Eversion | legs | `ankle` | D |
| Band Ankle Inversion | legs | `ankle` | D |
| Calf Raise | legs | `calf` | P |
| Controlled Hip Flexion | legs | `kneeRaise` | F |
| Controlled Knee Raise | legs | `kneeRaise` | F |
| Copenhagen plank | legs | `copenhagen` | F |
| Dorsiflexion raises | legs | `toeRaise` | D |
| Good morning | legs | `hinge` | P |
| Heel Walk | legs | `heelWalk` | F |
| Hip Abduction | legs | `abduction` | P |
| Jump Rope | legs | `jump` | F |
| Jumps | legs | `jump` | F |
| Knee Raise | legs | `kneeRaise` | F |
| Leg Curl | legs | `legCurl` | P |
| Leg Extension | legs | `legExtension` | P |
| Lunge | legs | `lunge` | F |
| RDL | legs | `hinge` | P |
| Resisted Hip Adduction | legs | `adduction` | P |
| Resisted March | legs | `walk` | F |
| Seated Calf Raise | legs | `seatedCalf` | P |
| Side Steps | legs | `sideStep` | F |
| Single-Leg Balance | legs | `balance` | S |
| Squat | legs | `squat` | P |
| Standing Calf Raise | legs | `calf` | P |
| Step-Up | legs | `step` | F |
| Sumo squat | legs | `sumoSquat` | P |
| Uphill Walk | legs | `walk` | F |
| Walking | legs | `walk` | F |
| Arnold press | shoulders | `arnold` | D |
| Band External Rotation | shoulders | `external` | D |
| Face Pull with External Rotation | shoulders | `facePullRotated` | D |
| Lateral Raise | shoulders | `armRaise` | P |
| Overhead Press | shoulders | `overhead` | P |
| Y-raise | shoulders | `armRaise` | P |

## Kryterium ukończenia kolejnych etapów

Każde ćwiczenie musi indywidualnie przejść: ocenę zakresu i kierunku ruchu, poprawność podparcia i chwytu, spójność pozycji startowej i końcowej, brak nienaturalnych przeskoków w połowie ruchu, ocenę sprzętu, kontrolę na telefonie i w przeglądarce oraz przejrzyste opisy techniczne. Dopiero potem może stracić oznaczenie „Szkic mechaniki 2D”.

## Kontynuacja: ćwiczenia 1–98 po kolei (22.10.2026)

Kompletny spis i statusy: docs/FITPLAN_EXERCISE_REVIEW_1_98.md. Po korektach katalog ma 67 wzorców (63 użyte). Próby skryptowe 95 szkiców po 101 położeń suwaka oraz Hip Thrust w 101 krokach nie wykazały zmiennej długości kontrolowanych segmentów, wyjść poza kadr lub przeskoków pozycji przekraczających przyjętą granicę. Kontrola kodowego renderowania 95 scen SVG przeszła. Dodatkowy test zapisano w tests/fitplan-motion-ordered-regression.test.cjs.

Wciąż nie zweryfikowano jakości biomechaniki ćwiczeń jako instruktażu; w szczególności Clamshell pozostaje nieruchomy w rzucie 2D i wymaga przebudowy do geometrii przestrzennej. Nie przeprowadzono npm run verify, verify:full, testów Chromium ani testu nowej wersji online. Gałąź main i Netlify bez zmian.
