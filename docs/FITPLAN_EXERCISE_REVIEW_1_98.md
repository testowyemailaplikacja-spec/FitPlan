# FitPlan — ponowna kontrola ćwiczeń 1–98 w kolejności użytkownika

Data audytu: 22.10.2026. Repozytorium: `testowyemailaplikacja-spec/Constant_app`, gałąź `develop`. Raport zastępuje poprzednią ocenę z tego samego dnia i zachowuje niezmienną numerację 1–98.

## Zakres sprawdzenia

1. Sprawdzono istnienie wszystkich **98/98** nazw we właściwym katalogu i jedynego poprawnego dostawcę podglądu (95 szkiców SVG + trzy wcześniejsze odrębne modele).
2. Dla 95 szkiców mechanicznych sprawdzono 101 wartości suwaka, brak nieciągłości powyżej 15 jednostek obrazu na 1 punkt procentowy, 10 długości segmentów oraz położenie 14 punktów w kadrze. Sprawdzone odchylenia długości pozostają na poziomie błędu numerycznego.
3. Hip Thrust ma osobny atlas sześciu fotograficznych klatek i pięć par map przepływu. Skontrolowano pełną oś `[0,1,2,3,4,5,4,3,2,1,0]`, skrajne wartości suwaka oraz lokalne wymiary obu zasobów. Poprzednia kontrola długości segmentów dotyczyła zastąpionego modelu punktowego.
4. Sprawdzono kodowy renderer wszystkich 95 szkiców SVG w symulowanym DOM, suwaki w kilku pozycjach i zwolnienie obiektów; ponadto sprawdzono przypisanie nowej geometrii sprzętu i przeciwstawne kierunki ruchu dłoni/stóp.
5. Wzorców w rejestrze **67**, wykorzystywanych w katalogu **63**. Katalog nie zawiera brakujących aliasów ani kolizji.

**Ważne:** powyższy PASS dotyczy integralności kodu i ograniczeń geometrycznych, **nie** faktycznie wykonanych testów `npm run verify` ani Playwright i **nie** profesjonalnej oceny techniki ruchów. Wciąż nie ma potwierdzenia wyglądu w nowej wersji Netlify. Nie utożsamiać małego odchylenia długości kości z poprawną biomechaniką: model nie posiada pełnego chwytu, palców, stóp, osi 3D ani odwzorowania sił i tempa.

## Przegląd pozycji jedna po drugiej

Kolumna „Przemieszczenie” oznacza największą zmianę położenia jednego punktu ciała między 0% a 50% (w jednostkach obrazu 800×400), **nie ocenia poprawności techniki**. Dla ruchów realizowanych wyłącznie obrotem grafiki dłoni/stopy wartość może wynosić 0.

