# WIE-110 — porównanie 10 konkurentów i rejestr prac Work/Codex

**WD:** WD-20261031-WIE-110-FITPLAN-COMPETITOR-REVIEW-02. **Data:** 31.10.2026. **Autor:** ChatGPT / GPT-6. **Metoda:** badanie 10 oficjalnych publicznych witryn/instrukcji; bez kont, płatnych funkcji, testów urządzeń i porównania jakości algorytmów.

| Serwis | Funkcje potwierdzone w źródłach | Źródło |
|---|---|---|
| Hevy | Program zawiera rutyny; cele serii, zakres powtórzeń, zapis RPE | https://help.hevyapp.com/hc/en-us/articles/34953606698903-Build-a-Workout-Program-Create-Organize-Routines |
| Strong | Szablon jest oddzielny od wykonanego treningu; timer i historia | https://help.strongapp.io/article/105-about-templates |
| Fitbod | Dobór sprzętu, celu, historii; adaptacja na podstawie treningów | https://help.fitbod.me/hc/en-us/articles/360004429814-How-Fitbod-Creates-Your-Workout |
| JEFIT | Gotowe szablony i wybór według celów, sprzętu, dziennik | https://www.jefit.com/use-case/workout-planner |
| Boostcamp | Plan, dni treningowe, zapis serii/PR, mechanizm progresji | https://www.boostcamp.app/ |
| Caliber | Dziennik, serie, zastępowanie ćwiczeń, sprzęt i cele | https://caliberstrong.com/workout-app/ |
| StrengthLog | Kolejny trening programu, historia, szacowany czas | https://help.strengthlog.com/help-article/follow-a-program/ |
| Nike Training Club | Wielotygodniowe programy z instrukcjami i fazami | https://www.nike.com/pl/aplikacja-ntc |
| Freeletics | Training Journeys z feedbackiem oraz zmianami przy braku czasu/sprzętu | https://help.freeletics.com/hc/en-us/articles/360001805519-Choose-your-Freeletics-Training-Journey |
| TrainHeroic | Biblioteka ćwiczeń, historia, programowanie przez trenera | https://support.trainheroic.com/hc/en-us/articles/18170940515853-Downloading-the-TrainHeroic-Mobile-App |

## Wnioski do wdrożenia w istniejącym FitPlan

1. **Szablon treningu nie jest ukończoną sesją:** nie zaznaczać wykonania po wczytaniu lub starcie stopera (Strong/Hevy).
2. **A/B i historia:** kolejny dzień wybierać z ostatniej rzeczywiście potwierdzonej sesji tego konkretnego programu (Boostcamp, StrengthLog).
3. **Prosty dziennik lokalny:** osobny wersjonowany klucz, brak automatycznej wysyłki na serwer, obsługa uszkodzonego formatu i niedostępnego Storage (Strong, JEFIT).
4. **Serie, rzeczywiste powtórzenia, kg i RPE/RIR:** przyszła warstwa, nie wyprowadzać ich z upływu interwału (Hevy, Caliber).
5. **Sprzęt i progresja:** jawne wymogi sprzętowe; adaptacja obciążeń dopiero po zweryfikowanych wynikach i regułach (Fitbod, Freeletics).
6. **Dostępność:** własna uproszczona implementacja, bez kopiowania layoutów, programów autorów, grafik i kodu konkurencji.

## Natychmiast oznaczone zadania Work/Codex

**P1 CODEX — WIE-110/WIE-117:** Sprawdzić bieżący develop, stabilność lokalnego dziennika, następne A/B, ponowne wejście, błędy historii, odmowę i brak duplikatów. Wykonać `node --test tests/fitplan-training-presets.test.cjs tests/fitplan-training-progress.test.cjs tests/fitplan-start.test.cjs`, `npm run check:fitplan`, `npm run verify`, `npm run verify:full`. Nie powtarzać napisanych funkcji bez testów RED.

**P1 WORK — WIE-110/WIE-171/WIE-186:** 320/390/768/1440, prawdziwe przejścia przez UI i timer, zapis tylko świadomie ukończonej sesji, przerwanie/ponowne otwarcie, PWA offline, logowanie, Netlify SHA po zbiorczej publikacji i rzeczywisty odsłuch alarmu. Przed testem porównać `build-info.json` z commit develop.

**P2 CODEX — WIE-185/WIE-117:** Zapis każdej serii z rzeczywistymi powtórzeniami, kg, RPE/RIR, ostatni wynik przy ćwiczeniu, historia i edycja, rozdzielenie template/draft/completed, wersjonowanie i migracje. Nie udawać, że timer mierzy powtórzenia.

**P2 CODEX + TRENER — WIE-115:** Wielotygodniowy schemat, poziom, sprzęt, ręczne zamienniki i bezpieczna progresja dopiero po wynikach; nie generować nieuzasadnionych automatycznych ciężarów.

**P2 WORK + SPECJALISTA — WIE-111/112/113/114:** Potwierdzenie biomechaniki i przejść animacji, bez fikcyjnego zaliczania sztucznych szkiców 2D jako weryfikacji techniki.

**P0 etap 00 (osobny owner):** RLS, Auth/Storage, offline/PWA, backup, W04/W05 i formalne bramki. Nie zmieniać statusów etapu 00 przez pilot.

**Stan:** konkurencyjny audyt udokumentowany, zadania Work/Codex ZAREJESTROWANE, ich testy i prawdziwe wydanie NIE WYKONANE.