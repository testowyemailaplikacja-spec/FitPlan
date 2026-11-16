// WIEDORA-CHANGE: WD-20261031-WIE-115-LOAD-CYCLE-02 | TASK: WIE-115 | AUTHOR: ChatGPT / GPT-6
// Shared, side-effect-free training-budget calculations. This is a conservative
// scheduling model, not a validated individualized coaching prescription.
(()=>{
"use strict";
const DURATIONS=Object.freeze([20,40,60,80,100]),CYCLES=Object.freeze([5,7,10]);
const MODES=Object.freeze({
 endurance:Object.freeze({secondsPerRep:3,restSeconds:90,warmupSeconds:360,cooldownSeconds:180,transitionSeconds:75,gapHours:48}),
 strength:Object.freeze({secondsPerRep:4,restSeconds:150,warmupSeconds:480,cooldownSeconds:240,transitionSeconds:90,gapHours:48}),
 light:Object.freeze({secondsPerRep:3,restSeconds:60,warmupSeconds:300,cooldownSeconds:180,transitionSeconds:60,gapHours:24})
});
const OWN=Object.prototype.hasOwnProperty;
const validInt=(n,min,max)=>Number.isInteger(n)&&n>=min&&n<=max;
function preferences(p={}){
 const minutes=p.minutes??20,cycleDays=p.cycleDays??7;
 if(!DURATIONS.includes(minutes)||!CYCLES.includes(cycleDays))throw Error("Wybierz czas 20/40/60/80/100 min i cykl 5/7/10 dni.");
 return Object.freeze({minutes,cycleDays});
}
function estimate(input){
 const sets=input?.sets,mode=MODES[input?.mode||"endurance"];
 if(!mode||!Array.isArray(sets)||!sets.length||sets.length>20||
    sets.some(n=>!validInt(n,1,1000)))throw Error("Niepoprawne serie lub tryb treningu.");
 const secondsPerRep=input.secondsPerRep??mode.secondsPerRep;
 const restSeconds=input.restSeconds??mode.restSeconds;
 const warmupSeconds=input.warmupSeconds??mode.warmupSeconds;
 const cooldownSeconds=input.cooldownSeconds??mode.cooldownSeconds;
 const transitionSeconds=input.transitionSeconds??mode.transitionSeconds;
 if(!validInt(secondsPerRep,1,10)||!validInt(restSeconds,mode.restSeconds,600)||
    !validInt(warmupSeconds,mode.warmupSeconds,1800)||!validInt(cooldownSeconds,mode.cooldownSeconds,1800)||
    !validInt(transitionSeconds,mode.transitionSeconds,1800))throw Error("Model czasu nie może skracać minimalnej rozgrzewki, regeneracji i przerw.");
 const repetitions=sets.reduce((a,n)=>a+n,0),workSeconds=repetitions*secondsPerRep;
 const recoverySeconds=(sets.length-1)*restSeconds;
 const fixedSeconds=warmupSeconds+cooldownSeconds+transitionSeconds;
 return Object.freeze({repetitions,sets:sets.length,secondsPerRep,restSeconds,
    workSeconds,recoverySeconds,warmupSeconds,cooldownSeconds,transitionSeconds,
    fixedSeconds,estimatedSeconds:fixedSeconds+workSeconds+recoverySeconds});
}
function fitToTime(input){
 const p=preferences(input),mode=input.mode||"endurance",source=input.sets;
 const base=estimate({...input,mode,sets:source}),budget=p.minutes*60;
 // Leave rest at the minimum defined for the intensity; never trade away safety
 // to artificially fill a user-requested number of minutes.
 if(base.estimatedSeconds<=budget)return Object.freeze({
  ...base,minutes:p.minutes,budgetSeconds:budget,setsTarget:Object.freeze([...source]),
  spareSeconds:budget-base.estimatedSeconds,adjusted:false,feasible:true
 });
 const free=budget-base.fixedSeconds-base.recoverySeconds;
 if(free<source.length*base.secondsPerRep) return Object.freeze({
   ...base,minutes:p.minutes,budgetSeconds:budget,setsTarget:Object.freeze([]),
   spareSeconds:0,adjusted:true,feasible:false,reason:"Nie mieści się rozgrzewka, odpoczynek i schłodzenie. Wybierz dłuższą sesję lub lżejszą odmianę."
 });
 const maxReps=Math.floor(free/base.secondsPerRep);
 const total=source.reduce((a,n)=>a+n,0),count=source.length;
 const scaled=source.map(n=>Math.max(1,Math.floor(n*maxReps/total)));
 let left=maxReps-scaled.reduce((a,n)=>a+n,0);
 // Restore only existing planned reps, deterministically, without increasing
 // above the original workload. Excess time is reserved for optional light work.
 for(let i=0;left>0;i=(i+1)%count){
   if(scaled.every((n,j)=>n>=source[j]))break;
   if(scaled[i]<source[i]){scaled[i]++;left--;}
 }
 const revised=estimate({...input,mode,sets:scaled});
 return Object.freeze({...revised,minutes:p.minutes,budgetSeconds:budget,
  setsTarget:Object.freeze(scaled),spareSeconds:budget-revised.estimatedSeconds,
  adjusted:true,feasible:true,reason:"Liczbę powtórzeń ograniczono do dostępnego czasu; nie skracano przerw."});
}
const DAYS=Object.freeze({5:Object.freeze([0,2]),7:Object.freeze([0,2,4]),10:Object.freeze([0,3,6,8])});
function cyclePlan(cycleDays,mode="endurance"){
 if(!CYCLES.includes(cycleDays)||!OWN.call(MODES,mode))throw Error("Nieznany cykl lub intensywność.");
 const workouts=DAYS[cycleDays];
 return Object.freeze(Array.from({length:cycleDays},(_,i)=>Object.freeze({
    day:i+1,kind:workouts.includes(i)?"workout":"recovery",
    detail:workouts.includes(i)?"Jednostka treningowa":"Odpoczynek lub lekka aktywność bez przeciążania tych samych mięśni"
 })));
}
// WIEDORA-CHANGE: WD-20261101-WIE-110-KB-FBW-01 | TASK: WIE-115 | AUTHOR: ChatGPT / GPT-6
// Customized schedule retains an approximate 48-hour minimum separation for
// harder workouts. Calendar dates and individual recovery require later validation.
const CUSTOM_CYCLE_DAYS=Object.freeze({
 5:Object.freeze({1:[1],2:[1,3]}),
 7:Object.freeze({1:[1],2:[1,4],3:[1,3,5]}),
 10:Object.freeze({1:[1],2:[1,6],3:[1,4,7],4:[1,4,7,9]})
});
function customCyclePlan(days,count){
 const exerciseDays=CUSTOM_CYCLE_DAYS[days]?.[count];
 if(!exerciseDays)throw Error("Niepoprawna liczba jednostek w cyklu.");
 return Object.freeze(Array.from({length:days},(_,index)=>Object.freeze({
  day:index+1,kind:exerciseDays.includes(index+1)?"workout":"recovery",
  detail:exerciseDays.includes(index+1)?"Planowana jednostka":"Odpoczynek lub lekkie ćwiczenia innych partii"
 })));
}
function recovery(input){
 const intensity=input?.intensity||"hard",fatigue=input?.fatigue||"normal";
 if(!["easy","hard"].includes(intensity)||!["normal","tired","pain"].includes(fatigue))
   throw Error("Niepoprawna ocena regeneracji.");
 if(fatigue==="pain")return Object.freeze({allowed:false,restHours:null,reason:"Ból lub niepokojące objawy: przerwij i rozważ konsultację ze specjalistą."});
 const minRestHours=intensity==="hard"?48:24;
 const restHours=fatigue==="tired"?(intensity==="hard"?72:48):minRestHours;
 const lastEnd=input?.lastEnd;
 if(lastEnd===undefined||lastEnd===null)return Object.freeze({allowed:true,restHours,reason:"Brak ostatniej potwierdzonej sesji; ocenę samopoczucia należy wykonać samodzielnie."});
 const when=Date.parse(lastEnd);
 const now=input.now===undefined?Date.now():new Date(input.now).getTime();
 if(!Number.isFinite(when)||!Number.isFinite(now))throw Error("Niepoprawna data treningu.");
 const elapsed=(now-when)/3600000;
 return Object.freeze({allowed:elapsed>=restHours,restHours,
   remainingHours:Math.max(0,Math.ceil(restHours-elapsed)),
   reason:elapsed<restHours?"Zaplanuj dodatkowy odpoczynek dla tej samej grupy mięśniowej.":"Zachowaj prawidłową technikę i oceń zmęczenie przed treningiem."});
}
// WIEDORA-CHANGE: WD-20261031-WIE-115-LOAD-CYCLE-02 | TASK: WIE-115 | AUTHOR: ChatGPT / GPT-6
function analyzeRollingLoad(sessions,now=new Date(),targetGroup=""){
 if(!Array.isArray(sessions)||sessions.length>1000||!sessions.every(x=>
   x&&typeof x.at==="string"&&Number.isFinite(Date.parse(x.at))&&
   ["easy","hard"].includes(x.intensity)&&Array.isArray(x.groups)&&
   x.groups.every(g=>typeof g==="string"&&g.length>0&&g.length<=60)))
   throw Error("Niepoprawna historia sesji.");
 const timestamp=new Date(now).getTime();
 if(!Number.isFinite(timestamp))throw Error("Niepoprawna data.");
 const last7=sessions.filter(x=>{const age=timestamp-Date.parse(x.at);return age>=0&&age<604800000});
 const days=new Set(last7.map(x=>x.at.slice(0,10)));
 const same=last7.filter(x=>x.groups.includes(targetGroup)).sort((x,y)=>Date.parse(y.at)-Date.parse(x.at));
 const consecutive=!!targetGroup&&same.length>=2&&same[0].intensity==="easy"&&same[1].intensity==="easy"&&
   Math.floor(Date.parse(same[0].at)/86400000)-Math.floor(Date.parse(same[1].at)/86400000)===1;
 const notes=[];
 if(consecutive)notes.push("Po dwóch dniach lekkich ćwiczeń tej samej partii rozważ dzień odpoczynku od tej partii.");
 if(days.size>=6)notes.push("W ostatnich siedmiu dniach było co najmniej sześć dni aktywności. Oceń zmęczenie i zaplanuj regenerację.");
 const hard=same.find(x=>x.intensity==="hard");
 if(hard&&timestamp-Date.parse(hard.at)<172800000)
   notes.push("Po cięższej sesji tej partii rozważ około 48 godzin regeneracji.");
 return Object.freeze({trainingDays7:days.size,sameGroupSessions7:same.length,
   consecutiveEasy:consecutive,warnings:Object.freeze(notes),recommendRecovery:notes.length>0});
}
function phase(week,feedback="normal"){
 if(!validInt(week,1,156)||!["normal","tired","stalled"].includes(feedback))
   throw Error("Niepoprawna faza lub ocena zmęczenia.");
 const deload=week%5===0||feedback!=="normal";
 return Object.freeze({week,deload,recommendedVolumeFactor:deload?0.6:1,
  mode:deload?"reduced":"normal",
  description:deload?"Okres lżejszy: propozycja około 40% mniejszej objętości, bez automatycznej zmiany historii.":"Standardowy tydzień programu."
 });
}
function durationPreview(goalSessions,cycleDays){
 if(!validInt(goalSessions,1,500)||!CYCLES.includes(cycleDays))throw Error("Niepoprawna liczba jednostek.");
 return Object.freeze({sessions:goalSessions,cycleDays,
  sessionsPerCycle:DAYS[cycleDays].length,
  nominalDays:Math.ceil(goalSessions/DAYS[cycleDays].length)*cycleDays});
}
const api=Object.freeze({DURATIONS,CYCLES,MODES,preferences,estimate,fitToTime,cyclePlan,customCyclePlan,recovery,analyzeRollingLoad,phase,durationPreview});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(typeof window!=="undefined")window.FitPlanTrainingLoad=api;
})();
