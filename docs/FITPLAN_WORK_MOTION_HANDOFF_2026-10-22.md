# ChatGPT Work — FitPlan: pełna walidacja mechaniki i przebudowa animacji 1–98

**Data przygotowania:** 22.10.2026. **Repozytorium:** `testowyemailaplikacja-spec/Constant_app`; **gałąź:** `develop` (nie ruszać `main`). **Status:** TESTY KODOWE CZĘŚCIOWE; BRAK ZALICZONEJ WALIDACJI BIOMECHANICZNEJ / WIZUALNEJ / ONLINE. Ten plik jest handoffem wykonawczym dla Work, nie deklaracją ukończenia 98 realistycznych animacji.

## 0. Zakres i źródła

- Pierwsza czynność nowej sesji: pobierz **aktualny** `AGENTS.md`, potem `docs/FITPLAN.md`, `docs/FITPLAN_MOTION.md`, `docs/FITPLAN_MECHANICAL_AUDIT.md`, `docs/FITPLAN_EXERCISE_REVIEW_1_98.md` i `docs/CI_COST_POLICY.md`. Odczytaj aktualny HEAD `develop` i stan lokalnego checkout. Nie bazuj na SHA wpisanym w pamięci chatu.
- Kanoniczna **stała numeracja 1–98**: `docs/FITPLAN_EXERCISE_REVIEW_1_98.md`. 98 pozycji katalogu = 95 szkiców + Hip Thrust (landmark) + Push-Up (foto/WebGL) + Bench Press (osobny 3D).
- Celem użytkownika jest realistyczne przedstawienie **każdego konkretnego ćwiczenia**, wyłącznie ręcznie sterowane suwakiem we wspólnych modelach (bez automatycznego odtwarzania w Push-Up, Hip Thrust, 95 szkicach). Model ma być poprawny pod względem mechaniki i użyteczny na telefonie/tablecie/PC, bez licencjonowanych obcych zasobów. **Nie wolno** przedstawiać aktualnych 95 szkiców jako pełnych realistycznych animacji.
- Zachowaj działające moduły FitPlan, offline, logowanie, postępy i pozostałe aplikacje. Nie twórz fikcyjnych testów PASS, screenshotów czy potwierdzeń Netlify.

## 1. Audyt wykonany w tej sesji (dane pomiarowe)

**Źródło pomiaru:** aktualne pliki `apps/fitplan/` pobrane z GitHub `develop`; testy wykonywane w silniku JavaScript na modelach, bez uruchomionego pełnego Node test-runnera lub przeglądarki.

- Przypisania: **98/98** znalezionych; **95/95** szkiców zdefiniowanych; **67** szablonów, **63** używane; brak duplikatów aliasów ani brakujących wzorców.
- Wstępna kontrola: **9595** położeń szkiców (0–100% co 1%), **95** scen SVG stworzonych/przesuniętych/usuniętych w *symulowanym* DOM; bez błędów geometrii tej klasy.
- Test zagęszczony: **95 095** położeń szkiców (0–100% co 0,1%), dodatkowo **1001** położeń Hip Thrust; 10 stałych długości segmentów/szkic; największy błąd długości około `2.14e-13` jednostki, odchylenie pomiędzy odwrotnymi fazami około `1.72e-11`, największy ruch punktu na 0,1% suwaka około `2.81` jednostki; **0** niefinitycznych współrzędnych, **0** wyjść poza kadr. Hip Thrust: 5 długości odcinków stałych, barki i stopy nie przesuwają się.
- **To nie jest gwarancja prawidłowej techniki**: stabilność liczb nie bada fizjologicznych zakresów stawów, środka ciężkości, punktu podparcia, kolizji, chwytu, toru oporu ani wyglądu postaci.

### 1.1. Potwierdzone blokery i reprodukcja

