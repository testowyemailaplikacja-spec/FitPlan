# FitPlan — Kettlebell Total Body Circuit (FBW / trening obwodowy)

**Data:** 01.11.2026. **ID:** WD-20261101-WIE-110-KB-FBW-01. **Autor kodu:** ChatGPT / GPT-6. **Zakres:** FitPlan, WIE-110, WIE-115 i WIE-117. **Status:** wdrożone w kodzie `develop`, formalny odbiór Work/Codex **BLOCKED**.

## 1. Badania i uzasadnienie konstrukcji

**Oficjalne źródła (nie kopie programów):**

1. ACSM 2026, [Resistance Training Prescription: An Overview of Reviews](https://pubmed.ncbi.nlm.nih.gov/41843416/) i [tekst pełny](https://pmc.ncbi.nlm.nih.gov/articles/PMC12965823/). Analiza 137 przeglądów systematycznych: dobór objętości, obciążenia i sposobu prowadzenia zależnie od siły, rozbudowy mięśni i mocy. Wzrost siły wspierają wyższe obciążenia; hipertrofię większa tygodniowa objętość, a wysiłku nie trzeba zawsze kończyć upadkiem mięśniowym. **Nie ustanawia to ściśle optymalnych przerw i tempa dla każdego użytkownika**.
2. ACE, [How to Get Started With Kettlebells](https://www.acefitness.org/resources/pros/expert-articles/5269/how-to-get-started-with-kettlebells/). Poprawna technika i nauka zawiasu biodrowego poprzedzają swing i zaawansowane ruchy; jakość przed szybkością i ciężarem; krótkie serie i odpoczynek.
3. StrongFirst, [Kettlebells Require Expert Instruction](https://www.strongfirst.com/begin/). W przypadku ćwiczeń z odważnikiem zalecana nauka techniki, najlepiej pod okiem wykwalifikowanego instruktora.

**Wzorce funkcjonalne konkurentów:**

- Fitbod, [How Fitbod Creates Your Workout](https://help.fitbod.me/hc/en-us/articles/360004429814-How-Fitbod-Creates-Your-Workout) (aktualizacja IX 2026): cele, doświadczenie, sprzęt, czas, regeneracja, zmienność, treningi obwodowe i zmiana ćwiczeń.
- Fitbod, [Workout Customization](https://help.fitbod.me/hc/en-us/sections/31812780318743-Exercise-Workout-Customization): podmiana ruchów, czas sesji, sprzęt i intensywność chwilowa.
- Hevy, [Feature comparison](https://www.hevyapp.com/compare/fitbod/): szybkie wpisywanie serii, ostatni wynik, timer i RPE/RIR.
- Boostcamp, [Workout trackers compared](https://www.boostcamp.app/compare/workout-tracking): historia poprzednich serii, RPE, zestawy, obwody i licznik przerw.
- StrengthLog, [Training Reports](https://help.strengthlog.com/help-article/training-reports/): sesje, objętość, powtórzenia, serie, mięśnie i porównanie okresów.

**Podział nauka / własne decyzje:** 20/40/60/80/100 minut, 5/7/10 dni i 1–2/3/4 sesje to wybory produktu. Liczby powtórzeń i przerw w poniższym silniku są **prototypowymi parametrami do sprawdzenia przez trenera**, a nie gotowym, zwalidowanym schematem klinicznym ani kopią tabel konkurentów.

## 2. Siedem celów programu

| Cel UI | Intencja | Prototypowe powtórzenia | Przerwa orientacyjna |
|---|---|---:|---:|
| Sprawność ogólna | Równomierny trening całego ciała | 8 | ≥90 s |
| Rozbudowa mięśni | Hipertrofia | 10 | ≥90 s |
| Rekompozycja sylwetki | Poprawa składu ciała | 10 | ≥90 s |
| Redukcja z ochroną mięśni | Utrzymywanie mięśni podczas redukcji masy | 10 | ≥90 s |
| Siła całego ciała | Bardziej wymagające obciążenia, więcej odpoczynku | 6 | ≥150 s |
| Technika i kontrola ruchu | Poprawny ruch, powolniejszy etap | 6 | ≥120 s |
| Kondycja i wytrzymałość | Obwody, tolerancja wysiłku | 12 | ≥90 s |

**Ważne:** samo wskazanie „redukcji” nie wywołuje redukcji tkanki tłuszczowej; znaczenie ma bilans energetyczny i regeneracja. Repetytorium siłowe jest współzależne od indywidualnie dobranego ciężaru; aplikacja **nie zgaduje kilogramów** z poziomu.

## 3. Trzy poziomy i katalog ćwiczeń

Działający istniejący `apps/fitplan/data/kettlebell-catalog.js` zawiera **31 ćwiczeń z trwałymi ID `kb-...`**. Nowy program wybiera jedynie ID z tego rejestru, bez kopiowania ćwiczeń i animacji. Trzy poziomy **programu obwodowego** nie usuwają czterech poziomów istniejącego ręcznego kreatora kettlebell.

- **I Fundamenty**: deadlift, row, floor press, goblet squat, glute bridge. Bez dynamicznych swing/clean/snatch. Przy krótkim treningu priorytet: zawias biodrowy + wiosłowanie + wypychanie.
- **II Rozwój**: swing oburącz po nauce zawiasu, goblet squat, row, strict press, reverse lunge, floor press. Technika i warunki bezpieczeństwa konieczne.
- **III Zaawansowany**: clean, rack squat, row, strict press, reverse lunge, floor press, swing oburącz. To nie jest instrukcja opanowania zaawansowanego ruchu; przy braku techniki trzeba przejść na niższy poziom i instruktora.

Powtórzenia w ćwiczeniach jednostronnych interpretować jako **sumę obu stron**; przyszły mechanizm ma je rozdzielać na lewą/prawą, aby nie maskować asymetrii.

## 4. Jak liczymy obwód

Konfiguracja: poziom I/II/III, cel, budżet czasu 20/40/60/80/100, cykl 5/7/10 dni i rzeczywista liczba jednostek **1–2 przy 5 dniach, 1–3 przy 7, 1–4 przy 10**. Kolejność ćwiczeń jest stabilna; wybór nie może nadpisać historii.

Silnik `FitPlanKettlebellCircuit.proposal(state,lib,load)` korzysta z istniejącego `FitPlanTrainingLoad.fitToTime`, w którym uwzględnione są: tempo powtórzeń, rozgrzewka, przejścia, przerwy pomiędzy seriami, schłodzenie. Jeżeli w krótkim budżecie nie mieści się całość, w **pierwszej kolejności zmniejsza liczbę rund**, później liczbę ćwiczeń (minimum trzy podstawowe wzorce), a na koniec liczbę powtórzeń. **Nie skraca narzuconych minimalnych przerw i nie mnoży serii tylko po to, aby wypełnić 100 minut**. Dla treningu siłowego 20 min system ostrzega o skróconym, minimalnym obwodzie i wymaga uważnej oceny jakości. Nie może wymyślić ćwiczeń niedostępnych dla danego poziomu.

Jednostki w cyklu otrzymują orientacyjny dzień z rozszerzenia wspólnego silnika `customCyclePlan` (5 dni → 1 i 3 dla 2 sesji; 7 dni → 1 i 4 dla 2 sesji lub 1,3,5 dla 3; 10 dni → 1 i 6 dla 2 sesji, 1,4,7 dla 3 lub 1,4,7,9 dla 4). To nie zapis rzeczywistej daty, urlopu, choroby czy podróży. Powiązanie z kalendarzem konta wymaga Work i synchronizacji po etapie 00.

## 5. Co jest zapisywane i jak oblicza się następną jednostkę

**Lokalny rekord** `fitplan.kb-fbw-circuit.v1` zawiera konfigurację i rzeczywiście potwierdzone sesje. Każda sesja: data ISO, numer cyklu i jednostki oraz każda wykonana seria (`id`, `target`, `actual`, `kg`, `rir` lub null, `form=good|needs-work|unknown`). Brak kilogramów, ujemne powtórzenia, dane spoza katalogu lub uszkodzona historia są odrzucane, bez cichego kasowania i przepisywania starszych wpisów. Limity: 300 sesji / 30 serii na sesję / 300 wykonanych powtórzeń w serii / 200 kg / historia do 300 KB.

**Dopasowanie następnego celu danego ćwiczenia**: jeśli wszystkie jego ostatnie serie osiągnęły cel, technika była oznaczona `good`, a RIR wynosił ≥2 **albo był niewpisany, ale faktycznie wykonano więcej niż cel**, system proponuje **+1 powtórzenie** przy ostatnio wpisanym ciężarze (ciężar jest podpowiedzią do świadomego wyboru, nie automatycznie zapisywany). Jeśli ostatnie wykonanie spadło poniżej 85% celu, technika wymaga poprawy albo RIR=0, system proponuje **−2 powtórzenia**. W innych sytuacjach utrzymuje cel. Samo dokładne wykonanie celu przy niewpisanym RIR **nie jest** automatycznym sygnałem zwiększenia obciążenia. Po zmianie celu lub poziomu bazowe repetycje nowego celu nie są dziedziczone ze starego planu; zmiana częstotliwości nie zmienia numerów historycznych sesji. Limity 3–30 powtórzeń w serii, lżejszy co piąty cykl ~65% celów. To mechanizm **heurystyczny i ostrożny**, nie diagnoza przetrenowania ani automatyczna zmiana masy odważnika. Dalsza wersja ma uwzględniać minimum dwa porównywalne treningi, RPE, dłuższe przerwy i indywidualne tempo.

**Nie udajemy wyników**: powtórzenia planowane nie zwiększają statystyk, kilogramy nie są automatycznie dobierane; użytkownik wpisuje `actual` i `kg` do każdej serii, może wykonać więcej, mniej lub zero, a po zatwierdzeniu jest widoczny różnicowy wynik względem celu.

## 6. Panel użytkownika i analiza postępów

W ekranie programu i w istniejącym FitPlan `podsumowanie-wynikow` widać ilość ukończonych jednostek, powtórzenia w bieżącym cyklu, powtórzenia od początku, serie i objętość `Σ(kg×rzeczywiste powtórzenia)` (tylko przybliżony wskaźnik objętości, zwłaszcza dla ruchów asymetrycznych). Porównanie każdej powtarzającej się pozycji z dwiema ostatnimi sesjami klasyfikuje **progres / regres / stagnację** wyłącznie według wpisanych powtórzeń, ciężaru i techniki. Nie wolno przedstawiać tego jako obiektywnego przyrostu mięśni, ubytku tłuszczu ani pomiaru zmęczenia układu nerwowego.

Dane są lokalne w profilu przeglądarki, więc profil wieloosobowy nie zapewnia prywatnej izolacji; integracja z kontem i RLS to odrębna praca WIE-117 po etapach Auth/Storage.

## 7. Kolejne technologie i priorytety Work/Codex

1. Realna walidacja 20/40/60/80/100 i wszystkich kombinacji celu/poziomu, brak przekroczenia limitu i skracania przerw.
2. Testy 5/7/10 dni, 1–4 jednostek, odpoczynku 48–72 h, przerw po chorobie i wakacjach; synchronizacja dat.
3. Ocena trenera wszystkich 7 celów i domyślnych przerw; formalna etykieta „przetestowane” dopiero po ocenie.
4. Eksport/import kompletnej historii, backup, kontrola kwot localStorage, migracje i izolacja kont po etapie 00.
5. RIR/RPE per seria i sesja, edycja błędnie wpisanej serii, cofnięcie ostatniej sesji, jawne zapisy szkiców.
6. Dobór rzeczywiście posiadanych kettlebelli, jeden/dwa odważniki, kilogramy i bezpieczne warianty bez zgadywania ciężaru.
7. **Wymiana ćwiczeń:** w obrębie tego samego wzorca ruchowego, poziomu i dostępnego sprzętu; zachować stary identyfikator w historii, nowy plan i indywidualną skalę porównania.
8. Ruchy jednostronne: oddzielnie lewa/prawa, asymetria i prawidłowe przeliczenie czasu/objętości.
9. Kontrola czasu rzeczywistego ze stoperem i przerwami, ręczne nadpisanie planu i potwierdzenie techniki.
10. Prawidłowy monitoring przetrenowania: tylko przybliżone heurystyki bez diagnoz medycznych, informacja o regeneracji, śnie, stresie i samopoczuciu.
11. Statystyki: porównanie cykli, wykres trendów, rekordy ćwiczeń, osobne metryki objętości i wyników wydolnościowych.
12. Dostępność: UI 320/390/768/1440, trzy motywy, brak scrolla całej strony przez tabelę, czytelne etykiety, PL/EN, PWA offline.
13. Pełna regresja `node --test tests/fitplan-kettlebell-circuit.test.cjs tests/fitplan-kettlebell.test.cjs`, `npm run check:fitplan`, `npm run verify`, `npm run verify:full`. Przed Netlify porównać aktualny `develop` i wdrożony `build-info.json`.
14. Nie usuwać starego edytora kettlebell (cztery poziomy) i nie dopisywać sztucznych jednostek do danych konta.
15. **Częściowo wdrożone w pompkach:** w `pushup-100.js` dodano liczenie wszystkich rzeczywistych repetycji także w niepełnych sesjach, repetycji bieżącego tygodnia, różnicę ostatniej sesji względem celu oraz trend znormalizowany względem zaplanowanego celu; nowe karty w UI. **Nadal do Work:** wspólne RIR/technika, faktyczne zmiany jednostek, korekty wpisów, porównania w długich blokach i eksport. Nie tworzyć sztucznego kg dla pompek.

**Testy przed odbiorem:** uruchomiono izolowane 315 kombinacji planów (3 poziomy × 7 celów × 5 czasów × 3 cykle) i 9/9 testów logiki kettlebell w V8, a także 10/10 testów logiki pompek w izolowanym runnerze (bez JSDOM). E2E, test na urządzeniu, `verify`, `verify:full`, rzeczywisty Netlify SHA i review specjalisty nie były uruchomione. Dlatego formalnie **BLOCKED**. Zadanie i raport: `docs/wiedora-quality/tasks/WD-20261101-WIE-110-KB-FBW-01.md`.

## Korekta programu i UX — 01.11.2026, WD-20261101-WIE-110-KB-UX-FIX-02

Po porównaniu rozwiązania Hevy (rejestrowanie serii i podgląd wcześniejszych wyników), Fitbod (czytelna konfiguracja celu/czasu) i Strong (oddzielenie szablonu od wykonanej sesji) wdrożono własny, czytelniejszy układ: trzy kroki, karty ćwiczeń na telefonie do 700 px zamiast szerokiej tabeli, licznik kompletnych wpisów i przycisk jawnego uzupełnienia ostatniego ciężaru. Nie kopiowano grafik ani chronionego wyglądu konkurencji. Szkic trwa tylko w bieżącej stronie i nie jest trwałym zapisem po jej ponownym załadowaniu.

Naprawa krytyczna: zaniżone wartości serii piątego cyklu nie stanowią nowego celu bazowego w tym samym ani następnym cyklu; progresja w zwykłych jednostkach korzysta z ostatniej porównywalnej sesji poza deload, a trend ignoruje celowo lżejsze treningi. Historia odrzuca niekanoniczne identyfikatory i ćwiczenia niezgodne z zapisanym poziomem. Formularz wykrywa zmianę ID, celu, cyklu lub slotu w innej karcie i blokuje niewłaściwe przypisanie wyników. Zachowano indywidualne ręczne wpisy kg, RIR, wyniki 0 i cały katalog 31 ćwiczeń.

Weryfikacja izolowana 315 kombinacji V8 + sekwencja 10 treningów i uszkodzony identyfikator PASS. Nowe testy Node zapisane w tests/fitplan-kettlebell-circuit.test.cjs; natywny Node/JSDOM, trzy motywy, pełna regresja i urządzenie rzeczywiste wymagają osobnego odbioru. [Raport](./wiedora-evidence/WD-20261101-WIE-110-KB-UX-FIX-02.md).
