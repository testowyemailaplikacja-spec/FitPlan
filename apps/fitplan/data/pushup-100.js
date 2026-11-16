// WIEDORA-CHANGE: WD-20261031-WIE-110-PUSHUP100-01 | TASK: WIE-110/WIE-115 | AUTHOR: ChatGPT / GPT-6
// Original push-up endurance training pilot, inspired by public high-level
// concepts of initial tests, three weekly sessions and re-tests. No copied tables.
// A training set is only logged when the athlete types actual repetitions.
(()=>{
"use strict";
// WIEDORA-CHANGE: WD-20261031-WIE-115-LOAD-CYCLE-02 | TASK: WIE-115 | AUTHOR: ChatGPT / GPT-6
const KEY="fitplan.pushups100.v1",VERSION=1,MAX_HISTORY=120,MAX_WEEK=40;
const load=(typeof module!=="undefined"&&module.exports)
 ? require("./training-load-engine.js") : typeof window!=="undefined"?window.FitPlanTrainingLoad:null;
const TIERS=Object.freeze([
 Object.freeze({id:"start",name:"Poziom I · Początek",min:0,max:10,note:"0–10 poprawnych pompek. Przy zerowym wyniku ćwicz na podwyższeniu, nie zaliczając ich jako pełnych pompek.",rates:[.4,.5,.35,.35,.4]}),
 Object.freeze({id:"progress",name:"Poziom II · Rozwój",min:11,max:30,note:"11–30 poprawnych pompek. Skup się na kontrolowanych seriach i odpoczynku.",rates:[.42,.5,.4,.36,.43]}),
 Object.freeze({id:"endurance",name:"Poziom III · Wytrzymałość",min:31,max:1000,note:"Co najmniej 31 poprawnych pompek. Objętość zwiększaj stopniowo, bez forsowania techniki.",rates:[.34,.42,.36,.34,.4]})
]);
const integer=(x,min,max)=>Number.isInteger(x)&&x>=min&&x<=max;
const goalOf=state=>state?.goal??100;
const prefsOf=state=>load?.preferences(state?.preferences||{})||{minutes:20,cycleDays:7};
const limitWeek=state=>state?.blockEndWeek??8;
function tier(max){
 if(!integer(max,0,1000))throw Error("Podaj liczbę poprawnych pompek od 0 do 1000.");
 return TIERS.find(t=>max<=t.max);
}
function session(max,week,day,options={}){
 const level=tier(max),goal=goalOf(options),prefs=prefsOf(options);
 if(!integer(week,1,MAX_WEEK)||!integer(day,1,3))throw Error("Niepoprawny tydzień lub dzień treningowy.");
 if(!integer(goal,100,1000))throw Error("Niepoprawny cel treningowy.");
 if(max>=goal)return Object.freeze({achieved:true,sets:[],level:level.id,goal,week,day,
  minutes:prefs.minutes,cycleDays:prefs.cycleDays,feasible:true});
 const basis=Math.max(3,max),blockWeek=(week-1)%8;
 const factor=1+0.055*blockWeek+0.035*(day-1);
 // A new 4-week extension starts from the current proven test, not a blind
 // compounding of the preceding eight-week progression.
 const phase=load?.phase(week)||{deload:false,recommendedVolumeFactor:1};
 const original=level.rates.map(rate=>Math.max(1,Math.min(300,
   Math.round(basis*rate*factor*phase.recommendedVolumeFactor))));
 const restSeconds=day===3?120:90;
 const time=load?.fitToTime({sets:original,mode:"endurance",minutes:prefs.minutes,
  cycleDays:prefs.cycleDays,restSeconds});
 const sets=time?(time.feasible?time.setsTarget:[]):original;
 return Object.freeze({
  achieved:false,level:level.id,goal,week,day,sets:Object.freeze([...sets]),
  total:sets.reduce((a,b)=>a+b,0),restSeconds,
  minutes:prefs.minutes,cycleDays:prefs.cycleDays,
  estimatedSeconds:time?.estimatedSeconds||null,spareSeconds:time?.spareSeconds||0,
  adjusted:!!time?.adjusted,feasible:time?.feasible??true,
  reason:time?.reason||"",warmupSeconds:time?.warmupSeconds??360,
  cooldownSeconds:time?.cooldownSeconds??180,deload:phase.deload,
  variant:max===0?"assisted":"standard",
  recheck:day===3&&week%2===0,
  guidance:max===0?"Wariant przy ścianie lub na stabilnym podwyższeniu. Wynik nie jest równoważny pompkom pełnym.":"Pozostaw zapas 1–3 powtórzeń; jeśli technika się psuje, przerwij serię."
 });
}
function validate(state){
 if(!state||state.version!==VERSION||!integer(state.max,0,1000)||
   !integer(state.week,1,MAX_WEEK)||!integer(state.day,1,3)||
   !integer(goalOf(state),100,1000)||
   !integer(limitWeek(state),8,MAX_WEEK)||
   !(state.preferences===undefined||(state.preferences!==null&&typeof state.preferences==="object"&&!Array.isArray(state.preferences)&&load&&load.CYCLES.includes(state.preferences.cycleDays)&&load.DURATIONS.includes(state.preferences.minutes)))||
   !(state.goalUpdates===undefined||(Array.isArray(state.goalUpdates)&&state.goalUpdates.length<=20&&
      state.goalUpdates.every(e=>e&&integer(e.goal,100,1000)&&
       (e.testCount===undefined||integer(e.testCount,1,20))&&
       typeof e.at==="string"&&Number.isFinite(Date.parse(e.at)))))||
   typeof state.finishedCycle!=="boolean"||
   !Array.isArray(state.tests)||state.tests.length<1||state.tests.length>20||
   !Array.isArray(state.attempts)||state.attempts.length>MAX_HISTORY)return false;
 if(!state.tests.every(x=>x&&integer(x.max,0,1000)&&
   typeof x.at==="string"&&Number.isFinite(Date.parse(x.at))))return false;
 if(!state.attempts.every(x=>x&&integer(x.week,1,MAX_WEEK)&&integer(x.day,1,3)&&
    integer(x.baseline,0,1000)&&Array.isArray(x.targets)&&x.targets.length===5&&
    x.targets.every(n=>integer(n,1,300))&&
    Array.isArray(x.actual)&&x.actual.length===5&&x.actual.every(n=>integer(n,0,300))&&
    typeof x.passed==="boolean"&&
    x.passed===x.actual.every((n,i)=>n>=x.targets[i])&&
    typeof x.at==="string"&&Number.isFinite(Date.parse(x.at))))return false;
 return true;
}
function read(storage){
 let raw;try{raw=storage.getItem(KEY)}catch{throw Error("Nie można odczytać programu pompek z urządzenia.");}
 if(raw===null)return null;
 if(raw.length>80000)throw Error("Historia programu jest zbyt duża; nie nadpisujemy danych.");
 let data;try{data=JSON.parse(raw)}catch{throw Error("Uszkodzony zapis programu. Nie nadpisujemy danych.");}
 if(!validate(data))throw Error("Nieobsługiwana wersja lub uszkodzony zapis programu.");
 return data;
}
function write(storage,state){
 if(!validate(state))throw Error("Nieprawidłowy stan programu.");
 const raw=JSON.stringify(state);
 if(raw.length>80000)throw Error("Historia przekracza bezpieczny limit. Zapis przerwany.");
 try{storage.setItem(KEY,raw)}catch{throw Error("Nie udało się zapisać postępu na urządzeniu.");}
 return state;
}
function begin(storage,max,clock=Date,preferences={}){
 if(read(storage)!==null)throw Error("Program już istnieje. Zaktualizuj test lub kontynuuj bez kasowania historii.");
 tier(max);
 const chosen=prefsOf({preferences});
 const state={version:VERSION,max,goal:100,preferences:{minutes:chosen.minutes,cycleDays:chosen.cycleDays},
   week:1,day:1,blockEndWeek:8,finishedCycle:max>=100,
   tests:[{max,at:new clock().toISOString()}],attempts:[],goalUpdates:[]};
 return write(storage,state);
}
function retest(storage,max,clock=Date){
 tier(max);
 const state=read(storage);if(!state)throw Error("Najpierw wykonaj test początkowy.");
 if(state.tests.length>=20)throw Error("Limit testów osiągnięty. Zachowaj kopię danych.");
 const change={...state,max,tests:[...state.tests,{max,at:new clock().toISOString()}],
  ...(max>=goalOf(state)?{finishedCycle:true}:{})};
 // An unfinished goal at the block end must be explicitly extended. No reset.

 return write(storage,change);
}
function record(storage,actual,clock=Date){
 const state=read(storage);
 if(!state)throw Error("Najpierw wykonaj test początkowy.");
 if(state.finishedCycle||state.max>=goalOf(state))throw Error("Blok zakończony. Jeśli nie osiągnięto celu, wybierz przedłużenie i odpoczynek.");
 if(state.attempts.length>=MAX_HISTORY)throw Error("Historia treningów jest pełna. Nie nadpisujemy jej.");
 if(!Array.isArray(actual)||actual.length!==5||actual.some(v=>!integer(v,0,300)))
   throw Error("Podaj rzeczywiste powtórzenia w każdej z pięciu serii (0–300).");
 const proposed=session(state.max,state.week,state.day,state);
 if(!proposed.feasible||proposed.sets.length!==5)throw Error("Ten trening nie mieści się w czasie. Wybierz inny czas przed zapisem.");
 const passed=actual.every((n,i)=>n>=proposed.sets[i]);
 const item={week:state.week,day:state.day,baseline:state.max,targets:[...proposed.sets],
  actual:[...actual],passed,at:new clock().toISOString()};
 let week=state.week,day=state.day,finishedCycle=false;
 if(passed){
  if(day<3)day++;
  else if(week<limitWeek(state)){week++;day=1;}
  else finishedCycle=true;
 }
 const updated={...state,week,day,finishedCycle,attempts:[...state.attempts,item]};
 write(storage,updated);
 return Object.freeze({passed,attempt:item,next:{week,day,finishedCycle}});
}
function summary(state){
 if(!validate(state))throw Error("Niepoprawny zapis postępów.");
 const successes=state.attempts.filter(x=>x.passed);
 const last=successes.at(-1)||null;
 const sum=successes.reduce((acc,x)=>acc+x.actual.reduce((a,b)=>a+b,0),0);
 // WIEDORA-CHANGE: WD-20261101-WIE-110-KB-FBW-01 | TASK: WIE-110 | AUTHOR: ChatGPT / GPT-6
 // Preserve legacy "volume" meaning successful-session reps; add all logged
 // reps (including partial/failed attempts) and target-normalized trend.
 const repsAll=state.attempts.reduce((acc,x)=>acc+x.actual.reduce((a,b)=>a+b,0),0);
 const repsWeek=state.attempts.filter(x=>x.week===state.week).reduce(
   (acc,x)=>acc+x.actual.reduce((a,b)=>a+b,0),0);
 const lastAttempt=state.attempts.at(-1);
 const lastDifference=lastAttempt?lastAttempt.actual.reduce((a,b)=>a+b,0)-
   lastAttempt.targets.reduce((a,b)=>a+b,0):null;
 const ratio=x=>x.actual.reduce((a,b)=>a+b,0)/Math.max(1,x.targets.reduce((a,b)=>a+b,0));
 const secondLast=state.attempts.at(-2);
 const change=lastAttempt&&secondLast?ratio(lastAttempt)-ratio(secondLast):null;
 const trend=change===null?"brak porównania":change>0.05?"progres":change< -0.05?"regres":"stagnacja";
 return {max:state.max,tier:tier(state.max).id,week:state.week,day:state.day,
  goal:goalOf(state),preferences:prefsOf(state),blockEndWeek:limitWeek(state),
  attempts:state.attempts.length,completed:successes.length,volume:sum,
  repsAll,repsWeek,lastDifference,trend,
  lastDate:last?.at||null,percent:Math.min(100,Math.round(100*state.max/goalOf(state))),
  finishedCycle:state.finishedCycle};
}
// Shared time/cycle settings only. Updating the budget never marks a session done.
function configure(storage,preferences){
 const state=read(storage);if(!state)throw Error("Najpierw rozpocznij program.");
 if(!load)throw Error("Wspólny model czasu nie jest dostępny.");
 const p=load.preferences(preferences);
 return write(storage,{...state,preferences:{minutes:p.minutes,cycleDays:p.cycleDays}});
}
function extend(storage,clock=Date){
 const state=read(storage);if(!state)throw Error("Brak rozpoczętego programu.");
 if(!state.finishedCycle||state.max>=goalOf(state))throw Error("Przedłużenie jest dostępne po zakończeniu bloku bez osiągnięcia celu.");
 if(limitWeek(state)>=MAX_WEEK||state.attempts.length>=MAX_HISTORY)
   throw Error("Limit długości programu został osiągnięty. Zachowaj historię i skonsultuj dalszą progresję.");
 // Four additional weeks, with a 3–7 day light/recovery period recommended.
 const next={...state,week:state.week+1,day:1,blockEndWeek:Math.min(MAX_WEEK,limitWeek(state)+4),finishedCycle:false};
 return write(storage,next);
}
function increaseGoal(storage,amount,clock=Date){
 const state=read(storage);if(!state)throw Error("Najpierw rozpocznij program.");
 const oldGoal=goalOf(state);
 if(state.max<oldGoal)throw Error("Najpierw potwierdź osiągnięcie obecnego celu w teście maksimum.");
 if(!integer(amount,1,100)||oldGoal+amount>1000)
   throw Error("Możesz podnieść cel jednorazowo o 1–100 powtórzeń, maksymalnie do 1000.");
 if((state.goalUpdates||[]).length>=20)throw Error("Limit zmian celu. Zachowaj historię.");
 if(state.goalUpdates?.at(-1)?.testCount===state.tests.length)
   throw Error("Do ponownego zwiększenia celu potrzebny jest nowy rzeczywisty test maksimum.");
 const goal=oldGoal+amount;
 return write(storage,{...state,goal,week:1,day:1,blockEndWeek:8,finishedCycle:false,
  goalUpdates:[...(state.goalUpdates||[]),{goal,testCount:state.tests.length,at:new clock().toISOString()}]});
}
const api=Object.freeze({KEY,VERSION,TIERS,tier,session,read,begin,retest,record,summary,configure,extend,increaseGoal});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(typeof window!=="undefined")window.FitPlanPushup100=api;
})();