| Priorytet | Ćw. | Problem | Test / dowód |
|---|---|---|---|
| P0 | **64 — Wyciskanie nad głowę** | Geometria łokcia schodzi do **13,62°** przy ok. **34%** suwaka. Przy przejściu 0 → 50% kąt maleje z ok. **167,61° do 56,43°**: łokieć ugina się zamiast prostować w fazie wyciskania. | `ACUTE_ELBOW`, `OVERHEAD_WRONG_DIRECTION` w skrypcie |
| P0 | **85 — Prostowania na wyciągu** | Pozycja startowa ma kąt łokcia ok. **5,56°**, niemal złożone przedramię. Wymaga przebudowy pozycji startowej i toru ramienia, nie kosmetyki. | `ACUTE_ELBOW` w skrypcie |
| P0 | **5 — Clamshell** | Obecny rig 2D nie wykonuje rzeczywistego ruchu (suwak jawnie wyłączony); potrzebny poprawny ruch przestrzenny w 2.5D/3D. | `NO_MOTION`; brak translacji stawów nie jest animacją rotacji biodra |
| P1 / decyzja UX | **37 — Wyciskanie sztangi na ławce** | Oddzielny starszy odtwarzacz automatycznie odtwarza ćwiczenie, jeśli użytkownik nie ma ustawienia reduce-motion. Sprawdzić ujednolicenie z docelową obsługą wyłącznie suwakiem. | `BENCH_AUTOPLAY` (ostrzeżenie; nie zmieniać bez potwierdzenia kontraktu UX) |

**Próg 20° zastosowano wyłącznie jako konserwatywny alarm geometryczny w rysunku 2D, a nie medyczną granicę zakresu ruchu.** Przed naprawą potwierdzić układ współrzędnych, wybór kierunku zgięcia i położenie barku/łokcia/nadgarstka.

### 1.2. Niezamknięte ograniczenia — nie mylić z P0

- **Nr 3, 46, 65, 66, 67, 74, 91, 92**: obrót/relacja ze ścianą/supinacja lub pronacja wymagają osobnej głębokości, ruchu 3D bądź innej projekcji.
- **Nr 16**: brak nachylenia podłoża; **nr 22**: brak podwyższonej podpory Copenhagen Plank; **nr 27**: brak skakanki i toru liny.
- **Nr 23 i 93**: brak szczegółowych stawów przodostopia/palców.
- **Nr 83, 88, 89, 95, 96**: kierunek chwytu dłoni niewidoczny; nie wystarczy poruszyć całym ramieniem.
- **Nr 8, 39, 53, 58**: niejednoznaczna nazwa/wariant; ustalić precyzyjny wariant zanim technika zostanie zatwierdzona.
- **Nr 18, 19, 94, 97**: demonstracja opiera się na lokalnym obrocie grafiki stopy/dłoni bez pełnego łańcucha drobnych stawów.
- **Pozostałe**: dwa położenia bazowe nie dowodzą właściwego tempa, trzech lub czterech faz, kontaktów i anatomii. Status „szkic 2D” zachować aż do potwierdzenia.

## 1.3. Referencje techniczne do oceny ruchu (bez kopiowania grafik)

