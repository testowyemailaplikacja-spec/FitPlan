# FitPlan — naukowe podstawy czasu treningu, cykli i regeneracji

**Data opracowania:** 31.10.2026. **Zadania:** WIE-115 (silnik planowania), WIE-110 (program 100 pompek), WIE-117 (historia), WIE-185 (rzeczywiste serie). **Właściciel dokumentu:** ChatGPT / GPT-6. **ID zmian:** WD-20261031-WIE-115-LOAD-CYCLE-02.

**Ważne:** dokument oddziela (A) wyniki badań, (B) założenia aplikacji ustalone z właścicielem i (C) własne heurystyki konieczne do zbudowania pierwszego prototypu. Badanie populacji nie jest indywidualną oceną wydolności użytkownika. Program nie jest gwarancją uzyskania 100 pompek i nie zastępuje konsultacji po kontuzjach.

## 1. Co rzeczywiście wspierają źródła

| Temat | Potwierdzone badania / wytyczne | Znaczenie dla kodu |
|---|---|---|
| Aktywność tygodniowa | WHO 2020: dla dorosłych **150–300 min/tydzień umiarkowanej aktywności aerobowej lub 75–150 min intensywnej**, i ćwiczenia wzmacniające **≥2 dni w tygodniu**. WHO nie nakazuje konkretnej długości pojedynczej sesji siłowej ani 150 minut samych pompek. | Nie mnożyć pompek automatycznie przez wolne minuty. |
| Przepisywanie treningu siłowego | ACSM Currier i wsp. 2026, przegląd parasolowy **137 przeglądów systematycznych** i >30 tys. uczestników; efekty zależą od celu, obciążenia, objętości, częstotliwości. Brak jednego obowiązkowego czasu 20/40/60/80/100 min. | Czas jest budżetem. Progresja zależy od realnej historii i regeneracji. |
| Długość jednej repetycji | ACSM's Health & Fitness Journal, Mang i wsp. 2023: tempo to suma faz ruchu; możliwy szeroki zakres, dostosowany do celu. Enes i wsp., metaanaliza 2025: porównywano m.in. tempa ~1 oraz ~3,5 sekundy; nie ma uniwersalnie najlepszego jednego tempa dla każdego ćwiczenia. | Startowa **heurystyka 3 s/pompka**, konfigurowalna dla innych typów ćwiczeń i do późniejszej kalibracji z danymi. |
| Przerwy | Singer i wsp. 2024, metaanaliza: niewielka przewaga przerw >60 sekund dla hipertrofii, bez wyraźnej przewagi >90 sekund; to nie oznacza uniwersalnego zakazu dłuższych przerw. Starsze ACSM 2009 zalecają dłuższe odpoczynki dla ciężkiego treningu siłowego. | Pilot wytrzymałościowy: minimum 90 sekund, dla trzeciej jednostki 120 sekund; trening cięższy 150 sekund. Rzeczywista potrzeba może wymagać dłuższych przerw. |
| Częstotliwość | ACSM 2026: w treningu siłowym warto angażować główne grupy przynajmniej 2 razy/tydzień; Schoenfeld i wsp. 2019: przy wyrównanej objętości częstotliwość sama w sobie nie miała dużego wpływu na hipertrofię. | Wybór 5/7/10 dni to organizacja planu, nie twierdzenie o naukowo optymalnej długości cyklu. |
| Cała długość bloku | Badania ACSM objęły programy 6–52 tygodni. Nie ma dowodów na obowiązkowe 3 albo 4 miesiące ciągłego treningu, po których *każdy* musi przestać trenować. | Podstawowy blok 8 tygodni jest punktem kontroli. Można kontynuować przy regeneracji i adaptacji. |
| Lżejszy okres (deload) | Bell i wsp. 2026, Strength & Conditioning Journal: praktycznie często co 4–8 tygodni, poprzez mniejszą objętość, intensywność lub częstotliwość. Pancar i wsp. 2026, n=19 niewytrenowanych mężczyzn, w programie 8 tygodni redukcja objętości/częstotliwości w tygodniach 4 i 8 nie pogorszyła wyraźnie adaptacji; mała próba i ograniczenia. | Prototypowy **co 5. tydzień blokowy 40% mniej objętości** oraz korekta po zgłoszonym zmęczeniu. To wybór projektowy, nie kliniczny standard. |
| Progres do 100 pompek | HundredPushups.com: maksymalny test, trzy sesje w tygodniu, jeden dzień odpoczynku pomiędzy, okresowe powtórne testy; dopuszcza powtarzanie tygodnia po problemach. | Własny algorytm opiera się na tych **zasadach**, nie kopiuje autorskich tabel serii. |