| Nr | Ćwiczenie | Wzorzec | Przemieszczenie | Wynik kontroli | Uwagi |
|---:|---|---|---:|---|---|
| 1 | Hip thrust | H | — | OSOBNY MODEL FOTOGRAFICZNY | Sześć faz od dołu do wyprostu, własna mapa przepływu i powrót odwróconą osią. Kontakt barków z ławką, stóp z podłożem i wygląd interpolacji wymagają kontroli wizualnej. |
| 2 | Side step | side-step | — | MODEL FOTOGRAFICZNY Z INTERPOLACJĄ | Wspólna definicja, sześć klatek 512×512 i pięć map flow; ręczny krok w bok i powrót. Bez WebGL: przenikanie klatek. Ocena biomechaniczna pozostaje otwarta. |
| 3 | Kontrolowana rotacja biodra | hipRotation | 57.0 | WYMAGA WIDOKU 3D | Model 2D nie zawiera poprawnej osi rotacji stawów ani orientacji dłoni. |
| 4 | Chód bokiem z gumą | lateralBandWalk | 66.1 | SZKIC 2D | Pozostań w lekkim półprzysiadzie; zrób krok jedną nogą, utrzymując napięcie taśmy. Kontrola techniki, kontaktów i perspektywy w przeglądarce pozostaje otwarta. |
| 5 | Ćwiczenie muszla | clamshell | 0.0 | BRAK ANIMACJI | Ruch przestrzenny niewidoczny w obecnej projekcji. Suwak zablokowany, potrzebny nowy model 3D/2.5D. |
| 6 | Monster walk | monsterWalk | 62.1 | SZKIC 2D | Zachowaj ugięte kolana i napiętą taśmę; krok wykonuj po skosie, bez zapadania kolan. Kontrola techniki, kontaktów i perspektywy w przeglądarce pozostaje otwarta. |
| 7 | Odwodzenie nogi | abduction | 71.9 | SZKIC 2D | Odsuń nogę od osi ciała bez przechylania tułowia. Kontrola techniki, kontaktów i perspektywy w przeglądarce pozostaje otwarta. |
| 8 | Single-leg work | balance | 107.8 | NIEJEDNOZNACZNA NAZWA | Brak zdefiniowanego wariantu ruchu — konieczne doprecyzowanie techniki. |
| 9 | Przysiady | squat | 62.0 | SZKIC 2D | Utrzymuj stabilne stopy, prowadź kolana zgodnie z kierunkiem palców. Kontrola techniki, kontaktów i perspektywy w przeglądarce pozostaje otwarta. |
| 10 | Sumo squat | sumoSquat | 62.0 | SZKIC 2D | Utrzymuj stabilne stopy, prowadź kolana zgodnie z kierunkiem palców. Kontrola techniki, kontaktów i perspektywy w przeglądarce pozostaje otwarta. |
| 11 | Wykroki | lunge | 95.4 | SZKIC 2D | Utrzymuj równowagę, zginając oba kolana i kontrolując położenie bioder. Kontrola techniki, kontaktów i perspektywy w przeglądarce pozostaje otwarta. |
| 12 | Kontrolowane unoszenie kolana | kneeRaise | 105.4 | SZKIC 2D | Unieś jedno kolano, utrzymując miednicę i tułów stabilnie. Kontrola techniki, kontaktów i perspektywy w przeglądarce pozostaje otwarta. |
| 13 | Kontrolowane zgięcie biodra | kneeRaise | 105.4 | SZKIC 2D | Unieś jedno kolano, utrzymując miednicę i tułów stabilnie. Kontrola techniki, kontaktów i perspektywy w przeglądarce pozostaje otwarta. |
| 14 | Marsz | walk | 60.5 | SZKIC 2D | Przenoś ciężar w kontrolowany sposób; ten podgląd pokazuje jeden krok. Kontrola techniki, kontaktów i perspektywy w przeglądarce pozostaje otwarta. |
| 15 | Marsz na piętach | heelWalk | 32.4 | SZKIC 2D | Utrzymuj kontakt pięty z podłożem; schemat pokazuje tylko etap kroku. Kontrola techniki, kontaktów i perspektywy w przeglądarce pozostaje otwarta. |
| 16 | Marsz pod górę | walk | 60.5 | BRAK NACHYLENIA | Brak modelu pochyłości terenu, rysunek jest płaskim krokiem. |
| 17 | Marsze z oporem | walk | 60.5 | SZKIC 2D | Przenoś ciężar w kontrolowany sposób; ten podgląd pokazuje jeden krok. Kontrola techniki, kontaktów i perspektywy w przeglądarce pozostaje otwarta. |
| 18 | Nawracanie stopy z gumą | ankleEversion | 0.0 | RUCH LOKALNY | Osobny kierunek obrotu stopy +27°. Kostka pozostaje nieruchoma; guma i anat. stopy uproszczone. |
| 19 | Odwracanie stopy z gumą | ankleInversion | 0.0 | RUCH LOKALNY | Przeciwny obrót stopy −27°. Kostka pozostaje nieruchoma; guma i anat. stopy uproszczone. |
| 20 | Addukcja z oporem | adduction | 55.4 | SZKIC 2D | Przemieszczaj nogę do środka, utrzymując stabilny tułów. Kontrola techniki, kontaktów i perspektywy w przeglądarce pozostaje otwarta. |
| 21 | Chód bokiem | side-step | — | MODEL FOTOGRAFICZNY Z INTERPOLACJĄ | Wspólna definicja, sześć klatek 512×512 i pięć map flow; ręczny krok w bok i powrót. Bez WebGL: przenikanie klatek. Ocena biomechaniczna pozostaje otwarta. |
| 22 | Copenhagen plank | copenhagen | 29.0 | BRAK PODPORY | Brak podwyższonej podpory górnej nogi; animacja nie może służyć jako instruktaż. |
| 23 | Dorsiflexion raises | toeRaise | 22.4 | BRAK PRZODOSTOPIA | Szkic porusza całą stopę zamiast osobnego uniesienia jej przodu. Potrzebny dodatkowy staw przodostopia. |
| 24 | Odwodzenie biodra | abduction | 71.9 | SZKIC 2D | Odsuń nogę od osi ciała bez przechylania tułowia. Kontrola techniki, kontaktów i perspektywy w przeglądarce pozostaje otwarta. |
| 25 | Prostowanie nóg | legExtension | 112.5 | SZKIC 2D | Wyprostuj kolano w kontrolowanym zakresie, bez szarpnięcia. Kontrola techniki, kontaktów i perspektywy w przeglądarce pozostaje otwarta. |
| 26 | RDL | hinge | 159.9 | SZKIC 2D | Cofnij biodra i pochyl tułów, unikając zaokrąglania pleców. Kontrola techniki, kontaktów i perspektywy w przeglądarce pozostaje otwarta. |
| 27 | Skakanka | jump | 47.0 | BRAK SKAKANKI | Wybicie i lądowanie kontroluj obunóż, miękko uginając kolana. Odbicie jest tylko poglądowe: aktualny renderer nie rysuje liny ani toru jej obrotu. |
| 28 | Skoki | jump | 47.0 | SZKIC 2D | Wybicie i lądowanie kontroluj obunóż, miękko uginając kolana. Kontrola techniki, kontaktów i perspektywy w przeglądarce pozostaje otwarta. |
| 29 | Stanie jednonóż | balance | 107.8 | SZKIC 2D | Utrzymuj środek ciężkości nad stopą podporową. Kontrola techniki, kontaktów i perspektywy w przeglądarce pozostaje otwarta. |
| 30 | Uginania nóg | legCurl | 104.1 | SZKIC 2D | Zginaj kolano bez przesuwania uda i przechylania tułowia. Kontrola techniki, kontaktów i perspektywy w przeglądarce pozostaje otwarta. |
| 31 | Unoszenia kolan | kneeRaise | 105.4 | SZKIC 2D | Unieś jedno kolano, utrzymując miednicę i tułów stabilnie. Kontrola techniki, kontaktów i perspektywy w przeglądarce pozostaje otwarta. |
| 32 | Wejścia na stopień | step | 71.3 | SZKIC 2D | W ostatniej pozycji stopa wykroczna styka się z podestem, przeciwna zachowuje podparcie. |
| 33 | Wspięcia na palce | calf | 20.0 | SZKIC 2D | Unieś pięty, zachowując wyprostowaną postawę i stabilną kontrolę. Kontrola techniki, kontaktów i perspektywy w przeglądarce pozostaje otwarta. |
| 34 | Wspięcia siedząc | seatedCalf | 18.1 | SZKIC 2D | Unoś pięty w pozycji siedzącej, nie szarpiąc kolanami. Kontrola techniki, kontaktów i perspektywy w przeglądarce pozostaje otwarta. |
| 35 | Wspięcia stojąc | calf | 20.0 | SZKIC 2D | Unieś pięty, zachowując wyprostowaną postawę i stabilną kontrolę. Kontrola techniki, kontaktów i perspektywy w przeglądarce pozostaje otwarta. |
| 36 | Good morning | hinge | 159.9 | SZKIC 2D | Cofnij biodra i pochyl tułów, unikając zaokrąglania pleców. Kontrola techniki, kontaktów i perspektywy w przeglądarce pozostaje otwarta. |
| 37 | Wyciskanie sztangi na ławce płaskiej | 3D | — | OSOBNY MODEL — BEZ WIZUALNEGO TESTU | Osobny model 3D. W tym przeglądzie nie sprawdzono wizualnie czterech faz i toru sztangi. |
| 38 | Pompki | F | — | OSOBNY MODEL — BEZ WIZUALNEGO TESTU | Osobna animacja fotograficzna z 6 klatek. W tym przeglądzie nie zweryfikowano deformacji WebGL ani obrazu. |
| 39 | Carries | walk | 60.5 | NIEJEDNOZNACZNA NAZWA | Brak zdefiniowanego wariantu ruchu — konieczne doprecyzowanie techniki. |
| 40 | Landmine press | landmine | 55.3 | SZKIC 2D | Stała długość sztangi względem podłogowego przegubu; chwyt i rzeczywista trajektoria wymagają wizualnej kontroli. |
| 41 | Wyciskanie hantli na ławce dodatniej | inclinePush | 100.0 | SZKIC 2D | Prowadź dłonie ponad barkami, kontrolując łopatki i tor ciężaru. Kontrola techniki, kontaktów i perspektywy w przeglądarce pozostaje otwarta. |
| 42 | Ćwiczenia kontroli barku | shoulder | 27.8 | SZKIC 2D | Poruszaj obręczą barkową w niewielkim, kontrolowanym zakresie. Kontrola techniki, kontaktów i perspektywy w przeglądarce pozostaje otwarta. |
| 43 | Ćwiczenia oddechowe | breathing | 2.4 | SZKIC 2D | Oddychaj spokojnie, unikając unoszenia barków; schemat nie mierzy objętości oddechu. Kontrola techniki, kontaktów i perspektywy w przeglądarce pozostaje otwarta. |
| 44 | Kontrolowane obniżanie łopatek | depression | 6.2 | SZKIC 2D | Opuść łopatki bez pochylenia szyi lub nadmiernego napięcia ramion. Kontrola techniki, kontaktów i perspektywy w przeglądarce pozostaje otwarta. |
| 45 | Spokojny oddech przeponowy | breathing | 2.4 | SZKIC 2D | Oddychaj spokojnie, unikając unoszenia barków; schemat nie mierzy objętości oddechu. Kontrola techniki, kontaktów i perspektywy w przeglądarce pozostaje otwarta. |
| 46 | Wall slides | armRaise | 120.8 | WYMAGA WIDOKU 3D | Tło ściany obejmuje ramiona; kontakt dłoni ze ścianą nie jest kinematycznie wymuszony. |
| 47 | Bracing | staticHold | 0.0 | IZOMETRIA | To ćwiczenie izometryczne; suwak pokazuje fazy utrzymania, a nie sztuczny ruch. Kontrola techniki, kontaktów i perspektywy w przeglądarce pozostaje otwarta. |
| 48 | Push-up plus | scapPush | 9.2 | SZKIC 2D | Wypchnij klatkę od podłoża, nie zginając łokci i nie zapadając biodrami. Kontrola techniki, kontaktów i perspektywy w przeglądarce pozostaje otwarta. |
| 49 | Rozpiętki na ławce | fly | 106.7 | SZKIC 2D | Zachowaj lekkie ugięcie łokci i prowadź ramiona szerokim łukiem. Kontrola techniki, kontaktów i perspektywy w przeglądarce pozostaje otwarta. |
| 50 | Stabilizacja łopatki | shoulder | 27.8 | SZKIC 2D | Poruszaj obręczą barkową w niewielkim, kontrolowanym zakresie. Kontrola techniki, kontaktów i perspektywy w przeglądarce pozostaje otwarta. |
| 51 | Martwy ciąg | hinge | 159.9 | SZKIC 2D | Cofnij biodra i pochyl tułów, unikając zaokrąglania pleców. Kontrola techniki, kontaktów i perspektywy w przeglądarce pozostaje otwarta. |
| 52 | Podciąganie | pullUp | 67.8 | SZKIC 2D | Podnieś ciało pracą ramion i pleców, bez bujania nogami. Kontrola techniki, kontaktów i perspektywy w przeglądarce pozostaje otwarta. |
| 53 | Wiosłowanie | row | 73.6 | NIEJEDNOZNACZNA NAZWA | Brak zdefiniowanego wariantu ruchu — konieczne doprecyzowanie techniki. |
| 54 | Bird dog | birdDog | 152.1 | SZKIC 2D | Wyciągnij przeciwległą rękę i nogę bez rotacji bioder. Kontrola techniki, kontaktów i perspektywy w przeglądarce pozostaje otwarta. |
| 55 | Face pull | facePull | 102.5 | SZKIC 2D | Prowadź łokcie szeroko, przyciągając dłonie w okolice skroni. Kontrola techniki, kontaktów i perspektywy w przeglądarce pozostaje otwarta. |
| 56 | Ściąganie drążka | pulldown | 94.6 | SZKIC 2D | Rozpocznij od drążka ponad głową, prowadź łokcie w dół bez szarpania tułowiem. Kontrola techniki, kontaktów i perspektywy w przeglądarce pozostaje otwarta. |
| 57 | Ćwiczenia antyrotacyjne | antiRotation | 55.8 | SZKIC 2D | Odsuń dłonie od mostka i utrzymaj stabilną miednicę. Kontrola techniki, kontaktów i perspektywy w przeglądarce pozostaje otwarta. |
| 58 | Izometrie | staticHold | 0.0 | NIEJEDNOZNACZNA NAZWA | Brak zdefiniowanego wariantu ruchu — konieczne doprecyzowanie techniki. |
| 59 | Kontrolowane unoszenie łopatek | shrug | 29.7 | SZKIC 2D | Unieś obręcz barkową, nie pochylając głowy. Kontrola techniki, kontaktów i perspektywy w przeglądarce pozostaje otwarta. |
| 60 | Back extension | backExtension | 68.5 | SZKIC 2D | Prostuj tułów w biodrach, unikając przeprostu odcinka lędźwiowego. Kontrola techniki, kontaktów i perspektywy w przeglądarce pozostaje otwarta. |
| 61 | Hip hinge | hinge | 159.9 | SZKIC 2D | Cofnij biodra i pochyl tułów, unikając zaokrąglania pleców. Kontrola techniki, kontaktów i perspektywy w przeglądarce pozostaje otwarta. |
| 62 | Shrugsy | shrug | 29.7 | SZKIC 2D | Unieś obręcz barkową, nie pochylając głowy. Kontrola techniki, kontaktów i perspektywy w przeglądarce pozostaje otwarta. |
| 63 | Ściąganie łopatek | shoulder | 27.8 | SZKIC 2D | Poruszaj obręczą barkową w niewielkim, kontrolowanym zakresie. Kontrola techniki, kontaktów i perspektywy w przeglądarce pozostaje otwarta. |
| 64 | Wyciskanie nad głowę | overhead | 146.0 | SZKIC 2D | Unieś ręce ponad głowę bez nadmiernego wyginania odcinka lędźwiowego. Kontrola techniki, kontaktów i perspektywy w przeglądarce pozostaje otwarta. |
| 65 | Arnold press | arnold | 142.4 | WYMAGA WIDOKU 3D | Arnold Press wymaga odwzorowania zmiany rotacji ramienia i chwytu; aktualny ruch 2D pokazuje jedynie wyciskanie. |
| 66 | Face pull z rotacją | facePullRotated | 129.0 | WYMAGA WIDOKU 3D | Face Pull z rotacją wymaga zewnętrznego obrotu ramienia i prawidłowej pozycji nadgarstków, niewidocznych w obecnym szkielecie. |
| 67 | Rotacje zewnętrzne gumą | external | 77.3 | WYMAGA WIDOKU 3D | Model 2D nie zawiera poprawnej osi rotacji stawów ani orientacji dłoni. |
| 68 | Unoszenia bokiem | armRaise | 120.8 | SZKIC 2D | Unieś ramiona spokojnie, nie unosząc nadmiernie barków. Kontrola techniki, kontaktów i perspektywy w przeglądarce pozostaje otwarta. |
| 69 | Y-raise | armRaise | 120.8 | SZKIC 2D | Unieś ramiona spokojnie, nie unosząc nadmiernie barków. Kontrola techniki, kontaktów i perspektywy w przeglądarce pozostaje otwarta. |
| 70 | Dead bug | deadBug | 68.8 | SZKIC 2D | Prowadź przeciwległe kończyny w przeciwnych kierunkach, utrzymując tułów nieruchomo. Kontrola techniki, kontaktów i perspektywy w przeglądarce pozostaje otwarta. |
| 71 | Deska boczna | sidePlank | 0.0 | IZOMETRIA | Utrzymaj linię bark–biodro–stopa i nie opadaj biodrami. Kontrola techniki, kontaktów i perspektywy w przeglądarce pozostaje otwarta. |
| 72 | Pallof press | antiRotation | 55.8 | SZKIC 2D | Odsuń dłonie od mostka i utrzymaj stabilną miednicę. Kontrola techniki, kontaktów i perspektywy w przeglądarce pozostaje otwarta. |
| 73 | Antyrotacja | antiRotation | 55.8 | SZKIC 2D | Odsuń dłonie od mostka i utrzymaj stabilną miednicę. Kontrola techniki, kontaktów i perspektywy w przeglądarce pozostaje otwarta. |
| 74 | Kontrolowane skręty tułowia | rotation | 32.0 | WYMAGA WIDOKU 3D | Model 2D nie zawiera poprawnej osi rotacji stawów ani orientacji dłoni. |
| 75 | Hollow hold | hollow | 75.0 | SZKIC 2D | Unieś lekko barki i nogi przy stabilnym tułowiu, bez wymuszonego przeprostu. Kontrola techniki, kontaktów i perspektywy w przeglądarce pozostaje otwarta. |
| 76 | Side plank | sidePlank | 0.0 | IZOMETRIA | Utrzymaj linię bark–biodro–stopa i nie opadaj biodrami. Kontrola techniki, kontaktów i perspektywy w przeglądarce pozostaje otwarta. |
| 77 | Spacer z obciążeniem po jednej stronie | walk | 60.5 | SZKIC 2D | Przenoś ciężar w kontrolowany sposób; ten podgląd pokazuje jeden krok. Kontrola techniki, kontaktów i perspektywy w przeglądarce pozostaje otwarta. |
| 78 | Spięcia | crunch | 71.5 | SZKIC 2D | Unoś łopatki siłą mięśni brzucha, unikając ciągnięcia szyi. Kontrola techniki, kontaktów i perspektywy w przeglądarce pozostaje otwarta. |
| 79 | Unoszenia nóg | legRaise | 185.8 | SZKIC 2D | Unoś nogi bez odrywania lędźwi i kołysania tułowiem. Kontrola techniki, kontaktów i perspektywy w przeglądarce pozostaje otwarta. |
| 80 | Woodchopper | woodchop | 118.9 | SZKIC 2D | Wykonuj ruch ukośnie z kontrolą bioder i tułowia. Kontrola techniki, kontaktów i perspektywy w przeglądarce pozostaje otwarta. |
| 81 | Rollouty | rollout | 85.4 | SZKIC 2D | Przesuń dłonie do przodu, utrzymując napięty brzuch i kontrolując odcinek lędźwiowy. Kontrola techniki, kontaktów i perspektywy w przeglądarce pozostaje otwarta. |
| 82 | Dipy | dip | 36.0 | SZKIC 2D | Dodane poręcze; dolny punkt stóp nie przenika narysowanej podłogi w 101 pozycjach. |
| 83 | Podciąganie podchwytem | pullUp | 67.8 | UCHWYT NIEODWZOROWANY | Dynamika podciągania obecna, lecz model 2D nie pokazuje ustawienia dłoni w supinacji. |
| 84 | Wyciskanie wąsko | push | 90.8 | SZKIC 2D | Po poprawce dłonie przemieszczają się około 91 jednostek, przedramiona zachowują długość, a sztanga utrzymuje poziomy chwyt. Ustawienie łopatek i kontakt sztangi z klatką wymagają oceny wizualnej. |
| 85 | Prostowania na wyciągu | triceps | 84.7 | SZKIC 2D | Wyprostuj przedramiona, utrzymując łokcie stabilnie przy bokach. Kontrola techniki, kontaktów i perspektywy w przeglądarce pozostaje otwarta. |
| 86 | Uginania hantli | curl | 76.0 | SZKIC 2D | Utrzymuj ramiona blisko tułowia, pracuj przedramionami. Kontrola techniki, kontaktów i perspektywy w przeglądarce pozostaje otwarta. |
| 87 | Uginania ze sztangą | curl | 76.0 | SZKIC 2D | Utrzymuj ramiona blisko tułowia, pracuj przedramionami. Kontrola techniki, kontaktów i perspektywy w przeglądarce pozostaje otwarta. |
| 88 | Uginanie ramion chwytem młotkowym | curl | 76.0 | UCHWYT NIEODWZOROWANY | Dłoń i chwyt nie są odwzorowane przestrzennie. |
| 89 | Uginanie ramion nachwytem | curl | 76.0 | UCHWYT NIEODWZOROWANY | Dłoń i chwyt nie są odwzorowane przestrzennie. |
| 90 | Spacer farmera | walk | 60.5 | SZKIC 2D | Przenoś ciężar w kontrolowany sposób; ten podgląd pokazuje jeden krok. Kontrola techniki, kontaktów i perspektywy w przeglądarce pozostaje otwarta. |
| 91 | Nawracanie przedramienia z małym oporem | forearmRotate | 29.4 | WYMAGA WIDOKU 3D | Model 2D nie zawiera poprawnej osi rotacji stawów ani orientacji dłoni. |
| 92 | Odwracanie przedramienia z małym oporem | forearmRotate | 29.4 | WYMAGA WIDOKU 3D | Model 2D nie zawiera poprawnej osi rotacji stawów ani orientacji dłoni. |
| 93 | Prostowanie palców z gumą | fingers | 16.8 | BRAK STAWÓW PALCÓW | Aktualny model nie posiada stawów palców: ruch jest poglądowy i nie przedstawia faktycznego rozwarcia dłoni. |
| 94 | Prostowanie nadgarstków | wristExtension | 0.0 | RUCH LOKALNY | Osobny kierunek wyprostu dłoni −36°. Przedramię nie przesuwa się; brak pełnego stawu nadgarstka. |
| 95 | Uginanie młotkowe | curl | 76.0 | UCHWYT NIEODWZOROWANY | Ruch przedramienia widoczny, ale chwyt neutralny nie jest reprezentowany. |
| 96 | Uginanie nachwytem | curl | 76.0 | UCHWYT NIEODWZOROWANY | Ruch przedramienia widoczny, ale pronacja dłoni nie jest reprezentowana. |
| 97 | Uginanie nadgarstków | wristCurl | 0.0 | RUCH LOKALNY | Osobny kierunek zgięcia dłoni +36°. Przedramię nie przesuwa się; brak pełnego stawu nadgarstka. |
| 98 | Zwis na drążku | hang | 0.0 | IZOMETRIA | Utrzymuj aktywne barki i stabilny chwyt; ruch nie jest wymagany. Kontrola techniki, kontaktów i perspektywy w przeglądarce pozostaje otwarta. |

