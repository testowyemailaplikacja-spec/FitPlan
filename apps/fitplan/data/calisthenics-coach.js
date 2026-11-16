// WIEDORA-CHANGE: WD-20261101-WIE-115-CALISTHENICS-01 | TASK: WIE-115/WIE-110 | AUTHOR: ChatGPT / GPT-6
// Original progressive calisthenics coaching engine. Indicative thresholds, not validated clinical skill criteria.
// Uses existing FitPlanExerciseRegistry; no duplicate exercise definitions or server mutations.
(function(root){
"use strict";
const KEY_PREFIX="fitplan.calisthenics.path.v1.";
const MIN_REST_MS=48*60*60*1000;
const CATEGORIES=Object.freeze([
  {id:"pull",title:"Przyciąganie i drążek"},
  {id:"push",title:"Wypychanie i podpory"},
  {id:"balance",title:"Równowaga i stanie na rękach"},
  {id:"core",title:"Dźwignie i mięśnie głębokie"},
  {id:"legs",title:"Nogi i pośladki"},
  {id:"rings",title:"Kółka gimnastyczne"},
  {id:"acro",title:"Akrobatyka z trenerem"}
]);
const SETTINGS=Object.freeze({
 pullup:["pull",["drążek"]],
 "high-pull":["pull",["drążek"]],
 dips:["push",["poręcze"]],
 "muscle-up":["pull",["drążek","poręcze","guma"]],
 planche:["push",["paraletki lub stabilne podłoże"]],
 dragon:["core",["stabilne podparcie"]],
 "front-lever":["core",["drążek"]],
 "back-lever":["core",["drążek","asekuracja"]],
 handstand:["balance",["ściana","mata"]],
 lsit:["core",["paraletki lub poręcze"]],
 pistol:["legs",["stabilne podparcie"]],
 flag:["core",["stabilny słup","asekuracja"]],
 acro:["acro",["mata gimnastyczna","trener"]]
});
const EXTRA=[
 ["one-arm-pull","Podciągnięcie jednorącz","pull",["drążek","guma"],false,[
   ["Podciąganie oburącz","Band-Assisted Pull-Up","Pull-Up"],
   ["Siła asymetryczna","Archer Pull-Up"],
   ["Stopniowe odciążanie ręki","Assisted One-Arm Pull-Up"],
   ["Kontrolowane opuszczanie","One-Arm Eccentric Pull-Up"],
   ["Jedna ręka","One-Arm Pull-Up"]
 ]],
 ["one-arm-push","Pompka na jednej ręce","push",["stabilne podłoże"],false,[
   ["Pełny zakres ruchu","Incline Push-Up","Push-Up"],
   ["Przesunięcie ciężaru","Archer Push-Up"],
   ["Podparcie drugą ręką","One-Arm Assisted Push-Up"],
   ["Zmniejszenie pomocy","Elevated One-Arm Push-Up"],
   ["Jedna ręka","One-Arm Push-Up"]
 ]],
 ["shrimp","Shrimp squat","legs",["stabilna podpora"],false,[
   ["Kontrola jednonóż","Step-Up","Supported Pistol Squat"],
   ["Podpora i równowaga","Supported Shrimp Squat"],
   ["Faza ekscentryczna","Shrimp Squat Negative"],
   ["Pełny ruch","Shrimp Squat"]
 ]],
 ["nordic","Nordic hamstring curl","legs",["bezpieczny punkt zaczepienia stóp","asekuracja"],false,[
   ["Przygotowanie zginaczy kolana","Leg Curl","Hip Thrust"],
   ["Odciążone uginanie","Nordic Curl Assisted"],
   ["Powolne opuszczanie","Nordic Curl Eccentric"],
   ["Pełny nordic","Nordic Curl"]
 ]],
 ["ring-muscle-up","Muscle-up na kółkach","rings",["kółka","asekuracja","guma"],true,[
   ["Podpór i przyciąganie","Ring Support Hold","Band-Assisted Pull-Up"],
   ["Dipy na kółkach","Ring Dip"],
   ["Przejście blisko podłoża","Low Ring Transition"],
   ["Przejście z pomocą","Band-Assisted Ring Muscle-Up"],
   ["Pełny ruch","Strict Ring Muscle-Up"]
 ]],
 ["elbow-lever","Elbow lever","balance",["mata"],false,[
   ["Równowaga podporowa","Frog Stand"],
   ["Krótka dźwignia","Elbow Lever Tuck"],
   ["Dłuższa dźwignia","One-Leg Elbow Lever"],
   ["Pozycja docelowa","Elbow Lever"]
 ]],
 ["ninety-push","90-degree push-up","balance",["mata","ściana","asekuracja"],true,[
   ["Wypychanie pionowe","Pike Push-Up","Wall Handstand Hold"],
   ["Siła w odwróceniu","Wall-Assisted Handstand Push-Up"],
   ["Przejście w dół","90 Degree Push-Up Negative"],
   ["Pełny ruch","90 Degree Push-Up"]
 ]],
 ["hefesto","Hefesto","rings",["kółka","trener","asekuracja"],true,[
   ["Siła łopatek i podpór","Parallel Bar Support Hold","Inverted Row"],
   ["Przygotowanie z asekuracją","Assisted Hefesto"],
   ["Pełna figura z trenerem","Hefesto"]
 ]],
 ["one-arm-handstand","Stanie na jednej ręce","balance",["mata","ściana","trener"],true,[
   ["Stabilizacja barków","Wall Handstand Hold"],
   ["Samodzielna równowaga","Freestanding Handstand"],
   ["Przeniesienie ciężaru","Weight Shift Handstand"],
   ["Jednorącz przy ścianie","One Arm Wall Handstand"],
   ["Samodzielnie jednorącz","One Arm Handstand"]
 ]],
 ["manna","Manna","core",["paraletki","asekuracja"],true,[
   ["Kompresja i podpór","Seated Compression Lift","L-Sit"],
   ["Uniesienie nóg","V-Sit"],
   ["Przygotowanie pozycji","Manna Lean"],
   ["Manna","Manna"]
 ]],
 ["iron-cross","Iron cross","rings",["kółka","trener","asekuracja"],true,[
   ["Podpór na kółkach","Ring Support Hold"],
   ["Odciążona pozycja","Assisted Iron Cross Hold"],
   ["Figura docelowa","Iron Cross"]
 ]],
 ["front-lever-row","Wiosłowanie w front lever","pull",["drążek","asekuracja"],true,[
   ["Dźwignia podstawowa","Tuck Front Lever"],
   ["Przyciąganie w krótkiej dźwigni","Tuck Front Lever Row"],
   ["Wydłużenie dźwigni","Advanced Tuck Front Lever","Advanced Tuck Front Lever Row"],
   ["Pełne przyciąganie","Front Lever Row"]
 ]]
];
const cloneStages=rows=>rows.map(([title,...moves])=>({title,moves}));
function paths(extensions){
  if(!Array.isArray(extensions?.progressions))throw Error("Brak kanonicznego katalogu progresji FitPlan.");
  const old=extensions.progressions.map(t=>{
    const [category,equipment]=SETTINGS[t.id]||["core",["mata"]];
    return Object.freeze({...t,category,equipment:[...equipment],stages:t.stages.map(s=>Object.freeze({title:s.title,moves:[...s.moves]}))});
  });
  const newer=EXTRA.map(([id,title,category,equipment,coach,stages])=>
    Object.freeze({id,title,category,equipment:[...equipment],coach,stages:cloneStages(stages),sourceId:"acsm-2026"}));
  const list=[...old,...newer],ids=list.map(x=>x.id);
  if(new Set(ids).size!==ids.length)throw Error("Duplikat identyfikatora ścieżki.");
  return Object.freeze(list);
}
function validatePath(path,registry){
  if(!path||!Array.isArray(path.stages)||!path.stages.length)return {valid:false,missing:["brak etapów"]};
  const missing=[...new Set(path.stages.flatMap(s=>s.moves).filter(name=>!registry?.get?.(name)))];
  return Object.freeze({valid:missing.length===0,missing});
}
function stageTarget(stageIndex,exerciseName){
  const isDynamic=/row|push.?up|pull.?up|dip|squat|negative|press|curl|raise|transition/i.test(exerciseName);
  const isHold=!isDynamic&&/(hold|hang|handstand|stand|l-sit|v-sit|planche|lever|flag|iron cross|manna|lean|support)/i.test(exerciseName);
  const reps=[8,8,6,5,3,3][Math.min(stageIndex,5)];
  const seconds=[20,20,15,12,8,8][Math.min(stageIndex,5)];
  return Object.freeze({kind:isHold?"seconds":"reps",value:isHold?seconds:reps,sets:3});
}
function buildSession(path,stageIndex,registry,variant="A"){
  if(!["A","B"].includes(variant)||!Number.isInteger(stageIndex)||stageIndex<0||stageIndex>=path?.stages?.length)
    throw Error("Nieprawidłowy etap lub wariant treningu.");
  const check=validatePath(path,registry);
  if(!check.valid)throw Error("Brak ćwiczeń w istniejącym rejestrze: "+check.missing.join(", "));
  if(path.category==="acro")throw Error("Elementy akrobatyczne wymagają indywidualnego planu z trenerem.");
  const stage=path.stages[stageIndex];
  const primaryName=stage.moves[stage.moves.length-1];
  const primary=registry.get(primaryName);
  // A genuine FBW must retain pushing, pulling, legs and core even when
  // a skill stage lists many preparatory exercises for the same muscle group.
  // Prefer related stage moves in each movement slot, then canonical fallbacks.
  const used=new Set([primary.id]);
  const slots=[
    {areas:["chest","shoulders","arms"],names:variant==="A"?["Push-Up","Incline Push-Up","Pike Push-Up","Dips"]:["Pike Push-Up","Push-Up","Incline Push-Up","Dips"]},
    {areas:["back"],names:variant==="A"?["Inverted Row","Band-Assisted Pull-Up","Pull-Up"]:["Band-Assisted Pull-Up","Inverted Row","Pull-Up"]},
    {areas:["legs","glutes"],names:variant==="A"?["Squat","Lunge","Step-Up","Hip Thrust"]:["Step-Up","Squat","Hip Thrust","Lunge"]},
    {areas:["abs"],names:variant==="A"?["Hollow hold","Dead Bug","Side Plank","Reverse Crunch"]:["Dead Bug","Hollow hold","Side Plank","Reverse Crunch"]}
  ];
  const accessories=slots.map(slot=>{
    const fits=item=>item?.muscleProfile?.primary?.some(m=>slot.areas.includes(m.area));
    const prep=stage.moves.slice(0,-1).map(n=>registry.get(n)).find(item=>!used.has(item?.id)&&fits(item));
    const base=prep||slot.names.map(n=>registry.get(n)).find(item=>item&&!used.has(item.id)&&fits(item));
    if(!base)throw Error("Brak pełnego pokrycia FBW (push / pull / nogi / core) w rejestrze.");
    used.add(base.id);return base;
  });
  return Object.freeze({
    variant,stageIndex,focus:{id:primary.id,name:primary.displayName||primaryName,target:stageTarget(stageIndex,primaryName)},
    exercises:[{id:primary.id,name:primary.displayName||primaryName,sets:3,restSeconds:150,role:"Cel etapu"},
      ...accessories.map((e,i)=>({id:e.id,name:e.displayName||e.name,sets:2,restSeconds:90,
        role:i<2?"Przygotowanie / umiejętność":"FBW – równowaga bodźców"}))],
    equipment:[...path.equipment],recoveryHours:48
  });
}
function key(id){if(!/^[a-z0-9-]{2,50}$/.test(String(id)))throw Error("Niepoprawny identyfikator ścieżki.");return KEY_PREFIX+id;}
function read(store,id){
  const raw=store.getItem(key(id));
  if(raw===null)return null;
  let s;try{s=JSON.parse(raw)}catch{throw Error("Zapis progresji jest nieczytelny. Nie nadpisano go.");}
  if(!s||s.version!==1||s.pathId!==id||!Number.isInteger(s.stageIndex)||s.stageIndex<0||
     !Array.isArray(s.logs)||s.logs.length>2000||s.logs.some(log=>!Number.isInteger(log.stageIndex)||!Number.isFinite(Date.parse(log.at))||!Array.isArray(log.actual)))
    throw Error("Zapis progresji ma niewłaściwą strukturę. Nie nadpisano go.");
  return s;
}
function commit(store,id,state){
  // A failed write never reports success or mutates the previous saved record.
  const json=JSON.stringify(state);
  store.setItem(key(id),json);
  return state;
}
function begin(store,path,stageIndex=0,confirmed=false,DateType=Date){
  if(!path||!Number.isInteger(stageIndex)||stageIndex<0||stageIndex>=path.stages.length)
    throw Error("Nieprawidłowy poziom wejściowy.");
  if(stageIndex>0&&!confirmed)throw Error("Wyższy etap wymaga potwierdzenia opanowania poprzednich.");
  if(read(store,path.id))throw Error("Plan jest już zapisany. Wróć do bieżącej sesji.");
  return commit(store,path.id,{version:1,pathId:path.id,stageIndex,createdAt:new DateType().toISOString(),logs:[]});
}
function stats(state){
  const logs=state.logs.filter(x=>x.stageIndex===state.stageIndex).slice().sort((a,b)=>Date.parse(a.at)-Date.parse(b.at));
  let streak=0;
  for(let i=logs.length-1;i>=0;i--){if(!logs[i].passed)break;streak++;}
  const last=state.logs.length?state.logs.at(-1):null;
  const ready=streak>=2&&state.stageIndex!==null;
  return Object.freeze({completed:state.logs.length,stageSessions:logs.length,streak,ready,
    lastAt:last?.at||null,restUntil:last?new Date(Date.parse(last.at)+MIN_REST_MS).toISOString():null,
    nextVariant:state.logs.length%2===0?"A":"B"});
}
function logSession(store,path,registry,{actual,extras=null,technique,fatigue="normal",now=new Date()}){
  const state=read(store,path.id);
  if(!state)throw Error("Najpierw rozpocznij ścieżkę.");
  if(path.category==="acro")throw Error("Akrobatykę prowadzi trener, bez automatycznego zapisu prób.");
  if(!(now instanceof Date)||!Number.isFinite(now.getTime()))throw Error("Niepoprawna data treningu.");
  if(!technique||fatigue==="pain")throw Error("Przy bólu lub złej technice nie zaliczaj etapu.");
  if(!["normal","tired"].includes(fatigue))throw Error("Niepoprawne samopoczucie.");
  if(!Array.isArray(actual)||actual.length!==3||actual.some(n=>!Number.isInteger(n)||n<0||n>150))
    throw Error("Wpisz trzy rzeczywiście wykonane serie (0–150).");
  const meta=stats(state);
  if(meta.lastAt&&now.getTime()-Date.parse(meta.lastAt)<MIN_REST_MS)
    throw Error("Między cięższymi sesjami zostaw co najmniej 48 godzin na regenerację.");
  if(meta.lastAt&&now.getTime()<=Date.parse(meta.lastAt))throw Error("Data treningu jest wcześniejsza od historii.");
  const plan=buildSession(path,state.stageIndex,registry,meta.nextVariant);
  // Optional full-body log (2 performed sets for every accessory), validated against the generated plan.
  // Older focus-only records remain readable, but the new UI collects the entire workout.
  let accessoryResults=[];
  if(extras!==null){
    if(!Array.isArray(extras)||extras.length!==plan.exercises.length-1)
      throw Error("Wpisz faktycznie wykonane serie wszystkich czterech ćwiczeń FBW.");
    accessoryResults=extras.map((entry,i)=>{
      const item=plan.exercises[i+1];
      if(entry?.id!==item.id||!Array.isArray(entry.actual)||entry.actual.length!==2||
         entry.actual.some(n=>!Number.isInteger(n)||n<0||n>150))
        throw Error("Nieprawidłowy wynik FBW: "+item.name);
      return {id:item.id,actual:[...entry.actual],kind:stageTarget(0,item.name).kind};
    });
  }
  const passed=actual.every(v=>v>=plan.focus.target.value)&&fatigue==="normal";
  const record={at:now.toISOString(),stageIndex:state.stageIndex,variant:meta.nextVariant,
    focusId:plan.focus.id,kind:plan.focus.target.kind,target:plan.focus.target.value,
    actual:[...actual],extras:accessoryResults,passed,technique:true,fatigue};
  commit(store,path.id,{...state,logs:[...state.logs,record]});
  const current=read(store,path.id);
  return Object.freeze({record,stats:stats(current)});
}
function advance(store,path){
  const current=read(store,path.id);
  if(!current)throw Error("Nie ma aktywnej ścieżki.");
  if(current.stageIndex>=path.stages.length-1)throw Error("Osiągnięto ostatni etap tej ścieżki.");
  if(!stats(current).ready)throw Error("Potrzeba dwóch kolejnych zaliczonych sesji, każdej po regeneracji.");
  return commit(store,path.id,{...current,stageIndex:current.stageIndex+1});
}
function reset(store,path){
  // Explicit action only; keep session log immutable by default and prefer restart from first stage.
  if(!read(store,path.id))return false;
  store.removeItem(key(path.id));
  return true;
}
const api=Object.freeze({CATEGORIES,paths,validatePath,stageTarget,buildSession,key,read,begin,stats,logSession,advance,reset,MIN_REST_MS});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.FitPlanCalisthenicsCoach=api;
})(typeof window!=="undefined"?window:undefined);
