---
change_id: WD-20261030-WIE-002-FITPLAN-ID-READONLY-01
task_ids: [WIE-002]
phase: "00"
actor: "ChatGPT / GPT-6"
date: 2026-10-30
source_masterplan: docs/WIEDORA_MASTERPLAN_FULL_v5.md
source_version: "v5 / 2026-10-29"
branch: develop
source_commit_sha: "cb0383a7ecdafebe87569c1ce7a87dd2a0d6ab5a"
deploy_sha: "NOT_CHECKED"
scope_files:
  - apps/fitplan/data/app-data.js
  - apps/fitplan/data/muscles.js
  - apps/fitplan/data/exercise-catalog.js
  - apps/fitplan/data/kettlebell-catalog.js
  - apps/fitplan/data/training-extensions.js
  - apps/fitplan/data/exercise-registry.js
  - apps/fitplan/modules/workout-plan.js
  - apps/fitplan/modules/start.js
  - apps/fitplan/core/storage.js
  - apps/fitplan/core/state.js
tests:
  - scenario: "odczyt i uruchomienie sześciu niezmienionych modułów danych w izolowanym kontekście JS"
    result: PASS
  - scenario: "niepuste i unikalne ID w pięciu kolekcjach runtime"
    result: PASS
  - scenario: "kontrola aliasów, poprawnego i błędnego wyszukania ID"
    result: PASS
  - scenario: "negatywna fikstura: zmiana nazwy ćwiczenia zmienia wyliczany identyfikator"
    result: PASS
  - scenario: "migracja prawdziwych danych, sesji, PWA i deployment"
    result: NOT_RUN
decision_refs: [DEC-20261029-008]
status: "DOKUMENTACJA"
limitations:
  - "Izolowane uruchomienie modeli danych nie zastępuje testu w przeglądarce, serwera ani kont użytkowników"
  - "Nie przeprowadzono migracji ani testu zachowania rzeczywistego postępu po zmianie nazwy"
next_step: "Codex/Work: zabezpieczyć niezmienne ID fiksturą aliasów i testami zgodności zapisanych planów przed przyszłą zmianą katalogów"
---

# WIE-002 — bezinwazyjny audyt identyfikatorów ćwiczeń FitPlan (30.10.2026)

## Dlaczego wykonano

Rozszerzenie [wcześniejszego audytu WIE-002](./WD-20261030-WIE-002-LOCAL-INVENTORY.md), który obejmował CCNA, część Prawa, Oficerską i klucze wspólnego storage, ale **nie podawał liczebności ani zachowania ID katalogu ćwiczeń FitPlan**. To kontrola pomocnicza do etapu 00, bez ponawiania inwentaryzacji już wykonanych modułów.

## Metoda i pozytywne wyniki

Z GitHub `develop` odczytano wskazane w metadanych pliki. Sześć niezmienionych skryptów danych (`app-data.js`, `muscles.js`, `exercise-catalog.js`, `kettlebell-catalog.js`, `training-extensions.js`, `exercise-registry.js`) uruchomiono sekwencyjnie **w izolowanym obiekcie `window` wewnątrz lokalnej ewaluacji JS**, bez DOM, sieci, logowania, dostępu do localStorage czy produkcyjnego Supabase. Następnie zbadano wynikowe kolekcje; źródeł nie modyfikowano.

| Kolekcja | Liczba rekordów | Unikalne ID | Puste ID | Duplikaty |
|---|---:|---:|---:|---:|
| `FitPlanData.modules` | 7 | 7 | 0 | 0 |
| `FitPlanExerciseCatalog.items` (atlas) | 98 | 98 | 0 | 0 |
| `FitPlanKettlebellCatalog.items` | 31 | 31 | 0 | 0 |
| `FitPlanTrainingExtensions.items` | 130 | 130 | 0 | 0 |
| `FitPlanExerciseRegistry.items` (kanoniczny widok) | 253 | 253 | 0 | 0 |

Źródłowe 98 + 31 + 130 = **259** rekordów; kanoniczny rejestr ma **253**, ponieważ scala odpowiedniki i utrzymuje **6 aliasów**. Brak surowych kolizji ID między trzema kolekcjami źródłowymi. Siedem ID modułów jest jawnych i nie zależy od widocznych polskich etykiet (np. `podsumowanie-wynikow` pozostaje identyfikatorem Panelu sterowania).

