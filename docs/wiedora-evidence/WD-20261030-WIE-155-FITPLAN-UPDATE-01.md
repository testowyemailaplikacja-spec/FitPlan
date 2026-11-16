---
change_id: WD-20261030-WIE-155-FITPLAN-UPDATE-01
task_ids: [WIE-155, WIE-005]
phase: "00"
actor: "Codex / GPT-6 (pełna wersja nieustalona)"
date: 2026-10-30
source_commit_sha: e50078e144dde42dbc393f10f38fd05f521d0f62
source_tree_sha: 12d6942a975366a652d477b24d5a228d61892b8c
status: "WDROŻONE I PRZETESTOWANE — zakres odporności cache"
deploy_sha: 358067601c228478047ab9e57dc88793f1a4f3ba
---
# WIE-155 — aktualizacja pakietu offline FitPlan

## Przejęcie bez dublowania

Baza tej partii obejmuje osiem nowszych commitów dokumentacyjnych zwykłego Chatu po `cb0383a`. Przeczytano i zachowano jego raporty [ID FitPlan](./WD-20261030-WIE-002-FITPLAN-ID-READONLY-01.md), [archiwum Podróży](./WD-20261030-WIE-007-TRAVEL-DATA-READONLY-01.md) oraz [statycznych manifestów PWA](./WD-20261030-WIE-155-PWA-STATIC-READONLY-01.md). Nie powtórzono inwentaryzacji 253 ćwiczeń, 1014 wpisów Podróży, manifestu 61 kafli ani porównania czterech manifestów. Kod aplikacji od poprzedniej partii nie zmienił się. Nowy zakres to zachowanie prawdziwego Service Workera FitPlan podczas aktualizacji i błędnego pobierania.

Obowiązują masterplan v5, etap 00, WIP=1 (FitPlan), aktualne AGENTS.md i FITPLAN.md. Przeszukano aktywne bug_reports FitPlan po offline/pobieraniu/cache: brak dopasowań. Nie zmieniono żadnego zgłoszenia, danych konta, ról, Supabase ani main. Zgoda właściciela na testowe Netlify pozostaje podstawą ewentualnego wydania po regresji.

## Potwierdzony błąd i przyczyna

`apps/fitplan/sw.js` sprawdzał tylko `response.ok`. Odpowiedź HTTP 200 z `Content-Type: text/html`, zwrócona zamiast pliku JS lub CSS przez fallback SPA, trafiała do cache jako poprawny zasób. Aktualizacja zgłaszała sukces, zapisywała marker gotowości i usuwała poprzedni pakiet. Taki pakiet nie gwarantował wykonania skryptu przy kolejnym otwarciu offline.

Pierwsze dwa nowe testy zachowania odtworzyły błąd dla `modules/start.js` i `styles/start.css` (RED 2 FAIL, dotychczasowe 8 PASS). Następnie prawdziwy Chromium z rzeczywistym Service Workerem i Cache Storage odtworzył ten sam błąd: HTTP 503 zachowywało poprzedni pakiet, natomiast HTML/200 kończyło aktualizację bez zgłoszenia nieudanego pliku.

Naprawa odrzuca HTML dla zasobów `.js` i `.css` przed ich zapisaniem w cache, zarówno przy pobieraniu pakietu, jak i zwykłym odczycie skryptu/arkusza. Przy błędnej odpowiedzi podczas pracy zwraca istniejącą poprawną kopię; bez takiej kopii zwraca błąd zamiast HTML udającego kod. Wykorzystuje istniejące liczenie błędów, komunikaty i zachowanie poprzedniej generacji; nie dodaje nowego magazynu ani mechanizmu kont. Cache FitPlan ma nową generację `20261030-update-v2`. Układ, manifest, ikona, postępy i identyfikatory ćwiczeń pozostają bez zmian.

Przegląd kodu wskazał drugą drogę zapisu: zwykła odpowiedź sieciowa skryptu mogła nadpisać cache HTML-em. Dodatkowe dwa testy Node odtworzyły to zachowanie (RED 2 FAIL, 10 PASS); przeglądarka również zwróciła HTML zamiast pobranego wcześniej skryptu. Wspólną walidację zastosowano w obu miejscach zapisu. Powtórny przegląd nie wykazał uwag Critical/Important/Minor do rozszerzenia. Nie oznacza on odbioru urządzeń, kont ani Netlify.

