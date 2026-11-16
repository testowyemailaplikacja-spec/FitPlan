# Audyt użytkowy FitPlan — develop

Data: 7 października 2026 r. Audyt i naprawy wykonano na `develop`.

Kod napraw: `f7b2da3028b7d38159c9f5fb4ee3eb4a898bc23e`. Korekta publicznego audytu: `6385c39648dbaa7d584cfda4b94065e7972dee54`. Odblokowanie wspólnego builda: `f322787012aa6a5ad97c6294c809791758e75870`.

Sprawdzono panel główny, dostęp gościa, kalendarz i edytor, historię nawigacji, postęp, kopie danych, atlas i wyszukiwanie, PL/EN, motywy, responsywność, aktualizacje offline oraz granice danych między kontami. Naprawiono wykryte problemy z interfejsem i utratą danych. Trzy istniejące szkice modułów oznaczono zgodnie z ich stanem.

**Aktualny stan po zgodzie użytkownika:** rzeczywiste logowanie, powrót do FitPlan, dostęp do atlasu oraz zapis i odczyt notatki z bazy konta zostały potwierdzone. Pełne odtworzenie interfejsu konta po nowej sesji, wylogowanie i zmiana konta pozostają do ręcznej weryfikacji z powodu ograniczenia narzędzia przeglądarki po logowaniu. Render 3D pozostaje niepotwierdzony z powodu braku WebGL. Szczegóły i sprzątnięcie danych testowych opisano w ostatniej sekcji.

| Problem i skutek dla użytkownika | Wprowadzona naprawa |
| --- | --- |
| Kalendarz przykrywał nagłówek, miał dwa powroty i nieopisane strzałki. | Normalny układ strony, pojedynczy powrót, pełne daty i etykiety dostępności; układ dopasowany do telefonu. |
| Zmiana dnia, miesiąca albo historii usuwała niezapisany szkic. | Potwierdzenie odrzucenia; anulowanie zachowuje notatkę, edytor i zgodny adres. Ponowne kliknięcie tego samego dnia zachowuje szkic. |
| Pusty zapis tworzył pozorny wpis. | Zapis wymaga notatki lub godziny i wyjaśnia brak danych. |
| Eksport pomijał notatki kalendarza. | Kopia v2 obejmuje postęp i cały kalendarz. Import starszego postępu zachowuje notatki. |
| Błędny import lub nieudany drugi zapis mógł częściowo zmienić dane. | Walidacja przed potwierdzeniem i wycofanie częściowego zapisu. Uszkodzony zapis źródłowy nie jest nadpisywany. |
| Zapis, usunięcie lub przeniesienie mogło nadpisać nowszą zmianę z innej karty. | Kontrola aktualności wpisu przed operacją; przy konflikcie szkic pozostaje dostępny. |
| Zapisane EN, dwóch tłumaczy i niewłaściwe zdarzenie psuły zmianę języka i motywu. | Wspólny tłumacz, poprawna kolejność ładowania i most preferencji; zmiana PL/EN nie tłumaczy treści notatek i nie usuwa szkicu. |
| Wyszukiwanie atlasu nie znajdowało widocznych angielskich nazw ćwiczeń. | Wyszukiwanie polskich, łacińskich i przetłumaczonych nazw oraz ćwiczeń, m.in. „bench press” i „push-ups”. |
| Bez WebGL przyciski modelu wyglądały na działające. | Jasny komunikat, wyłączone operacje 3D oraz dostępna lista, kategorie i opisy mięśni. |
| Kalendarz nie był objęty synchronizacją konta. | Synchronizacja notatek z metadanymi zmian, migracja starszych kopii i ochrona właściciela danych. |
| Pierwsze logowanie mogło utracić notatki gościa. | Połączenie notatek gościa z kontem; kolizja daty zachowuje oba opisy i godziny. |
| Wylogowanie mogło pozostawić chroniony atlas albo prywatny szkic na ekranie. | Zamknięcie chronionego widoku, usunięcie szkicu z interfejsu i powrót do dostępnego panelu. Zmiana konta nie przenosi notatek poprzedniego użytkownika. |
| Aktualizacja offline usuwała wymagany stary kod albo uznawała stary shell za nowy pakiet. | Poprzedni kompletny pakiet pozostaje do zakończenia pobierania nowego. Kod i style są odświeżane, a niezmienne części modelu mogą być ponownie użyte. |
| Plan, Dieta i Wyniki sugerowały gotową funkcjonalność. | Karty mają status „W przygotowaniu”; opis kalendarza i komunikat gościa odpowiadają dostępnym funkcjom. |
| Publiczny audyt szukał usuniętego, drugiego powrotu. | Test używa obecnego przycisku i dodatkowo mierzy przepełnienie, położenie kalendarza i widoczność nagłówka. |

