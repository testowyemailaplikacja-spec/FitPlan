// WIEDORA-CHANGE: WD-20261031-WIE-110-STARTER-PLANS-01 | TASK: WIE-110 | AUTHOR: ChatGPT / GPT-6
// Data-only pilot programs. Training sessions use existing canonical exercise IDs
// after resolving names; no duplicate exercise catalog and no backend side effects.
(()=>{
"use strict";
const p=(id,title,description,frequency,equipment,days)=>Object.freeze({
 id,title,description,frequency,equipment,
 days:Object.freeze(days.map(([dayId,dayTitle,names,work,rest,rounds])=>Object.freeze({
   id:dayId,title:dayTitle,names:Object.freeze(names),settings:Object.freeze({work,rest,rounds,mode:"same",custom:[]})
 })))
});
const programs=Object.freeze([
 p("fbw-home","FBW · w domu","Dwie jednostki całego ciała na zmianę. Na początek wystarczą 2–3 sesje w tygodniu, rozdzielone regeneracją.","2–3 razy w tygodniu","Masa ciała oraz bezpieczny drążek lub poręcze do wiosłowania podchwytem",[
  ["a","Dzień A · baza",["Squat","Incline Push-Up","Inverted Row","Hip Thrust","Dead bug"],40,40,2],
  ["b","Dzień B · stabilizacja",["Lunge","Wall Push-Up","Inverted Row","Hip hinge","Side Plank"],40,40,2]
 ]),
 p("fbw-gym","FBW · siłownia","Dwie naprzemienne jednostki całego ciała: przysiad/hinge, pchanie, przyciąganie, praca pomocnicza i core. Zacznij od obciążenia umożliwiającego kontrolowaną technikę.","2–3 razy w tygodniu","Sztanga, hantle, ławka i sprzęt do przyciągania; trudniejsze ruchy zamień na łatwiejsze",[
  ["a","Dzień A · baza siłowa",["Squat","Barbell Bench Press","Row","Hip Thrust","Face pull","Dead bug"],45,120,2],
  ["b","Dzień B · tylna taśma",["Deadlift","Incline Dumbbell Bench Press","Band-Assisted Pull-Up","Lunge","Overhead Press","Side Plank"],45,120,2]
 ]),
 p("calisthenics-base","Kalistenika · podstawy","Spokojny start z podporami, przyciąganiem i kontrolą tułowia. Drążek używaj tylko przy pewnym, bezpiecznym montażu.","2 razy w tygodniu","Masa ciała; dzień B wymaga stabilnego drążka, gumy i asekuracji",[
  ["a","Dzień A · podpory",["Incline Push-Up","Squat","Bird dog","Side Plank","Wrist Preparation"],35,45,2],
  ["b","Dzień B · przyciąganie",["Band-Assisted Pull-Up","Lunge","Dead bug","Scapular Pull-Up","Walking"],35,60,2]
 ]),
 p("mobility-reset","Mobilność i regeneracja","Lekki ruch i kontrola postawy. Zamiast forsować zakresy, zachowaj spokojny oddech i swobodny ruch.","2–4 razy w tygodniu","Mata; dzień B wymaga lekkiej gumy",[
  ["a","Dzień A · biodra i tułów",["Walking","Controlled Hip Rotation","Bird dog","Diaphragmatic Breathing"],45,20,2],
  ["b","Dzień B · barki i rotacja",["Shoulder Mobility Flow","Band External Rotation","Controlled Trunk Rotation","Dead bug"],45,20,2]
 ])
]);
// Curated movement equivalences, not interchangeable medical/rehab exercises.
const SWAP_GROUPS=Object.freeze([
 Object.freeze({label:"Przysiad i nogi",names:["Squat","Sumo squat","Goblet Squat","Front Rack Squat","Lunge","Step-Up","Supported Pistol Squat"]}),
 Object.freeze({label:"Pchanie poziome · klatka",names:["Incline Push-Up","Wall Push-Up","Knee Push-Up","Push-Up","Slow Tempo Push-Up","Barbell Bench Press","Incline Dumbbell Bench Press","Kettlebell Floor Press"]}),
 Object.freeze({label:"Przyciąganie · grzbiet",names:["Inverted Row","Row","Single-Arm Kettlebell Row","Band-Assisted Pull-Up","Foot-Assisted Pull-Up","Pull-Up"]}),
 Object.freeze({label:"Wyprost biodra i tylna taśma",names:["Hip Thrust","Hip hinge","Deadlift","Kettlebell Deadlift","Kettlebell Glute Bridge","Kettlebell Romanian Deadlift"]}),
 Object.freeze({label:"Stabilizacja tułowia · antywyprost",names:["Dead bug","Bird dog","Hollow hold"]}),
 Object.freeze({label:"Stabilizacja tułowia · antyrotacja",names:["Side Plank","Pallof press"]}),
 Object.freeze({label:"Pchanie nad głowę · barki",names:["Overhead Press","Arnold press","Landmine press","Kettlebell Strict Press","Pike Push-Up"]}),
 Object.freeze({label:"Stabilizatory barków",names:["Face pull","Face Pull with External Rotation","Band External Rotation"]})
]);
const HOME_NAMES=new Set(["Squat","Sumo squat","Lunge","Step-Up","Supported Pistol Squat","Incline Push-Up","Wall Push-Up","Knee Push-Up","Push-Up","Slow Tempo Push-Up","Inverted Row","Band-Assisted Pull-Up","Foot-Assisted Pull-Up","Hip Thrust","Hip hinge","Dead bug","Bird dog","Hollow hold","Side Plank","Pallof press","Pike Push-Up","Band External Rotation"]);
const BODYWEIGHT_NAMES=new Set(["Squat","Sumo squat","Lunge","Wall Push-Up","Knee Push-Up","Push-Up","Slow Tempo Push-Up","Hip hinge","Dead bug","Bird dog","Hollow hold","Side Plank","Pike Push-Up"]);
const MOVEMENT_LABELS=Object.freeze({
 "Przysiad i nogi":"Nogi · przysiad / wykrok",
 "Pchanie poziome · klatka":"Pchanie · klatka i triceps",
 "Przyciąganie · grzbiet":"Przyciąganie · plecy i biceps",
 "Wyprost biodra i tylna taśma":"Biodra · pośladki i tył uda",
 "Stabilizacja tułowia · antywyprost":"Core · stabilizacja",
 "Stabilizacja tułowia · antyrotacja":"Core · antyrotacja",
 "Pchanie nad głowę · barki":"Pchanie · barki",
 "Stabilizatory barków":"Barki · mięśnie stabilizujące"
});
function groupFor(exercise,registry){
 const source=registry?.get?.(exercise);
 return source?SWAP_GROUPS.find(g=>g.names.some(name=>registry.get(name)?.id===source.id))||null:null;
}
function guidance(programId,dayId,registry){
 const prepared=prepare(programId,dayId,registry),program=programs.find(x=>x.id===programId);
 const light=programId==="mobility-reset",strength=programId==="fbw-gym";
 return Object.freeze(prepared.ids.map((id,i)=>{
   const item=registry.get(id),name=program.days.find(d=>d.id===dayId).names[i];
   const hold=/hold|plank|hang|support/i.test(name);
   const breath=/breath/i.test(name);
   const core=/dead bug|bird dog|pallof/i.test(name);
   const heavy=/deadlift|bench press|overhead press/i.test(name);
   const target=breath?"30–45 s spokojnie":hold?"15–30 s":light?"30–45 s ruchu":core?"6–10 na stronę":heavy?"5–8 powt.":"8–12 powt.";
   const group=groupFor(id,registry);
   return Object.freeze({id,name:item.displayName||name,group:group?MOVEMENT_LABELS[group.label]:item.categoryLabel||"Ruch pomocniczy",
     sets:prepared.settings.rounds,target,restHint:light?"Spokojny oddech":strength?"ok. 120 s; wydłuż wg potrzeb":"45–90 s wg wysiłku"});
 }));
}
function alternatives(exercise,registry,{environment="all",exclude=[],maxLevel=2,preference="all"}={}){
 if(typeof registry?.get!=="function")return [];
 const source=registry.get(exercise);
 if(!source||!["all","home","gym"].includes(environment)||!["all","bodyweight","basic"].includes(preference))return [];
 const group=groupFor(source.id,registry);
 if(!group)return []; // No unreviewed guesses for uncommon/technical exercises.
 const blocked=new Set(exclude.map(id=>registry.get(id)?.id||id));
 const candidates=[];
 for(const name of group.names){
  const item=registry.get(name);
  if(!item||item.id===source.id||blocked.has(item.id)||candidates.some(x=>x.id===item.id))continue;
  if(item.minLevel&&item.minLevel>maxLevel)continue;
  if(environment==="home"&&!HOME_NAMES.has(name))continue;
  if(preference==="bodyweight"&&!BODYWEIGHT_NAMES.has(name))continue;
  if(preference==="basic"&&item.minLevel>1)continue;
  if(item.equipment==="kettlebell"&&source.equipment!=="kettlebell"&&environment!=="all")continue;
  candidates.push(Object.freeze({id:item.id,name:item.displayName||item.name,reason:group.label}));
 }
 return candidates;
}
function compatible(programId,dayId,ids,registry){
 const p=programs.find(p=>p.id===programId),day=p?.days.find(d=>d.id===dayId);
 if(!day||!Array.isArray(ids)||ids.length!==day.names.length||new Set(ids).size!==ids.length)return false;
 const env=programId==="fbw-home"?"home":programId==="fbw-gym"?"gym":"all";
 return day.names.every((name,i)=>{
  const item=registry?.get?.(name),chosen=registry?.get?.(ids[i]);
  return item&&chosen&&(item.id===chosen.id||alternatives(item.id,registry,{environment:env,maxLevel:2}).some(x=>x.id===chosen.id));
 });
}
function prepare(programId,dayId,registry){
 const program=programs.find(x=>x.id===programId);
 const day=program?.days.find(x=>x.id===dayId);
 if(!day)throw new Error("Nieznany program lub dzień treningowy.");
 if(typeof registry?.get!=="function")throw new Error("Katalog ćwiczeń nie jest gotowy.");
 const items=day.names.map(name=>registry.get(name));
 if(items.some(x=>!x?.id)||new Set(items.map(x=>x.id)).size!==items.length||items.length>20)
   throw new Error("Program wymaga aktualizacji katalogu ćwiczeń. Nie zmieniono Twojego planu.");
 return {programId:program.id,dayId:day.id,name:program.title+" · "+day.title,
   ids:items.map(x=>x.id),settings:{...day.settings,custom:[]}};
}
const api=Object.freeze({programs,prepare,alternatives,compatible,guidance,SWAP_GROUPS,version:3});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(typeof window!=="undefined")window.FitPlanTrainingPresets=api;
})();
