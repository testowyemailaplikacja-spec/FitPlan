// WIEDORA-CHANGE: WD-20261101-WIE-110-KB-FBW-01 | TASK: WIE-110/WIE-115/WIE-117 | AUTHOR: ChatGPT / GPT-6
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const engine=require('../apps/fitplan/data/kettlebell-fbw-circuit.js');
const load=require('../apps/fitplan/data/training-load-engine.js');
const {createFitPlan}=require('./fitplan-shell-harness.cjs');
const win={};vm.runInNewContext(fs.readFileSync('apps/fitplan/data/kettlebell-catalog.js','utf8'),{window:win});
const lib=win.FitPlanKettlebellCatalog;
const storage=()=>{const map=new Map();return{
 getItem:key=>map.has(key)?map.get(key):null,
 setItem:(key,value)=>map.set(key,value),map}};
const clock=class extends Date{constructor(){super('2026-11-01T10:00:00.000Z')}};
const cfg=(level='beginner',goal='general',minutes=40,cycleDays=7,sessionsPerCycle=3)=>({level,goal,minutes,cycleDays,sessionsPerCycle});
test('three skill tiers only use the canonical existing catalog and correct complexity',()=>{
 assert.equal(engine.LEVELS.length,3);assert.equal(engine.GOALS.length,7);
 for(const tier of engine.LEVELS){
  const c=cfg(tier.id,'general');
  const plan=engine.proposal({version:1,config:c,history:[]},lib,load);
  assert.equal(plan.feasible,true);
  assert(plan.rows.every(x=>lib.get(x.id)?.minLevel<=tier.maxLevel));
 }
 const intro=engine.proposal({version:1,config:cfg(),history:[]},lib,load);
 assert(intro.rows.some(x=>x.id==='kb-deadlift'));
 assert(!intro.rows.some(x=>['kb-clean','kb-snatch','kb-two-hand-swing'].includes(x.id)));
 assert.equal(lib.items.length,31,'never duplicate or mutate exercise catalog');
});
test('all 7 goals × 3 levels × 5 durations preserve full-body movement patterns and safe breaks',()=>{
 for(const level of engine.LEVELS)for(const goal of engine.GOALS)
 for(const minutes of load.DURATIONS){
  const state={version:1,config:cfg(level.id,goal.id,minutes),history:[]};
  const p=engine.proposal(state,lib,load);
  if(goal.id==='strength'&&minutes===20){
    assert.equal(p.feasible,false,'20 min strength cannot fit four movement patterns without shortening rests');
    assert.match(p.reason,/czterech podstawowych wzorców/);
    continue;
  }
  assert(p.feasible,level.id+' '+goal.id+' '+minutes);
  assert(p.exercises>=4);
  assert(p.seconds<=minutes*60);
  assert(p.rows.length>0&&p.rows.length<=20);
  assert(p.restSeconds>=90);
  assert(p.rows.every(x=>Number.isInteger(x.target)&&x.target>=1&&x.target<=30));
 }
});
test('cycle length and session count are validated; short strength training fails closed when FBW is impossible',()=>{
 for(const [days,max] of [[5,2],[7,3],[10,4]]){
  for(let count=1;count<=max;count++){
   const c=engine.config(cfg('beginner','general',40,days,count));
   assert.equal(c.sessionsPerCycle,count);
  }
  assert.throws(()=>engine.config(cfg('beginner','general',40,days,max+1)));
 }
 assert.throws(()=>engine.config(cfg('beginner','general',30)));
 assert.throws(()=>engine.config(cfg('expert','general',40)));
 assert.throws(()=>engine.config(cfg('beginner','unknown',40)));
 const p=engine.proposal({version:1,config:cfg('beginner','strength',20),history:[]},lib,load);
 assert.equal(p.feasible,false);
 assert.match(p.reason,/40 minut/);
 const shortGeneral=engine.proposal({version:1,config:cfg('beginner','general',20),history:[]},lib,load);
 assert.equal(shortGeneral.feasible,true);
 const movements=[...new Set(shortGeneral.rows.map(x=>x.id))];
 for(const needed of ['kb-deadlift','kb-row','kb-floor-press','kb-goblet-squat'])assert(movements.includes(needed));
});
test('session logs actual greater/less target, kg, RIR, form and updates subsequent targets',()=>{
 const s=storage();engine.begin(s,cfg());
 const first=engine.proposal(engine.read(s),lib,load);
 const performance=first.rows.map(x=>({id:x.id,actual:x.target+2,kg:8,rir:3,form:'good'}));
 let state=engine.record(s,performance,lib,load,clock);
 assert.equal(state.history.length,1);
 assert.equal(engine.summary(state).sessions,1);
 assert.equal(engine.summary(state).repsAll,performance.reduce((a,x)=>a+x.actual,0));
 assert.equal(engine.summary(state).tonnageKg,engine.summary(state).repsAll*8);
 const next=engine.proposal(state,lib,load);
 assert(next.rows.some(row=>row.adjustment==='up'));
 assert(next.rows.every(row=>row.previousKg===8));
 const hard=next.rows.map(x=>({id:x.id,actual:Math.max(0,x.target-4),kg:8,rir:0,form:'needs-work'}));
 state=engine.record(s,hard,lib,load,clock);
 const next2=engine.proposal(state,lib,load);
 assert(next2.rows.some(x=>x.adjustment==='down'));
 assert(engine.summary(state).regress>0);
});
test('per-cycle and lifetime totals are separate, and changes to settings preserve prior records',()=>{
 const s=storage();engine.begin(s,cfg('beginner','general',40,5,2));
 for(let i=0;i<2;i++){
  const p=engine.proposal(engine.read(s),lib,load);
  engine.record(s,p.rows.map(x=>({id:x.id,actual:x.target,kg:6,rir:2,form:'good'})),lib,load,clock);
 }
 const state=engine.read(s),overall=engine.summary(state);
 assert.equal(overall.cycle,2);assert.equal(overall.repsCycle,0);assert(overall.repsAll>0);
 const previous=JSON.stringify(state.history);
 engine.configure(s,cfg('intermediate','technique',80,10,4));
 assert.equal(JSON.stringify(engine.read(s).history),previous);
 assert.equal(engine.read(s).config.sessionsPerCycle,4);
});
test('malformed actual, missing weight, bad status and corrupted storage fail closed',()=>{
 const s=storage();engine.begin(s,cfg());
 const first=engine.proposal(engine.read(s),lib,load);
 const good=first.rows.map(x=>({id:x.id,actual:x.target,kg:12,rir:null,form:'unknown'}));
 const original=s.getItem(engine.KEY);
 for(const invalid of [
  good.slice(0,-1),good.map(x=>({...x,kg:0})),
  good.map(x=>({...x,actual:NaN})),
  good.map(x=>({...x,rir:8})),
  good.map(x=>({...x,form:'invalid'})),
  good.map(x=>({...x,id:'kb-fake'}))
 ])assert.throws(()=>engine.record(s,invalid,lib,load,clock));
 assert.equal(s.getItem(engine.KEY),original);
 s.setItem(engine.KEY,'{');assert.throws(()=>engine.read(s),/uszkodzona/);
 assert.throws(()=>engine.begin(s,cfg()));
 assert.equal(s.getItem(engine.KEY),'{');
});
test('Changing goal or sessions-per-cycle never renumbers existing history and resets rep targets',()=>{
 const s=storage();engine.begin(s,cfg('beginner','muscle',40,7,3));
 for(let i=0;i<2;i++){
  const p=engine.proposal(engine.read(s),lib,load);
  engine.record(s,p.rows.map(x=>({id:x.id,actual:x.target+1,kg:8,rir:3,form:'good'})),lib,load,clock);
 }
 const prior=JSON.stringify(engine.read(s).history);
 engine.configure(s,cfg('beginner','strength',60,5,2));
 const after=engine.proposal(engine.read(s),lib,load);
 assert.equal(after.cycle,2);assert.equal(after.slot,1);
 assert.equal(after.rows[0].target,6,'new strength target must not inherit hypertrophy reps');
 assert.equal(JSON.stringify(engine.read(s).history),prior);
});
test('Changing the number of workouts spaces training days through the whole cycle',()=>{
 const examples=[
  [5,1,[1]],[5,2,[1,3]],[7,2,[1,4]],[7,3,[1,3,5]],
  [10,2,[1,6]],[10,3,[1,4,7]],[10,4,[1,4,7,9]]
 ];
 for(const [days,count,expected] of examples){
  const schedule=load.customCyclePlan(days,count).filter(x=>x.kind==='workout').map(x=>x.day);
  assert.deepEqual(schedule,expected);
  const current={version:1,config:cfg('beginner','general',40,days,count),history:[]};
  const p=engine.proposal(current,lib,load);
  assert.equal(p.plannedDay,expected[0]);
 }
});
test('Unknown repetitions in reserve at exact target are not silently interpreted as a safe progression',()=>{
 const s=storage();engine.begin(s,cfg());
 const planned=engine.proposal(engine.read(s),lib,load);
 const completed=planned.rows.map(x=>({id:x.id,actual:x.target,kg:8,rir:null,form:'good'}));
 engine.record(s,completed,lib,load,clock);
 const next=engine.proposal(engine.read(s),lib,load);
 assert(next.rows.every(x=>x.adjustment==='hold'));
});
test('DOM: custom circuit lives alongside existing eleven families and user results dashboard',async t=>{
 const app=await createFitPlan(t),w=app.w,d=w.document;
 w.FitPlanApp.open('plan-treningowy');await app.settle();
 assert.equal(d.querySelectorAll('[data-fpk-plan]').length,11);
 assert.equal(typeof w.FitPlanKettlebellCircuit?.proposal,'function');
 d.getElementById('fpkKbCircuitLauncher').click();
 assert.equal(d.getElementById('fpkKbcPanel').hidden,false);
 assert.equal(d.getElementById('fpkKettlebellFlow').hidden,false);
 d.getElementById('fpkKbcMinutes').value='20';
 d.getElementById('fpkKbcCycle').value='5';
 d.getElementById('fpkKbcCycle').dispatchEvent(new w.Event('change',{bubbles:true}));
 d.getElementById('fpkKbcSetup').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
 const state=w.FitPlanKettlebellCircuit.read(w.localStorage);
 assert.equal(state.config.minutes,20);assert.equal(state.config.cycleDays,5);
 const inputs=[...d.querySelectorAll('#fpkKbcRows tr')];
 assert(inputs.length>0);
 for(const tr of inputs){
  const target=Number(tr.children[1].textContent),[reps,kg]=tr.querySelectorAll('input');
  reps.value=String(target+1);kg.value='8';
 }
 w.confirm=()=>true;
 d.getElementById('fpkKbcResults').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
 assert.equal(w.FitPlanKettlebellCircuit.read(w.localStorage).history.length,1);
 assert(Number(d.getElementById('fpkKbcAllReps').textContent)>0);
 w.FitPlanApp.open('podsumowanie-wynikow');await app.settle();
 assert.match(d.querySelector('.fpd-kettlebell-progress')?.textContent||'',/Kettlebell Total Body Circuit/);
 assert.deepEqual(app.errors,[]);
});


 // WIEDORA-CHANGE: WD-20261101-WIE-110-KB-UX-FIX-02 | TASK: WIE-110 | AUTHOR: ChatGPT / GPT-6
 test('the fifth-cycle reduction is stable and cycle six resumes original reps',()=>{
  const store=storage();engine.begin(store,cfg('beginner','general',40,5,2));
  let normal=null,light=null;
  for(let n=0;n<10;n++){
   const plan=engine.proposal(engine.read(store),lib,load);
   if(plan.cycle===4)normal=plan.rows[0].target;
   if(plan.cycle===5){
    if(light===null)light=plan.rows[0].target;
    else assert.equal(plan.rows[0].target,light,'second light workout cannot compound reduction');
   }
   engine.record(store,plan.rows.map(r=>({id:r.id,actual:r.target,kg:8,rir:null,form:'unknown'})),lib,load,clock);
  }
  const next=engine.proposal(engine.read(store),lib,load);
  assert.equal(next.cycle,6);
  assert(light<normal);
  assert.equal(next.rows[0].target,normal);
 });
 test('tampered history rejects unknown and cross-level exercise IDs',()=>{
  const store=storage();engine.begin(store,cfg());
  const p=engine.proposal(engine.read(store),lib,load);
  engine.record(store,p.rows.map(r=>({id:r.id,actual:r.target,kg:8,rir:null,form:'unknown'})),lib,load,clock);
  const good=store.getItem(engine.KEY);
  for(const id of ['kb-unknown','kb-clean']){
   const altered=JSON.parse(good);
   altered.history[0].rows[0].id=id;
   store.setItem(engine.KEY,JSON.stringify(altered));
   assert.throws(()=>engine.read(store),/format/);
  }
  store.setItem(engine.KEY,good);
  assert.equal(engine.read(store).history.length,1);
 });
