// WIEDORA-CHANGE: WD-20261031-WIE-110-PUSHUP100-01 | TASK: WIE-110/WIE-115 | AUTHOR: ChatGPT / GPT-6
'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const engine=require('../apps/fitplan/data/pushup-100.js');
const {createFitPlan}=require('./fitplan-shell-harness.cjs');
const makeStorage=()=>{const data=new Map();return{data,getItem:key=>data.has(key)?data.get(key):null,setItem:(key,value)=>data.set(key,value)};};
const clock=class extends Date {constructor(){super('2026-10-31T12:00:00.000Z')}};
test('three assessed levels are deterministic and accept a higher verified post-100 goal',()=>{
 assert.equal(engine.tier(0).id,'start');assert.equal(engine.tier(10).id,'start');
 assert.equal(engine.tier(11).id,'progress');assert.equal(engine.tier(30).id,'progress');
 assert.equal(engine.tier(31).id,'endurance');assert.equal(engine.tier(99).id,'endurance');
 assert.equal(engine.tier(100).id,'endurance');assert.equal(engine.session(100,1,1).achieved,true);
 for(const max of [-1,1001,NaN,3.4,null,'12'])assert.throws(()=>engine.tier(max));
});
test('24 plan sessions have 5 finite targets, progressive moderate volume, rest and assisted zero baseline',()=>{
 for(const max of [0,1,5,10,11,30,31,65,99]){
  const firstByDay=new Map();
  for(let week=1;week<=8;week++)for(let day=1;day<=3;day++){
   const plan=engine.session(max,week,day);
   if(!firstByDay.has(day))firstByDay.set(day,plan.total);
   assert.equal(plan.sets.length,5);
   assert(plan.sets.every(x=>Number.isInteger(x)&&x>=1&&x<=99));
   assert.equal(plan.total,plan.sets.reduce((a,b)=>a+b,0));
   assert.equal(plan.restSeconds,day===3?120:90);
   assert.equal(plan.recheck,day===3&&week%2===0);
   assert(week%5===0 || plan.total>=firstByDay.get(day),'except planned lighter weeks for same day type');
   assert.equal(plan.variant,max===0?'assisted':'standard');
  }
 }
 for(const [week,day] of [[0,1],[41,1],[1,0],[1,4]])assert.throws(()=>engine.session(8,week,day));
});
test('real completed sets advance one session; short sets preserve position, do not fake progress',()=>{
 const s=makeStorage();
 const started=engine.begin(s,7,clock);
 assert.equal(started.week,1);assert.equal(started.day,1);
 const targets=engine.session(7,1,1).sets;
 const incomplete=engine.record(s,[0,0,0,0,0],clock);
 assert.equal(incomplete.passed,false);
 assert.equal(engine.read(s).day,1);
 const completed=engine.record(s,[...targets],clock);
 assert.equal(completed.passed,true);
 assert.equal(engine.read(s).day,2);
 assert.equal(engine.summary(engine.read(s)).completed,1);
 assert.equal(engine.summary(engine.read(s)).volume,targets.reduce((a,b)=>a+b,0));
});
test('new test changes only future targets and never erases saved history',()=>{
 const s=makeStorage();engine.begin(s,9,clock);
 engine.record(s,engine.session(9,1,1).sets,clock);
 const before=engine.read(s).attempts;
 engine.retest(s,21,clock);
 const current=engine.read(s);
 assert.equal(engine.tier(current.max).id,'progress');
 assert.deepEqual(current.attempts,before);
 assert.equal(current.week,1);assert.equal(current.day,2);
 assert.equal(current.tests.length,2);
 assert.throws(()=>engine.begin(s,3,clock),/już istnieje/);
});
test('corrupt, quota and invalid actual values fail closed',()=>{
 const s=makeStorage();
 s.setItem(engine.KEY,'{');
 assert.throws(()=>engine.read(s),/Uszkodzony/);
 assert.throws(()=>engine.begin(s,8,clock));
 assert.equal(s.getItem(engine.KEY),'{');
 const t=makeStorage();engine.begin(t,12,clock);
 const previous=t.getItem(engine.KEY);
 for(const bad of [[1,2,3],[-1,2,3,4,5],[1,2,3,4,500],[1,2,3,4,NaN]])
  assert.throws(()=>engine.record(t,bad,clock));
 assert.equal(t.getItem(engine.KEY),previous);
 t.setItem=()=>{throw Error('quota');};
 assert.throws(()=>engine.record(t,[1,1,1,1,1],clock),/Nie udało się zapisać/);
});
test('100 completed in a verified max test marks goal, while 8-week cycle is not false 100',()=>{
 const s=makeStorage();engine.begin(s,40,clock);
 for(let week=1;week<=8;week++)for(let day=1;day<=3;day++)
  assert.equal(engine.record(s,engine.session(40,week,day).sets,clock).passed,true);
 const done=engine.read(s);
 assert.equal(done.finishedCycle,true);
 assert.equal(done.max,40);
 assert.throws(()=>engine.record(s,[1,1,1,1,1],clock),/Blok zakończony/);
 engine.retest(s,60,clock);
 assert.equal(engine.read(s).week,8,'retest does not silently restart an unfinished goal');
 assert.equal(engine.read(s).finishedCycle,true);
 engine.extend(s,clock);
 assert.equal(engine.read(s).week,9);
 assert.equal(engine.read(s).blockEndWeek,12);
 engine.retest(s,100,clock);
 assert.equal(engine.read(s).finishedCycle,true);
 assert.equal(engine.summary(engine.read(s)).percent,100);
});
test('DOM: 100-pompek existing category opens three-tier assessment and real session recording',async t=>{
 const app=await createFitPlan(t);
 const w=app.w;
 w.FitPlanApp.open('plan-treningowy');await app.settle();
 const doc=w.document;
 doc.querySelector('[data-fpk-plan="100-pompek"]').click();
 doc.querySelector('[data-fpk-kb-goal="pushup-100"]').click();
 const panel=doc.getElementById('fpkPushup100');
 assert.equal(panel.hidden,false);
 assert.equal(doc.querySelectorAll('.fpk-pu-level-grid > div').length,3);
 assert.ok(doc.getElementById('fpkPuMotion'),'existing Push-Up animation has a link');
 assert.equal(typeof w.FitPlanExerciseDetails.open,'function');
 const input=doc.getElementById('fpkPuTest');input.value='9';
 doc.getElementById('fpkPuTestForm').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
 assert.equal(w.FitPlanPushup100.read(w.localStorage).max,9);
 assert.match(doc.getElementById('fpkPuLevel').textContent,/Początek/);
 assert.equal(doc.querySelectorAll('#fpkPuSetList input').length,5);
 assert.equal(doc.querySelectorAll('#fpkPuRoadmap tr').length,8,'complete 8-week overview');
 assert.equal(doc.querySelectorAll('#fpkPuRoadmap td').length,24,'all three sessions per week');
 assert.equal(doc.getElementById('fpkPuRing').style.getPropertyValue('--pu-percent'),'9%');
 const targets=engine.session(9,1,1).sets;
 [...doc.querySelectorAll('#fpkPuSetList input')].forEach((el,i)=>el.value=String(targets[i]));
 w.confirm=()=>true;
 doc.getElementById('fpkPuSetsForm').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
 const state=w.FitPlanPushup100.read(w.localStorage);
 assert.equal(state.day,2);assert.equal(state.attempts.length,1);
 input.value='20';
 doc.getElementById('fpkPuTestForm').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
 assert.equal(w.FitPlanPushup100.read(w.localStorage).max,20);
 assert.match(doc.getElementById('fpkPuLevel').textContent,/Rozwój/);
 assert.equal(doc.querySelectorAll('#fpkPuSetList input').length,5);
 assert.deepEqual(app.errors,[]);
});

