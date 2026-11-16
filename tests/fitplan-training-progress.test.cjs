// WIEDORA-CHANGE: WD-20261031-WIE-117-TRAINING-HISTORY-03 | TASK: WIE-117 | AUTHOR: ChatGPT / GPT-6
'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const history=require('../apps/fitplan/data/training-progress.js');
const {createTimer}=require('./fitplan-timer-harness.cjs');

const catalog={programs:[{id:'a',days:[{id:'x'},{id:'y'}]},{id:'b',days:[{id:'q'},{id:'r'}]}],
  prepare(programId,dayId){
    if(!this.programs.some(p=>p.id===programId&&p.days.some(d=>d.id===dayId)))throw Error('missing');
    return {programId,dayId,ids:['exercise-one','exercise-two']};
  }};
const memory=()=>{
 const db=new Map();
 return {db,getItem(key){return db.has(key)?db.get(key):null;},setItem(key,value){db.set(key,value);}};
};
const save=(storage,programId='a',dayId='x',rpe=null)=>
 history.record(storage,{programId,dayId,exerciseIds:['exercise-one','exercise-two'],rpe},catalog,{}, {now:()=>1793470000000+history.read(storage).length*1000});

test('WIE-117: blank diary, confirmed A then B, independent program and optional RPE',()=>{
 const store=memory();
 assert.deepEqual(history.read(store),[]);
 assert.equal(history.nextDay('a',[],catalog.programs),'x');
 let a=save(store,'a','x',7);
 assert.equal(a.rpe,7);
 assert.equal(history.nextDay('a',history.read(store),catalog.programs),'y');
 assert.equal(history.nextDay('b',history.read(store),catalog.programs),'q');
 save(store,'b','q');
 assert.equal(history.nextDay('a',history.read(store),catalog.programs),'y');
 save(store,'a','y');
 assert.equal(history.nextDay('a',history.read(store),catalog.programs),'x');
 assert.equal(history.read(store).length,3);
 assert.equal(history.read(store)[0].exerciseIds[0],'exercise-one');
});
test('WIE-117: no fabricated exercise results and invalid payloads are refused',()=>{
 const store=memory();
 for(const x of [
  {programId:'a',dayId:'x',exerciseIds:['exercise-one'],rpe:7},
  {programId:'a',dayId:'x',exerciseIds:['exercise-two','exercise-one'],rpe:7},
  {programId:'a',dayId:'x',exerciseIds:['exercise-one','exercise-two'],rpe:11},
  {programId:'a',dayId:'x',exerciseIds:['exercise-one','exercise-two'],rpe:7.5},
  {programId:'missing',dayId:'x',exerciseIds:['exercise-one','exercise-two'],rpe:6}
 ])assert.throws(()=>history.record(store,x,catalog,{}));
 assert.deepEqual(history.read(store),[]);
});
test('WIE-110: approved same-pattern replacements preserve exact completed IDs and sets',()=>{
 const store=memory();
 const approved={...catalog,compatible(programId,dayId,ids){
   return programId==='a'&&dayId==='x'&&ids.join(',')==='exercise-alt,exercise-two';
 }};
 const row={exerciseId:'exercise-alt',number:1,reps:7,weightKg:12.5,rpe:7.5,rir:2};
 const entry=history.record(store,{
   programId:'a',dayId:'x',exerciseIds:['exercise-alt','exercise-two'],rpe:7,sets:[row]
 },approved,{}, {now:()=>1793470001234});
 assert.equal(entry.exerciseIds[0],'exercise-alt');
 assert.deepEqual(entry.sets[0],row);
 assert.deepEqual(history.read(store)[0].sets[0],row);
 const before=store.getItem(history.KEY);
 assert.throws(()=>history.record(store,{
   programId:'a',dayId:'x',exerciseIds:['forged','exercise-two'],rpe:null
 },approved,{}),/nie odpowiada/);
 assert.throws(()=>history.record(store,{
   programId:'a',dayId:'x',exerciseIds:['exercise-alt','exercise-two'],rpe:null,
   sets:[{...row,exerciseId:'exercise-one'}]
 },approved,{}),/Niepoprawne serie/);
 assert.equal(store.getItem(history.KEY),before,'invalid entries must not mutate confirmed history');
});
test('WIE-110: Start saves a real, swapped workout as the original A/B program',async t=>{
 const app=await createTimer(t),w=app.w,doc=w.document;
 doc.getElementById('fpsTabPlan').click();
 doc.getElementById('fpsLoadPreset').click();
 const oldIds=JSON.parse(w.localStorage.getItem('fitplan.start.exercises.v1'));
 const swap=doc.querySelector('#fpsPlanList [data-fps-action="swap"]');
 assert(swap);swap.click();
 const choice=doc.querySelector('#fpsPlanList .fps-swap-choice');
 assert(choice?.value);const replacement=choice.value;
 doc.querySelector('#fpsPlanList [data-fps-action="apply-swap"]').click();
 const changed=JSON.parse(w.localStorage.getItem('fitplan.start.exercises.v1'));
 assert.equal(changed[0],replacement);
 assert.deepEqual(changed.slice(1),oldIds.slice(1));
 doc.getElementById('fpsLaunchPlan').click();
 assert.equal(doc.getElementById('fpsSetExercise').value,replacement);
 doc.getElementById('fpsSetReps').value='9';
 doc.getElementById('fpsSetWeight').value='0';
 doc.getElementById('fpsAddSet').click();
 app.step(2*60*60*1000);
 assert.equal(doc.getElementById('fpsCompletePreset').disabled,false);
 w.confirm=()=>true;doc.getElementById('fpsCompletePreset').click();
 const rows=history.read(w.localStorage);
 assert.equal(rows.length,1);
 assert.equal(rows[0].programId,'fbw-home');
 assert.equal(rows[0].dayId,'a');
 assert.equal(rows[0].exerciseIds[0],replacement);
 assert.equal(rows[0].sets[0].exerciseId,replacement);
 assert.equal(rows[0].sets[0].reps,9);
 assert.equal(doc.getElementById('fpsCompletePreset').disabled,true);
 assert.deepEqual(app.errors,[]);
});
test('WIE-117: corrupted, unsupported and unreadable histories fail closed',()=>{
 const store=memory();
 for(const raw of ['{',JSON.stringify({version:2,entries:[]}),JSON.stringify({version:1,entries:[{fake:true}]})]){
  store.setItem(history.KEY,raw);
  assert.throws(()=>history.read(store));
  assert.throws(()=>save(store));
  assert.equal(store.getItem(history.KEY),raw,'never overwrite damaged history');
 }
});
test('WIE-117: quota/storage failure does not report a completed session',()=>{
 const store=memory();
 store.setItem=()=>{throw Error('quota');};
 assert.throws(()=>save(store),/Nie zapisano/);
 assert.deepEqual(history.read(store),[]);
});
test('WIE-117: Start only enables completion after timer ends; repeated save is blocked',async t=>{
 const app=await createTimer(t);
 const w=app.w,doc=w.document;
 doc.getElementById('fpsTabPlan').click();
 assert.equal(doc.getElementById('fpsCompletePreset').disabled,true);
 assert.equal(doc.getElementById('fpsPresetProgram').options.length,4);
 assert.equal(doc.querySelectorAll('#fpsPresetPreview li').length,5);
 doc.getElementById('fpsLoadPreset').click();
 assert.equal(JSON.parse(w.localStorage.getItem('fitplan.start.exercises.v1')).length,5);
 doc.getElementById('fpsLaunchPlan').click();
 assert.equal(doc.getElementById('fpsCompletePreset').disabled,true);
 app.step(2*60*60*1000);
 assert.equal(doc.getElementById('fpsPhase').textContent,'KONIEC');
 assert.equal(doc.getElementById('fpsCompletePreset').disabled,false);
 w.confirm=()=>true;
 doc.getElementById('fpsPilotRpe').value='7';
 doc.getElementById('fpsCompletePreset').click();
 const rows=JSON.parse(w.localStorage.getItem(history.KEY)).entries;
 assert.equal(rows.length,1);
 assert.equal(rows[0].programId,'fbw-home');
 assert.equal(rows[0].dayId,'a');
 assert.equal(rows[0].rpe,7);
 assert.equal(doc.getElementById('fpsCompletePreset').disabled,true);
 doc.getElementById('fpsCompletePreset').click();
 assert.equal(JSON.parse(w.localStorage.getItem(history.KEY)).entries.length,1);
 doc.getElementById('fpsTabPlan').click();
 assert.equal(doc.getElementById('fpsPresetDay').value,'b','next A/B is shown');
 assert.match(doc.getElementById('fpsPresetHistory').textContent,/Wykonano: 1/);
 assert.equal(doc.getElementById('fpsUndoPreset').disabled,false);
 w.confirm=()=>false;
 doc.getElementById('fpsUndoPreset').click();
 assert.equal(JSON.parse(w.localStorage.getItem(history.KEY)).entries.length,1,'cancel leaves history');
 w.confirm=()=>true;
 doc.getElementById('fpsUndoPreset').click();
 assert.equal(JSON.parse(w.localStorage.getItem(history.KEY)).entries.length,0);
 assert.equal(doc.getElementById('fpsPresetDay').value,'a');
 doc.getElementById('fpsTabTimer').click();
 assert.equal(doc.getElementById('fpsCompletePreset').disabled,false,'undo can be corrected on the same finished timer');
 assert.deepEqual(app.errors,[]);
});
test('WIE-117: invalid storage does not create a fake success on timer completion',async t=>{
 const app=await createTimer(t);
 const w=app.w,doc=w.document;
 doc.getElementById('fpsTabPlan').click();
 doc.getElementById('fpsLoadPreset').click();
 doc.getElementById('fpsLaunchPlan').click();
 app.step(2*60*60*1000);
 w.confirm=()=>true;
 w.localStorage.setItem(history.KEY,'{');
 doc.getElementById('fpsCompletePreset').click();
 assert.equal(w.localStorage.getItem(history.KEY),'{');
 assert.match(doc.getElementById('fpsCompleteFeedback').textContent,/uszkodzony format/);
 assert.equal(doc.getElementById('fpsCompletePreset').disabled,false);
 assert.deepEqual(app.errors,[]);
});

