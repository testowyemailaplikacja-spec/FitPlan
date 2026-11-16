# FitPlan

Moduł portalu pod `/apps/fitplan/`.

- `index.html` — shell aplikacji
- `router.js` — routing modułów i zakładek
- `legacy.html` — lekki Home i wspólny szkielet widoków
- `app-controller.js`, `modules/registry.js` — widoki i cykl aktywacji modułów
- `core/state.js`, `core/storage.js` — wspólny stan i jedyna granica zapisu
- `progress.js` — adapter postępu shellu do tej samej instancji w iframe
- `data/muscles.js` — pełny katalog 48 mięśni
- `modules/anatomy.js`, `modules/anatomy-runtime.js` — atlas uruchamiany na żądanie
- `data/anatomy-manifest.json`, `assets/anatomy/` — skompresowany model w wersjonowanych częściach

Atlas i model są pobierane dopiero przy wejściu do Tabeli ćwiczeń. Wyjście zwalnia renderer, animacje i nasłuchy. Manifest sprawdza rozmiary oraz SHA-256; dane modelu i siatki pozostały identyczne z wersją pierwotną.

Instalacja Service Workera pobiera tylko shell. Jawne pobranie aplikacji offline obejmuje także anatomię. Przy zmianie modelu trzeba nadać nowe nazwy części, przeliczyć manifest i listę zasobów offline.

Kontrola: `npm run check:fitplan`. Testy DOM i dekodera chronią nawigację, dane oraz ładowanie; ocenę renderowania WebGL wykonuje się osobno w przeglądarce.

`FitPlanState` powstaje przed uruchomieniem Home w dokumencie iframe. Shell,
`FitPlanRuntime.state` i kontekst aktywacji kontrolerów korzystają z tej samej
instancji. `snapshot()` udostępnia niemutowalną migawkę; `setNavigation()`
przechowuje bieżący moduł i zakładkę. Postęp jest dostępny przez `progress`,
a wpisy i widok kalendarza przez `calendar`. Moduły zapisują przez to API.

Istniejące klucze `planer-treningowy-progress-v1.6` i
`fitplan.calendar.entries.v2` oraz ich formaty pozostają zgodne. Start nie
migruje ani nie nadpisuje danych. Odczyt na bieżąco i zdarzenia `storage`
pozwalają zobaczyć aktualizacje z innych kart lub synchronizacji portalu.
Reset postępu zachowuje dotychczasowy zakres i nie usuwa wpisów kalendarza.
Zakres synchronizacji konta pozostaje dotychczasowy; renderer atlasu zarządza
własnymi ulotnymi zasobami GPU.


## Namespacing (etap 14/21)

Dokument aplikacji ma jawny root `data-fitplan-app="true"`. Wspólne nazwy zdarzeń
są zebrane w `core/events.js` i udostępnione przez `FitPlanEvents`; nowe
zdarzenia aplikacji powinny korzystać z prefiksu `fitplan:`. Zdarzenia
interakcji modułów należy podpinać do ich własnego hosta, nie do całego
`document`, jeśli nie jest to konieczne. Kalendarz obsługuje kliknięcia
wyłącznie w `#fitplanCalendarV2`, a jego dynamiczne style pól formularza są
ograniczone do tego korzenia. Atlas zachowuje własny namespace klas `.fp*`.
Iframe pozostaje twardą granicą stylów FitPlan względem portalu.