// WIEDORA-CHANGE: WD-20261031-WIE-115-LOAD-CYCLE-02 | TASK: WIE-115 | AUTHOR: ChatGPT / GPT-6
// WIEDORA-CHANGE: WD-20261101-WIE-110-KB-FBW-01 | TASK: WIE-110 | AUTHOR: ChatGPT / GPT-6
test('Push-up summary counts incomplete attempts separately and identifies progress relative to target',()=>{
 const s=makeStorage();engine.begin(s,10,clock);
 const planned=engine.session(10,1,1);
 engine.record(s,[0,0,0,0,0],clock);
 let stats=engine.summary(engine.read(s));
 assert.equal(stats.repsAll,0);
 assert.equal(stats.volume,0);
 assert.equal(stats.trend,'brak porównania');
 engine.record(s,planned.sets,clock);
 stats=engine.summary(engine.read(s));
 assert.equal(stats.repsAll,planned.total);
 assert.equal(stats.repsWeek,planned.total);
 assert.equal(stats.lastDifference,0);
 assert.equal(stats.trend,'progres');
});
test('WIE-115: target can be raised by at most 100 per update and retains workout records',()=>{
 const s=makeStorage();engine.begin(s,100,clock,{minutes:20,cycleDays:7});
 assert.throws(()=>engine.increaseGoal(s,101,clock),/1–100/);
 assert.equal(engine.increaseGoal(s,35,clock).goal,135);
 assert.equal(engine.read(s).finishedCycle,false);
 assert.equal(engine.session(100,1,1,engine.read(s)).achieved,false);
 engine.retest(s,135,clock);
 assert.equal(engine.read(s).finishedCycle,true);
 assert.equal(engine.summary(engine.read(s)).percent,100);
 assert.equal(engine.increaseGoal(s,100,clock).goal,235);
 assert.deepEqual(engine.read(s).goalUpdates.map(x=>x.goal),[135,235]);
});
test('WIE-115: old v1 user data without new preferences remains readable',()=>{
 const s=makeStorage();engine.begin(s,21,clock);
 const existing=JSON.parse(s.getItem(engine.KEY));
 delete existing.goal;delete existing.preferences;delete existing.blockEndWeek;delete existing.goalUpdates;
 s.setItem(engine.KEY,JSON.stringify(existing));
 const loaded=engine.read(s);
 assert.equal(loaded.max,21);
 assert.equal(engine.summary(loaded).goal,100);
 assert.equal(engine.summary(loaded).preferences.minutes,20);
 engine.configure(s,{minutes:80,cycleDays:10});
 assert.deepEqual(engine.read(s).preferences,{minutes:80,cycleDays:10});
});
test('WIE-115: time cap does not fill 100 minutes with pointless extra push-up repetitions',()=>{
 const shorter=engine.session(65,1,1,{preferences:{minutes:20,cycleDays:7}});
 const longer=engine.session(65,1,1,{preferences:{minutes:100,cycleDays:10}});
 assert(shorter.total<=longer.total);
 assert(longer.estimatedSeconds<=100*60);
 assert(shorter.estimatedSeconds<=20*60);
 assert.equal(longer.sets.length,5);
});