## Weryfikacja

- `npm test`: **314/314 PASS**; `npm run check:fitplan`: **139/139 PASS**.
- Dodatkowa kontrola krytycznych ścieżek kalendarza, kopii i kont: **40/40 PASS**.
- Kontrola składni i lokalnych zasobów: brak problemów w kodzie FitPlan i brakujących zależności.
- Niezależny FitPlan CI, run `37576925225`: **SUCCESS**.
- Publiczny audyt wdrożenia, run `37578314913`: **SUCCESS — 33/33 kontroli, 0 błędów**. FitPlan nie zgłosił ostrzeżeń na żadnym z trzech widoków.
- W przeglądarce potwierdzono polski panel, kalendarz i otwarcie edytora przy szerokości 320 px, pełne etykiety dni oraz komunikat gotowego pakietu offline. Przed ograniczeniem sesji potwierdzono również angielski atlas i wyłączone kontrolki niedostępnego WebGL.
- Zachowano dane 48 mięśni, 99 siatek oraz hashe części modelu. Nie zmieniano anatomii w celu obejścia testów.
- Naprawy wdrożono na develop; metadane Netlify potwierdziły kod `f322787…`. SHA 30 plików napraw FitPlan pozostają zgodne z przetestowanym wydaniem.

Wspólną publikację zatrzymał późniejszy błąd w równoległym etapie przypisów KPA. Usunięto wyłącznie 21 nadmiarowych nawiasów, zachowując treści, 312 podsekcji, 2808 pytań i 470 podstaw prawnych. Kontrola startu 33 kursów i Law course integrity, run `37578314914`, zakończyły się powodzeniem. Ta korekta służyła odblokowaniu wdrożenia i audytu FitPlan.

| Widok w audycie wdrożenia | Szerokość | Przepełnienie poziome | Kalendarz nad nagłówkiem |
| --- | ---: | --- | --- |
| Komputer | 1440 px | brak | nie |
| Tablet | 1024 px | brak | nie |
| Telefon | 390 px | brak | nie |