## Testy rzeczywistego silnika przeglądarki

`tests/fitplan-offline-update.browser.cjs` uruchamia lokalny HTTP i niezmienioną aplikację. Symulacja poprzedniego wydania zmienia wyłącznie nazwę cache w serwowanym workerze oraz dodaje znacznik wersji do HTML. Nie jest to historyczny deploy ani fizyczna instalacja PWA. Działa prawdziwy SW, parser, Cache Storage, localStorage i ramka FitPlan. Obce HTTPS są blokowane; brak konta i kontaktu z rzeczywistym backendem.

Rozłączenie wymusza zarówno przeglądarka, jak i lokalny serwer, który zrywa żądania. Jest to istotne, ponieważ w tej konfiguracji samo `context.setOffline(true)` nie zatrzymywało niezależnych żądań istniejącego workera: pierwsza diagnostyczna próba odczytała nową powłokę z serwera. Test został doprecyzowany przed oceną aplikacji; nie uznano samej flagi przeglądarki za dowód braku sieci.

| Scenariusz | Wynik po naprawie |
|---|---|
| Pełny pakiet poprzedniej generacji | PASS |
| HTML podczas zwykłego odczytu skryptu | PASS: zwrócono zachowany właściwy skrypt, z identycznym SHA-256 |
| HTTP 503 podczas aktualizacji | PASS: failed=1, poprzedni pakiet zachowany, nowy bez markera gotowości |
| Zamknięcie i otwarcie offline po tej awarii | PASS: poprzednia powłoka i ramka, zachowany syntetyczny plan |
| HTTP 200 HTML zamiast skryptu | PASS: failed=1, poprzedni pakiet zachowany, nowy bez gotowości |
| Ponowienie przy poprawnych odpowiedziach | PASS: failed=0, nowy gotowy pakiet, poprzedni usunięty dopiero po ukończeniu |
| Zamknięcie i ponowne otwarcie offline po sukcesie | PASS: nowa powłoka i ramka, ten sam syntetyczny plan |
| Pierwsze pobieranie z HTML zamiast skryptu | PASS: CACHE_ERROR, brak gotowości i flagi włączenia, przycisk pozwala ponowić |

Syntetyczny plan używa istniejącego `fitplan.start.exercises.v1` z `["chest-pompki"]`. Ten test dowodzi zachowania lokalnego klucza podczas aktualizacji SW; nie jest testem konta ani synchronizacji wszystkich danych.

Testy Node: `node --test tests/fitplan-service-worker.test.cjs tests/fitplan-offline-control.test.cjs tests/offline-worker.test.cjs` — **21 PASS, 0 FAIL, 0 SKIP**. Test przeglądarkowy — **8/8 PASS**. `package.json` włącza ten test do `test:regression` i udostępnia `npm run test:fitplan:offline-update`; brak komentarzy w JSON jest wyjątkiem składniowym, autorstwo zapisano tutaj i w commicie. [Wyniki i hashe](./WD-20261030-WIE-155-FITPLAN-UPDATE-01-TESTS.json).

## Blokada testu obrazów i jej diagnoza

Pełny przebieg finalnego zakresu zatrzymał się po 851 Node PASS i 8/8 testach aktualizacji offline na porównaniu obrazu notatki Prawa. Przypadek odtworzono osobno: różnica 43 pikseli dotyczyła krawędzi nieruchomego paska nad notatką, nie jej treści. [Diagnoza WIE-005 i test mutacyjny](./WD-20261030-WIE-005-NOTE-SCREENSHOT-01.md). Izolacja zewnętrznych nakładek dotyczy wyłącznie pary zrzutów w teście; wzorca ani zerowej tolerancji nie zmieniono. Kontrolne przesunięcie notatki o 1 px nadal daje FAIL. Nie zmieniano kodu aplikacji Prawo. Ten nieudany pełny przebieg jest zachowany jako FAIL, nie jako zaliczona bramka wydania.