Dodatnie odczyty rejestru: `canonicalId("Pompki")` i `canonicalId("Push-Up")` zwracają to samo `chest-pompki`; `canonicalId("kb-goblet-squat")` zwraca to ID. Ujemny odczyt `canonicalId("nieistniejace-cwiczenie")` zwrócił `null`. To kontrola runtime modeli danych, **nie** kliknięcie w aplikację.

## Konkretne ryzyko przyszłych modyfikacji

- `data/exercise-catalog.js`: ID atlasu oblicza z `record.category` i `record.name` (`toLocaleLowerCase("pl-PL")`, `NFD`, zamiana znaków niealfanumerycznych). **Zmiana nazwy lub kategorii może zmienić ID**, mimo że tekst dla użytkownika powinien móc ewoluować.
- `data/training-extensions.js`: ID `fx-...` powstaje z nazwy ruchu. Zmiana nazwy również może spowodować zmianę ID.
- `data/kettlebell-catalog.js`: ID `kb-...` pochodzi z jawnie zapisanego `slug`; nie jest w tym pliku generowany ze zmiennej etykiety.
- `data/exercise-registry.js`: istnieje kanonizacja i 6 aliasów, ale nie udowodniono, że obejmują **przyszłe** przemianowania.
- `modules/start.js`: `fitplan.start.exercises.v1` przechowuje tablicę ID; przy wczytywaniu nieistniejące ID są filtrowane przez `byId.has(id)`. Zmiana ID **może usunąć element z odczytywanego planu**, jeśli nie zapewniono zgodnego aliasu/migracji. Nie stwierdzono faktycznej utraty danych użytkownika.
- `modules/workout-plan.js`: postęp/wybór wiążą klucze `fitplan.plan.selected.v1`, `fitplan.<sport>.level.v1` oraz `fitplan.training.v2.<sport>.<level>.<goal>`; przy przebudowie nazw sportu/celu nie wolno zmieniać tych identyfikatorów bez testów zgodności. `core/storage.js` ma osobny stabilny klucz postępów modułów `planer-treningowy-progress-v1.6`.

**Negatywny test fikstury (bez modyfikacji katalogu):** algorytm obecnego atlasu wylicza dla kategorii `chest` i nazwy `Wyciskanie sztangi na ławce płaskiej` ID `chest-wyciskanie-sztangi-na-awce-p-askiej`; po dodaniu w nazwie `(nowa nazwa)` ID otrzymuje suffix `-nowa-nazwa`. Są różne. To demonstracja zależności ID od etykiety, nie wdrożona zmiana.

## Co zrobiono i czego nie zrobiono

**Zrobiono:** rzeczywistą, niepowtarzającą wcześniejszego raportu inwentaryzację kolekcji FitPlan, kontrolę unikalności i pustych ID, próby aliasów i negatywną fiksturę; odczytano miejsca użycia ID i kluczy przechowywania.

**Nie zrobiono:** żadnych zmian plików aplikacji, samych ID, danych, kluczy, Supabase, Netlify, `main`, testów CI ani migracji. Nie uruchomiono fizycznych urządzeń/PWA i nie testowano faktycznych kont. Audyt nie jest zatwierdzeniem globalnego WIE-002 ani etapu 00.

## Przekazanie bez dublowania

1. **Nie wykonywać drugi raz samego zliczenia 7/98/31/130/253**, dopóki nie zmienią się wskazane źródła (bazowe SHA powyżej).
2. Jeśli będzie trzeba przemianować ruch, najpierw przygotować test zachowania starego ID → nowy kanoniczny rekord i zapisanej tablicy `fitplan.start.exercises.v1`; wariant negatywny: brak aliasu nie może po cichu zmienić historii użytkownika.
3. Oddzielnie ocenić politykę trwałości `fx` i nazw sportów/celów w `workout-plan.js`; testować na kopii/syntetycznych danych, nigdy przez masową edycję identyfikatorów.
4. Codex/Work nadal ma do wykonania cały zakres WIE-002 poza tą inwentaryzacją, w tym pełną mapę innych domen oraz weryfikację zachowania rzeczywistych postępów dopiero po bezpiecznym przygotowaniu.

**Wynik końcowy tej partii: PASS dla audytu tylko do odczytu; WIE-002 nadal CZĘŚCIOWE; etap 00 NIEUKOŃCZONY.**
