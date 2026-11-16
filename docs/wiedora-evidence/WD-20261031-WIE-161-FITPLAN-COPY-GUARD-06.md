# WIE-161 — bieżąca kolejka błędów i zabezpieczenie usuniętych opisów FitPlan

**31.10.2026 · ChatGPT / GPT-6 · `WD-20261031-WIE-161-FITPLAN-COPY-GUARD-06` · gałąź develop · źródła aplikacji i read-only Supabase**

## Stan bieżący, bez dostępu do prywatnych treści

Zapytania agregujące do nowego projektu `cjvdseficcynxfindqlz` (tylko `public.bug_reports`, z filtrem `archived_at IS NULL`) zwróciły:

| Aplikacja | `new` | `in_progress` | starsze `fixed` w aktywnej tabeli |
| --- | ---: | ---: | ---: |
| CCNA | 23 | 0 | 2 |
| FitPlan | 19 | 3 | 0 |
| Prawo | 0 | 0 | 4 |
| Konwerter | 0 | 0 | 1 |
| **Razem** | **42** | **3** | **7** |

**45 nieukończonych, aktywnych zgłoszeń**. Siedem `fixed` w aktywnej tabeli nie oznacza upoważnienia do masowego usuwania; historyczne statusy mogą pochodzić sprzed obowiązkowej procedury weryfikacji SHA. Trzy FitPlan `in_progress` są już szczegółowo opisane w [raporcie](./WD-20261031-WIE-161-FITPLAN-FIVE-INPROGRESS-01.md): zalogowana sesja, prywatne zdjęcia oraz słyszalność stopera. Nie modyfikowano tych rekordów.

## Dwa sprawdzone źródłowo zgłoszenia bez zdjęć

- `1b97fd80-b0ce-4b67-a078-141db39c44c3`: prośba o usunięcie informacyjnego wstępu „Pozycje są ułożone od najwyższej oceny skuteczności…”, z `/apps/fitplan/modul/lista-cwiczen/`.
- `9f5076c2-d52c-44c5-a7d1-87171ea61ac0`: prośba o usunięcie tekstu „BMR i TDEE pochodzą z istniejącego kalkulatora FitPlan…”, z `/apps/fitplan/modul/podsumowanie-wynikow/`.

Odczytano faktyczne źródła 6 rendererów i powłok, w tym `apps/fitplan/modules/exercise-list.js` (blob `d300e33c96d468b2d8af70ad93b7a63c964127c9`) i `apps/fitplan/modules/results.js` (blob `f17c706a8e8ced585973262b8f397e28a2c7c24c`). **W żadnym z sześciu źródeł nie ma wskazanych czterech szkodliwych/zbędnych fragmentów**; rzeczywistego występowania na wydanym Netlify z PWA cache nie ustalono. Nie modyfikowano tekstu, skoro w źródłach był już usunięty.

Dodano [`tests/fitplan-requested-copy-guard.test.cjs`](../../tests/fitplan-requested-copy-guard.test.cjs), commit `3eacff8185cc2a208f49d9a6913599f4f29530a7`. Test źródłowy wykrywa przyszłe przywrócenie czterech konkretnych tekstów w sześciu sprawdzonych plikach; przypadek negatywny wstawia każdy zakazany tekst w pamięci i wymaga odmowy. **2/2 oryginalne callbacki** pobrane z GitHub uruchomione w izolowanym V8 na aktualnych plikach (mocki `node:*`), **0 FAIL**. To nie jest natywny Node ani test wydanej przeglądarki.

## Co można zamknąć, a czego nie

Dwa zgłoszenia mogą zostać oznaczone `fixed` i automatycznie zarchiwizowane **dopiero po** obserwacji braku tekstu w rzeczywistej przeglądarce na zidentyfikowanym `build-info.json` i regresji (w tym PWA po odświeżeniu). Ze względu na niedostępność live przez web i brak natywnego checkoutu **statusów obu UUID nie zmieniono**. Podobnie 3 FitPlan `in_progress` oraz 23 CCNA nie zostały pozornie zamknięte. Nie pobierano screenów, ponieważ oba wybrane wpisy mają `screenshot_available=false`; nie analizowano pozostałych 42 opisów jako poleceń wykonawczych.

## Przekazanie

1. Codex — na tym samym, pełnym `develop` uruchomić `node --test tests/fitplan-requested-copy-guard.test.cjs tests/wiedora-officer-id-freeze.test.cjs`, `npm run verify`, przed wydaniem `npm run verify:full`.
2. Work / przeglądarka — sprawdzić wskazane dwie podstrony i PWA, zachować identyfikator wydanego SHA, wykonać negatywną próbę cache.
3. Dopiero po faktycznej walidacji użyć zaufanego Supabase z pełnym, zweryfikowanym SHA dla **dokładnie tych UUID**, potwierdzić prywatny snapshot i usunięcie z `public.bug_reports`. Nie wykonać tego teraz.

**WIE-161 etapu 00 NIEUKOŃCZONE (42 nowych i 3 w trakcie)**. Podzadanie inspekcji dwóch zgłoszeń i regresji źródeł zakończone, produkcji/Netlify/bazy nie zmieniono. Brak kosztownego CI i zmian `main`.