### Linki do zweryfikowanych publikacji

1. WHO 2020, [Guidelines on physical activity and sedentary behaviour](https://pmc.ncbi.nlm.nih.gov/articles/PMC9219310/).
2. Currier i wsp. (ACSM, 2026), [Resistance Training Prescription for Muscle Function, Hypertrophy, and Physical Performance](https://pmc.ncbi.nlm.nih.gov/articles/PMC12965823/), DOI 10.1249/MSS.0000000000003897.
3. Mang, Ronai, Kravitz (ACSM 2023), [The Ultimate Guide for Selecting Repetition Tempos](https://doi.org/10.1249/FIT.0000000000000814).
4. Enes i wsp. (2025), [How Slow Should You Go?](https://pubmed.ncbi.nlm.nih.gov/42709703/).
5. Singer i wsp. (2024), [Give it a rest: inter-set intervals and hypertrophy](https://pubmed.ncbi.nlm.nih.gov/39205815/).
6. Schoenfeld i wsp. (2019), [Training frequency and hypertrophy](https://pubmed.ncbi.nlm.nih.gov/30558493/).
7. Bell i wsp. (2026), [A Practical Approach to Deloading](https://doi.org/10.1519/SSC.0000000000000910).
8. Pancar i wsp. (2026), [Effects of deload periods in resistance training](https://www.nature.com/articles/s41598-026-40612-5), DOI 10.1038/s41598-026-40612-5.
9. [Hundred Pushups — initial test](https://hundredpushups.com/test.html), [week 1](https://hundredpushups.com/week1.html), [week 6 and extending](https://hundredpushups.com/week6.html).

**Nie wolno:** przedstawiać arbitralnego 48 h, 40% deload, dokładnego dnia cyklu lub wzoru na ilość powtórzeń jako jedynego wyniku badań. Są to jawne, ostrożne domyślne ustawienia prototypu wymagające przeglądu specjalisty i testów użytkowników.

## 2. Ustalone z właścicielem zakresy konfiguracji

**Budżet jednej sesji:** dokładnie 20, 40, 60, 80, 100 minut. 20 nie oznacza treningu zawsze trwającego pełne 20 minut, a 100 nie oznacza wymuszonego wyczerpania całego budżetu. Po zakończeniu wymaganej objętości może zostać czas na luźną aktywność, inną grupę mięśniową lub odpoczynek, który nie jest dopisywany automatycznie jako dodatkowe pompki.

**Cykl organizacyjny:** 5, 7 albo 10 dni. Domyślnie:
- 5 dni → **2 cięższe jednostki**, w dniach 1 i 3.
- 7 dni → **3 cięższe jednostki**, w dniach 1, 3 i 5.
- 10 dni → **4 cięższe jednostki**, w dniach 1, 4, 7 i 9.

W inne dni może być pełny odpoczynek lub aktywność lekka, najlepiej inna partia. Użytkownik może trenować codziennie *różne* partie, ale 6+ dni pracy w ostatnich siedmiu dniach wywołuje ostrożne ostrzeżenie dotyczące całkowitego obciążenia i samopoczucia; to **nie** jest medyczny pomiar „przemęczenia układu nerwowego”.

**Podwyższenie celu:** po wykonaniu obecnego celu w rzeczywistym teście maksimum, jednokrotne zwiększenie o **1–100 pompek**. W pilocie twarda granica docelowa: **1000**. Nowy cel i blok bez usuwania poprzednich serii/testów. Przy 100 pompkach nowy cel np. 120, 150, 200 — zależnie od wybranej liczby, bez automatycznego dążenia do dowolnie ogromnych wyników.

**Przedłużenie bloku:** podstawowy program 8 tygodni po 3 planowane jednostki, ale 5/10-dniowy cykl zmienia liczbę realnych dni potrzebnych na 24 jednostki. Przy niewykonanym celu po zakończeniu bloku użytkownik może jawnie dodać **4 kolejne tygodnie blokowe** (maksymalnie 40 tygodni i 120 zapisanych prób) po okresie spokojniejszej regeneracji. 3–7 dni lżejszej aktywności lub odpoczynku są obecnie **wskazówką**, nie automatycznie egzekwowanym medycznym nakazem.

## 3. Kanoniczny wzór czasu (wspólny dla przyszłych ćwiczeń)

`T = rozgrzewka + Σ(powtórzenia_j × sekundy_na_powtórzenie_j) + Σ(przerwy między seriami) + przejścia/organizacja + schłodzenie`.

Pierwszy własny profil **endurance**: tempo 3 s/powtórzenie, przerwy ≥90 s, rozgrzewka 360 s, schłodzenie 180 s, organizacja/przejścia 75 s. **strength**: 4 s, przerwy ≥150 s, rozgrzewka 480 s, schłodzenie 240 s, przejścia 90 s. **light**: 3 s, przerwy ≥60 s, rozgrzewka 300 s, schłodzenie 180 s, przejścia 60 s. Dla ćwiczeń izometrycznych oraz na czas należy docelowo stosować *czas utrzymania*, a nie wymyślone powtórzenia — ten podtyp jest jeszcze zadaniem Work/Codex.

Algorytm `FitPlanTrainingLoad.fitToTime(...)`:
1. Waliduje listę serii i profil, odrzuca uszkodzone zakresy i nieznane nastawy.
2. Wylicza rzeczywisty czas szacowany; nie dodaje na siłę serii, jeśli wybrano dłuższy budżet.
3. Jeśli trening nie mieści się w czasie, zmniejsza **liczbę planowanych powtórzeń**, nie minimalny odpoczynek; zachowuje liczbę serii i proporcje w granicach możliwości.
4. Jeśli nie mieści się nawet rozgrzewka, minimalne przerwy i jedna repetycja na serię → `feasible:false`, zapisu nie wolno zaliczyć; UI każe wybrać dłuższy czas lub lżejszą wersję.
5. Rozdziela cel i rzeczywiste powtórzenia. Zaliczenie po pięciu rzeczywiście wpisanych seriach i potwierdzeniu; nie zalicza upływu czasu.
6. Nie szacuje automatycznie tętna, stresu i „CNS fatigue”. Bieżące wskazówki regeneracji opierają się na czasie od ostatniego treningu, intensywności oraz dobrowolnym zgłoszeniu zmęczenia/bólu.

**Przykład obliczenia:** maksymalny test 20 pompek, pierwsza jednostka, czas 20 min. Cele serii 8/10/8/7/9, razem 42. Praca 42×3 s = 126 s. 4 przerwy ×90 s = 360 s. Rozgrzewka 360 s + schłodzenie 180 s + przejścia 75 s = 615 s. **Razem 1101 sekund = 18 min 21 s**, pozostaje **1 min 39 s** rezerwy. Nie zwiększamy serii, by trafić sztucznie w 20:00.

## 4. Regeneracja oraz dłuższa perspektywa

- Cięższa jednostka tej samej grupy: prototypowo **48 godzin** przed następną. Lekka: prototypowo ≥24 godziny, ale dwie lekkie sesje tej samej grupy dzień po dniu sugerują **trzeci dzień odciążenia tej grupy**. To konserwatywna heurystyka, a nie reguła bez wyjątków.
- Przy innych grupach możliwa aktywność w kolejnych dniach, ale 6+ różnych dni treningu w okresie siedmiu dni powoduje komunikat o dodatkowej ocenie całkowitego obciążenia, snu, stresu i samopoczucia.
- Przy odczuwalnym zmęczeniu ustawienie `tired` wydłuża sugerowany odpoczynek **do 72 godzin po cięższej jednostce i 48 godzin po lekkiej (heurystyka produktu)**; `pain` w prototypie blokuje potwierdzenie nowego treningu z komunikatem o przerwaniu/ewentualnej konsultacji.
- Co piąty **tydzień blokowy** (niekoniecznie równo siedem dni kalendarzowych przy cyklach 5/10) proponowany `deload`: **0,6 zwykłej liczby powtórzeń**, nie nowy maksymalny test. W razie niepokojących objawów każda liczba może być zbyt duża; system nie zastępuje oceny specjalisty.
- Nie wprowadzamy sztywnego obowiązku przerwy po 3 czy 4 miesiącach. Zaplanowany przegląd po każdym bloku 8 tygodni i ewentualne mniejsze obciążenie co 4–8 tygodni są bezpieczniejszym kierunkiem rozwoju. Po braku postępów pierwsze jest sprawdzenie jakości wykonania, zmęczenia i regeneracji, a nie bezwarunkowe dokładanie objętości.
- W modelu pushup `extend()` jest decyzją użytkownika po 8/12/16 itd. tygodniach blokowych, a `increaseGoal()` wymaga faktycznego testu potwierdzającego cel. Do formalnego zatwierdzenia przez trenera i Work.

## 5. Dokładny katalog do zadań Work/Codex

1. **WIE-115-A · walidacja badań:** przejrzeć tabele i ustalić oddzielne profile dla wytrzymałości, siły, mocy, mobilności, izometrii oraz treningu mieszanego. Potwierdzić granice tempa/przerw u specjalisty. Nie przedstawiać modelu jako medycznego.
2. **WIE-115-B · czas 20/40/60/80/100:** sprawdzić licznik czasu całego treningu, rozgrzewki, przejść, cooldown, przypadek niemożliwy, brak cichego skrócenia odpoczynku; bez automatycznych dodatkowych powtórzeń po zwiększeniu czasu.
3. **WIE-115-C · cykle 5/7/10:** sprawdzić liczbę jednostek 2/3/4, przerwy tej samej grupy, faktyczne daty i zmianę cyklu po ukończonej sesji bez zaliczania nowych treningów.
4. **WIE-115-D · regeneracja:** uwzględnić realny obszar ćwiczeń z kanonicznych mięśni, RPE/RIR, ból, sen, zmęczenie, 2 lekkie sesje z rzędu, 6+ dni treningu; poinformować o ograniczeniach braku obiektywnego pomiaru regeneracji.
5. **WIE-115-E · deload i długie bloki:** prototyp 40% redukcji co pięć tygodni przejrzeć w odniesieniu do badań, intensywności oraz populacji, sprawdzić scenariusze bloków >3/4 miesięcy i przerwy wymuszone przez życie/choroby.
6. **WIE-110-F · nieukończony program:** po 8 tygodniach bez wyniku 100 utrzymać historię, retest bez automatycznego resetu, decyzja +4 tygodnie, ponowna ocena po rekomendowanym 3–7 dniach regeneracji; limity 40 tygodni i 120 prób.
7. **WIE-110-G · kolejny cel:** po rzeczywistym teście osiągnięcia celu +1–100 na raz, maks. 1000; blokada przedwczesnego lub wielokrotnego fikcyjnego zaliczenia, zachowanie historycznych rekordów i re-testów.
8. **WIE-117-H · dane:** kompatybilność z `fitplan.pushups100.v1`, nieznikająca historia, odporny zapis przy braku localStorage/quota, synchronizacja kont i RLS dopiero po bramkach etapu 00. Pełny eksport/import/testy kopii zapasowej.
9. **WIE-185-I · wszystkie rodziny:** wspólny mechanizm ma obsługiwać stopniowo wszystkie 11 rodzin FitPlan i kilkaset ćwiczeń, także statyczne/czasowe, nie stosować 3 s/rep do oddechu czy planka.
10. **WIE-186-J · test na żywo:** `npm ci`, `node --test tests/fitplan-training-load.test.cjs tests/fitplan-pushup-100.test.cjs`, `npm run check:fitplan`, `npm run verify`, `npm run verify:full`, 320/390/768/1440 px, realny Netlify develop SHA, PWA, tablet, dotyk i klawiatura; nie oznaczać PASS z samego commita.
