// WIEDORA-CHANGE: WD-20261101-WIE-005-NATIVE-REGRESSION-11 | TASK: WIE-005 | AUTHOR: Codex / GPT-6
'use strict';
// WIEDORA-CHANGE: WD-20261101-WIE-115-CALISTHENICS-01 | TASK: WIE-115 | AUTHOR: ChatGPT / GPT-6
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
function load(){
  const window={};
  const ctx=vm.createContext({window,Date,console});
  for(const file of [
    'apps/fitplan/data/muscles.js',
    'apps/fitplan/data/app-data.js',
    'apps/fitplan/data/exercise-catalog.js',
    'apps/fitplan/data/kettlebell-catalog.js',
    'apps/fitplan/data/training-extensions.js',
    'apps/fitplan/data/exercise-registry.js',
    'apps/fitplan/data/calisthenics-coach.js'
  ])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx,{filename:file});
  const api=window.FitPlanCalisthenicsCoach;
  return {window,api,registry:window.FitPlanExerciseRegistry,paths:api.paths(window.FitPlanTrainingExtensions)};
}
function storage(fail=false){
 const map=new Map();
 return {getItem:k=>map.has(k)?map.get(k):null,
   setItem(k,value){if(fail)throw Error('quota');map.set(k,value);},
   removeItem:k=>map.delete(k)};
}
const day=n=>new Date('2026-11-'+String(n).padStart(2,'0')+'T12:00:00Z');

