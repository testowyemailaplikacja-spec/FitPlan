'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {createFitPlan}=require('./fitplan-shell-harness.cjs');
const prefix='apps/fitplan/';
const sources=[
  'data/app-data.js','data/muscles.js','data/exercise-catalog.js','exercise-motion.js',
  'motion/library.js','motion/photographic-manifest.js','motion/photographic-catalog.js',
  'motion/full-body-poses.js','motion/exercises/catalog-rigs.js'
];
function fixture(){
  const window={},context={window,globalThis:window,console};
  for(const file of sources)vm.runInNewContext(fs.readFileSync(prefix+file,'utf8'),context,{filename:file});
  return window;
}
test('every current exercise has one provider and mechanical coverage adapts to the photographic manifest',()=>{
  const w=fixture(),report=w.FitPlanMotionCoverage;
  assert.ok(report);
  assert.equal(report.total,w.FitPlanExerciseCatalog.items.length);
  assert.equal(report.draftCount+report.existingCount,report.total);
  assert.ok(report.patterns>=50);
  assert.deepEqual(Array.from(report.unmapped),[]);
  assert.deepEqual(Array.from(report.duplicates),[]);
  assert.deepEqual(Array.from(report.unknown),[]);
  const main=w.FitPlanExerciseMotion;
  let dedicated=0,drafts=0;
  for(const item of w.FitPlanExerciseCatalog.items){
    const rig=w.FitPlanMotionLibrary.resolve(item.name);
    const bench=main.has(item.name);
    assert.ok(rig||bench,item.name);
    assert.ok(!(rig&&bench),'no overlapping providers: '+item.name);
    if (rig?.mechanicalDraft) assert.equal(item.category,rig.category);
    else if (rig) assert.ok(w.FitPlanPhotographicManifest.exercises.some(entry => entry.id === rig.id), 'photographic aliases may span catalog categories');
    if(bench||!rig.mechanicalDraft)dedicated++;else drafts++;
  }
  assert.equal(report.existingCount,dedicated);
  assert.equal(report.draftCount,drafts);
});
test('all photographic manifest entries and Barbell Bench Press are not replaced by mechanical drafts',()=>{
  const w=fixture();
  for(const entry of w.FitPlanPhotographicManifest.exercises){
    const movement=w.FitPlanMotionLibrary.resolve(entry.aliases[0]);
    assert.equal(movement.id,entry.id);
    assert.notEqual(movement.mechanicalDraft,true);
  }
  assert.equal(w.FitPlanMotionLibrary.resolve('Wyciskanie sztangi na ławce płaskiej'),null);
  assert.ok(w.FitPlanExerciseMotion.has('Wyciskanie sztangi na ławce płaskiej'));
});
test('remaining mechanical families keep explicit joint movement and never use photographic frames',()=>{
  const w=fixture(),lib=w.FitPlanMotionLibrary;
  const families=new Set();
  let checked=0,moving=0;
  for(const item of w.FitPlanExerciseCatalog.items){
    const movement=lib.resolve(item.name);
    if(!movement?.mechanicalDraft)continue;
    assert.equal(movement.visual.kind,'full-body-rig');
    assert.equal(movement.visual.poses.length,2);
    const start=movement.visual.poses[0],finish=movement.visual.poses[1];
    if(JSON.stringify(start)!==JSON.stringify(finish))moving++;
    assert.equal(movement.visual.atlas,undefined);
    assert.equal(movement.visual.frames,undefined);
    families.add(movement.visual.pattern);
    const pose=lib.sample(movement,.25);
    assert.equal(pose.mix,.5);
    assert.equal(lib.sample(movement,0).from,0);
    assert.equal(lib.sample(movement,.5).from,1);
    assert.equal(lib.sample(movement,1).from,0);
    assert.ok(Object.isFrozen(movement));
    checked++;
  }
  assert.equal(checked,w.FitPlanMotionCoverage.draftCount);
  assert.ok(families.size>=Math.min(12,checked));
  assert.ok(moving>=Math.min(12,checked));
});
test('static exercise drafts are stationary rather than artificial animation loops',()=>{
  const w=fixture(),lib=w.FitPlanMotionLibrary;
  for(const name of ['Izometrie','Bracing','Zwis na drążku','Deska boczna']){
    const d=lib.resolve(name);
    if(!d?.mechanicalDraft)continue;
    assert.ok(d.mechanicalDraft,name);
    assert.deepEqual(d.visual.poses[0],d.visual.poses[1]);
  }
  for(const p of ['motion/pose-constraints.js','motion/full-body-renderer.js','motion/full-body-poses.js','motion/exercises/catalog-rigs.js'])
    assert.doesNotMatch(fs.readFileSync(prefix+p,'utf8'),/\b(?:requestAnimationFrame|setInterval|setTimeout)\s*\(/);
});
test('registry rejects malformed full-body coordinates and duplicate aliases',()=>{
  const w=fixture(),lib=w.FitPlanMotionLibrary;
  const reference=w.FitPlanExerciseCatalog.items.map(item=>lib.resolve(item.name)).find(item=>item?.mechanicalDraft);
  assert.ok(reference);
  assert.throws(()=>lib.registerExercise({...reference,id:'bad-joints',aliases:['bad joints'],visual:{...reference.visual,poses:[{},{}]}}),/Invalid full-body/);
  assert.throws(()=>lib.registerExercise({...reference,id:'duplicate-name',aliases:[reference.aliases[0]]}),/already registered/);
});
test('new scripts are loaded in correct order and included in offline download',()=>{
  const legacy=fs.readFileSync(prefix+'legacy.html','utf8'),sw=fs.readFileSync(prefix+'sw.js','utf8');
  const index=fs.readFileSync(prefix+'index.html','utf8');
  const scripts=['motion/library.js','motion/photographic-manifest.js','motion/photographic-catalog.js',
   'motion/full-body-poses.js','motion/exercises/catalog-rigs.js','motion/pose-constraints.js','motion/full-body-renderer.js',
   'motion/renderer.js','exercise-motion-embed.js'];
  let cursor=-1;
  for(const path of scripts){
    const tag=legacy.match(new RegExp('<script src="(\\./'+path.replaceAll('.','\\.')+'(?:\\?v=[^"]+)?)"'));
    assert.ok(tag,path+' loaded');
    if(path==='motion/photographic-manifest.js')assert.match(sw,/MOTION_MANIFEST="\.\/motion\/photographic-manifest\.js"/);
    else assert.ok(sw.includes('"'+tag[1]+'"'),path+' cached');
    const found=legacy.indexOf(tag[0]);assert.ok(found>cursor,path+' correct order');cursor=found;
  }
  const iframe=index.match(/\.\/legacy\.html\?v=[^"]+/)?.[0];
  const exerciseList=index.match(/\.\/modules\/exercise-list\.js\?v=[^"]+/)?.[0];
  assert.ok(iframe&&sw.includes('"'+iframe+'"'),'iframe version cached');
  assert.ok(exerciseList&&sw.includes('"'+exerciseList+'"'),'exercise list version cached');
  assert.match(sw,/const CACHE_NAME=.*cache-\d{8}-[\w-]+/);
});
test('mechanical draft is visible and scrubs manually in the real exercise dialog',async t=>{
  const app=await createFitPlan(t);
  app.card('lista-cwiczen').click();await app.settle();
  const doc=app.w.document;
  const names=app.w.FitPlanExerciseCatalog.items
    .filter(item=>app.w.FitPlanMotionLibrary.resolve(item.name)?.mechanicalDraft)
    .slice(0,3).map(item=>item.name);
  assert.equal(names.length,3);
  for(const name of names){
    const card=doc.querySelector('[data-fitplan-exercise="'+name+'"]');
    assert.ok(card,name+' in catalogue');
    assert.match(card.textContent,/Szkic mechaniki 2D/);
    card.click();
    const root=doc.querySelector('[data-fitplan-exercise-motion] .fitplan-motion');
    assert.ok(root);
    assert.match(root.querySelector('.fitplan-motion-badge').textContent,/Szkic mechaniczny 2D/);
    const scene=root.querySelector('.fitplan-fullbody-scene'),slider=root.querySelector('[data-push-progress]');
    assert.ok(scene);
    assert.equal(root.dataset.state,'manual');
    assert.equal(scene.dataset.pose,'0');
    slider.value='50';slider.dispatchEvent(new app.w.Event('input',{bubbles:true}));
    assert.equal(scene.dataset.pose,'50');
    slider.value='100';slider.dispatchEvent(new app.w.Event('input',{bubbles:true}));
    assert.equal(scene.dataset.pose,'100');
    assert.equal(root.querySelector('[data-push-play]'),null);
    doc.querySelector('.fitplan-dialog-close').click();
    assert.equal(doc.querySelector('.fitplan-fullbody-scene'),null);
  }
  assert.deepEqual(app.errors,[]);
});

