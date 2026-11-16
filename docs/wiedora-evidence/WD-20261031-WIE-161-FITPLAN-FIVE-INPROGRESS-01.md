# WIE-161: weryfikacja pięciu zgłoszeń FitPlan w trakcie

31.10.2026, ChatGPT / GPT-6, `develop`. To kontrola **istniejących** poprawek bez ich powtarzania.

## Źródło prawdy
- Pięć konkretnych UUID w `public.bug_reports` ze statusem `in_progress` w nowym Supabase: `d69d8592-bb02-4dbe-b470-e3bc4ce87dcd`, `82c225ef-3a1f-4b78-ad6d-9380e59d09cd`, `612fcc31-3eb0-4108-9b1e-3cd8e92ca0f3`, `abab091a-ebca-4023-8ff7-a2c962fd1242`, `8fad38a1-9127-4cbf-be61-daffc96abc34`.
- Prywatne screenshoty wszystkich pięciu odczytane i obejrzane przez zaufany Supabase. Oryginalne ekrany zawierały m.in. zbędny przycisk w kalendarzu, brak Centrum progresu i propozycję ponownego logowania.
- Pobrano aktualny `AGENTS.md`, `docs/FITPLAN.md`, `docs/BUG_REPORTS.md`, kod i testy z aktywnej gałęzi `develop`.

## Rzeczywisty Netlify i wcześniejsza regresja
- Publiczny testowy URL `https://develop--constant-app.netlify.app/build-info.json` z parametrem cache-buster udostępnił pełny commit **`c74a1d49852ac0f5f5a78a9578b6d0a3d8932823`**, z `builtAt=2026-10-31T18:23:25.299Z`. Ten SHA był w danym momencie opublikowany na `develop`, ale nie odpowiadał wszystkim równoległym późniejszym commitom z `develop`.
- Dokładne blob SHA ośmiu kluczowych plików: `modules/start.js`, `modules/results.js`, `legacy.html`, `index.html`, `sw.js`, `js/fitplan-account-media.js`, `tests/fitplan-start.test.cjs` i `tests/fitplan-progress-center.test.cjs` są **takie same** na wdrożonym `c74a1d4`, najnowszym roboczym `develop` i wcześniejszym sprawdzonym wydaniu `68b74802f194e30603e55e7aa5830684999d32b4`.
- Starszy niezależny raport [WD-20261031-WIE-005-NATIVE-REGRESSION-09](WD-20261031-WIE-005-NATIVE-REGRESSION-09.md) dokumentuje faktycznie wykonany `npm run verify`, `npm run verify:full`, **1019 natywnych testów PASS** i skrypty browser PASS na tych samych blobach. Nie powtarzano ich w tej sesji, gdyż kontener nie ma checkout prywatnego repo i DNS nie rozwiązuje Netlify/GitHub.
- W tej sesji wywołano **17 deterministycznych asercji V8 PASS** bezpośrednio na kodzie z commita wdrożenia: parsowanie minut i granice, wykluczenie przycisku kalendarza, obecność zalogowanego panelu, Centrum progresu, dźwięku/fallback WAV, zgodność plików w powłoce i offline.
- W bazie live `storage.buckets` potwierdzono, że `fitplan-progress` jest prywatny, limit 4 MiB; polityki INSERT/SELECT/UPDATE/DELETE ograniczają `storage.objects.name` do katalogu `auth.uid()/`.

## Wyniki per raport
| UUID | Cel | Rozliczenie |
|---|---|---|
| `612fcc31-3eb0-4108-9b1e-3cd8e92ca0f3` | Usunięcie przycisku oznaczania kalendarza | `fixed` z wydanym SHA; trigger atomowo zarchiwizował i usunął z `bug_reports` |
| `8fad38a1-9127-4cbf-be61-daffc96abc34` | Sama liczba oznacza minuty | `fixed` z wydanym SHA; trigger atomowo zarchiwizował i usunął z `bug_reports` |
| `d69d8592-bb02-4dbe-b470-e3bc4ce87dcd` | Brak drugiego logowania | Kod i lokalny test regresji istnieją, ale **brak testu rzeczywistego zalogowanego użytkownika** na wdrożeniu: aktywny |
| `82c225ef-3a1f-4b78-ad6d-9380e59d09cd` | Centrum progresu i prywatne zdjęcia | Kod, testy symulacyjne i RLS istnieją, ale **brak testu prawdziwego wysłania i odczytu zdjęć z konta**: aktywny |
| `abab091a-ebca-4023-8ff7-a2c962fd1242` | Dźwięk stopera | W kodzie WebAudio + fallback WAV i przycisk próbny, ale **brak testu słyszalności na realnym Android/iOS**: aktywny |

## Archiwizacja
- Wykonano `UPDATE public.bug_reports SET status='fixed', fix_reference='c74a1d49852ac0f5f5a78a9578b6d0a3d8932823'` dla dwóch konkretnych UUID. Potwierdzono w SQL **brak obu UUID w aktywnej tabeli**, obecność ich prywatnych kopii `agent_report_archive_memory` i pełnego SHA w `snapshot.resolution.fix_reference`. Stare historyczne `fixed` i inne zgłoszenia nie zostały usunięte.
- Nie oznaczono pozostałych trzech jako naprawionych tylko na podstawie źródeł. Dla nich konieczny jest rzeczywisty test konta / storage / audio w aktywnej przeglądarce, np. w Work, który ma browser/Computer Use, lub w lokalnym Codex na pełnym checkout.
- Nie modyfikowano kodu ani `main`, nie uruchamiano nowej publikacji i płatnego CI: działające pliki FitPlan już znajdowały się w wydaniu `c74a1d4`.
