// WIEDORA-CHANGE: WD-20261031-WIE-185-SETS-ENGINE-07 | TASK: WIE-185 | AUTHOR: ChatGPT / GPT-6
'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const sets=require('../apps/fitplan/data/training-sets.js');
const progress=require('../apps/fitplan/data/training-progress.js');
const {createTimer}=require('./fitplan-timer-harness.cjs');
const makeStore=()=>{
 const map=new Map();
 return {map,getItem:k=>map.has(k)?map.get(k):null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};
};
const session={programId:'fbw-home',dayId:'a',ids:['squat','push']};
const catalog={prepare:(programId,dayId)=>({programId,dayId,ids:['squat','push']})};
test('set engine writes real numbers and per-exercise sequence, without a fake set',()=>{
 const storage=makeStore();
 assert.equal(sets.snapshot(storage,session).length,0);
 assert.equal(sets.append(storage,session,{exerciseId:'squat',reps:8,weightKg:1.23,rpe:7.5,rir:2}).number,1);
 assert.equal(sets.append(storage,session,{exerciseId:'push',reps:10,weightKg:0,rpe:'',rir:''}).number,1);
 assert.equal(sets.append(storage,session,{exerciseId:'squat',reps:7,weightKg:0,rpe:8,rir:1}).number,2);
 assert.equal(sets.snapshot(storage,session).length,3);
 assert.equal(sets.undo(storage,session).length,2);
 assert.equal(sets.snapshot(storage,session)[1].exerciseId,'push');
});
test('set engine fails closed for invalid fields, other sessions and corrupt local data',()=>{
 const storage=makeStore();
 const ok={exerciseId:'squat',reps:8,weightKg:2.5,rpe:8,rir:2};
 for(const bad of [{...ok,reps:0},{...ok,weightKg:-1},{...ok,weightKg:1000.001},
    {...ok,rpe:12},{...ok,rir:11},{...ok,exerciseId:'other'}])
  assert.throws(()=>sets.append(storage,session,bad));
 assert.equal(sets.read(storage),null);
 sets.append(storage,session,ok);
 assert.throws(()=>sets.snapshot(storage,{...session,dayId:'b'}),/Inny trening/);
 assert.throws(()=>sets.restore(storage,session,[sets.snapshot(storage,session)[0]]),/Nie nadpisujemy/);
 const prior=storage.getItem(sets.KEY);
 storage.setItem(sets.KEY,'{');
 assert.throws(()=>sets.read(storage),/Uszkodzony/);
 assert.throws(()=>sets.append(storage,session,ok));
 assert.throws(()=>sets.clear(storage));
 assert.equal(storage.getItem(sets.KEY),'{');
 storage.setItem(sets.KEY,prior);
 sets.clear(storage);
 assert.equal(storage.getItem(sets.KEY),null);
});
test('completed history retains real sets and old v1 entries, restores after undo',()=>{
 const storage=makeStore();
 const entry=progress.record(storage,{programId:'fbw-home',dayId:'a',exerciseIds:session.ids,
    rpe:7,sets:[sets.append(storage,session,{exerciseId:'squat',reps:8,weightKg:1.23,rpe:7.5,rir:2})]},catalog,{}, {now:()=>1790000000000});
 assert.equal(entry.sets.length,1);
 sets.clear(storage);
 assert.equal(sets.last(progress.read(storage),'squat').weightKg,1.23);
 const undone=progress.undoLast(storage,'fbw-home');
 assert.equal(sets.restore(storage,session,undone.sets),1);
 assert.equal(sets.snapshot(storage,session)[0].reps,8);
 const old=progress.record(storage,{programId:'fbw-home',dayId:'a',exerciseIds:session.ids,rpe:null},catalog,{}, {now:()=>1790000000000});
 assert.equal(old.sets,undefined,'v1 without sets remains accepted');
 assert.equal(progress.read(storage).length,1);
});
test('history rejects fabricated sets without overwriting earlier results',()=>{
 const storage=makeStore();
 const before=storage.getItem(progress.KEY);
 const bad={exerciseId:'squat',number:1,reps:0,weightKg:0,rpe:null,rir:null};
 assert.throws(()=>progress.record(storage,{programId:'fbw-home',dayId:'a',exerciseIds:session.ids,rpe:null,sets:[bad]},catalog,{}),/Niepoprawne serie/);
 assert.equal(storage.getItem(progress.KEY),before);
});
test('FitPlan Start logs actual series, confirms completion once and can recover after undo',async t=>{
 const app=await createTimer(t);
 const w=app.w,doc=w.document;
 doc.getElementById('fpsTabPlan').click();
 doc.getElementById('fpsLoadPreset').click();
 doc.getElementById('fpsLaunchPlan').click();
 const choose=doc.getElementById('fpsSetExercise');
 assert.equal(choose.options.length,5);
 assert.equal(doc.getElementById('fpsCompletePreset').disabled,true);
 doc.getElementById('fpsSetReps').value='8';
 doc.getElementById('fpsSetWeight').value='12.5';
 doc.getElementById('fpsSetRpe').value='8';
 doc.getElementById('fpsSetRir').value='2';
 doc.getElementById('fpsAddSet').click();
 assert.equal(JSON.parse(w.localStorage.getItem(sets.KEY)).sets.length,1);
 assert.equal(doc.querySelectorAll('#fpsSetList li').length,1);
 app.step(2*60*60*1000);
 assert.equal(doc.getElementById('fpsCompletePreset').disabled,false);
 w.confirm=()=>true;
 doc.getElementById('fpsCompletePreset').click();
 const completed=JSON.parse(w.localStorage.getItem(progress.KEY)).entries[0];
 assert.equal(completed.sets.length,1);
 assert.equal(completed.sets[0].weightKg,12.5);
 assert.equal(w.localStorage.getItem(sets.KEY),null);
 assert.equal(doc.getElementById('fpsAddSet').disabled,true,'a saved session cannot create orphan set drafts');
 assert.equal(doc.getElementById('fpsUseLastSet').disabled,false);
 doc.getElementById('fpsUseLastSet').click();
 assert.equal(doc.getElementById('fpsSetReps').value,'8');
 assert.equal(doc.getElementById('fpsSetWeight').value,'12.5');
 assert.equal(doc.getElementById('fpsCompletePreset').disabled,true);
 doc.getElementById('fpsTabPlan').click();
 const completedDay=doc.getElementById('fpsPresetDay');
 completedDay.value='a';
 completedDay.dispatchEvent(new w.Event('change',{bubbles:true}));
 assert.match(doc.querySelector('#fpsPresetPreview .fps-guide-previous')?.textContent||'',/8 powt.*12.5 kg/,
   'preview shows confirmed previous result, not an invented set');
 doc.getElementById('fpsUndoPreset').click();
 assert.equal(JSON.parse(w.localStorage.getItem(sets.KEY)).sets.length,1);
 doc.getElementById('fpsTabTimer').click();
 assert.equal(doc.getElementById('fpsAddSet').disabled,false,'undo allows correcting the set draft');
 assert.equal(doc.getElementById('fpsCompletePreset').disabled,false);
 doc.getElementById('fpsCompletePreset').click();
 assert.equal(JSON.parse(w.localStorage.getItem(progress.KEY)).entries[0].sets.length,1);
 assert.deepEqual(app.errors,[]);
});
