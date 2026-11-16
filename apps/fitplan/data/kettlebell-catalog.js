(()=>{
"use strict";
const levels=Object.freeze({poczatkujacy:1,sredniozaawansowany:2,zaawansowany:3,zawodowiec:4});
const areas=Object.freeze([
["full","Całe ciało","Przysiad, przyciąganie, stabilizacja i praca bioder."],
["shoulders","Barki","Wyciskanie i kontrola obręczy barkowej."],
["legs","Nogi","Przysiady, wykroki i ruchy jednonóż."],
["abs","Brzuch","Stabilizacja oraz kontrola tułowia."],
["back","Plecy","Wiosłowanie i tylna taśma."],
["chest","Klatka piersiowa","Wyciskanie w leżeniu."],
["arms","Ramiona","Biceps, triceps i kontrola ramion."],
["glutes","Pośladki","Wyprost biodra i stabilizacja miednicy."],
["grip","Chwyt i przedramiona","Noszenia i utrzymywanie odważnika."],
["custom","Sam dobierz ćwiczenia","Zbuduj zestaw z ćwiczeń dla swojego poziomu."]
].map(([id,title,description])=>Object.freeze({id,title,description})));
const rows=[
["deadlift","Kettlebell Deadlift",1,"full legs glutes back","Prowadź ciężar blisko ciała, wypychaj biodra do tyłu."],
["goblet-squat","Goblet Squat",1,"full legs glutes abs","Trzymaj odważnik przy klatce, kontroluj kolana."],
["suitcase-carry","Suitcase Carry",1,"full abs grip back","Idź bez przechylania tułowia."],
["farmer-carry","Farmer Carry",1,"full grip back","Idź stabilnie, bez unoszenia barków."],
["halo","Kettlebell Halo",1,"shoulders abs","Prowadź odważnik wokół głowy bez odchylania żeber."],
["floor-press","Kettlebell Floor Press",1,"chest arms","Oprzyj łokieć o podłogę w kontrolowany sposób."],
["one-arm-floor-press","Single-Arm Floor Press",1,"chest arms abs","Wyciskaj jedną ręką, stabilizuj tułów."],
["row","Single-Arm Kettlebell Row",1,"back arms","Utrzymuj plecy stabilnie, prowadź łokieć w stronę biodra."],
["rdl","Kettlebell Romanian Deadlift",1,"legs glutes back","Cofaj biodra, zachowując neutralne plecy."],
["reverse-lunge","Kettlebell Reverse Lunge",1,"legs glutes abs","Kontroluj krok w tył i ustawienie kolan."],
["split-squat","Kettlebell Split Squat",1,"legs glutes","Stabilizuj rozstaw stóp przez cały ruch."],
["glute-bridge","Kettlebell Glute Bridge",1,"glutes abs","Zabezpiecz ciężar na biodrach, unoś miednicę bez przeprostu."],
["march","Suitcase March",1,"abs grip","Maszeruj w miejscu, stabilizuj tułów."],
["curl","Kettlebell Biceps Curl",1,"arms grip","Nie bujaj tułowiem, kontroluj opuszczanie."],
["triceps-extension","Kettlebell Triceps Extension",1,"arms","Użyj lekkiego ciężaru, kontroluj łokcie."],
["squeeze-press","Kettlebell Squeeze Floor Press",2,"chest arms","Wyciskaj spokojnie, zachowaj neutralne nadgarstki."],
["strict-press","Kettlebell Strict Press",2,"shoulders arms abs","Nie przeprostowuj lędźwi podczas wyciskania."],
["rack-carry","Front Rack Carry",2,"full abs shoulders grip","Utrzymuj odważnik blisko tułowia."],
["rack-squat","Front Rack Squat",2,"legs abs full","Kontroluj pion tułowia i zejście w przysiad."],
["two-hand-swing","Two-Hand Kettlebell Swing",2,"full glutes legs","Ruch wykonuj biodrami po opanowaniu hip hinge."],
["push-press","Kettlebell Push Press",2,"shoulders legs arms","Płytkie ugięcie kolan wspiera wypchnięcie ciężaru."],
["supported-renegade-row","Supported Renegade Row",2,"back abs arms","Druga ręka na stabilnym podparciu, bez skręcania bioder."],
["overhead-carry","Overhead Carry",3,"shoulders abs grip","Wymaga stabilnej pozycji kettlebell nad głową."],
["clean","Kettlebell Clean",3,"full glutes shoulders arms","Prowadź ciężar blisko ciała do pozycji rack."],
["one-arm-swing","One-Arm Kettlebell Swing",3,"glutes abs grip","Utrzymuj symetrię pracy bioder."],
["windmill","Kettlebell Windmill",3,"abs shoulders glutes","Nie forsuj zakresu mobilności bioder i barku."],
["turkish-getup","Turkish Get-Up",3,"full abs shoulders","Najpierw opanuj etapy ruchu bez obciążenia."],
["thruster","Kettlebell Thruster",3,"full legs shoulders","Połącz przysiad i wyciskanie z kontrolą tułowia."],
["snatch","Kettlebell Snatch",4,"full shoulders glutes","Dynamiczny ruch po opanowaniu swing i clean."],
["jerk","Kettlebell Jerk",4,"shoulders legs full","Wymaga stabilnego przyjęcia ciężaru nad głową."],
["bottoms-up-press","Bottoms-Up Press",4,"shoulders arms grip","Użyj lekkiego ciężaru, kontroluj równowagę odważnika."]
];
const items=Object.freeze(rows.map(([slug,name,minLevel,groups,cue])=>Object.freeze({
 id:"kb-"+slug,name,displayName:name,minLevel,areas:Object.freeze(groups.split(" ")),category:"kettlebell",categoryLabel:"Kettlebell",cue
})));
const lookup=new Map(items.map(item=>[item.id,item]));
function available(level,goal="custom"){
 const tier=levels[level]||0;
 return tier?items.filter(item=>item.minLevel<=tier&&(goal==="full"||goal==="custom"||item.areas.includes(goal))):[];
}
function suggest(level,goal){
 const list=available(level,goal);
 if(goal==="custom")return [];
 if(goal!=="full")return list.slice(0,5).map(item=>item.id);
 const chosen=[];
 for(const group of ["legs","back","chest","shoulders","abs"]){
  const item=list.find(x=>x.areas.includes(group)&&!chosen.includes(x.id));
  if(item)chosen.push(item.id);
 }
 return chosen;
}
window.FitPlanKettlebellCatalog=Object.freeze({levels,areas,items,get:id=>lookup.get(String(id))||null,available,suggest});
})();