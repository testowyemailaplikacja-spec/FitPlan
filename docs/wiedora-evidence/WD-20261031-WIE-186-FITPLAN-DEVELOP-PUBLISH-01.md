# FitPlan — świadoma publikacja partii testowej na Netlify develop

**WIE:** WIE-186 (test na prawdziwym Netlify); WIE-185/WIE-117/WIE-110 w zakresie wdrażanych zmian. **WD:** WD-20261031-WIE-186-FITPLAN-DEVELOP-PUBLISH-01. **Data:** 31.10.2026. **Wykonawca:** ChatGPT / GPT-6. **Środowisko:** wyłącznie Netlify `develop--constant-app.netlify.app`, bez produkcyjnego main, Supabase i płatnego GitHub Actions.

**Decyzja właściciela:** użytkownik polecił 31.10.2026: „Dodaj je do netlify, sprawdź i ewentualnie popraw a następnie sprawdź czego jeszcze brakuje I dobuduj kolejne technologie”. Niniejszy commit uruchamia **jedno zbiorcze wydanie testowe** przy użyciu wybranego w repo `[publish-netlify]`. Nie jest to akceptacja produkcyjnego mergowania ani zamknięcie etapu 00/04.

**Kod w pakiecie:** 3 programy treningowe × 2 jednostki, interwały, wykonywanie i potwierdzanie, lokalna historia A/B, dobrowolne RPE treningu, rzeczywiste serie (powtórzenia, kg, RPE/RIR), ostatni wynik, szkic offline, cofanie pomyłek, częściowy backup JSON, zliczanie cykli i cache PWA. Raport [WD-20261031-WIE-185-SETS-ENGINE-07](./WD-20261031-WIE-185-SETS-ENGINE-07.md), karty `WIE-185` i `WIE-186` w `docs/wiedora-quality/tasks/`.

**Kontrole wykonane przed zwolnieniem partii:** 17/17 izolowanych asercji V8 modelu, poprawna składnia 8/8 skryptów JS/CJS, 14/14 ID UI↔JS, 2/2 karty Work/Codex bez błędów formatu, zgodne ścieżki SW/iframe/outer i logiczna kontrola ochrony zapisu po zatwierdzeniu. To **nie jest** `npm run verify`, nie zastępuje natywnych testów Node/JSDOM ani prawdziwego urządzenia.

**Weryfikacja po publikacji (do uzupełnienia tylko po faktycznym wyniku):** raportować Netlify deploy ID, state, status/build log, `/build-info.json` SHA porównany z commit release i widok FitPlan, CDN/PWA, realne interakcje UI w Chrome lub Work. Jeśli deploy nie zostanie uruchomiony lub nie będzie dostępny — **BLOCKED**, a nie PASS. Nie używać tego samego wyniku do zaliczania C01 lub innych bramek etapu 00.

**Lista ryzyk i dalsze zadania:** backendowa synchronizacja kont wstrzymana przez W04/W05 etapu 00, import backupu niezaimplementowany, automatyczna progresja ciężaru bez danych/oceny trenera niedozwolona, 11 rodzin poza nowym pilotem, animacje bez oceny specjalisty. Po publikacji testu i korektach potrzebne odrębne `npm run verify`, `npm run verify:full`, mobilny E2E i najnowszy spójny SHA. Nie usuwać aktywnych zgłoszeń błędów bez ich testów.
