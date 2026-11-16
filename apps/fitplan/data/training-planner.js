// WIEDORA-CHANGE: WD-20261031-WIE-115-PLANNING-BASE-01 | TASK: WIE-115 | AUTHOR: ChatGPT / GPT-6
// Read-only 4-week scheduling preview; NOT a clinical training prescription.
// Uses confirmed local history only. Never automatically logs, increases loads,
// modifies templates, or syncs user data between accounts.
(()=>{
"use strict";
const PROFILES=Object.freeze({
 "fbw-home":Object.freeze({weekdays:[1,4],gapHours:48,gear:Object.freeze({a:["Stabilny punkt do wiosłowania"],b:["Stabilny punkt do wiosłowania"]})}),
 "fbw-gym":Object.freeze({weekdays:[1,4],gapHours:48,gear:Object.freeze({a:["Sztanga","Ławka","Sprzęt do wiosłowania"],b:["Sztanga","Hantle","Drążek i guma"]})}),
 "calisthenics-base":Object.freeze({weekdays:[2,5],gapHours:48,gear:Object.freeze({a:["Stabilna podpora"],b:["Bezpiecznie zamocowany drążek","Guma treningowa","Asekuracja"]})}),
 "mobility-reset":Object.freeze({weekdays:[1,3,5],gapHours:12,gear:Object.freeze({a:["Mata"],b:["Mata","Lekka guma"]})})
});
function dayKey(date){
 const pad=n=>String(n).padStart(2,"0");
 return date.getFullYear()+"-"+pad(date.getMonth()+1)+"-"+pad(date.getDate());
}
function overview(program,entries,now=new Date(),weeks=4){
 if(!program||!PROFILES[program.id]||!Array.isArray(program.days)||!program.days.length)
   throw Error("Brak konfiguracji harmonogramu dla tego programu.");
 if(!Array.isArray(entries))throw Error("Historia ma niepoprawny format.");
 if(!(now instanceof Date)||Number.isNaN(now.getTime())||
    !Number.isInteger(weeks)||weeks<1||weeks>12)throw Error("Niepoprawna data lub liczba tygodni.");
 const profile=PROFILES[program.id];
 const relevant=entries.filter(x=>x?.programId===program.id&&
    program.days.some(d=>d.id===x.dayId)&&
    typeof x.finishedAt==="string"&&Number.isFinite(Date.parse(x.finishedAt)));
 const latest=relevant.length?relevant.reduce((a,b)=>Date.parse(a.finishedAt)>Date.parse(b.finishedAt)?a:b):null;
 // Per confirmed session; scheduled (not performed) slots never advance actual progress.
 const lastIndex=latest?program.days.findIndex(d=>d.id===latest.dayId):-1;
 const nextIndex=(lastIndex+1)%program.days.length;
 const lastTimestamp=latest?Date.parse(latest.finishedAt):null;
 const restUntil=lastTimestamp===null?null:new Date(lastTimestamp+profile.gapHours*3600000);
 const start=new Date(now.getFullYear(),now.getMonth(),now.getDate(),12,0,0,0);
 const preview=[];
 for(let d=0;d<7*weeks;d++){
   const date=new Date(start);
   date.setDate(start.getDate()+d);
   if(!profile.weekdays.includes(date.getDay()))continue;
   const day=program.days[(nextIndex+preview.length)%program.days.length];
   preview.push(Object.freeze({date:dayKey(date),dayId:day.id,
     title:day.title,needs:profile.gear[day.id]||[],
     beforeRestInterval:restUntil!==null&&date.getTime()<restUntil.getTime()}));
 }
 return Object.freeze({
   programId:program.id,weekdays:[...profile.weekdays],gapHours:profile.gapHours,
   weeks,completed:relevant.length,
   nextDayId:program.days[nextIndex].id,
   restUntil:restUntil?.toISOString()||null,
   entries:preview
 });
}
function trend(entries,exerciseId){
 if(!Array.isArray(entries)||typeof exerciseId!=="string")return null;
 const matches=[];
 // Compare distinct completed workouts, not two sets within the same session.
 for(const training of entries){
   const rows=Array.isArray(training?.sets)?training.sets:[];
   const set=[...rows].reverse().find(x=>x?.exerciseId===exerciseId&&
     Number.isFinite(x.weightKg)&&Number.isInteger(x.reps));
   if(set)matches.push(set);
 }
 if(matches.length<2)return null;
 const last=matches.at(-1),previous=matches.at(-2);
 return {exerciseId,previous:{reps:previous.reps,weightKg:previous.weightKg},
   last:{reps:last.reps,weightKg:last.weightKg},
   deltaReps:last.reps-previous.reps,deltaKg:Math.round((last.weightKg-previous.weightKg)*100)/100};
}
const api=Object.freeze({PROFILES,overview,trend});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(typeof window!=="undefined")window.FitPlanTrainingPlanner=api;
})();