test('25 unique paths; seven categories; every stage references canonical exercises',()=>{
 const {api,registry,paths}=load();
 assert.equal(paths.length,25);
 assert.equal(new Set(paths.map(x=>x.id)).size,25);
 assert.equal(api.CATEGORIES.length,7);
 for(const path of paths){
   assert.equal(api.validatePath(path,registry).valid,true,path.id);
   assert.ok(path.stages.length>=3,path.id);
   assert.ok(path.equipment.length>0,path.id);
 }
});
test('both FBW variants cover five canonical exercises at every stage, with no duplicates',()=>{
 const {api,registry,paths}=load();
 for(const p of paths.filter(x=>x.category!=='acro'))for(let i=0;i<p.stages.length;i++)
 for(const v of ['A','B']){
   const plan=api.buildSession(p,i,registry,v);
   assert.equal(plan.exercises.length,5,p.id+' '+i+' '+v);
   assert.equal(new Set(plan.exercises.map(e=>e.id)).size,5,p.id+' '+i+' '+v);
   const accessories=plan.exercises.slice(1).map(x=>registry.get(x.id));
   const expected=[['chest','shoulders','arms'],['back'],['legs','glutes'],['abs']];
   expected.forEach((areas,k)=>assert.ok(accessories[k].muscleProfile.primary.some(m=>areas.includes(m.area)),
     p.id+' '+i+' '+v+' must include '+areas.join('/')));
   assert.equal(plan.focus.target.sets,3);
   assert.equal(plan.recoveryHours,48);
 }
});
test('Nordic skill preparation includes knee flexors before eccentric progression',()=>{
 const {paths,api,registry}=load(),nordic=paths.find(p=>p.id==='nordic');
 assert(nordic.stages[0].moves.includes('Leg Curl'));
 assert.equal(api.validatePath(nordic,registry).valid,true);
});
test('hold and dynamic exercise targets have correct units',()=>{
 const {api}=load();
 assert.equal(api.stageTarget(2,'One Arm Handstand').kind,'seconds');
 assert.equal(api.stageTarget(2,'Full Front Lever').kind,'seconds');
 assert.equal(api.stageTarget(2,'Front Lever Row').kind,'reps');
 assert.equal(api.stageTarget(2,'Dragon Flag Negative').kind,'reps');
});
test('no skipping stages without assessment; no premature promotion; history preserved',()=>{
 const {api,registry,paths}=load(),goal=paths.find(p=>p.id==='muscle-up'),store=storage();
 assert.throws(()=>api.begin(store,goal,2,false),/poprzednich/);
 api.begin(store,goal);
 assert.throws(()=>api.begin(store,goal),/już/);
 const makeExtras=variant=>api.buildSession(goal,0,registry,variant).exercises.slice(1)
  .map(x=>({id:x.id,actual:[8,7]}));
 const first=api.logSession(store,goal,registry,{
   actual:[8,8,8],extras:makeExtras('A'),technique:true,now:day(1)});
 assert.equal(first.record.extras.length,4);
 assert.equal(first.stats.streak,1);
 assert.throws(()=>api.advance(store,goal),/dwóch/);
 assert.throws(()=>api.logSession(store,goal,registry,{
   actual:[8,8,8],extras:makeExtras('B'),technique:true,now:day(2)}),/48 godzin/);
 const second=api.logSession(store,goal,registry,{
   actual:[8,8,8],extras:makeExtras('B'),technique:true,now:day(3)});
 assert.equal(second.stats.ready,true);
 assert.equal(second.stats.nextVariant,'A');
 assert.equal(api.advance(store,goal).stageIndex,1);
 assert.equal(api.read(store,goal.id).logs.length,2);
 assert.equal(api.stats(api.read(store,goal.id)).streak,0);
});
test('unsafe, incomplete and forged logs are refused; corrupt data is not overwritten',()=>{
 const {api,registry,paths}=load(),goal=paths.find(p=>p.id==='front-lever'),store=storage();
 api.begin(store,goal);
 const base={actual:[20,20,20],technique:true,now:day(1)};
 assert.throws(()=>api.logSession(store,goal,registry,{...base,technique:false}),/technice/);
 assert.throws(()=>api.logSession(store,goal,registry,{...base,fatigue:'pain'}),/bólu/);
 assert.throws(()=>api.logSession(store,goal,registry,{...base,actual:[20,20,-1]}),/0–150/);
 assert.throws(()=>api.logSession(store,goal,registry,{...base,extras:[{id:'forged',actual:[8,8]}]}),/czterech/);
 assert.equal(api.read(store,goal.id).logs.length,0);
 const corrupt={getItem:()=>'{broken'};
 assert.throws(()=>api.read(corrupt,goal.id),/nieczytelny/);
 assert.throws(()=>api.begin(storage(true),goal),/quota/);
 assert.equal(api.read(store,goal.id).logs.length,0);
});
test('offline references, entrypoints and exact style versions stay synchronized',()=>{
 const read=p=>fs.readFileSync(path.join(root,p),'utf8');
 const shell=read('apps/fitplan/index.html'),legacy=read('apps/fitplan/legacy.html');
 const sw=read('apps/fitplan/sw.js'),loader=read('apps/fitplan/styles-loader.js');
 for(const item of [
 'data/calisthenics-coach.js',
 'modules/calisthenics-paths-ui.js',
 'modules/workout-plan.js',
 'styles-loader.js'
 ]){
   const entry=[...shell.matchAll(/<script\b[^>]*src="([^"]+)"/g)].map(match=>match[1]).find(url=>url.startsWith('./'+item+'?v='));
   assert.ok(entry,'versioned shell: '+item);
   assert.ok(sw.includes('"'+entry+'"'),'exact SW version: '+item);
 }
 assert.ok(legacy.includes('training-extensions.js?v=20261101-cali-1'));
 assert.ok(sw.includes('training-extensions.js?v=20261101-cali-1'));
 const version=loader.match(/const VERSION="([^"]+)"/)[1];
 assert.ok(shell.includes('styles-loader.js?v='+version));
 for(const css of ['core','anatomy','start','physical-goals'])assert.ok(sw.includes('./styles/'+css+'.css?v='+version),'offline '+css);
 assert.ok(sw.includes('/apps/shared/avatar-presets.css?v='+version));
 assert.ok(sw.includes('-cache-'+version),'cache generation follows style release');
});
