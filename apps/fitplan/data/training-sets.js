// WIEDORA-CHANGE: WD-20261031-WIE-185-SETS-ENGINE-07 | TASK: WIE-185 | AUTHOR: ChatGPT / GPT-6
// Local pilot set drafts. No fabricated repetitions, weights or automatic coaching.
(()=>{
"use strict";
const KEY="fitplan.training.pilot-sets.v1",VERSION=1,LIMIT=120;
const int=(x,a,b)=>Number.isInteger(x)&&x>=a&&x<=b;
const weight=x=>typeof x==="number"&&Number.isFinite(x)&&x>=0&&x<=1000&&Math.abs(x*100-Math.round(x*100))<1e-6;
const effort=x=>x===null||(typeof x==="number"&&Number.isFinite(x)&&x>=1&&x<=10&&int(x*2,2,20));
const reserve=x=>x===null||int(x,0,10);
function validSet(row,ids){
 return !!row&&typeof row==="object"&&ids.includes(row.exerciseId)&&
  int(row.number,1,15)&&int(row.reps,1,300)&&weight(row.weightKg)&&
  effort(row.rpe)&&reserve(row.rir);
}
function validDraft(raw){
 if(!raw||raw.version!==VERSION||typeof raw.programId!=="string"||
    typeof raw.dayId!=="string"||!Array.isArray(raw.exerciseIds)||
    !raw.exerciseIds.length||raw.exerciseIds.length>20||
    new Set(raw.exerciseIds).size!==raw.exerciseIds.length||
    raw.exerciseIds.some(id=>typeof id!=="string"||!id||id.length>160)||
    !Array.isArray(raw.sets)||raw.sets.length>LIMIT)return false;
 const numbers=new Map();
 for(const row of raw.sets){
  if(!validSet(row,raw.exerciseIds))return false;
  const n=(numbers.get(row.exerciseId)||0)+1;
  if(row.number!==n)return false;
  numbers.set(row.exerciseId,n);
 }
 return true;
}
function read(storage){
 let text;
 try{text=storage.getItem(KEY)}catch{throw Error("Nie można odczytać szkicu serii.");}
 if(text===null)return null;
 if(text.length>85000)throw Error("Szkic serii przekracza limit. Nie został nadpisany.");
 let draft;
 try{draft=JSON.parse(text)}catch{throw Error("Uszkodzony szkic serii. Nie nadpisujemy danych.");}
 if(!validDraft(draft))throw Error("Nieznany format szkicu serii. Nie nadpisujemy danych.");
 return draft;
}
function match(draft,session){
 return !!session&&draft.programId===session.programId&&draft.dayId===session.dayId&&
 Array.isArray(session.ids)&&session.ids.length===draft.exerciseIds.length&&
 session.ids.every((id,i)=>id===draft.exerciseIds[i]);
}
function snapshot(storage,session){
 const draft=read(storage);
 if(!draft)return [];
 if(!match(draft,session))throw Error("Inny trening ma zapisane serie. Najpierw dokończ go albo wyczyść szkic.");
 return draft.sets.map(x=>({...x}));
}
function append(storage,session,input){
 if(!session||!Array.isArray(session.ids)||!session.ids.length)throw Error("Najpierw wybierz gotowy trening.");
 const sets=snapshot(storage,session);
 const id=String(input?.exerciseId||"");
 if(!session.ids.includes(id))throw Error("Ćwiczenie nie należy do tej jednostki.");
 if(sets.length>=LIMIT)throw Error("Osiągnięto limit 120 serii bez usuwania wcześniejszych danych.");
 const row={exerciseId:id,number:sets.filter(s=>s.exerciseId===id).length+1,
  reps:Number(input.reps),weightKg:Number(input.weightKg),
  rpe:input.rpe===""||input.rpe==null?null:Number(input.rpe),
  rir:input.rir===""||input.rir==null?null:Number(input.rir)};
 if(!validSet(row,session.ids))throw Error("Niepoprawna seria: 1–300 powtórzeń, 0–1000 kg, RPE 1–10 (co 0,5), RIR 0–10.");
 const next={version:VERSION,programId:session.programId,dayId:session.dayId,
 exerciseIds:[...session.ids],sets:[...sets,row]};
 try{storage.setItem(KEY,JSON.stringify(next))}catch{throw Error("Nie udało się zapisać serii w pamięci urządzenia.");}
 return row;
}
function undo(storage,session){
 const sets=snapshot(storage,session);
 if(!sets.length)throw Error("Nie ma serii do cofnięcia.");
 sets.pop();
 const next={version:VERSION,programId:session.programId,dayId:session.dayId,
 exerciseIds:[...session.ids],sets};
 try{storage.setItem(KEY,JSON.stringify(next))}catch{throw Error("Nie udało się cofnąć serii.");}
 return sets;
}
// WIEDORA-CHANGE: WD-20261031-WIE-185-SETS-ENGINE-07 | TASK: WIE-185 | AUTHOR: ChatGPT / GPT-6
function restore(storage,session,rows){
 const previous=read(storage);
 if(previous?.sets?.length)throw Error("Inny szkic ma serie. Nie nadpisujemy go podczas przywracania.");
 const candidate={version:VERSION,programId:session?.programId,dayId:session?.dayId,
 exerciseIds:[...(session?.ids||[])],sets:Array.isArray(rows)?rows.map(x=>({...x})):null};
 if(!validDraft(candidate))throw Error("Nie można przywrócić niepoprawnych serii.");
 try{storage.setItem(KEY,JSON.stringify(candidate))}
 catch{throw Error("Nie udało się przywrócić szkicu serii.");}
 return candidate.sets.length;
}
function clear(storage){
 read(storage); // do not mask corrupted data; user can export/recover first
 try{storage.removeItem(KEY)}catch{throw Error("Nie można usunąć szkicu serii.");}
}
function last(history,exerciseId){
 if(!Array.isArray(history))return null;
 for(let i=history.length-1;i>=0;i--){
  const rows=history[i]?.sets;
  if(!Array.isArray(rows))continue;
  for(let j=rows.length-1;j>=0;j--)if(rows[j].exerciseId===exerciseId)return {...rows[j]};
 }
 return null;
}
const api=Object.freeze({KEY,VERSION,LIMIT,validSet,read,snapshot,append,undo,restore,clear,last});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(typeof window!=="undefined")window.FitPlanTrainingSets=api;
})();
