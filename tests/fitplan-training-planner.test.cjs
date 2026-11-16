// WIEDORA-CHANGE: WD-20261101-WIE-005-NATIVE-REGRESSION-10 | TASK: WIE-005 | AUTHOR: Codex / GPT-6 (pełna wersja nieustalona)
// WIEDORA-CHANGE: WD-20261031-WIE-115-PLANNING-BASE-01 | TASK: WIE-115 | AUTHOR: ChatGPT / GPT-6
'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const engine=require('../apps/fitplan/data/training-planner.js');
const {createFitPlan}=require('./fitplan-shell-harness.cjs');
const programs=[
 {id:'fbw-home',days:[{id:'a',title:'A'},{id:'b',title:'B'}]},
 {id:'calisthenics-base',days:[{id:'a',title:'A'},{id:'b',title:'B'}]},
 {id:'mobility-reset',days:[{id:'a',title:'A'},{id:'b',title:'B'}]}
];
test('WIE-115: default preview includes planned A/B workouts without marking them complete',()=>{
 const original=[{programId:'fbw-home',dayId:'a',finishedAt:'2026-10-30T18:00:00Z',sets:[]}];
 const snapshot=JSON.stringify(original);
 const r=engine.overview(programs[0],original,new Date(2026,9,31,12),4);
 assert.equal(r.nextDayId,'b');
 assert.equal(r.completed,1);
 assert.equal(r.weekdays.length,2);
 assert.equal(r.entries.length,8);
 assert.equal(r.entries[0].date,'2026-11-02');
 assert.equal(r.entries[0].dayId,'b');
 assert.equal(r.entries[1].date,'2026-11-05');
 assert.equal(r.entries[1].dayId,'a');
 assert.equal(JSON.stringify(original),snapshot);
});
test('WIE-115: each program remains independent and equipment needs are explicit',()=>{
 const r=engine.overview(programs[1],[{programId:'fbw-home',dayId:'a',finishedAt:'2026-10-30T12:00:00Z'}],new Date(2026,9,31,12));
 assert.equal(r.completed,0);
 assert.equal(r.nextDayId,'a');
 assert.equal(r.entries[1].dayId,'b');
 assert.match(r.entries[1].needs.join(' '),/drążek/);
 const mobility=engine.overview(programs[2],[],new Date(2026,9,31,12));
 assert.equal(mobility.weekdays.length,3);
 assert.equal(mobility.entries.length,12);
});
test('WIE-115: gym FBW has its own schedule and adequate rest between full-body workouts',()=>{
 const gym={id:'fbw-gym',days:[{id:'a',title:'A'},{id:'b',title:'B'}]};
 const r=engine.overview(gym,[],new Date(2026,9,31,12));
 assert.equal(r.gapHours,48);
 assert.equal(r.entries.length,8);
 assert.match(r.entries[0].needs.join(' '),/Sztanga/);
 assert.match(r.entries[1].needs.join(' '),/Hantle/);
});
test('WIE-115: invalid inputs fail and a gap is descriptive, not a forced workout block',()=>{
 assert.throws(()=>engine.overview({id:'other',days:[]},[],new Date()),/Brak konfiguracji/);
 assert.throws(()=>engine.overview(programs[0],null,new Date()),/Historia/);
 assert.throws(()=>engine.overview(programs[0],[],new Date('invalid')),/data/);
 assert.throws(()=>engine.overview(programs[0],[],new Date(),13),/data/);
 const r=engine.overview(programs[0],[{programId:'fbw-home',dayId:'b',finishedAt:new Date(2026,9,31,12).toISOString()}],new Date(2026,9,31,12));
 assert(r.restUntil);
 assert.equal(r.nextDayId,'a');
 assert.equal(r.entries[0].beforeRestInterval,false);
});
test('WIE-110: suggested workout before 48-hour rest window receives conflict flag',()=>{
 const completedAt=new Date(2026,10,1,20,0,0);
 const model=engine.overview(programs[0],[{programId:'fbw-home',dayId:'a',finishedAt:completedAt.toISOString()}],new Date(2026,10,1,21,0,0),4);
 assert.equal(model.entries[0].date,'2026-11-02');
 assert.equal(model.entries[0].dayId,'b');
 assert.equal(model.entries[0].beforeRestInterval,true);
 assert.equal(model.entries[1].beforeRestInterval,false);
 assert(model.restUntil);
});
test('WIE-115: set trend uses actual confirmed sets, no automatic weight increase',()=>{
 const exerciseId='squat';
 assert.equal(engine.trend([{sets:[{exerciseId,reps:8,weightKg:12}]}],exerciseId),null);
 assert.equal(engine.trend([{sets:[{exerciseId,reps:8,weightKg:12},{exerciseId,reps:9,weightKg:12.5}]}],exerciseId),null,
   'two sets from the same workout are not two training sessions');
 const t=engine.trend([
  {sets:[{exerciseId,reps:8,weightKg:12}]},
  {sets:[{exerciseId,reps:9,weightKg:12.5}]}
 ],exerciseId);
 assert.equal(t.deltaReps,1);
 assert.equal(t.deltaKg,0.5);
 assert.equal(t.last.weightKg,12.5);
});
test('WIE-115: program preview is visible in real FitPlan DOM',async t=>{
 const app=await createFitPlan(t);
 app.w.FitPlanApp.open('start');await app.settle();
 const doc=app.w.document;
 doc.getElementById('fpsTabPlan').click();
 assert.equal(doc.querySelectorAll('#fpsTrainingCalendar li').length,6);
 assert.match(doc.getElementById('fpsTrainingRecovery').textContent,/odstęp/);
 const program=doc.getElementById('fpsPresetProgram');
 program.value='calisthenics-base';
 program.dispatchEvent(new app.w.Event('change',{bubbles:true}));
 assert.equal(doc.querySelectorAll('#fpsTrainingCalendar li').length,6);
 assert.match(doc.getElementById('fpsTrainingCalendar').textContent,/drążek/);
 assert.deepEqual(app.errors,[]);
});
