# FitPlan

Osobne repozytorium modułu treningowo-dietetycznego FitPlan, wydzielonego z Wiedory.

## Pochodzenie

Odtworzono migawkę kodu z `wiedoraWeb/Constant_app`, gałąź `develop`, commit `b5979b303077ec65fd8247d6cf6715ce1ebf5bce`, katalog `apps/fitplan/`. Skopiowano wszystkie 106 plików modułu z zachowaniem identycznych SHA obiektów Git, w tym 18 części atlasu i 7 plików ilustracji ćwiczeń. Dołączono potrzebne adaptery portalu, zasoby Supabase, 54 pliki testowe, narzędzia i dokumentację.

To jest wydzielona kopia stanu plików, nie migracja historii commitów podkatalogu. Starego modułu w Wiedorze nie usunięto, aby uniknąć przerwy w działaniu.

## Struktura

- `apps/fitplan/` — aplikacja i zasoby, punkt wejścia `apps/fitplan/index.html`
- `apps/shared/`, `js/`, `assets/vendor/` — zależności współdzielone, potrzebne do uruchomienia poza hostem Wiedory
- `supabase/migrations/` — migracja pamięci zdjęć FitPlanu, **nie uruchamiać ponownie bez kontroli istniejącej bazy**
- `tests/fitplan-*` — testy modułu skopiowane z repozytorium głównego
- `scripts/fitplan/` — walidacja i narzędzia animacji
- `docs/FITPLAN*` — dokumentacja i wcześniejsze audyty

## Uruchomienie / testy

Po sklonowaniu uruchom `npm ci` i `npm run check:fitplan` (wymagany Node.js z obsługą jsdom 27). Zawartość strony należy serwować od katalogu głównego repozytorium, bo moduł używa ścieżek `/apps/fitplan/`. Konfiguracja `netlify.toml` umożliwia takie statyczne publikowanie.

## Granice wydzielenia

FitPlan nadal korzysta ze wspólnych funkcji logowania, przechowywania postępu i Supabase pochodzących z Wiedory. Przed uznaniem tego repozytorium za produkcyjne trzeba osobno odebrać testy Node, działanie w przeglądarce, PWA/offline, zapis i odczyt na koncie, a następnie skonfigurować połączenie w hoście Wiedory. Sam import kodu nie potwierdza działania integracji ani wdrożenia Netlify.