test('WIE-117: undo last program session retains unrelated programs and refuses empty history',()=>{
 const store=memory();
 save(store,'a','x');
 save(store,'b','q');
 save(store,'a','y');
 assert.equal(history.nextDay('a',history.read(store),catalog.programs),'x');
 const undone=history.undoLast(store,'a');
 assert.equal(undone.dayId,'y');
 assert.equal(history.read(store).length,2);
 assert.equal(history.nextDay('a',history.read(store),catalog.programs),'y');
 assert.equal(history.nextDay('b',history.read(store),catalog.programs),'r');
 history.undoLast(store,'a');
 assert.throws(()=>history.undoLast(store,'a'),/Brak sesji/);
 assert.equal(history.read(store).length,1);
});
test('WIE-117: undo refuses corrupt storage and never claims successful removal',()=>{
 const store=memory();store.setItem(history.KEY,'{');
 assert.throws(()=>history.undoLast(store,'a'),/uszkodzony format/);
 assert.equal(store.getItem(history.KEY),'{');
});

// WIEDORA-CHANGE: WD-20261031-WIE-117-HISTORY-INTEGRITY-08 | TASK: WIE-117 | AUTHOR: ChatGPT / GPT-6
test('WIE-117: fixed-clock IDs remain unique after undo of earlier program',()=>{
 const store=memory(),time={now:()=>1793000000000};
 const first=history.record(store,{programId:'a',dayId:'x',exerciseIds:['exercise-one','exercise-two'],rpe:null},catalog,{},time);
 const second=history.record(store,{programId:'b',dayId:'q',exerciseIds:['exercise-one','exercise-two'],rpe:null},catalog,{},time);
 history.undoLast(store,'a');
 const third=history.record(store,{programId:'a',dayId:'x',exerciseIds:['exercise-one','exercise-two'],rpe:null},catalog,{},time);
 assert.notEqual(first.id,second.id);
 assert.notEqual(second.id,third.id);
 assert.equal(new Set(history.read(store).map(x=>x.id)).size,2);
});
test('WIE-117: only real A/B order counts as a completed cycle',()=>{
 const p=catalog.programs;
 const entries=[{programId:'a',dayId:'y'},{programId:'b',dayId:'q'},{programId:'a',dayId:'x'},
 {programId:'a',dayId:'x'},{programId:'a',dayId:'y'},{programId:'b',dayId:'r'},
 {programId:'a',dayId:'x'},{programId:'a',dayId:'y'}];
 assert.equal(history.completedCycles('a',entries,p),2);
 assert.equal(history.completedCycles('b',entries,p),1);
});
test('WIE-117: stop before a local history write exceeds the read safety limit',()=>{
 const store=memory();
 const entry={id:'old',programId:'a',dayId:'x',exerciseIds:['exercise-one','exercise-two'],rpe:null,finishedAt:'2026-10-31T12:00:00.000Z',notes:''};
 const base=JSON.stringify({version:1,entries:[entry]});
 entry.notes='a'.repeat(749910-base.length);
 const near=JSON.stringify({version:1,entries:[entry]});
 assert(near.length<750000 && near.length>749800);
 store.setItem(history.KEY,near);
 assert.throws(()=>save(store),/Limit historii urządzenia/);
 assert.equal(store.getItem(history.KEY),near);
});