- Wyciskanie nad głowę: ACE Exercise Library, [Seated Overhead Press](https://www.acefitness.org/resources/everyone/exercise-library/45/seated-overhead-press/). Ruch w górę prowadzi do wyprostu łokci, powrót do ich zgięcia. Różnica pozycji siedzącej/stojącej nie zmienia kierunku wyprostu stawu łokciowego.
- Prostowania na wyciągu: [Triceps Pushdown — STHENO](https://www.sthenofitness.com/exercises/tricepss-pushdown-cable-straight-bar). Zgięte łokcie w pozycji startowej, ramiona stabilne, wyprost w fazie właściwej. Źródło pomocnicze, nie zastępuje konsultacji biomechanicznej.
- Clamshell: [Merck Manual Professional, Side-Lying Hip External Rotation](https://www.merckmanuals.com/professional/multimedia/video/side-lying-hip-external-rotation-clamshell-exercise). Stopy pozostają razem, kolano górnej nogi odwodzi się ku górze; nie wykonuje się tego przez przesunięcie całej postaci w płaskim rzucie.

Źródła służą jedynie do weryfikacji wzorca; nie pobierać ani nie kopiować ich licencjonowanych zdjęć/filmów do aplikacji.

## 2. Nowe narzędzie diagnostyczne dla Work

Plik **`scripts/fitplan/motion-quality-audit.cjs`**, tylko odczyt. Generuje wyniki dla 98 numerów, wykazuje błędy geometrii, jawne ograniczenia i policzone kąty łokci. Powiązany test **`tests/fitplan-motion-quality-audit.test.cjs`** sprawdza zgodność audytu, wyniki JSON i semantykę trybu rygorystycznego.

```bash
git switch develop && git pull --ff-only
node scripts/fitplan/motion-quality-audit.cjs --json > /tmp/fitplan-motion-audit-before.json
node scripts/fitplan/motion-quality-audit.cjs --strict
node --test tests/fitplan-motion-quality-audit.test.cjs
node --test tests/fitplan-motion-ordered-regression.test.cjs tests/fitplan-mechanical-geometry.test.cjs tests/fitplan-mechanical-drafts.test.cjs tests/fitplan-exercise-embed.test.cjs tests/fitplan-exercise-motion.test.cjs
```

**Oczekiwany stan początkowy `--strict`: EXIT 1 — poprawne działanie rygorystycznej bramki, ponieważ istnieją cztery wyniki blokujące dotyczące trzech ćwiczeń.** Kiedy Work poprawi błędy, dopiero `EXIT 0` bez krytycznych wyników może otworzyć kolejny etap akceptacji. Brak wyników w rygorystycznym skrypcie **nie** oznacza zakończenia kontroli biomechaniki ani grafiki.

## 3. Konkretny workflow Work — bez przerywania po każdym numerze

1. **Preflight:** uruchomić powyższe polecenia w lokalnym checkout Work. Zweryfikować Node 22, `npm ci`, `npm run codex:context`, raport bazowy i aktualne SHA. Nie wymuszać GitHub Actions, build hooka ani Netlify bez konieczności.
2. **P0 biomechanika:** poprawić nr **64, 85, 5** oraz dopisać testy negatywne, które na starej implementacji odtwarzają defekt. Osobna walidacja techniki przy użyciu wiarygodnej demonstracji anatomii/ruchu; nie bazować wyłącznie na dwóch losowo przesuniętych pozycjach. W przypadku Clamshell przygotować właściwy, oddzielny model 2.5D/3D.
3. **P1 podpory i sprzęt:** nr **16, 22, 27**; ręce/ściana **46**; przyrządy **37, 40, 41, 54, 56**; zweryfikować punkt zakotwiczenia, wysokość ławki, ustawienie chwytów i siłę oporu. Nie używać fikcyjnych podpór w rysunku.
4. **P1 głębokość i małe stawy:** pozycje z listy 1.2. Rozbudować model dłoni, przedramienia, stopy i osi stawów bądź przygotować odrębny widok. Nie usuwać ostrzeżeń, zanim ruch nie zostanie rzeczywiście oddany.
5. **Kontrola wszystkich 98 ćwiczeń w kolejności** `docs/FITPLAN_EXERCISE_REVIEW_1_98.md`: dla każdego sprawdzić nazwę, wariant, pozycję startową, fazę główną, powrót, kąty, stabilność stóp/dłoni, sprzęt, kolizje, kierunek, symetrię/sprzężenie segmentów, opis i suwak. Nie dopuszczać masowego „PASS”, bo wszystkie długości kości są stałe.
6. **Test przeglądarkowy jako użytkownik:** lokalny serwer / odpowiedni branch preview po potwierdzonym SHA. Dla każdego ćwiczenia sprawdzić 0/25/50/75/100% ręcznie. Co najmniej **390×844**, **768×1024** i **1440×900**, orientację mobilną, 200% zoom, klawiaturę (strzałki/Home/End), brak autoplay, znikanie renderera po zamknięciu, ponowne otwarcie i offline. Wykonać dowodowe zrzuty *kontakt-sheet* (nie 980 pojedynczych ręcznych screenów); zapisać nazwy plików i wyniki przy numerach. Weryfikować warstwy SVG, punkty styku stóp i dłoni, kolizje ze sprzętem. Ruch nie może pozostawać nieruchomy przy suwaku, jeśli nie jest to ćwiczenie izometryczne — lokalne obroty wymagają wizualnego potwierdzenia.
7. **Regresja:** `npm run check:fitplan`, `npm run verify`, a przed release `npm run verify:full`; `node tests/fitplan-motion.browser.cjs`. Zbadać też wszystkie poprzednie odtwarzacze, katalog, konta/gościa, offline, postęp, przeglądarki i istniejące moduły FitPlan.
8. **Handoff:** w tym dokumencie i w macierzy 1–98 podać dla każdego ćwiczenia `PASS/FAIL/BLOCKED`, dowód (zrzut/raport), poprawioną mechanikę, SHA i poziom testów. Wyłącznie po zgodzie na zbiorczą publikację użyć Netlify `develop`; sprawdzić `build-info.json` vs SHA. `main` nie ruszać.

## 4. Kryteria akceptacji

- `node scripts/fitplan/motion-quality-audit.cjs --strict` = EXIT 0, bez krytycznej regresji.
- Wszystkie testy Node/regresji zgodne z kodem po poprawkach: `npm run verify` i `npm run verify:full` mają rzeczywisty PASS, nie były tylko dodane do repo.
- Każdy z 98 numerów ma zrealizowane i przetestowane pozycje 0,25,50,75,100%, bez nielogicznej pracy stawu, przenikania sprzętu, przesuwania zakotwiczonych kończyn i bez niezamierzonego autoplay.
- Każdy niewspierany szczegół jest jednoznacznie oznaczony w UI i raporcie, bez fałszywej deklaracji „gotowa animacja”.
- Zrzuty kontaktowe pozwalają audytować każdą technikę na telefonie i komputerze; brak poziomego scrolla i poprawny zakres suwaka.
- Zachowane wcześniejsze odtwarzacze, postępy i niepowiązane moduły; brak zmian na `main`.
- **Nie utożsamiać** testów typu „0 wydłużeń kości” z zatwierdzeniem realistycznego ruchu człowieka.

## 5. Gotowe polecenie do przekazania ChatGPT Work

> Pracuj na bieżącej gałęzi develop repozytorium `testowyemailaplikacja-spec/Constant_app`. Najpierw przeczytaj aktualny AGENTS.md i dokumenty FitPlan, a następnie w całości wykonaj `docs/FITPLAN_WORK_MOTION_HANDOFF_2026-10-22.md`. Zgłoszone trzy priorytetowe ćwiczenia (nr 5, 64, 85) napraw w pierwszej kolejności, potem sprawdzaj **każde ćwiczenie 1–98 po kolei**. Korzystaj z `scripts/fitplan/motion-quality-audit.cjs` w trybie JSON i strict, uruchom rzeczywiste Node/npm/Chromium testy, weryfikuj biomechanikę, renderowanie, punkty styku, responsywność i suwak. Zapisuj dowody i status każdego numeru, poprawiaj regresje, nie przedstawiaj szkicu 2D jako pełnego instruktażu, nie pomijaj nieudanych testów. Nie zmieniaj main, nie uruchamiaj kosztownych CI lub publikacji Netlify bez wyraźnej zgody. W raporcie końcowym rozdziel GitHub SHA, pełne testy, widok użytkownika i deployment.

## 6. Status przekazania

Wykonano bezpośredni test obliczeń (9595 i 95 095 próbek), analizę kodu i symulowanego renderera, utworzono narzędzie diagnostyczne i testy. **Nie wykonano lokalnego npm run verify, Chromium ani oględzin działającego develop**, ponieważ ten zwykły chat nie ma checkout GitHub z dostępem do repo w terminalu/Cloud Browser Work. **Brak zgody na publikację i brak zmian main.**