## Ograniczenia i definicja ukończenia

Status **SZKIC 2D** oznacza działającą podstawę geometrii, a nie zatwierdzony instruktaż. Status **BRAK ANIMACJI** oznacza wyłączony suwak i konieczność opracowania nowego ruchu. Statusy o brakującym podparciu, chwycie, pochyłości lub osi 3D wskazują konkretną przeszkodę do rozwiązania przed publikacją instruktażu.

Na tym etapie nie uznawać ćwiczenia za biomechanicznie ukończone bez indywidualnego sprawdzenia toru ruchu, pozycji start/koniec, kąta stawów i osi ruchu, kontaktu ze sprzętem i podłożem, faz powtórzenia, proporcji człowieka, płynności na telefonie i komputerze, zachowania offline i braku autoplay.

Aktualne testy w repozytorium: `tests/fitplan-motion-ordered-regression.test.cjs`, `tests/fitplan-mechanical-geometry.test.cjs` i `tests/fitplan-mechanical-drafts.test.cjs`. Po udostępnieniu lokalnego runtime przeprowadzić `npm run verify`, potem wybraną przeglądarkową regresję i porównać SHA wdrożenia. Do czasu ich wykonania status całego etapu to **WDROŻONE, NIEPRZETESTOWANE ZEWNĘTRZNIE**, z otwartymi ograniczeniami merytorycznymi.