## Końcowa bramka lokalna

`npm run verify:full -- --changed apps/fitplan/sw.js,tests/fitplan-service-worker.test.cjs,tests/fitplan-offline-update.browser.cjs,tests/law-citations.browser.cjs,package.json` — **PASS, exit 0**, na finalnym kodzie i bez diagnostycznych preloadów. Zewnętrzne środowisko narzędzi: Playwright 1.55.1 / Chromium Headless Shell 140.0.7339.186, PGlite 0.5.13; NODE_PATH i PLAYWRIGHT_BROWSERS_PATH poza repo, lockfile bez zmian.

**851 Node PASS, 0 FAIL, 0 SKIP**; test aktualizacji FitPlan 8/8 włączony do tego przebiegu; 33 przebiegi cytowań, 6 porównań obrazów, interakcje, motywy/języki, Packet Lab, audyty zasobów i 54 kombinacje prototypu PASS. Poprzedni pełny przebieg z błędem obrazu pozostaje oznaczony FAIL; nie zastąpiono jego wyniku etykietą PASS.

## Faktyczne wydanie i test na Netlify

Wydanie testowego develop: **`358067601c228478047ab9e57dc88793f1a4f3ba`**, build **2026-10-30T14:12:01.289Z**, fingerprint `ba52bb4ffdbd176d3bb0e5e5445513c51adf0216519b25bf2965bc780a7686c6`. Commit zawiera obie partie WIE-155 oraz pomocniczą WIE-005. Publikacja z Git, kontrola expected_sha i bez force; zachowano wszystkie osiem wcześniejszych commitów Chatu. [Dowody live](./WD-20261030-WIE-155-FITPLAN-UPDATE-01-LIVE.json).

Odczyt publiczny potwierdził dokładne SHA wydania i zgodność SHA-256 `apps/fitplan/sw.js` z lokalnym kodem: `ba05ea179159fc78b78fc68b7851a761d5ac89166a373ec6f166ff38b835f44a`. Build-info oraz SW mają testowe `X-Robots-Tag: noindex, nofollow`. Produkcja nadal `316a2441bb592b0cdfb4791834121d8f7c4a1b05`, bez testowego nagłówka. Nie powtarzano statycznych audytów Chatu.

W rzeczywistym Chrome otwarto publiczny FitPlan, kliknięto pobieranie offline, zaobserwowano „Pobieranie 84%”, następnie **„Offline gotowe”** i ponownie aktywny przycisk. Zapisano zrzut ekranu i jego hash. To pozytywny test pobrania na Netlify; nie test fizycznej instalacji ani rozłączenia sieci w tej przeglądarce. Awarie, stare/nowe generacje i ponowne otwarcie bez sieci są potwierdzone osobnym lokalnym testem rzeczywistego SW. Nie wstrzykiwano błędnych plików do publicznego hostingu.

## Środowisko i granice

Przy pierwszej próbie brakowało pliku Chromium, więc aplikacja nie była jeszcze testowana. Przywrócono oficjalny Chromium Headless Shell 140.0.7339.186 / Playwright 1.55.1 poza repozytorium. Instalator zgłosił problemy archiwów i lockfile przy dodatkowym FFmpeg; działający plik headless_shell zweryfikowano przez `--version` i powyższe testy. Produkcyjne zależności i lockfile pozostały bez zmian.

Pełna regresja przed wydaniem jest osobnym krokiem i nie wynika z tych 21 testów. Pierwszy pełny przebieg dotyczył początkowego zakresu; po odtworzeniu drugiej drogi zapisu uruchomiono nowy przebieg końcowy na finalnym kodzie. Nie ma trzech rzeczywistych urządzeń, fizycznej instalacji PWA, prawdziwych sesji, pełnego odbioru synchronizacji ani gwarancji wszystkich rodzajów błędnych odpowiedzi. Walidacja tej poprawki dotyczy HTML zamiast JS/CSS, nie skanowania treści czy integralności każdego formatu.

**WIE-155 oraz cały etap 00 pozostają CZĘŚCIOWE.** Zachowane wcześniejsze dowody i decyzje właściciela mają być używane w dalszej pracy, a nie odtwarzane od początku.
