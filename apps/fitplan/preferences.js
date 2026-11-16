(()=>{
"use strict";
const frame=document.getElementById("appFrame");if(!frame)return;
const LANGS=new Set(["pl","en"]),THEMES=new Set(["light","blue","gray"]);
const translations=new Map([
 ["Planer treningowy","Workout planner"],
 ["Twój plan treningowy","Your training plan"],
 ["Zaplanuj trening, kontroluj postęp i korzystaj z atlasu mięśni.","Plan workouts, track progress and use the muscle atlas."],
 ["Narzędzie do układania planów treningowych, organizowania ćwiczeń, kontrolowania progresji i zarządzania najważniejszymi elementami procesu treningowego.","A tool for building training plans, organizing exercises, tracking progression and managing the key parts of your training process."],
 ["Twoje moduły","Your modules"],
 ["Postęp","Progress"],
 ["Ukończone","Completed"],
 ["Wróć","Back"],
 ["Notatka","Note"],
 ["Pytania","Questions"],
 ["Egzamin","Exam"],
 ["Oznacz jako ukończone","Mark as completed"],
 ["Zresetuj postęp","Reset progress"],
 ["Plan treningowy","Training plan"],
 ["Tabela ćwiczeń","Exercise table"],
 ["Dieta","Diet"],
 ["Kalendarz treningowy","Training calendar"],
 ["Podsumowanie wyników","Results summary"]
]);
const original=new WeakMap();
function translate(doc,language){
 const walker=doc.createTreeWalker(doc.body,doc.defaultView.NodeFilter.SHOW_TEXT);
 let node;while((node=walker.nextNode())){
  if(node.parentElement?.closest('script,style,textarea,[data-no-translate],pre,code'))continue;
  const value=node.nodeValue,trim=value.trim();if(!trim)continue;
  if(!original.has(node))original.set(node,value);
  const base=original.get(node),key=base.trim(),translated=language==="en"?translations.get(key):null;
  node.nodeValue=translated?base.replace(key,translated):base;
 }
}
const extra={
 "Notatki i godziny treningów oraz dni odpoczynku w miesięcznym kalendarzu.":"Workout notes and times, and rest days in a monthly calendar.",
 "Wybierz dzień, dodaj notatkę lub godzinę, a następnie zapisz wpis.":"Select a day, add a note or time, then save the entry.",
 "notatki i godziny treningów":"workout notes and times",
 "nawigacja między miesiącami":"month navigation",
 "przenoszenie wpisów na wolny dzień":"moving entries to an empty day",
 "kopia danych i synchronizacja po zalogowaniu":"data backup and sync after signing in",
 "Wpisy są zapisywane na tym urządzeniu. Po zalogowaniu kalendarz jest synchronizowany z kontem; eksport danych zawiera również notatki.":"Entries are saved on this device. After signing in, the calendar syncs with your account; exported data also includes notes.",
 "Ta przeglądarka nie uruchomiła grafiki WebGL. Spróbuj ponownie lub otwórz FitPlan w przeglądarce z obsługą WebGL. Lista mięśni i opisy są nadal dostępne.":"This browser could not start WebGL graphics. Retry or open FitPlan in a browser with WebGL support. The muscle list and descriptions remain available.",
 "Offline po pobraniu":"Offline after download",
 "Pobieranie…":"Downloading…",
 "Offline gotowe":"Offline ready",
 "Offline · zapis lokalny":"Offline · saved locally",
 "Brak internetu":"No internet connection",
 "Błąd offline":"Offline error",
 "Pobieram pliki FitPlan. Nie zamykaj tej karty do zakończenia.":"Downloading FitPlan files. Keep this tab open until the download finishes.",
 "Gotowe. FitPlan może teraz działać bez internetu.":"Ready. FitPlan can now work offline.",
 "Nie udało się uruchomić trybu offline. Odśwież stronę i spróbuj ponownie.":"Could not start offline mode. Refresh the page and try again.",
 "Nie udało się pobrać wszystkich plików. Spróbuj ponownie przy stabilnym połączeniu.":"Could not download all files. Try again with a stable connection.",
 "Część plików nie została pobrana. Sprawdź połączenie i spróbuj ponownie.":"Some files were not downloaded. Check your connection and try again.",
 "Aby pierwszy raz włączyć tryb offline, połącz się z internetem.":"Connect to the internet to enable offline mode for the first time.",
 "Jesteś offline. Postęp będzie zapisywany lokalnie na tym urządzeniu.":"You are offline. Progress will be saved locally on this device.",
 "Połączenie wróciło. Sprawdzam aktualizacje aplikacji i synchronizuję postęp.":"Connection restored. Checking for app updates and syncing progress.",
 "Postęp został zsynchronizowany z Twoim kontem.":"Progress has been synced with your account.",
 "Bez logowania dostępny jest Kalendarz treningowy. Zaloguj się, aby otworzyć pozostałe moduły FitPlan.":"The Training calendar is available without signing in. Sign in to open the other FitPlan modules.",
 "W przygotowaniu":"In preparation",
 "Resetuj postęp modułów":"Reset module progress",
 "Czy zresetować oznaczenia ukończenia modułów? Notatki kalendarza zostaną zachowane.":"Reset module completion marks? Calendar notes will be kept.",
 "Postęp modułów został zresetowany.":"Module progress has been reset.",
 "Wczytać kopię danych? Zastąpi zapisany postęp oraz notatki kalendarza, jeśli plik je zawiera.":"Import this backup? It will replace saved progress and calendar notes if included in the file.",
 "Nie udało się odczytać danych do kopii. Zapisane dane nie zostały zmienione.":"Could not read the data for the backup. Saved data has not changed."
};
// The shared translator uses exact dictionary keys for integer download progress.
for(let percent=0;percent<=100;percent++)extra["Pobieranie "+percent+"%"]="Downloading "+percent+"%";
let registered=false;
function apply(detail={}){
 const doc=frame.contentDocument;if(!doc?.documentElement)return false;
 const currentLang=LANGS.has(doc.documentElement.lang)?doc.documentElement.lang:"pl";
 const currentTheme=THEMES.has(doc.documentElement.dataset.theme)?doc.documentElement.dataset.theme:"gray";
 const language=LANGS.has(detail.language)?detail.language:currentLang;
 const theme=THEMES.has(detail.theme)?detail.theme:currentTheme;
 doc.documentElement.lang=language;doc.documentElement.dataset.theme=theme;
 doc.documentElement.style.colorScheme=theme==="light"?"light":"dark";
 // The portal already owns translation in production. A second text walker
 // records translated English as the original and breaks the return to PL.
 if(window.PortalI18n){
  if(!registered){window.PortalI18n.registerDictionary('fitplan',extra);registered=true;}
 }else translate(doc,language);
 doc.defaultView.dispatchEvent(new doc.defaultView.CustomEvent('fitplan:preferences',{detail:{language,theme}}));
 return true;
}
function install(){
 const w=frame.contentWindow,doc=frame.contentDocument;if(!doc?.getElementById('homePage'))return;
 if(!w.FitPlanPreferences)Object.defineProperty(w,"FitPlanPreferences",{value:Object.freeze({apply}),configurable:true});
 let language='pl',theme='gray';
 try{language=localStorage.getItem('portal-language-v1')||language;theme=localStorage.getItem('portal-theme-v1')||theme;}catch{}
 apply({language,theme});
}
frame.addEventListener("load",install);
window.addEventListener("portal:preferences",event=>apply(event.detail));
window.addEventListener("portal-preferences-change",event=>apply(event.detail));
try{if(frame.contentDocument?.readyState==='complete')install();}catch{}
})();