Zrzuty tych widoków zapisano w artefakcie [Public site audit](https://github.com/Cerebrum09/Strona-aplikacji/actions/runs/37578314913).

## Granice potwierdzenia

Plan treningowy, Dieta i Podsumowanie wyników nadal są modułami w przygotowaniu. Audyt nie tworzył nowych produktów w miejsce tych szkiców.

Przeglądarka audytu nie udostępniała WebGL; sprawdzono dostępny tryb zastępczy i integralność danych, a nie wygląd renderu 3D. Ochrona sesji ograniczyła dalsze ręczne operacje po logowaniu. Zapis chmurowy, zmiana konta, wylogowanie, konflikty kart i błędy importu były sprawdzane na izolowanych scenariuszach testowych, bez modyfikowania notatek rzeczywistego konta. Gotowość cache została zaobserwowana w interfejsie; obsługę błędów pobierania i kolejnych generacji pakietu potwierdzają testy Service Workera.

## Kontynuacja po przerwaniu Work — 7 października 2026

Stan wyjściowy potwierdzono bezpośrednio w repozytorium: `develop` wskazywał `eeaa6c4899c2918a6bf1bc60990eafbc649f82cb`. Poprzednia sesja zapisała naprawy oraz raport; zielone przebiegi CI zostały ponownie odczytane. Kontynuacja sprawdza rzeczywisty zakres potwierdzenia, a nie sam status wpisany w notatce.

**Status pierwotnego wznowienia: publiczna część audytu potwierdzona; testy na rzeczywistym koncie oczekiwały na zgodę.** Zgoda i późniejsze wyniki są opisane w ostatniej sekcji. Nie oznaczać pełnego audytu użytkownika jako zakończonego przed pozostałą kontrolą odtworzenia interfejsu konta i wylogowania.

| Ścieżka sprawdzona w działającym develop | Wynik |
| --- | --- |
| Notatka z polskimi znakami i godzina 18:30; PL → EN podczas edycji | Treść, godzina i szkic zachowane; tekst notatki nie jest tłumaczony. |
| Próba zmiany miesiąca z niezapisanym szkicem i anulowanie potwierdzenia | Edytor pozostaje na właściwym dniu, szkic zachowany. |
| Zapis, odświeżenie strony i odtworzenie adresu modułu | Zapisany wpis widoczny po ponownym uruchomieniu aplikacji. |
| Przeniesienie własnego wpisu testowego z 31 na 30 października | Data zmieniona; notatka i godzina zachowane. |
| Eksport z przycisku aplikacji i ponowny import własnego pliku | Kopia `fitplan-backup` v2 zawiera postęp oraz wpis kalendarza; po potwierdzeniu importu wpis jest dostępny. |
| Kalendarz przy szerokościach 320, 390, 768 i 1280 px w produkcyjnym iframe | Bez przepełnienia poziomego; kalendarz nie zasłania nagłówka ani powrotu. |
| Oznaczenia dni minionych, bieżącego i przyszłych w jasnym motywie | Minione mają inne tło, bieżący żółte, przyszłe zwykłe. |
| Wejście gościa do Tabeli ćwiczeń | Poprawna blokada oraz link do formularza logowania z powrotem do FitPlan. |
| Pobranie pakietu offline z przycisku aplikacji | Pobieranie zakończone stanem gotowości; brak błędów offline w konsoli. |
| Motyw granatowy przy szerokości 390 px | Motyw ustawiony, bez przepełnienia poziomego. |
| Motyw szary i powrót do jasnego | Motyw iframe jest zgodny z wyborem; na końcu przywrócono PL i jasny motyw. |
| Wdrożone komunikaty offline EN i przełączenie na PL | Widoczne „Downloading 3%” oraz „Offline ready”; po przełączeniu „Offline gotowe”. |

W tej kontynuacji poprawiono pozostającą polską etykietę wersji w nagłówku EN. Nagłówek używa neutralnej nazwy `FitPlan • 1.7.0`; stopka nie opisuje już aplikacji jako jednoplikowej. Podczas pobierania pakietu offline znaleziono też nieprzetłumaczone etykiety pobierania i gotowości. Słownik FitPlan uzupełniono o procent postępu, stan pobierania, gotowość, błędy i komunikaty synchronizacji. Rzeczywisty wspólny tłumacz potwierdził te etykiety oraz powrót EN → PL. Nowa wersja adresu skryptu preferencji i generacja cache obejmują tę korektę. Nie zmieniano modelu, danych mięśni ani treści notatek użytkownika.

Odświeżenie strony ujawniło dodatkowo błąd wspólnego przycisku offline: zakończone `REFRESH_APP` pozostawiało stan `installing=true`, przez co przycisk blokował się na „Pobieranie…”. Obsługa `REFRESH_DONE` czyści teraz ten stan. Nowy test `tests/fitplan-offline-control.test.cjs` odtworzył błąd przed poprawką i potwierdził po niej gotowość, dostępność przycisku oraz datę zakończenia odświeżenia.

Świeże sprawdzenia po korektach, włącznie z nowym testem odświeżania offline: `npm test` **315/315 PASS**, `check:fitplan` **140/140 PASS**, `check:quick` **140 skryptów bez błędów składni oraz 215 odwołań w 21 plikach HTML bez brakujących zasobów**.

Weryfikacja pierwszej publikacji kontynuacji (`eb6454f…`): [FitPlan CI](https://github.com/Cerebrum09/Strona-aplikacji/actions/runs/37588690377) i [Public site audit](https://github.com/Cerebrum09/Strona-aplikacji/actions/runs/37588690502) zakończone **SUCCESS**.

Publikacja tłumaczeń `1649ef6b843ec6e9506057310e9115eb27cb35e3` została potwierdzona przez build-info Netlify i zgodność SHA256 plików index, preferences, sw i legacy. [FitPlan CI](https://github.com/Cerebrum09/Strona-aplikacji/actions/runs/37605286343) oraz [Public site audit](https://github.com/Cerebrum09/Strona-aplikacji/actions/runs/37605286399) zakończyły się **SUCCESS**.

### Końcowa naprawa odświeżania offline i wspólnego wdrożenia

Naprawa przycisku offline została opublikowana jako `cec7d7a9ca9c8b85d3887737d00eedfff1faa93b`. Build-info Netlify potwierdził ten commit, a SHA256 wspólnego offline-control i cache FitPlan były zgodne z lokalnie przetestowanymi plikami. [FitPlan CI](https://github.com/Cerebrum09/Strona-aplikacji/actions/runs/37606329607) zakończył się **SUCCESS**. Po odświeżeniu rzeczywistego kalendarza przycisk pokazuje „Offline gotowe”, jest dostępny i nie zgłasza błędów offline w konsoli.

Równoległe commity `e4650df…` i `6069052…` z przypisami etapów 7–8 kursu prawa anulowały wspólny audyt i nie przeszły kontroli składni procedure.js. Następnie równoległa sesja opublikowała naprawę `095f0e4…` i domknięcie etapu 8 `420aeef…`. W kontynuacji FitPlan zachowano najnowszą wersję pliku, zgodną z blobem `0347786…`; nie nadpisano jej wcześniejszą kandydacką korektą. Potwierdzono poprawny JSON, 312 podsekcji, 2808 pytań i 1390 wpisów legalBasis. Ocena merytoryczna przypisów pozostaje częścią osobnego zadania; tutaj sprawdzany jest start wspólnego wdrożenia.


Końcowe potwierdzenie: dla `420aeef656dd0531810f798b30abaef0c91778b4` [Public site audit](https://github.com/Cerebrum09/Strona-aplikacji/actions/runs/37607305249) oraz [Law course integrity](https://github.com/Cerebrum09/Strona-aplikacji/actions/runs/37607305206) zakończyły się **SUCCESS**. Netlify build-info wskazuje tę samą wersję. SHA256 wszystkich pięciu plików napraw FitPlan oraz aktualnego procedure.js są zgodne z przetestowanymi plikami. Po uwzględnieniu najnowszych przypisów `npm test` nadal ma **315/315 PASS**, `check:law` uruchamia 33 kursy, a `check:quick` nie zgłasza problemów. Kod FitPlan nie zmienił się względem zielonego FitPlan CI `37606329607`.

### Historyczna blokada logowania — rozwiązana zgodą użytkownika

Automatyczna kontrola bezpieczeństwa odrzuciła wywołanie bezpiecznego formularza `browserAuth.request` dla `https://develop--stronaaplikacji.netlify.app`. Podany powód: brak jednoznacznej autoryzacji przekazania adresu e-mail i hasła do tego wdrożenia. Odrzucenie nastąpiło przed utworzeniem formularza dla użytkownika i przed wpisaniem danych. Nie wykonywano alternatywnego logowania ani obchodzenia odmowy.

Do zamknięcia pozostają rzeczywiste logowanie i powrót do FitPlan, zapis oraz ponowny odczyt z chmury na koncie, wylogowanie i atlas. Testy izolowane tych granic przeszły, ale nie zastępują kontroli na prawdziwym koncie. Render 3D dodatkowo wymaga dostępnego WebGL. Plan treningowy, Dieta i Podsumowanie pozostają wcześniej oznaczonymi modułami w przygotowaniu.


## Kontynuacja po zgodzie na logowanie — 7 października 2026

Użytkownik udzielił zgody („Zezwalam”) na wcześniej wskazane bezpieczne logowanie do develop Netlify. Formularz `browserAuth` zakończył się statusem `submitted`; aplikacja wróciła do FitPlan. Nie odczytywano wartości pól uwierzytelniania ani nie stosowano alternatywnego sposobu wpisywania danych.

| Rzeczywista ścieżka | Potwierdzenie |
| --- | --- |
| Logowanie i powrót do FitPlan | Powrót do panelu i otwarcie chronionej Tabeli ćwiczeń bez bramki logowania; portal rozpoznaje zalogowaną sesję. |
| Warstwa głęboka i wybór mięśnia | Przełączenie wybiera mięśnie międzyżebrowe; wybór Przepony po warstwie powierzchownej ustawia wyłącznie warstwę głęboką i zgodny opis. Dotyczy kontrolek i opisu, bez oceny renderu. |
| Atlas EN | Opis Przepony oraz etykiety i ćwiczenia są po angielsku. Wyszukiwanie „push-ups” znajduje Pectoralis major; brak wyników pokazuje angielski komunikat. |
| Ponowienie modelu | Retry wraca do czytelnego komunikatu braku WebGL; lista i opisy nadal działają, operacje 3D są wyłączone. |
| Zaliczenie atlasu | Zmiana „Mark module as completed” → „Mark module as incomplete”; panel konta odczytał 20%, 1 z 5 oraz nową datę synchronizacji. |
| Notatka na koncie | W pustym dniu 31.10.2026 zapisano własną syntetyczną notatkę audytu z polskimi znakami i godziną 18:30. Etykieta dnia zawiera poprawną treść i godzinę. |
| Zapis i odczyt z chmury | Niezależny od lokalnej pamięci odczyt przez integrację Supabase potwierdził dokładnie jeden stan FitPlan z testowym wpisem, rewizję 16 i datę serwera 2026-10-07 11:09:13 UTC. Pełny odczyt wykazał wyłącznie tę notatkę oraz własne zaliczenie atlasu. |
| Sprzątnięcie po teście | Zachowano kopię wyłącznie syntetycznych danych w formacie importu panelu konta `centrum-aplikacji-progress` v1. Warunkowa aktualizacja sprawdzająca pełny stan i rewizję 16 usunęła wyłącznie własny testowy wpis oraz cofnęła zaliczenie atlasu. Baza potwierdziła rewizję 17, pusty kalendarz i 0% postępu. Ponowny odczyt potwierdza wynik. |

**Ograniczenie narzędzia po logowaniu:** podczas przygotowania eksportu w panelu konta przeglądarka zgłosiła `retained_data_restricted`, a następnie „native credential state cannot be safely resumed”. Zalecane otwarcie nowego dokumentu, nowej karty w tej samej przeglądarce i reset środowiska nie przywróciły dostępu. Nie obchodzono ochrony poświadczeń. To ograniczenie narzędzia, a nie dowód błędu aplikacji. Eksportu z panelu konta w tym podejściu nie ukończono; zapis i odczyt chmurowy potwierdzono odrębnym, już połączonym narzędziem bazy.

Sprzątnięcie zostało potwierdzone w bazie. Zamrożona karta może nadal pokazywać poprzedni widok testowy; nie potwierdzono ponownego odczytu interfejsu po sprzątnięciu. Zwykłe ponowne uruchomienie aplikacji powinno pobrać nowszą rewizję zgodnie z przetestowaną logiką synchronizacji.

**Pozostałe ręczne kontrole:** odtworzenie interfejsu po nowej sesji konta, wylogowanie przy otwartym atlasie i prywatnym edytorze oraz zmiana konta. Testy izolowane tych granic przeszły wcześniej, ale nie zastępują tych obserwacji. Obrót, wskazanie siatki, zbliżenie, izolacja i wygląd warstw 3D wymagają przeglądarki z działającym WebGL.

Nie znaleziono nowego błędu aplikacji w ścieżkach dostępnych po zgodzie. Nie zmieniano kodu ani głównej gałęzi. Najnowsze sprawdzone wdrożenie `9660b3684e75d9bc2e283c691bb4b66f08e12cd7` ma [Public site audit 37608800249](https://github.com/Cerebrum09/Strona-aplikacji/actions/runs/37608800249) i [Law course integrity 37608800310](https://github.com/Cerebrum09/Strona-aplikacji/actions/runs/37608800310) zakończone SUCCESS. Równoległe zmiany przypisów zachowano.
