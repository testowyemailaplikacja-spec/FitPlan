(()=>{
"use strict";
// All new movements live here exactly once. Plan/discipline screens store IDs only.
const L=["poczatkujacy","sredniozaawansowany","zaawansowany","zawodowiec"];
// name ; minimum level 1-4 ; primary areas ; assistant areas ; sports ; instruction
const rows=[
["Incline Push-Up",1,"chest arms","shoulders abs","kalistenika 100-pompek","Pompka z rękami na stabilnym podwyższeniu; zmniejsz kąt wraz z postępem."],
["Wall Push-Up",1,"chest arms","shoulders","kalistenika 100-pompek","Pompka przy ścianie; kontroluj pozycję tułowia."],
["Knee Push-Up",1,"chest arms","shoulders abs","kalistenika 100-pompek","Pompka z kolan bez opuszczania bioder."],
["Slow Tempo Push-Up",2,"chest arms","shoulders abs","kalistenika 100-pompek","Wydłuż opuszczanie, zachowując stabilną linię tułowia."],
["Decline Push-Up",3,"chest shoulders","arms abs","kalistenika 100-pompek","Pompka z nogami na podwyższeniu; nie zapadaj się w barkach."],
["Archer Push-Up",3,"chest arms","shoulders abs","kalistenika 100-pompek","Przesuń obciążenie ku jednej ręce, bez skręcania tułowia."],
["One-Arm Assisted Push-Up",3,"chest arms","shoulders abs","kalistenika 100-pompek","Wariant z podparciem drugiej ręki, kontroluj rotację bioder."],
["Scapular Pull-Up",1,"back","shoulders arms grip","kalistenika","Zwis z niewielkim kontrolowanym ruchem łopatek, bez kołysania."],
["Band-Assisted Pull-Up",1,"back arms","grip abs","kalistenika","Pomoc dobrana tak, by zachować pełny kontrolowany zakres."],
["Foot-Assisted Pull-Up",1,"back arms","grip abs","kalistenika","Podparcie stopy stopniowo zmniejsza pomoc."],
["Eccentric Pull-Up",2,"back arms","grip abs","kalistenika","Kontroluj fazę opuszczania, wykorzystaj stabilne wejście."],
["Inverted Row",1,"back arms","grip abs","kalistenika crossfit","Poziome przyciąganie na stabilnym drążku, napięty tułów."],
["Chest-to-Bar Pull-Up",3,"back arms","abs grip","kalistenika crossfit","Przyciągaj do klatki bez gwałtownego szarpania."],
["Explosive High Pull-Up",3,"back arms","abs grip","kalistenika","Dynamiczne przyciąganie wyżej niż zwykłe podciąganie."],
["Lower-Chest High Pull-Up",4,"back arms","abs grip","kalistenika","Wysokie podciąganie przy pełnej kontroli toru i łopatek."],
["Parallel Bar Support Hold",1,"chest arms","shoulders abs","kalistenika","Utrzymuj stabilny podpór na poręczach, barki aktywne."],
["Band-Assisted Dip",2,"chest arms","shoulders","kalistenika","Dobierz pomoc; nie schodź poniżej kontrolowanego zakresu."],
["Eccentric Dip",2,"chest arms","shoulders","kalistenika","Powolne opuszczanie na poręczach, powrót z podparciem."],
["Straight-Bar Dip",3,"chest arms","shoulders abs","kalistenika","Wyciskanie w podporze na jednym stabilnym drążku."],
["Low-Bar Muscle-Up Transition",3,"back chest arms","shoulders abs grip","kalistenika","Nauka przejścia nad niskim drążkiem z podparciem stóp."],
["Band-Assisted Bar Muscle-Up",3,"back chest arms","shoulders abs grip","kalistenika","Przećwicz przyciąganie, przejście i wyprost w podporze."],
["Strict Bar Muscle-Up",4,"back chest arms","shoulders abs grip","kalistenika","Łączy wysokie przyciąganie, przejście i wyciskanie; tylko po opanowaniu podstaw."],
["Wrist Preparation",1,"grip","shoulders","kalistenika joga rozciaganie","Łagodna mobilizacja i obciążanie nadgarstków bez bólu."],
["Scapular Protraction Hold",1,"shoulders","chest abs","kalistenika","Aktywne wypchnięcie łopatek w podporze."],
["Frog Stand",2,"shoulders abs","grip chest","kalistenika","Krótka równowaga w podporze, asekuruj wyjście."],
["Planche Lean",2,"shoulders chest","arms abs grip","kalistenika","Kontrolowany skłon nad dłońmi z aktywnymi łopatkami."],
["Pseudo Planche Push-Up",2,"chest shoulders arms","abs grip","kalistenika","Pompka z przesuniętym środkiem ciężkości i kontrolą nadgarstka."],
["Tuck Planche",3,"shoulders chest","arms abs grip","kalistenika","Podpór z kolanami podciągniętymi, bez utraty pozycji barków."],
["Advanced Tuck Planche",3,"shoulders chest","arms abs grip","kalistenika","Stopniowo wydłuż dźwignię tułowia, nie zapadaj łopatek."],
["Straddle Planche",4,"shoulders chest","arms abs grip","kalistenika","Figura bardzo zaawansowana, tylko przy pełnej kontroli pozycji."],
["Full Planche",4,"shoulders chest","arms abs grip","kalistenika","Trudny podpór poziomy wymagający przygotowanych nadgarstków i barków."],
["Reverse Crunch",1,"abs","hip","kalistenika brzuch","Zwijaj miednicę, bez zamachu nogami."],
["Candlestick Raise",2,"abs","hip back","kalistenika brzuch","Kontrolowane uniesienie miednicy przy stabilnym podparciu."],
["Tuck Dragon Flag Negative",2,"abs","back shoulders","kalistenika brzuch","Krótka dźwignia; ciężar na barkach, nigdy na szyi."],
["One-Leg Dragon Flag Negative",3,"abs","back glutes","kalistenika brzuch","Jedna noga wyprostowana podczas kontrolowanego opuszczania."],
["Dragon Flag Negative",3,"abs","back shoulders","kalistenika brzuch","Opuszczanie bez załamania w biodrach i bez nacisku na szyję."],
["Dragon Flag",4,"abs","back shoulders glutes","kalistenika brzuch","Pełny ruch z utrzymaniem długiej dźwigni; stabilne podparcie."],
["Tuck Front Lever",2,"back abs","arms shoulders grip","kalistenika","Utrzymaj tułów w podwieszeniu z krótką dźwignią."],
["Advanced Tuck Front Lever",3,"back abs","arms shoulders grip","kalistenika","Stopniowo wydłuż dźwignię zachowując ustawienie łopatek."],
["One-Leg Front Lever",3,"back abs","arms shoulders grip","kalistenika","Jedna noga wydłuża dźwignię; naprzemiennie ćwicz strony."],
["Straddle Front Lever",4,"back abs","arms shoulders grip","kalistenika","Podwieszenie z wyprostowanymi nogami w rozkroku."],
["Full Front Lever",4,"back abs","arms shoulders grip","kalistenika","Figura siłowa w podwieszeniu, wymaga bardzo mocnego grzbietu i tułowia."],
["Tuck Back Lever",3,"shoulders back","chest abs","kalistenika","Wymaga wyuczonej kontroli rotacji barków i asekuracji."],
["Advanced Tuck Back Lever",3,"shoulders back","chest abs","kalistenika","Postęp przez dźwignię przy zachowaniu ruchomości barków."],
["Straddle Back Lever",4,"shoulders back","chest abs","kalistenika","Figura zaawansowana w kontrolowanym podwieszeniu."],
["Full Back Lever",4,"shoulders back","chest abs","kalistenika","Pełna dźwignia tyłem, pod nadzorem przy pierwszych próbach."],
["Seated Compression Lift",1,"abs hip","quad","kalistenika joga","Unoś nogi nad podłoże w siadzie z kontrolą miednicy."],
["Tuck L-Sit",2,"abs hip","arms shoulders","kalistenika","Podpór na poręczach lub paraletkach z ugiętymi kolanami."],
["One-Leg L-Sit",2,"abs hip","arms shoulders","kalistenika","Jedna noga wyprostowana, druga ugięta."],
["L-Sit",3,"abs hip","arms shoulders","kalistenika","Utrzymaj nogi równolegle do podłoża, aktywne barki."],
["V-Sit",4,"abs hip","arms shoulders","kalistenika","Zaawansowana kompresja w podporze."],
["Wall Plank",1,"shoulders abs","arms","kalistenika","Podpór przygotowujący barki do pozycji odwróconych."],
["Wall Walk",2,"shoulders abs","arms grip","kalistenika crossfit","Wchodź stopami na ścianę w kontrolowanym zakresie."],
["Wall Handstand Hold",2,"shoulders abs","arms grip","kalistenika joga","Stój na rękach przy ścianie z kontrolowanym zejściem."],
["Handstand Exit Drill",2,"shoulders abs","arms","kalistenika","Ćwicz bezpieczne zejście bokiem z asekuracją."],
["Freestanding Handstand",3,"shoulders abs","arms grip","kalistenika joga","Równowaga bez ściany dopiero po nauce bezpiecznego wyjścia."],
["Pike Push-Up",2,"shoulders arms","chest abs","kalistenika crossfit","Pompka z biodrami wysoko, stopniowo zwiększ zakres."],
["Wall-Assisted Handstand Push-Up",3,"shoulders arms","chest abs","kalistenika crossfit","Ruch do bezpiecznej wysokości przy asekuracji."],
["Freestanding Handstand Push-Up",4,"shoulders arms","chest abs","kalistenika","Zaawansowany ruch równoważno-siłowy pod nadzorem."],
["Supported Pistol Squat",2,"legs glutes","abs","kalistenika","Przysiad na jednej nodze z podporą."],
["Eccentric Pistol Squat",3,"legs glutes","abs","kalistenika","Kontrolowane opuszczanie na jednej nodze."],
["Pistol Squat",3,"legs glutes","abs ankle","kalistenika","Pełny przysiad jednonóż bez zapadania kolana."],
["Vertical Human Flag Hold",3,"abs shoulders","back grip","kalistenika","Pozycja pionowa przy słupie; asekuracja i stabilny uchwyt."],
["Tuck Human Flag",3,"abs shoulders","back grip","kalistenika","Dźwignia skrócona z kolanami przy tułowiu."],
["Straddle Human Flag",4,"abs shoulders","back grip","kalistenika","Zaawansowana flaga z nogami w rozkroku."],
["Human Flag",4,"abs shoulders","back grip","kalistenika","Pełna figura wymagająca silnej stabilizacji tułowia."],
["Cartwheel Fundamentals",2,"shoulders abs","legs grip","kalistenika","Przewrót bokiem po nauce odpowiedniego podparcia i lądowania."],
["Round-Off Fundamentals",3,"shoulders abs","legs","kalistenika","Łączony ruch gimnastyczny wyłącznie na przygotowanym podłożu."],
["Aerial Cartwheel",4,"shoulders abs legs","back","kalistenika","Akrobatyka bez rąk wyłącznie w sali z trenerem i asekuracją."],
["Front Handspring",4,"shoulders abs legs","back","kalistenika","Element akrobatyczny tylko na macie i pod nadzorem szkoleniowym."],
["Back Handspring",4,"shoulders abs legs","back","kalistenika","Zaawansowany element akrobatyczny; nie ćwicz samodzielnie."],
["Front Tuck Somersault",4,"abs legs","back shoulders","kalistenika","Salto w przód jedynie z certyfikowanym trenerem i zabezpieczeniem."],
["Back Tuck Somersault",4,"abs legs","back shoulders","kalistenika","Salto w tył jedynie z certyfikowanym trenerem i zabezpieczeniem."],
// WIEDORA-CHANGE: WD-20261101-WIE-115-CALISTHENICS-01 | TASK: WIE-115/WIE-110 | AUTHOR: ChatGPT / GPT-6
// These are canonical catalog records, reused by skill paths; coaching is informational.
["Archer Pull-Up",3,"back arms","grip abs","kalistenika","Przyciąganie z większym udziałem jednej ręki; nie skręcaj tułowia."],
["Assisted One-Arm Pull-Up",3,"back arms","grip abs","kalistenika","Druga ręka pomaga przez stabilny uchwyt lub gumę; bez szarpania."],
["One-Arm Eccentric Pull-Up",4,"back arms","grip abs","kalistenika","Powolne opuszczanie z asekuracją i przygotowanym łokciem."],
["One-Arm Pull-Up",4,"back arms","grip abs","kalistenika","Wymaga dużej siły i kontroli barku; nie próbuj bez przygotowania."],
["Elevated One-Arm Push-Up",3,"chest arms","shoulders abs","kalistenika","Jednorącz na wyższym stabilnym podparciu; utrzymaj miednicę poziomo."],
["One-Arm Push-Up",4,"chest arms","shoulders abs","kalistenika","Pełna jednorączna pompka bez skrętu tułowia."],
["Supported Shrimp Squat",2,"legs glutes","abs","kalistenika","Przysiad jednonóż z oparciem ręką i kontrolą równowagi."],
["Shrimp Squat Negative",3,"legs glutes","abs","kalistenika","Powolne opuszczenie na jednej nodze z bezpieczną pomocą przy wstaniu."],
["Shrimp Squat",4,"legs glutes","abs","kalistenika","Głęboki przysiad jednonóż z ugiętą nogą za ciałem."],
["Nordic Curl Assisted",2,"legs glutes","abs","kalistenika","Silna asekuracja stóp i pomoc rąk przy wyproście."],
["Nordic Curl Eccentric",3,"legs glutes","abs","kalistenika","Kontrolowane opuszczanie z solidnym ustabilizowaniem pięt."],
["Nordic Curl",4,"legs glutes","abs","kalistenika","Zaawansowane uginanie kolan z ciężarem ciała; nie ciągnij lędźwi."],
["Ring Support Hold",2,"chest shoulders","arms abs grip","kalistenika","Stabilny podpór na kółkach na niskiej wysokości, asekuruj zejście."],
["Ring Dip",3,"chest arms","shoulders abs","kalistenika","Dipy na kółkach dopiero po pewnym podparciu, bez zapadania barków."],
["Low Ring Transition",3,"back chest arms","shoulders abs","kalistenika","Przejście na niskich kółkach z podparciem stóp."],
["Band-Assisted Ring Muscle-Up",3,"back chest arms","shoulders abs grip","kalistenika","Ruch przy dużej asekuracji, kontroluj rotację nadgarstków."],
["Strict Ring Muscle-Up",4,"back chest arms","shoulders abs grip","kalistenika","Pełny muscle-up na kółkach tylko przy opanowanej sile i technice."],
["Elbow Lever Tuck",2,"shoulders abs","chest grip","kalistenika","Krótka dźwignia na ramionach, z matą pod twarzą."],
["One-Leg Elbow Lever",3,"shoulders abs","chest grip","kalistenika","Jedna noga prostowana stopniowo; stabilne podparcie łokci."],
["Elbow Lever",3,"shoulders abs","chest grip","kalistenika","Równowaga w poziomym podporze na łokciach, bez bólu nadgarstków."],
["90 Degree Push-Up Negative",4,"shoulders chest arms","abs","kalistenika","Zaawansowana negatywna faza ruchu w asekuracji; duże obciążenie barków."],
["90 Degree Push-Up",4,"shoulders chest arms","abs","kalistenika","Przejście z podporu do stania na rękach pod okiem trenera."],
["Assisted Hefesto",4,"back arms shoulders","chest","kalistenika","Praca na kółkach przy trenerze i dużym odciążeniu; ryzyko barków."],
["Hefesto",4,"back arms shoulders","chest","kalistenika","Element gimnastyczny wysokiego ryzyka; tylko trener i asekuracja."],
["Weight Shift Handstand",3,"shoulders abs","arms","kalistenika","Przenoszenie ciężaru nad dłońmi w stabilnym staniu na rękach."],
["One Arm Wall Handstand",4,"shoulders abs","arms","kalistenika","Wariant przy ścianie z trenerem i kontrolowanym zejściem."],
["One Arm Handstand",4,"shoulders abs","arms","kalistenika","Jednoręczne stanie na rękach wyłącznie po latach przygotowania i pod nadzorem."],
["Manna Lean",4,"abs shoulders","arms hip","kalistenika","Próba wydłużenia podporu do tyłu tylko przy pełnej mobilności barków."],
["Manna",4,"abs shoulders","arms hip","kalistenika","Wysoce specjalistyczny podpór gimnastyczny; trener zalecany."],
["Assisted Iron Cross Hold",4,"shoulders chest arms","back","kalistenika","Silne odciążenie na kółkach, bez agresywnego rozciągania obręczy."],
["Iron Cross",4,"shoulders chest arms","back","kalistenika","Element na kółkach wymagający szkolenia gimnastycznego i asekuracji."],
["Tuck Front Lever Row",3,"back arms abs","grip","kalistenika","Przyciąganie przy krótkiej dźwigni w pełnej kontroli łopatek."],
["Advanced Tuck Front Lever Row",4,"back arms abs","grip","kalistenika","Wiosłowanie z dłuższą dźwignią, bez zamachu."],
["Front Lever Row",4,"back arms abs","grip","kalistenika","Pełne przyciąganie w poziomym zwisie bez utraty dźwigni."],
["Burpee",1,"full","chest legs abs","crossfit sztuki-walki","Ruch z kontrolowanym zejściem na ziemię i wstaniem."],
["Box Step-Up",1,"legs glutes","abs","crossfit","Stabilna skrzynia, spokojny krok bez skoku."],
["Box Jump",2,"legs glutes","calf abs","crossfit","Bezpieczny zeskok, wysokość dobrana do lądowania."],
["Medicine Ball Thruster",2,"legs shoulders","arms abs","crossfit","Przysiad połączony z wypchnięciem piłki."],
["Wall Ball Shot",2,"legs shoulders","arms abs","crossfit","Wypchnięcie piłki ze stabilnej pozycji przysiadu."],
["Rowing Ergometer",1,"full","back legs arms","crossfit sztuki-walki","Ergometr w tempie dostosowanym do celu sesji."],
["Air Bike Intervals",1,"full","legs shoulders","crossfit sztuki-walki","Naprzemienne odcinki umiarkowane i szybkie."],
["Shuttle Run",1,"legs","glutes calf abs","crossfit sztuki-walki","Krótkie biegi wahadłowe z kontrolowanymi nawrotami."],
["Jump Rope Intervals",1,"legs","calf shoulders","crossfit sztuki-walki","Skakanka w interwałach z miękkim lądowaniem."],
["Double-Under Practice",3,"legs","calf shoulders","crossfit","Podwójny obrót skakanki bez utraty miękkiego lądowania."],
["Ski Ergometer",1,"full","back arms abs","crossfit","Wysiłek na ergometrze narciarskim z kontrolą tułowia."],
["Assault Bike Sprint",3,"legs","arms abs","crossfit sztuki-walki","Krótki intensywny interwał tylko po zbudowaniu bazy."],
["Shadow Boxing Stance",1,"legs abs","shoulders","sztuki-walki","Postawa, garda i środek ciężkości; bez partnera."],
["Boxing Footwork Forward-Back",1,"legs","calf abs","sztuki-walki","Małe kroki bez krzyżowania nóg, zachowuj bazę."],
["Boxing Lateral Step",1,"legs","calf abs","sztuki-walki","Kroki w bok z powrotem do stabilnej pozycji."],
["Boxing Pivot",2,"legs abs","glutes","sztuki-walki","Obrót stóp i bioder, utrzymuj równowagę."],
["Jab Shadow Boxing",1,"shoulders arms","chest abs","sztuki-walki","Ćwicz prowadzącą rękę w powietrzu z powrotem do gardy."],
["Rear Cross Shadow Boxing",1,"shoulders arms","chest abs glutes","sztuki-walki","Łącz obrót stopy i biodra z prostym ruchem ręki."],
["Jab-Cross Combination Drill",1,"shoulders arms","abs legs","sztuki-walki","Powtarzaj ciosy proste w wolnym tempie bez celu kontaktowego."],
["Lead Hook Shadow Boxing",2,"shoulders abs","arms chest","sztuki-walki","Ćwicz łukowy tor i rotację biodra bez przeprostu barku."],
["Rear Hook Shadow Boxing",2,"shoulders abs","arms chest","sztuki-walki","Kontroluj rotację tułowia i powrót do gardy."],
["Lead Uppercut Shadow Boxing",2,"shoulders abs","arms legs","sztuki-walki","Prowadź krótką trajektorię ku górze z pracą nóg."],
["Rear Uppercut Shadow Boxing",2,"shoulders abs","arms legs","sztuki-walki","Kontroluj tułów i ustawienie nadgarstka, ćwicz w powietrzu."],
["Shadow Boxing Combination Flow",2,"shoulders abs","arms legs","sztuki-walki","Łącz pracę nóg, proste, haki i podbródkowe w technicznej sekwencji."],
["Slip and Guard Drill",1,"abs legs","shoulders","sztuki-walki","Ćwicz gardę i niewielką zmianę ustawienia głowy bez partnera."],
["Teep Front Push Kick Drill",1,"legs glutes","abs hip","sztuki-walki","Równowaga, uniesienie kolana i spokojny wyprost nogi bez kontaktu."],
["Low Round Kick Shadow Drill",2,"legs glutes","abs hip","sztuki-walki","Pracuj nad pivotem stopy i ruchem bioder w powietrzu."],
["Middle Roundhouse Kick Drill",2,"legs glutes","abs hip","sztuki-walki","Kontroluj łuk kopnięcia na średniej wysokości i powrót nogi."],
["High Roundhouse Kick Drill",4,"legs glutes","abs hip","sztuki-walki","Wysoki zakres tylko przy odpowiedniej mobilności i kontroli."],
["Front Snap Kick Drill",1,"legs","hip abs","sztuki-walki","Prosty kopnięcie sprężyste bez przeprostu kolana."],
["Side Kick Chamber Drill",2,"legs glutes","abs hip","sztuki-walki","Przećwicz samo uniesienie kolana i równowagę."],
["Side Kick Extension Drill",3,"legs glutes","abs hip","sztuki-walki","Wyprost z komory przy stabilnej nodze podporowej."],
["Back Kick Balance Drill",3,"legs glutes","abs hip","sztuki-walki","Najpierw równowaga i kontrolowany tor ruchu bez kontaktu."],
["Knee Strike Shadow Drill",2,"legs abs","glutes hip","sztuki-walki","Uniesienie kolana z równowagą i stabilnym tułowiem."],
["Kick Check Balance Drill",2,"legs abs","glutes calf","sztuki-walki","Uniesienie goleni do obrony z kontrolą równowagi."],
["Hip Mobility for Kicks",1,"glutes legs","abs","sztuki-walki rozciaganie","Łagodny zakres bioder bez wymuszania wysokich kopnięć."],
["Ankle Mobility for Footwork",1,"legs","calf","sztuki-walki rozciaganie","Mobilność stawu skokowego bez bólu."],
["Technical Shadow Boxing Rounds",1,"full","shoulders legs abs","sztuki-walki","Interwały techniczne z koncentracją na gardzie i oddechu."],
["Aerobic Zone 2 Cardio",1,"full","legs","sztuki-walki crossfit fbw","Wysiłek konwersacyjny o umiarkowanej intensywności."],
["Tempo Running Intervals",2,"legs","glutes abs","sztuki-walki crossfit","Odcinki umiarkowanie intensywnego biegu z odpoczynkiem."],
["Controlled Sprint Intervals",3,"legs glutes","abs","sztuki-walki crossfit","Interwały szybkościowe po rozgrzewce i przygotowaniu."],
["Shadow Boxing Endurance Circuit",2,"full","shoulders legs abs","sztuki-walki","Utrzymuj technikę mimo stopniowo rosnącego czasu rund."],
["Reaction and Coordination Steps",1,"legs","abs","sztuki-walki","Krótka reakcja na bezpieczny sygnał wzrokowy."],
["Dynamic Hip Stretch",1,"legs glutes","abs","rozciaganie joga","Łagodne, kontrolowane ruchy bioder."],
["Hamstring Mobility Flow",1,"legs","glutes","rozciaganie joga","Mobilność tylnej strony uda bez sprężynowania."],
["Shoulder Mobility Flow",1,"shoulders","chest back","rozciaganie joga","Bezbolesny zakres barków i łopatek."],
["Thoracic Rotation Flow",1,"back abs","shoulders","rozciaganie joga","Rotacja piersiowego odcinka kręgosłupa bez szarpania."],
["Ankle Dorsiflexion Mobility",1,"legs","calf","rozciaganie joga","Wolny ruch kolana nad stopą z piętą na podłożu."],
["Hip Flexor Stretch",1,"legs","abs glutes","rozciaganie joga","Kontrolowany wykrok z neutralną miednicą."],
["Cat Cow Mobility",1,"back abs","shoulders","joga rozciaganie","Powolny ruch kręgosłupa zsynchronizowany z oddechem."],
["Child's Pose Breathing",1,"back","shoulders abs","joga rozciaganie","Pozycja odpoczynkowa bez bólu kolan i barków."],
["Downward Dog Pose",1,"shoulders legs","back","joga rozciaganie","Długa linia tułowia bez forsowania pięt."],
["Warrior II Pose",1,"legs glutes","abs","joga","Stabilny rozkrok i kontrola kolana."],
["Tree Pose",1,"legs glutes","abs","joga","Równowaga na jednej nodze z podporą w razie potrzeby."],
["Boat Pose",2,"abs hip","back","joga","Utrzymaj tułów i nogi w kontrolowanej pozycji."],
["Cobra Pose",1,"back","glutes shoulders","joga rozciaganie","Łagodny wyprost piersiowego odcinka kręgosłupa."],
["Bridge Pose",2,"glutes back","legs","joga","Pozycja mostu w leżeniu z kontrolą oddechu."]
];
const names=new Set();
const items=Object.freeze(rows.map(([name,minLevel,prim,assist,sports,cue])=>{
 if(names.has(name))throw new Error("Duplicate new exercise: "+name);names.add(name);
 const id="fx-"+name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
 return Object.freeze({id,name,displayName:name,minLevel,category:"extended",categoryLabel:"Trening i technika",cue,description:cue,
  areas:Object.freeze(prim.split(" ")),supportAreas:Object.freeze(assist.split(" ")),
  sports:Object.freeze(sports.split(" ")),sourceId:
   sports.includes("sztuki-walki") ? (/kick|teep|knee strike|muay/i.test(name)?"kicking":"boxing"):
   sports.includes("crossfit") ? "crossfit":
   /muscle.up|pull.up|dip/i.test(name) ? "muscle-up":
   /planche/i.test(name) ? "planche":
   /dragon flag/i.test(name) ? "dragon":
   /handstand|cartwheel/i.test(name) ? "handstand":"acsm-2026"});
}));
const refs={
 "acsm-2026":"https://pmc.ncbi.nlm.nih.gov/articles/PMC12965823/",
 "muscle-up":"https://calisthenicsassociation.org/blog/unlock-the-muscle-up-a-3-phase-progression-for-your-first-rep",
 "planche":"https://calisthenicsassociation.org/lessons/planche-intermediate-programming",
 "dragon":"https://calisthenics.com/exercise/dragon-flag-negative/",
 "handstand":"https://kensington-gymnastics.uk/the-handstand-a-four-stage-training-model/",
 "boxing":"https://www.englandboxing.org/wp-content/uploads/2022/03/EB_Boxing-Coaching-Handbook-Part-1_v8-002.pdf",
 "kicking":"https://www.nowmuaythai.com/blog/basic-techniques-of-muay-thai",
 "crossfit":"https://www.crossfit.com/crossfit-movements"
};
// Each stage references canonical names (either legacy entries or the new index) and NEVER embeds copies.
const P=(id,title,sourceId,stages,coach=false)=>({id,title,sourceId,coach,stages:stages.map(([title,...moves],i)=>({title,minLevel:Math.min(4,i+1),moves}))});
const progressions=[
P("pullup","Pierwsze podciągnięcie","muscle-up",[
 ["Przygotowanie chwytu i łopatek","Dead Hang","Scapular Pull-Up","Inverted Row"],
 ["Siła z pomocą","Band-Assisted Pull-Up","Foot-Assisted Pull-Up","Eccentric Pull-Up"],
 ["Samodzielne powtórzenia","Pull-Up"]
]),
P("high-pull","Wysokie podciąganie","muscle-up",[
 ["Bazowa siła przyciągania","Inverted Row","Pull-Up"],
 ["Przyciąganie wyżej","Chest-to-Bar Pull-Up"],
 ["Przyciąganie dynamiczne","Explosive High Pull-Up"],
 ["Wysoki kontakt z drążkiem","Lower-Chest High Pull-Up"]
]),
P("dips","Pierwsze dipy","muscle-up",[
 ["Barki, triceps i podpór","Incline Push-Up","Parallel Bar Support Hold"],
 ["Dipy z pomocą","Band-Assisted Dip","Eccentric Dip"],
 ["Dipy samodzielnie","Dips"],
 ["Wyciskanie na drążku","Straight-Bar Dip"]
]),
P("muscle-up","Droga do muscle-up","muscle-up",[
 ["Siła bazowa: podciąganie i dipy","Band-Assisted Pull-Up","Parallel Bar Support Hold","Band-Assisted Dip"],
 ["Opanowanie podstaw","Pull-Up","Dips","Straight-Bar Dip"],
 ["Wysokość przyciągania","Chest-to-Bar Pull-Up","Explosive High Pull-Up"],
 ["Przejście nad drążkiem","Low-Bar Muscle-Up Transition","Band-Assisted Bar Muscle-Up"],
 ["Muscle-up bez pomocy","Lower-Chest High Pull-Up","Strict Bar Muscle-Up"]
]),
P("planche","Droga do planche","planche",[
 ["Nadgarstki i aktywne łopatki","Wrist Preparation","Scapular Protraction Hold","Hollow hold"],
 ["Przenoszenie środka ciężkości","Frog Stand","Planche Lean","Pseudo Planche Push-Up"],
 ["Pierwsze dźwignie","Tuck Planche","Advanced Tuck Planche"],
 ["Zaawansowane pozycje","Straddle Planche","Full Planche"]
],true),
P("dragon","Droga do dragon flag","dragon",[
 ["Napięcie tułowia","Dead bug","Hollow hold","Reverse Crunch"],
 ["Krótka dźwignia","Candlestick Raise","Tuck Dragon Flag Negative"],
 ["Kontrolowane opuszczanie","One-Leg Dragon Flag Negative","Dragon Flag Negative"],
 ["Pełna figura","Dragon Flag"]
]),
P("front-lever","Droga do front lever","acsm-2026",[
 ["Grzbiet i stabilizacja","Inverted Row","Hollow hold","Scapular Pull-Up"],
 ["Zwinięta dźwignia","Tuck Front Lever"],
 ["Wydłużanie dźwigni","Advanced Tuck Front Lever","One-Leg Front Lever"],
 ["Figura końcowa","Straddle Front Lever","Full Front Lever"]
],true),
P("back-lever","Droga do back lever","acsm-2026",[
 ["Przygotowanie obręczy","Parallel Bar Support Hold","Shoulder Mobility Flow"],
 ["Pierwsza dźwignia","Tuck Back Lever"],
 ["Stopniowe wydłużanie","Advanced Tuck Back Lever"],
 ["Figura końcowa","Straddle Back Lever","Full Back Lever"]
],true),
P("handstand","Droga do stania na rękach","handstand",[
 ["Stabilizacja barków","Wall Plank","Pike Push-Up","Wrist Preparation"],
 ["Bezpieczna pozycja odwrócona","Wall Walk","Wall Handstand Hold","Handstand Exit Drill"],
 ["Równowaga","Freestanding Handstand"],
 ["Siła w podporze","Wall-Assisted Handstand Push-Up","Freestanding Handstand Push-Up"]
],true),
P("lsit","Droga do L-sit i V-sit","acsm-2026",[
 ["Siła kompresji","Seated Compression Lift","Parallel Bar Support Hold"],
 ["Krótka dźwignia","Tuck L-Sit","One-Leg L-Sit"],
 ["L-sit","L-Sit"],
 ["V-sit","V-Sit"]
]),
P("pistol","Droga do pistol squat","acsm-2026",[
 ["Siła nóg","Squat","Lunge","Step-Up"],
 ["Równowaga i pomoc","Supported Pistol Squat"],
 ["Kontrola fazy zejścia","Eccentric Pistol Squat"],
 ["Pełny przysiad jednonóż","Pistol Squat"]
]),
P("flag","Droga do human flag","acsm-2026",[
 ["Stabilność boczna","Side Plank","Scapular Pull-Up"],
 ["Pionowy podpór","Vertical Human Flag Hold"],
 ["Krótsza dźwignia","Tuck Human Flag"],
 ["Figura końcowa","Straddle Human Flag","Human Flag"]
],true),
P("acro","Akrobatyka – tylko pod okiem trenera","handstand",[
 ["Fundamenty pozycji odwróconej","Wall Handstand Hold","Handstand Exit Drill"],
 ["Podstawowe elementy","Cartwheel Fundamentals"],
 ["Łączenia gimnastyczne","Round-Off Fundamentals"],
 ["Zaawansowana akrobatyka","Aerial Cartwheel","Front Handspring","Back Handspring","Front Tuck Somersault","Back Tuck Somersault"]
],true)
];
const combat=[
 ["straights","Ciosy proste","box / jab i cross",["Shadow Boxing Stance","Boxing Footwork Forward-Back","Jab Shadow Boxing","Rear Cross Shadow Boxing","Jab-Cross Combination Drill"]],
 ["hooks","Ciosy sierpowe","hook – cios po łuku",["Boxing Pivot","Lead Hook Shadow Boxing","Rear Hook Shadow Boxing","Shadow Boxing Combination Flow"]],
 ["uppercuts","Ciosy podbródkowe","uppercut – tor wznoszący",["Shadow Boxing Stance","Lead Uppercut Shadow Boxing","Rear Uppercut Shadow Boxing","Shadow Boxing Combination Flow"]],
 ["low-kick","Low kick","okrężne kopnięcie na niskim poziomie",["Hip Mobility for Kicks","Kick Check Balance Drill","Low Round Kick Shadow Drill"]],
 ["teep","Teep / front push kick","kopnięcie pchające w przód",["Shadow Boxing Stance","Teep Front Push Kick Drill"]],
 ["roundhouse","Roundhouse kick","okrężne na średnim lub wysokim poziomie",["Hip Mobility for Kicks","Middle Roundhouse Kick Drill","High Roundhouse Kick Drill"]],
 ["side-kick","Side kick","kopnięcie boczne",["Side Kick Chamber Drill","Side Kick Extension Drill"]],
 ["front-kick","Front snap kick","kopnięcie frontalne sprężyste",["Front Snap Kick Drill"]],
 ["back-kick","Back kick","kopnięcie w tył, zaawansowane",["Back Kick Balance Drill"]],
 ["knees","Praca kolan","technika w bezkontaktowym cieniu",["Knee Strike Shadow Drill"]],
 ["footwork","Praca nóg i obrona","kontrola dystansu i balansu",["Boxing Footwork Forward-Back","Boxing Lateral Step","Boxing Pivot","Slip and Guard Drill","Reaction and Coordination Steps"]],
 ["aerobic","Wydolność tlenowa","oddech i tempo",["Aerobic Zone 2 Cardio","Rowing Ergometer","Jump Rope Intervals","Technical Shadow Boxing Rounds"]],
 ["anaerobic","Wydolność beztlenowa","szybkie interwały z odpoczynkiem",["Tempo Running Intervals","Air Bike Intervals","Controlled Sprint Intervals"]],
 ["endurance","Wytrzymałość treningowa","dłuższe rundy o kontrolowanym tempie",["Shadow Boxing Endurance Circuit","Technical Shadow Boxing Rounds","Jump Rope Intervals"]],
 ["strength","Siła i stabilizacja","wzmacnianie łańcucha kinematycznego",["Squat","Deadlift","Push-Up","Pallof press","Hip thrust"]],
 ["mobility","Mobilność i regeneracja","zakres ruchu, równowaga",["Hip Mobility for Kicks","Ankle Mobility for Footwork","Shoulder Mobility Flow","Dynamic Hip Stretch"]]
].map(([id,title,description,moves])=>Object.freeze({id,title,description,moves:Object.freeze(moves),sourceId:id==="aerobic"||id==="strength"?"acsm-2026":id.includes("kick")||["low-kick","teep","roundhouse","front-kick","back-kick","side-kick","knees"].includes(id)?"kicking":"boxing"}));
const extraGoals=[
 ["push-pull",[["push","Dzień PUSH","Klatka, barki i triceps"],["pull","Dzień PULL","Grzbiet, biceps i chwyt"],["legs","Nogi","Trening uzupełniający"],["abs","Core","Stabilizacja tułowia"]]],
 ["crossfit",[["full","Całe ciało","Ruchy funkcjonalne"],["strength","Siła","Przysiady, wyciskania, przyciągania"],["aerobic","Wydolność","Ergometry, bieganie"],["power","Moc i dynamika","Skoki i szybkie ruchy"],["abs","Core","Stabilizacja"],["mobility","Mobilność","Zakresy ruchu"]]],
 ["rozciaganie",[["full","Całe ciało","Mobilność ogólna"],["shoulders","Barki","Obręcz barkowa"],["back","Plecy","Ruchomość piersiowa"],["legs","Nogi i biodra","Tylny łańcuch i biodra"],["grip","Nadgarstki","Przygotowanie podporu"]]],
 ["joga",[["full","Całe ciało","Sekwencje"],["balance","Równowaga","Pozycje stojące"],["abs","Core","Stabilizacja"],["mobility","Mobilność","Łagodne przepływy"],["shoulders","Pozycje odwrócone","Wymagana ostrożność"]]],
 ["100-pompek",[["chest","Klatka","Stopniowanie pompek"],["arms","Triceps","Siła wyprostu ramion"],["shoulders","Barki","Stabilizacja"],["abs","Core","Utrzymanie pozycji"]]]
];
window.FitPlanTrainingExtensions=Object.freeze({
 items,progressions:Object.freeze(progressions.map(p=>Object.freeze({...p,stages:Object.freeze(p.stages.map(s=>Object.freeze({...s,moves:Object.freeze(s.moves)})))}))),
 combat:Object.freeze(combat),extraGoals:Object.freeze(Object.fromEntries(extraGoals)),sources:Object.freeze(refs),levels:Object.freeze(L)
});
})();