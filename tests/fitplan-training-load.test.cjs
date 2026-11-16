// WIEDORA-CHANGE: WD-20261031-WIE-115-LOAD-CYCLE-02 | TASK: WIE-115 | AUTHOR: ChatGPT / GPT-6
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const load=require('../apps/fitplan/data/training-load-engine.js');
const push=require('../apps/fitplan/data/pushup-100.js');
const storage=()=>{const m=new Map();return{getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,v),m};};
const clock=class extends Date {constructor(){super('2026-10-31T12:00:00Z')}};
test('Only five time presets and three non-equivalent cycle windows are supported',()=>{
 assert.deepEqual(load.DURATIONS,[20,40,60,80,100]);
 assert.deepEqual(load.CYCLES,[5,7,10]);
 for(const [cycle,count] of [[5,2],[7,3],[10,4]]){
  const days=load.cyclePlan(cycle),sessions=days.filter(x=>x.kind==='workout');
  assert.equal(days.length,cycle);assert.equal(sessions.length,count);
  for(let i=1;i<sessions.length;i++)assert(sessions[i].day-sessions[i-1].day>=2,'no adjacent hard upper body sessions');
  const preview=load.durationPreview(24,cycle);
  assert.equal(preview.nominalDays,Math.ceil(24/count)*cycle);
 }
 for(const x of [0,19,21,120,'20'])assert.throws(()=>load.preferences({minutes:x,cycleDays:7}));
 for(const x of [0,6,9,14,'7'])assert.throws(()=>load.preferences({minutes:40,cycleDays:x}));
});
test('Tempo 3s per rep and minimum warmup, inter-set recovery and cooldown determine duration',()=>{
 const e=load.estimate({mode:'endurance',sets:[8,10,8,7,9]});
 assert.equal(e.repetitions,42);
 assert.equal(e.workSeconds,126);
 assert.equal(e.recoverySeconds,360);
 assert.equal(e.fixedSeconds,615);
 assert.equal(e.estimatedSeconds,1101);
 assert.throws(()=>load.estimate({sets:[10,10],restSeconds:30}));
 assert.throws(()=>load.estimate({sets:[10,10],warmupSeconds:60}));
});
test('Short session scales planned repetitions without shorter breaks or fake extra volume',()=>{
 const base=[80,90,75,70,90];
 const short=load.fitToTime({mode:'endurance',sets:base,minutes:20,cycleDays:5});
 const long=load.fitToTime({mode:'endurance',sets:base,minutes:100,cycleDays:10});
 assert(short.feasible&&long.feasible);
 assert(short.estimatedSeconds<=1200);
 assert.equal(short.restSeconds,90);
 assert.equal(short.setsTarget.length,5);
 assert(short.setsTarget.every((x,i)=>x<=base[i]&&x>=1));
 assert.equal(long.setsTarget.reduce((a,b)=>a+b,0),base.reduce((a,b)=>a+b,0));
 assert.equal(long.adjusted,false,'long time does not inflate repetitions');
 assert(long.spareSeconds>0,'unused time reserved for recovery or other muscle groups');
 const notEnough=load.fitToTime({mode:'strength',minutes:20,cycleDays:7,
  sets:Array(18).fill(20)});
 assert.equal(notEnough.feasible,false);
 assert.equal(notEnough.setsTarget.length,0);
});
test('Recovery checks actual time, subjective fatigue and pain without claiming CNS measurement',()=>{
 const when='2026-10-31T12:00:00Z';
 assert.equal(load.recovery({intensity:'hard',lastEnd:when,now:'2026-11-01T12:00:00Z'}).allowed,false);
 assert.equal(load.recovery({intensity:'hard',lastEnd:when,now:'2026-11-02T13:00:00Z'}).allowed,true);
 assert.equal(load.recovery({intensity:'easy',lastEnd:when,now:'2026-11-01T12:00:00Z'}).allowed,true);
 assert.equal(load.recovery({intensity:'hard',fatigue:'tired',lastEnd:when,now:'2026-11-01T13:00:00Z'}).allowed,false);
 assert.equal(load.recovery({intensity:'hard',fatigue:'tired',lastEnd:when,now:'2026-11-02T13:00:00Z'}).allowed,false,'tired state should not be indistinguishable from normal rest');
 assert.equal(load.recovery({intensity:'hard',fatigue:'tired',lastEnd:when,now:'2026-11-03T13:00:00Z'}).allowed,true);
 assert.equal(load.recovery({fatigue:'pain'}).allowed,false);
 assert.throws(()=>load.recovery({intensity:'invalid'}));
});
test('Deload every fifth week is descriptive and reduces programmed repetitions',()=>{
 assert.deepEqual(load.phase(4).recommendedVolumeFactor,1);
 assert.equal(load.phase(5).recommendedVolumeFactor,0.6);
 assert.equal(load.phase(8,'stalled').deload,true);
 const full=push.session(20,4,2,{preferences:{minutes:40,cycleDays:7}});
 const low=push.session(20,5,2,{preferences:{minutes:40,cycleDays:7}});
 assert(low.total<full.total);
});
test('Eight weeks is a review point, not an automatic success or history deletion',()=>{
 const s=storage();push.begin(s,20,clock,{minutes:40,cycleDays:10});
 for(let week=1;week<=8;week++)for(let day=1;day<=3;day++){
  const next=push.session(20,week,day,push.read(s));
  assert.equal(push.record(s,next.sets,clock).passed,true);
 }
 let state=push.read(s);
 assert.equal(state.max,20);assert(state.finishedCycle);
 assert.equal(state.attempts.length,24);
 push.retest(s,25,clock);
 assert.equal(push.read(s).week,8,'retest alone does not erase or restart the block');
 push.extend(s,clock);
 state=push.read(s);
 assert.equal(state.week,9);assert.equal(state.blockEndWeek,12);
 assert.equal(state.attempts.length,24);
 const ninth=push.session(25,9,1,state);
 assert(ninth.feasible);
});
test('Successful test can raise goal +100 at most, preserving old session logs',()=>{
 const s=storage();push.begin(s,100,clock);
 assert.throws(()=>push.increaseGoal(s,101,clock),/1–100/);
 push.increaseGoal(s,50,clock);
 assert.throws(()=>push.increaseGoal(s,50,clock),/Najpierw potwierdź/,'current 150 target was not reached');
 const high=storage();push.begin(high,250,clock);
 push.increaseGoal(high,100,clock);
 assert.throws(()=>push.increaseGoal(high,100,clock),/nowy rzeczywisty test/,'one strong test cannot fund repeated +100 increments');
 assert.equal(push.read(s).goal,150);
 assert.equal(push.read(s).finishedCycle,false);
 assert.equal(push.session(100,1,1,push.read(s)).achieved,false);
 push.retest(s,150,clock);
 assert.equal(push.read(s).finishedCycle,true);
 push.increaseGoal(s,100,clock);
 assert.equal(push.read(s).goal,250);
});
test('Legacy v1 data and unsupported/corrupt values are safe',()=>{
 const s=storage();push.begin(s,9,clock);
 const obj=JSON.parse(s.getItem(push.KEY));
 delete obj.goal;delete obj.preferences;delete obj.goalUpdates;delete obj.blockEndWeek;
 s.setItem(push.KEY,JSON.stringify(obj));
 assert.equal(push.summary(push.read(s)).goal,100);
 push.configure(s,{minutes:80,cycleDays:5});
 assert.deepEqual(push.read(s).preferences,{minutes:80,cycleDays:5});
 s.setItem(push.KEY,'{');
 assert.throws(()=>push.read(s),/Uszkodzony/);
 assert.throws(()=>push.configure(s,{minutes:40,cycleDays:7}));
 assert.equal(s.getItem(push.KEY),'{');
});

test('A two-day easy same-muscle streak and crowded 7-day routine trigger an advisory',()=>{
 const yesterday='2026-10-30T12:00:00Z',before='2026-10-29T12:00:00Z';
 const sessions=[
  {at:before,intensity:'easy',groups:['chest']},
  {at:yesterday,intensity:'easy',groups:['chest']}
 ];
 const current=load.analyzeRollingLoad(sessions,new Date('2026-10-31T12:00:00Z'),'chest');
 assert.equal(current.consecutiveEasy,true);
 assert.equal(current.recommendRecovery,true);
 const other=load.analyzeRollingLoad(sessions,new Date('2026-10-31T12:00:00Z'),'legs');
 assert.equal(other.consecutiveEasy,false);
 const crowded=Array.from({length:6},(_,i)=>({at:new Date(Date.parse('2026-10-31T12:00:00Z')-i*86400000).toISOString(),intensity:'easy',groups:['mobility']}));
 assert.equal(load.analyzeRollingLoad(crowded,new Date('2026-10-31T12:00:00Z'),'legs').trainingDays7,6);
 assert.equal(load.analyzeRollingLoad(crowded,new Date('2026-10-31T12:00:00Z'),'legs').recommendRecovery,true);
});
