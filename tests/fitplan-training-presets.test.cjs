// WIEDORA-CHANGE: WD-20261031-WIE-110-STARTER-PLANS-01 | TASK: WIE-110 | AUTHOR: ChatGPT / GPT-6
'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {createFitPlan}=require('./fitplan-shell-harness.cjs');
const scriptNames=[
  'apps/fitplan/data/app-data.js',
  'apps/fitplan/data/muscles.js',
  'apps/fitplan/data/exercise-catalog.js',
  'apps/fitplan/data/kettlebell-catalog.js',
  'apps/fitplan/data/training-extensions.js',
  'apps/fitplan/data/exercise-registry.js',
  'apps/fitplan/data/training-presets.js'
];
function library(){
 const sandbox={window:{}};
 for(const name of scriptNames)
   vm.runInNewContext(fs.readFileSync(name,'utf8'),sandbox,{filename:name,timeout:3000});
 return sandbox.window;
}
test('WIE-110: 4 pilot programs and 8 sessions resolve exact canonical FitPlan IDs',()=>{
 const w=library(),catalog=w.FitPlanTrainingPresets;
 assert.equal(w.FitPlanExerciseRegistry.items.length,287);
 assert.equal(catalog.programs.length,4);
 let n=0;
 for(const program of catalog.programs){
   assert.equal(program.days.length,2);
   for(const day of program.days){
     const session=catalog.prepare(program.id,day.id,w.FitPlanExerciseRegistry);
     assert.equal(session.ids.length,day.names.length);
     assert.equal(new Set(session.ids).size,session.ids.length);
     assert(session.ids.every(id=>w.FitPlanExerciseRegistry.get(id)?.id===id));
     assert(session.settings.work>0 && session.settings.rest>=0);
     assert(session.settings.rounds<=30 && session.ids.length<=20);
     n++;
   }
 }
 assert.equal(n,8);
});
test('WIE-110: complete FBW includes push, pull, legs and core in home and gym A/B',()=>{
 const w=library(),r=w.FitPlanExerciseRegistry,c=w.FitPlanTrainingPresets;
 for(const name of ['fbw-home','fbw-gym'])for(const day of c.programs.find(p=>p.id===name).days){
   const ids=c.prepare(name,day.id,r).ids;
   const areas=ids.flatMap(id=>r.get(id).muscleProfile.primary.map(x=>x.area));
   for(const group of ['chest','back','legs','abs'])assert(areas.includes(group),name+' '+day.id+' lacks '+group);
 }
});
test('WIE-110: swaps match trained muscles, reject duplicates, preserve program identity',()=>{
 const w=library(),r=w.FitPlanExerciseRegistry,c=w.FitPlanTrainingPresets;
 const original=c.prepare('fbw-home','a',r),list=c.alternatives(original.ids[1],r,{environment:'home',exclude:original.ids,maxLevel:2});
 assert(list.some(x=>x.name==='Wall Push-Up'));
 assert(!list.some(x=>x.name.includes('Bench Press')));
 assert.equal(c.alternatives('90 Degree Push-Up',r).length,0);
 const swapped=[...original.ids];swapped[1]=list.find(x=>x.name==='Wall Push-Up').id;
 assert.equal(c.compatible('fbw-home','a',swapped,r),true);
 assert.equal(c.compatible('fbw-home','a',[...swapped,swapped[0]],r),false);
 assert.equal(c.compatible('fbw-gym','a',swapped,r),false);
});
test('WIE-110: one changed exercise can be saved in Start without losing other exercises',async t=>{
 const app=await createFitPlan(t);app.w.FitPlanApp.open('start');await app.settle();
 const w=app.w,doc=w.document;doc.getElementById('fpsTabPlan').click();
 doc.getElementById('fpsLoadPreset').click();
 const before=JSON.parse(w.localStorage.getItem('fitplan.start.exercises.v1'));
 const swap=doc.querySelector('#fpsPlanList [data-fps-action="swap"]');
 assert(swap,'single-exercise swap button exists');swap.click();
 const chooser=doc.querySelector('#fpsPlanList .fps-swap-inline .fps-swap-choice');
 assert(chooser,'alternatives are shown');const substitute=chooser.value;
 doc.querySelector('#fpsPlanList [data-fps-action="apply-swap"]').click();
 const after=JSON.parse(w.localStorage.getItem('fitplan.start.exercises.v1'));
 assert.equal(after.length,before.length);assert.equal(after[0],substitute);
 assert.deepEqual(after.slice(1),before.slice(1));assert.deepEqual(app.errors,[]);
});
test('WIE-110: workout guidance includes consistent A/B doses and descriptions',()=>{
 const w=library(),lib=w.FitPlanTrainingPresets,r=w.FitPlanExerciseRegistry;
 for(const program of lib.programs)for(const day of program.days){
   const guide=lib.guidance(program.id,day.id,r);
   assert.equal(guide.length,day.names.length);
   assert(guide.every(row=>r.get(row.id)&&row.sets===day.settings.rounds&&row.target&&row.group));
 }
});
test('WIE-110: equipment-free alternatives reject bar and bench, and skill filter keeps basics',()=>{
 const w=library(),lib=w.FitPlanTrainingPresets,r=w.FitPlanExerciseRegistry;
 const noGear=lib.alternatives('Inverted Row',r,{environment:'home',preference:'bodyweight'});
 assert.equal(noGear.length,0,'a no-equipment substitute for a pulling movement must not be invented');
 const push=lib.alternatives('Barbell Bench Press',r,{environment:'all',preference:'bodyweight'});
 assert(push.some(x=>x.name==='Wall Push-Up'));
 assert(!push.some(x=>/Barbell|Kettlebell|Dumbbell|Incline Push-Up/.test(x.name)));
 const basic=lib.alternatives('Push-Up',r,{preference:'basic'});
 assert(basic.every(x=>(r.get(x.id).minLevel||1)<=1));
});
test('WIE-110: home/gym quick cards and labeled per-exercise guidance are interactive',async t=>{
 const app=await createFitPlan(t);
 app.w.FitPlanApp.open('start');await app.settle();
 const w=app.w,doc=w.document;
 doc.getElementById('fpsTabPlan').click();
 const gym=doc.querySelector('[data-fps-preset-quick="fbw-gym"]');
 assert(gym);gym.click();
 assert.equal(doc.getElementById('fpsPresetProgram').value,'fbw-gym');
 assert.equal(gym.getAttribute('aria-pressed'),'true');
 assert.equal(doc.querySelectorAll('#fpsPresetPreview .fps-guide-row').length,6);
 assert.match(doc.querySelector('#fpsPresetPreview .fps-guide-dose').textContent,/serie/);
 assert.equal(doc.querySelectorAll('#fpsPresetPreview [data-fps-preview-detail]').length,6);
 const home=doc.querySelector('[data-fps-preset-quick="fbw-home"]');home.click();
 assert.equal(doc.getElementById('fpsPresetProgram').value,'fbw-home');
 assert.equal(home.getAttribute('aria-pressed'),'true');
 assert.equal(gym.getAttribute('aria-pressed'),'false');
 assert.deepEqual(app.errors,[]);
});
test('WIE-110: swap reason filter does not mutate plan when no equipment matches',async t=>{
 const app=await createFitPlan(t);
 app.w.FitPlanApp.open('start');await app.settle();
 const w=app.w,doc=w.document;doc.getElementById('fpsTabPlan').click();
 doc.getElementById('fpsLoadPreset').click();
 const before=w.localStorage.getItem('fitplan.start.exercises.v1');
 const row=[...doc.querySelectorAll('#fpsPlanList li')].find(li=>li.textContent.includes('Inverted Row'));
 assert(row,'home FBW pulling exercise exists');
 row.querySelector('[data-fps-action="swap"]').click();
 const filter=row.querySelector('.fps-swap-preference');filter.value='bodyweight';
 filter.dispatchEvent(new w.Event('change',{bubbles:true}));
 assert.equal(row.querySelector('.fps-swap-choice').options.length,0);
 assert.equal(row.querySelector('[data-fps-action="apply-swap"]').disabled,true);
 assert.equal(w.localStorage.getItem('fitplan.start.exercises.v1'),before);
 row.querySelector('[data-fps-action="cancel-swap"]').click();
 assert.equal(row.querySelector('.fps-swap-inline'),null);
 assert.deepEqual(app.errors,[]);
});
test('WIE-110: invalid days, missing exercises and missing catalog fail closed',()=>{
 const w=library(),presets=w.FitPlanTrainingPresets;
 assert.throws(()=>presets.prepare('missing','a',w.FitPlanExerciseRegistry),/Nieznany/);
 assert.throws(()=>presets.prepare('fbw-home','missing',w.FitPlanExerciseRegistry),/Nieznany/);
 assert.throws(()=>presets.prepare('fbw-home','a',{}),/Katalog/);
 assert.throws(()=>presets.prepare('fbw-home','a',{get:()=>null}),/aktualizacji katalogu/);
});
test('WIE-110: Start loads a sample day, saves existing-format plan/timer and launches',async t=>{
 const app=await createFitPlan(t);
 app.w.FitPlanApp.open('start');await app.settle();
 const w=app.w,doc=w.document;
 doc.getElementById('fpsTabPlan').click();
 const program=doc.getElementById('fpsPresetProgram');
 const day=doc.getElementById('fpsPresetDay');
 assert.equal(program.options.length,4);
 assert.equal(day.options.length,2);
 doc.getElementById('fpsLoadPreset').click();
 const ids=JSON.parse(w.localStorage.getItem('fitplan.start.exercises.v1'));
 const settings=JSON.parse(w.localStorage.getItem('fitplan.start.settings.v1'));
 assert.equal(ids.length,5);
 assert.equal(settings.work,40);
 assert.equal(settings.rest,40);
 assert.equal(settings.rounds,2);
 assert.equal(doc.querySelectorAll('#fpsPlanList li').length,5);
 assert.match(doc.getElementById('fpsPresetFeedback').textContent,/Wczytano/);
 // A refused overwrite never destroys the user-edited list or settings.
 const beforeIds=JSON.stringify(ids),beforeSettings=JSON.stringify(settings);
 w.confirm=()=>false;
 program.value='mobility-reset';
 program.dispatchEvent(new w.Event('change',{bubbles:true}));
 day.value='b';
 doc.getElementById('fpsLoadPreset').click();
 assert.equal(w.localStorage.getItem('fitplan.start.exercises.v1'),beforeIds);
 assert.equal(w.localStorage.getItem('fitplan.start.settings.v1'),beforeSettings);
 w.confirm=()=>true;
 doc.getElementById('fpsLoadPreset').click();
 assert.equal(JSON.parse(w.localStorage.getItem('fitplan.start.exercises.v1')).length,4);
 assert.equal(JSON.parse(w.localStorage.getItem('fitplan.start.settings.v1')).work,45);
 doc.getElementById('fpsLaunchPlan').click();
 assert.equal(doc.getElementById('fpsPanelTimer').hidden,false);
 assert.match(doc.getElementById('fpsSessionName').textContent,/Mobilność/);
 assert.equal(doc.getElementById('fpsTimerStart').disabled,true);
 app.w.FitPlanApp.home();await app.settle();
 app.w.FitPlanApp.open('start');await app.settle();
 assert.equal(app.w.document.querySelectorAll('#fpsPlanList li').length,4);
 assert.deepEqual(app.errors,[]);
});
test('WIE-110: failed second storage write rolls back first; no partial template',async t=>{
 const app=await createFitPlan(t);
 app.w.FitPlanApp.open('start');await app.settle();
 const w=app.w,doc=w.document;
 doc.getElementById('fpsTabPlan').click();
 const storageProto=Object.getPrototypeOf(w.localStorage),original=storageProto.setItem;
 Object.defineProperty(storageProto,'setItem',{configurable:true,value:function(key,value){
   if(key==='fitplan.start.settings.v1')throw Error('quota exceeded');
   return original.call(this,key,value);
 }});
 t.after(()=>{Object.defineProperty(storageProto,'setItem',{configurable:true,value:original});});
 doc.getElementById('fpsLoadPreset').click();
 assert.equal(w.localStorage.getItem('fitplan.start.exercises.v1'),null);
 assert.equal(w.localStorage.getItem('fitplan.start.settings.v1'),null);
 assert.equal(doc.querySelectorAll('#fpsPlanList li').length,0);
 assert.match(doc.getElementById('fpsPresetFeedback').textContent,/Nie udało się zapisać/);
 assert.deepEqual(app.errors,[]);
});

// WIEDORA-CHANGE: WD-20261031-WIE-110-STARTER-PLANS-01 | TASK: WIE-110 | AUTHOR: ChatGPT / GPT-6
test('WIE-110: saved timer settings without exercises still require overwrite consent',async t=>{
 const app=await createFitPlan(t);
 const w=app.w;
 const prior={work:90,rest:20,rounds:3,mode:'same',custom:[]};
 w.localStorage.setItem('fitplan.start.settings.v1',JSON.stringify(prior));
 app.w.FitPlanApp.open('start');await app.settle();
 const doc=w.document;
 doc.getElementById('fpsTabPlan').click();
 w.confirm=()=>false;
 doc.getElementById('fpsLoadPreset').click();
 assert.equal(w.localStorage.getItem('fitplan.start.exercises.v1'),null);
 assert.equal(w.localStorage.getItem('fitplan.start.settings.v1'),JSON.stringify(prior));
 assert.equal(doc.querySelectorAll('#fpsPlanList li').length,0);
 assert.deepEqual(app.errors,[]);
});
