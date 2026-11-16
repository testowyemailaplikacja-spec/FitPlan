// WIEDORA-CHANGE: WD-20261101-WIE-110-KB-FBW-01 | TASK: WIE-110/WIE-115 | AUTHOR: ChatGPT / GPT-6
// Full body kettlebell circuit pilot: uses existing canonical kettlebell IDs.
// Recommendations are heuristics, not coaching or assumed kilogram prescriptions.
(()=>{
"use strict";
const KEY="fitplan.kb-fbw-circuit.v1", VERSION=1, LIMIT=300;
const LEVELS=Object.freeze([
 {id:"beginner",name:"I · Fundamenty",maxLevel:1,
  ids:["kb-deadlift","kb-row","kb-floor-press","kb-goblet-squat","kb-glute-bridge"]},
 {id:"intermediate",name:"II · Rozwój",maxLevel:2,
  ids:["kb-two-hand-swing","kb-goblet-squat","kb-row","kb-strict-press","kb-reverse-lunge","kb-floor-press"]},
 {id:"advanced",name:"III · Zaawansowany",maxLevel:3,
  ids:["kb-clean","kb-rack-squat","kb-row","kb-strict-press","kb-reverse-lunge","kb-floor-press","kb-two-hand-swing"]}
]);
const GOALS=Object.freeze([
 {id:"muscle",name:"Rozbudowa mięśni",description:"Hipertrofia i budowanie masy mięśniowej",reps:10,rest:90,rounds:[2,3,3],tempo:4},
 {id:"recomposition",name:"Rekompozycja sylwetki",description:"Trening siłowy podczas poprawy składu ciała",reps:10,rest:90,rounds:[2,2,3],tempo:3},
 {id:"reduction",name:"Redukcja z ochroną mięśni",description:"Trening oporowy wspierający utrzymanie mięśni; redukcja zależy także od bilansu energii",reps:10,rest:90,rounds:[2,2,3],tempo:3},
 {id:"strength",name:"Siła całego ciała",description:"Kontrolowany ciężar i dłuższe przerwy",reps:6,rest:150,rounds:[2,3,3],tempo:4},
 {id:"technique",name:"Technika i kontrola ruchu",description:"Jakość ruchu przed obciążeniem",reps:6,rest:120,rounds:[2,2,2],tempo:5},
 {id:"conditioning",name:"Kondycja i wytrzymałość",description:"Obwody umiarkowanego wysiłku",reps:12,rest:75,rounds:[2,3,3],tempo:3},
 {id:"general",name:"Sprawność ogólna",description:"Zrównoważone ruchy całego ciała",reps:8,rest:90,rounds:[2,2,3],tempo:3}
]);
// WIEDORA-CHANGE: WD-20261101-WIE-110-KB-UX-FIX-02 | TASK: WIE-110 | AUTHOR: ChatGPT / GPT-6
const KNOWN_IDS=new Set(LEVELS.flatMap(t=>t.ids));
const DAYS={5:2,7:3,10:4}, DURATIONS=[20,40,60,80,100];
const int=(n,a,b)=>Number.isInteger(n)&&n>=a&&n<=b;
const goal=id=>GOALS.find(x=>x.id===id),level=id=>LEVELS.find(x=>x.id===id);
const frozen=x=>Object.freeze(x);
function config(input){
 const l=level(input?.level),g=goal(input?.goal),minutes=input?.minutes,cycleDays=input?.cycleDays,
  sessionsPerCycle=input?.sessionsPerCycle;
 if(!l||!g||!DURATIONS.includes(minutes)||!Object.hasOwn(DAYS,cycleDays)||
   !int(sessionsPerCycle,1,DAYS[cycleDays]))
  throw Error("Wybierz cel, poziom, czas 20–100 min oraz liczbę sesji odpowiednią dla cyklu.");
 return frozen({level:l.id,goal:g.id,minutes,cycleDays,sessionsPerCycle});
}
function verify(state){
 if(!state||state.version!==VERSION||!Array.isArray(state.history)||state.history.length>LIMIT)return false;
 try{config(state.config)}catch{return false}
 return state.history.every(x=>x&&typeof x.at==="string"&&Number.isFinite(Date.parse(x.at))&&
  int(x.cycle,1,500)&&int(x.slot,1,4)&&
  (x.goal===undefined||!!goal(x.goal))&&(x.level===undefined||!!level(x.level))&&
  Array.isArray(x.rows)&&x.rows.length>0&&x.rows.length<=30&&
  x.rows.every(y=>y&&typeof y.id==="string"&&/^kb-[a-z-]+$/.test(y.id)&&
   KNOWN_IDS.has(y.id)&&(!x.level||level(x.level).ids.includes(y.id))&&
   int(y.target,1,100)&&int(y.actual,0,300)&&
   Number.isFinite(y.kg)&&y.kg>0&&y.kg<=200&&
   (y.rir===null||int(y.rir,0,6))&&
   ["good","needs-work","unknown"].includes(y.form)));
}
function read(storage){
 let raw;try{raw=storage.getItem(KEY)}catch{throw Error("Brak dostępu do zapisanych treningów.");}
 if(raw===null)return null;
 if(raw.length>300000)throw Error("Historia jest zbyt duża. Nie nadpisano jej.");
 let s;try{s=JSON.parse(raw)}catch{throw Error("Historia jest uszkodzona. Nie nadpisano danych.");}
 if(!verify(s))throw Error("Nieznany lub uszkodzony format historii kettlebell.");
 return s;
}
function write(storage,s){
 if(!verify(s))throw Error("Błędny zapis treningu.");
 let raw=JSON.stringify(s);if(raw.length>300000)throw Error("Przekroczono limit historii.");
 try{storage.setItem(KEY,raw)}catch{throw Error("Nie udało się zapisać treningu. Sprawdź miejsce w przeglądarce.");}
 return s;
}
function begin(storage,input){
 if(read(storage))throw Error("Program już istnieje. Możesz zmienić ustawienia bez utraty historii.");
 const s={version:VERSION,config:config(input),history:[]};
 return write(storage,s);
}
function configure(storage,input){
 const s=read(storage);if(!s)throw Error("Najpierw utwórz program.");
 return write(storage,{...s,config:config(input)});
}
// Deload sessions must not become the baseline of a future ordinary workout.
function lastFor(history,id,configFilter=null,skipDeload=false){
 for(let i=history.length-1;i>=0;i--){
  if(skipDeload&&history[i].cycle%5===0)continue;
  if(configFilter&&(history[i].goal!==configFilter.goal||history[i].level!==configFilter.level))continue;
  const rows=history[i].rows.filter(r=>r.id===id);
  if(rows.length)return rows;
 }
 return null;
}
function proposal(state,lib,load){
 if(!verify(state))throw Error("Niepoprawny stan programu.");
 if(!lib?.get||!load?.fitToTime)throw Error("Brak katalogu lub silnika czasu FitPlan.");
 const c=state.config,l=level(c.level),g=goal(c.goal),history=state.history;
 let ids=l.ids.filter(id=>lib.get(id)&&lib.get(id).minLevel<=l.maxLevel);
 if(ids.length!==l.ids.length)throw Error("Brak ćwiczenia w katalogu FitPlan. Nie zmieniamy historii.");
 const previous=history.at(-1);
 const cycle=previous?(previous.slot>=c.sessionsPerCycle?previous.cycle+1:previous.cycle):1;
 const slot=previous?(previous.slot>=c.sessionsPerCycle?1:previous.slot+1):1;
 const review=cycle%5===0;
 const factor=review?0.65:1;
 // Never invent kilogram values. Repeat the last entered load only as reference.
 const suggested=ids.map(id=>{
  const last=lastFor(history,id,c,true),reference=lastFor(history,id),prior=reference?.at(-1)||null;
  const successful=!!last&&last.every(x=>x.actual>=x.target&&x.form==="good"&&
   (x.rir!==null?x.rir>=2:x.actual>x.target));
  const struggling=!!last&&last.some(x=>x.actual<x.target*0.85||x.form==="needs-work"||(x.rir!==null&&x.rir===0));
  const before=last?.at(-1)?.target??g.reps;
  const value=Math.max(3,Math.min(30,Math.round((successful?before+1:struggling?before-2:before)*factor)));
  return {id,title:lib.get(id).name,cue:lib.get(id).cue,rep:value,
    previousKg:prior?.kg??null,change:successful?"up":struggling?"down":"hold"};
 });
 let chosen=null,reason="";
 // If 20 minutes are insufficient, reduce rounds before dropping exercises.
 for(let rounds=Math.min(g.rounds[LEVELS.indexOf(l)],4);rounds>=1&&!chosen;rounds--){
  // The first four exercises in each tier deliberately cover a hinge, squat,
  // pull and press. Dropping below four silently turns FBW into a split session.
  for(let count=ids.length;count>=4&&!chosen;count--){
   const selected=suggested.slice(0,count);
   const reps=Array.from({length:rounds},()=>selected.map(x=>x.rep)).flat();
   if(reps.length>20)continue; // shared time engine validates at most 20 sequential sets
   const useStrength=g.id==="strength";
   const mode=useStrength?"strength":"endurance";
   const restSeconds=Math.max(g.rest,useStrength?150:90);
   const result=load.fitToTime({mode,minutes:c.minutes,cycleDays:c.cycleDays,sets:reps,
    secondsPerRep:g.tempo,restSeconds,
    warmupSeconds:useStrength?480:360,
    cooldownSeconds:useStrength?240:180,transitionSeconds:useStrength?90:75});
   if(!result.feasible)continue;
   const rows=result.setsTarget.map((target,i)=>({
     id:selected[i%count].id,target,round:Math.floor(i/count)+1,
     previousKg:selected[i%count].previousKg,adjustment:selected[i%count].change
   }));
   chosen={rows,rounds,exercises:count,seconds:result.estimatedSeconds,
    restSeconds,spareSeconds:result.spareSeconds,
    adjusted:result.adjusted||rounds<g.rounds[LEVELS.indexOf(l)]||count<ids.length};
  }
 }
 if(!chosen)return frozen({feasible:false,reason:"Wybrany czas nie mieści rozgrzewki, bezpiecznych przerw i czterech podstawowych wzorców ruchu (nogi, biodra, przyciąganie, pchanie). Wybierz dłuższą sesję, np. 40 minut.",cycle,slot});
 const slotDays=load.customCyclePlan(c.cycleDays,c.sessionsPerCycle).filter(x=>x.kind==="workout");
 return frozen({feasible:true,...chosen,cycle,slot,plannedDay:slotDays[slot-1]?.day||null,
  goal:g.id,level:l.id,minutes:c.minutes,cycleDays:c.cycleDays,
  sessionsPerCycle:c.sessionsPerCycle,review,notes:chosen.adjusted?
  "Objętość lub liczba ćwiczeń została zmniejszona do limitu czasu. Nie skracano minimalnych przerw.":"Zachowano plan bez sztucznego wypełniania czasu dodatkowymi seriami."});
}
function record(storage,rows,lib,load,clock=Date){
 const s=read(storage);if(!s)throw Error("Najpierw rozpocznij program.");
 const p=proposal(s,lib,load);
 if(!p.feasible)throw Error(p.reason);
 if(s.history.length>=LIMIT)throw Error("Osiągnięto limit dziennika. Zapisz kopię, nie usuwamy danych.");
 if(!Array.isArray(rows)||rows.length!==p.rows.length)throw Error("Wpisz wynik każdej serii.");
 const completed=rows.map((r,i)=>{
  const planned=p.rows[i];
  if(r?.id!==planned.id||!int(r.actual,0,300)||
   !Number.isFinite(r.kg)||r.kg<=0||r.kg>200||
   !(r.rir===null||int(r.rir,0,6))||
   !["good","needs-work","unknown"].includes(r.form))
   throw Error("Wpisz prawdziwe powtórzenia, obciążenie i ocenę techniki w każdej serii.");
  return {id:r.id,target:planned.target,actual:r.actual,kg:r.kg,rir:r.rir,form:r.form};
 });
 const entry={at:new clock().toISOString(),cycle:p.cycle,slot:p.slot,goal:s.config.goal,level:s.config.level,rows:completed};
 return write(storage,{...s,history:[...s.history,entry]});
}
function summary(state){
 if(!verify(state))throw Error("Uszkodzony dziennik.");
 const h=state.history,per=state.config.sessionsPerCycle,prior=h.at(-1);
 const current=prior?(prior.slot>=per?prior.cycle+1:prior.cycle):1;
 const all=h.flatMap(e=>e.rows);
 const cycleRows=h.filter(e=>e.cycle===current).flatMap(e=>e.rows);
 const total=all.reduce((a,r)=>a+r.actual,0),thisCycle=cycleRows.reduce((a,r)=>a+r.actual,0);
 const volume=all.reduce((a,r)=>a+r.actual*r.kg,0);
 const lastDifference=h.at(-1)?.rows.reduce((a,r)=>a+r.actual-r.target,0)??null;
 const ids=[...new Set(all.map(r=>r.id))];
 let progress=0,regress=0,stagnation=0;
 for(const id of ids){
  // Do not report a deliberately lighter recovery cycle as regression.
  const batches=h.filter(e=>e.cycle%5!==0&&e.goal===state.config.goal&&e.level===state.config.level).map(e=>e.rows.filter(r=>r.id===id)).filter(x=>x.length);
  if(batches.length<2)continue;
  const a=batches.at(-2),b=batches.at(-1);
  const avg=xs=>xs.reduce((x,r)=>x+r.actual,0)/xs.length;
  const kg=xs=>xs.reduce((x,r)=>x+r.kg,0)/xs.length;
  const r1=avg(a),r2=avg(b),w1=kg(a),w2=kg(b);
  if(b.some(r=>r.form==="needs-work")){regress++;continue;}
  // Compare only like-for-like rep series, otherwise recognize a higher load
  // only if repetitions have not fallen more than 10%.
  if((w2>w1&&r2>=r1*.9)||(Math.abs(w2-w1)<.001&&r2>r1*1.05))progress++;
  else if((w2<w1&&r2<=r1*1.05)||(Math.abs(w2-w1)<.001&&r2<r1*.9))regress++;
  else stagnation++;
 }
 const last=h.at(-1);
 return frozen({sessions:h.length,cycle:current,slot:prior?(prior.slot>=per?1:prior.slot+1):1,sessionsInCycle:h.filter(e=>e.cycle===current).length,
  repsCycle:thisCycle,repsAll:total,tonnageKg:Math.round(volume*100)/100,
  setsAll:all.length,progress,regress,stagnation,
  lastDate:last?.at||null,lastDifference});
}
const api=frozen({KEY,VERSION,LEVELS,GOALS,config,read,begin,configure,proposal,record,summary});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(typeof window!=="undefined")window.FitPlanKettlebellCircuit=api;
})();
