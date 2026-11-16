// WIEDORA-CHANGE: WD-20261031-WIE-117-TRAINING-HISTORY-03 | TASK: WIE-117 | AUTHOR: ChatGPT / GPT-6
// Local-only pilot history. A template becomes a completed workout ONLY after
// a finished timer and an explicit user confirmation in the Start UI.
(()=>{
"use strict";
const KEY="fitplan.training.pilot-history.v1",VERSION=1,MAX_ENTRIES=500;
// WIEDORA-CHANGE: WD-20261031-WIE-185-SETS-ENGINE-07 | TASK: WIE-185 | AUTHOR: ChatGPT / GPT-6
// v1 records without sets stay readable. Set entries are optional, real user input.
function validSets(rows,ids){
 if(rows===undefined)return true;
 if(!Array.isArray(rows)||rows.length>120)return false;
 const tally=new Map();
 for(const x of rows){
  if(!x||typeof x!=="object"||!ids.includes(x.exerciseId)||
    !Number.isInteger(x.reps)||x.reps<1||x.reps>300||
    !Number.isFinite(x.weightKg)||x.weightKg<0||x.weightKg>1000||
    Math.abs(x.weightKg*100-Math.round(x.weightKg*100))>1e-6||
    !(x.rpe===null||(Number.isFinite(x.rpe)&&x.rpe>=1&&x.rpe<=10&&Number.isInteger(x.rpe*2)))||
    !(x.rir===null||(Number.isInteger(x.rir)&&x.rir>=0&&x.rir<=10)))return false;
  const n=(tally.get(x.exerciseId)||0)+1;
  if(x.number!==n||n>15)return false;
  tally.set(x.exerciseId,n);
 }
 return true;
}
function validEntry(x){
 return !!x&&typeof x==="object"&&typeof x.id==="string"&&x.id.length<=100&&
  typeof x.programId==="string"&&x.programId.length<=80&&
  typeof x.dayId==="string"&&x.dayId.length<=40&&
  typeof x.finishedAt==="string"&&!Number.isNaN(Date.parse(x.finishedAt))&&
  Array.isArray(x.exerciseIds)&&x.exerciseIds.length>=1&&x.exerciseIds.length<=20&&
  x.exerciseIds.every(id=>typeof id==="string"&&id.length>=1&&id.length<=160)&&
  (x.rpe===null||(Number.isInteger(x.rpe)&&x.rpe>=1&&x.rpe<=10))&&
  validSets(x.sets,x.exerciseIds);
}
function read(storage){
 if(!storage||typeof storage.getItem!=="function")throw Error("Pamięć urządzenia jest niedostępna.");
 let raw;
 try{raw=storage.getItem(KEY)}catch{throw Error("Nie można odczytać historii z tego urządzenia.");}
 if(raw===null)return [];
 if(raw.length>750000)throw Error("Historia jest zbyt duża. Wymaga bezpiecznego eksportu.");
 let state;
 try{state=JSON.parse(raw)}catch{throw Error("Historia ma uszkodzony format. Nie nadpisujemy danych.");}
 if(!state||state.version!==VERSION||!Array.isArray(state.entries)||
    state.entries.length>MAX_ENTRIES||!state.entries.every(validEntry))
   throw Error("Nieznany format historii. Nie nadpisujemy danych.");
 return state.entries;
}
// Count only confirmed complete A/B sequences, never infer a cycle from
// elapsed timer seconds or the number of loosely ordered sessions.
function completedCycles(programId,entries,programs){
 const program=programs?.find(p=>p.id===programId);
 if(!program?.days?.length)throw Error("Nieznany program.");
 let position=0,cycles=0;
 for(const entry of entries){
  if(entry.programId!==programId)continue;
  if(entry.dayId!==program.days[position].id)continue;
  position++;
  if(position===program.days.length){cycles++;position=0;}
 }
 return cycles;
}
function nextDay(programId,entries,programs){
 const program=programs?.find(p=>p.id===programId);
 if(!program||!program.days?.length)throw Error("Nieznany program.");
 const latest=[...entries].reverse().find(e=>e.programId===programId&&program.days.some(d=>d.id===e.dayId));
 if(!latest)return program.days[0].id;
 const index=program.days.findIndex(d=>d.id===latest.dayId);
 return program.days[(index+1)%program.days.length].id;
}
function record(storage,payload,catalog,registry,clock=Date){
 if(!catalog||typeof catalog.prepare!=="function")throw Error("Brak programu treningowego.");
 const session=catalog.prepare(payload?.programId,payload?.dayId,registry);
 // Allow only catalogue-approved, same-pattern swaps of one or more movements.
 // The exact performed IDs, not the original template IDs, belong in history.
 const ids=payload?.exerciseIds;
 const identical=Array.isArray(ids)&&ids.length===session.ids.length&&
   ids.every((id,index)=>id===session.ids[index]);
 const approved=!identical&&Array.isArray(ids)&&typeof catalog.compatible==="function"&&
   catalog.compatible(session.programId,session.dayId,ids,registry)===true;
 if(!identical&&!approved)
   throw Error("Zestaw nie odpowiada wybranemu programowi ani zatwierdzonym zamiennikom. Nie zapisano treningu.");
 const rpe=payload.rpe===""||payload.rpe===null||payload.rpe===undefined?null:Number(payload.rpe);
 if(rpe!==null&&(!Number.isInteger(rpe)||rpe<1||rpe>10))
   throw Error("RPE musi być liczbą całkowitą od 1 do 10 albo pozostać puste.");
 const sets=payload?.sets===undefined?[]:payload.sets;
 if(!validSets(sets,ids))throw Error("Niepoprawne serie treningowe. Zapis anulowany.");
 const entries=read(storage);
 if(entries.length>=MAX_ENTRIES)throw Error("Historia jest pełna. Nie usuwamy starszych treningów automatycznie.");
 const time=clock.now(),date=new Date(time);
 if(!Number.isFinite(time)||Number.isNaN(date.getTime()))throw Error("Nieprawidłowy czas urządzenia.");
 // WIEDORA-CHANGE: WD-20261031-WIE-117-HISTORY-INTEGRITY-08 | TASK: WIE-117 | AUTHOR: ChatGPT / GPT-6
 // Undo may remove an earlier program entry, so array length alone is not a unique suffix.
 let nextIndex=entries.length;
 while(entries.some(e=>e.id==="pilot-"+time+"-"+nextIndex))nextIndex++;
 const entry={
  id:"pilot-"+time+"-"+nextIndex,
  programId:session.programId,dayId:session.dayId,
  finishedAt:date.toISOString(),exerciseIds:[...ids],rpe,
  ...(sets.length?{sets:sets.map(row=>({...row}))}:{})
 };
 const serialized=JSON.stringify({version:VERSION,entries:[...entries,entry]});
 if(serialized.length>750000)throw Error("Limit historii urządzenia został osiągnięty. Dane pozostały bez zmian; wyeksportuj je przed dalszym zapisem.");
 try{storage.setItem(KEY,serialized);}
 catch{throw Error("Nie zapisano treningu. Sprawdź dostępność pamięci urządzenia.");}
 return entry;
}
// WIEDORA-CHANGE: WD-20261031-WIE-117-TRAINING-HISTORY-03 | TASK: WIE-117 | AUTHOR: ChatGPT / GPT-6
function undoLast(storage,programId){
 const entries=read(storage);
 const index=entries.findLastIndex(x=>x.programId===programId);
 if(index<0)throw Error("Brak sesji tego programu do cofnięcia.");
 const next=entries.filter((_,i)=>i!==index);
 try{storage.setItem(KEY,JSON.stringify({version:VERSION,entries:next}));}
 catch{throw Error("Nie można zapisać cofnięcia. Dotychczasowe dane pozostają.");
 }
 return entries[index];
}
const api=Object.freeze({KEY,VERSION,MAX_ENTRIES,read,nextDay,completedCycles,record,undoLast});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(typeof window!=="undefined")window.FitPlanTrainingProgress=api;
})();
