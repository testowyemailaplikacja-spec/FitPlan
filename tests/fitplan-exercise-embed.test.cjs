const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {createFitPlan}=require('./fitplan-shell-harness.cjs');

function library(){
 const window={};
 for(const file of ['motion/library.js','motion/photographic-manifest.js','motion/photographic-catalog.js','exercise-motion-embed.js']){
  assert.ok(fs.existsSync('apps/fitplan/'+file),'motion library is installed: '+file);
  vm.runInNewContext(fs.readFileSync('apps/fitplan/'+file,'utf8'),{window,globalThis:window});
 }
 return window;
}

test('photographic motion registry resolves only supported exercises',()=>{
 const w=library();
 assert.ok(w.FitPlanExerciseEmbed.has('Pompki'));
 assert.ok(w.FitPlanExerciseEmbed.has('Push-Up'));
 assert.ok(w.FitPlanExerciseEmbed.has('Hip thrust'));
 assert.equal(w.FitPlanExerciseEmbed.has('Barbell Bench Press'),false);
 assert.equal(w.FitPlanExerciseEmbed.has('Przysiad'),false);
 const movement=w.FitPlanMotionLibrary.resolve('Pompki');
 assert.equal(movement.actorId,'fitplan-athlete-01');
 assert.equal(w.FitPlanExerciseEmbed.kind,'photographic-sequence');
 assert.ok(Object.isFrozen(movement));
});

test('timeline samples a complete repetition without wrapping or overshooting endpoints',()=>{
 const w=library(),lib=w.FitPlanMotionLibrary,m=lib.resolve('push-up');
 for(const [progress,frame] of [[0,0],[.5,5],[1,0],[-1,0],[2,0],[NaN,0]]){
  const pose=lib.sample(m,progress);assert.equal(pose.from,frame);assert.equal(pose.mix,0);
 }
 const down=lib.sample(m,.25),up=lib.sample(m,.75);
 assert.equal(down.from,2);assert.equal(down.to,3);assert.ok(Math.abs(down.mix-.5)<1e-9);
 assert.equal(up.from,3);assert.equal(up.to,2);assert.ok(Math.abs(up.mix-.5)<1e-9);
});

test('new exercise and category use the same model interface without changing the player',()=>{
 const w=library(),lib=w.FitPlanMotionLibrary,base=lib.resolve('push-up');
 lib.registerExercise({...base,id:'fixture-squat',aliases:['Fixture squat'],category:'legs',keyframes:[{at:0,frame:0},{at:1,frame:1}]});
 const other=lib.resolve('Fixture squat');
 assert.equal(other.category,'legs');assert.equal(lib.sample(other,.5).mix,.5);
 assert.throws(()=>lib.registerExercise({...base,id:'invalid',aliases:['Bad'],keyframes:[{at:1,frame:0},{at:0,frame:1}]}));
 assert.throws(()=>lib.registerExercise({...base,id:'duplicate',aliases:['Pompki']}));
});

test('Push-Up stays still and changes position only through the timeline',async t=>{
 const app=await createFitPlan(t);app.card('lista-cwiczen').click();await app.settle();
 const doc=app.w.document;doc.querySelector('[data-fitplan-exercise="Pompki"]').click();
 const root=doc.querySelector('.fitplan-pushup-motion');assert.ok(root);
 assert.equal(root.dataset.state,'manual');
 assert.equal(root.querySelector('[data-push-play]'),null);
 assert.equal(root.querySelector('[data-push-speed]'),null);
 assert.equal(root.querySelectorAll('[data-push-phase]').length,4);
 assert.equal(root.querySelectorAll('button[data-push-phase]').length,0,'phase labels do not move the model');
 const slider=root.querySelector('[data-push-progress]');assert.equal(slider.value,'0');
 slider.value='50';slider.dispatchEvent(new app.w.Event('input',{bubbles:true}));
 assert.equal(root.dataset.progress,'50');assert.match(root.querySelector('[data-push-output]').textContent,/Dół ruchu/);
 await new Promise(resolve=>setTimeout(resolve,150));assert.equal(slider.value,'50');assert.equal(root.dataset.progress,'50');
 slider.value='100';slider.dispatchEvent(new app.w.Event('input'));
 assert.equal(slider.value,'100');assert.equal(root.dataset.progress,'100');
 assert.match(slider.getAttribute('aria-valuetext'),/100/);
 doc.querySelector('.fitplan-dialog-close').click();assert.equal(doc.querySelector('.fitplan-pushup-motion'),null);
 doc.querySelector('[data-fitplan-exercise="Pompki"]').click();assert.equal(doc.querySelector('[data-push-progress]').value,'0');
 assert.deepEqual(app.errors,[]);
});

test('all motion scripts and original local assets are covered by the offline package',()=>{
 const w=library(),motions=['Pompki','Hip thrust'].map(name=>w.FitPlanMotionLibrary.resolve(name));
 const sw=fs.readFileSync('apps/fitplan/sw.js','utf8'),legacy=fs.readFileSync('apps/fitplan/legacy.html','utf8');
 for(const file of ['motion/library.js','motion/photographic-manifest.js','motion/photographic-catalog.js','motion/landmark-constraints.js','motion/rig-renderer.js','motion/renderer.js','exercise-motion-embed.js']){
  const url=legacy.match(new RegExp('\\./'+file.replaceAll('.','\\.')+'(?:\\?v=[^"\\s]+)?'))?.[0];
  assert.ok(url,file+' is loaded');
  if(file==='motion/photographic-manifest.js')assert.match(sw,/MOTION_MANIFEST="\.\/motion\/photographic-manifest\.js"/);
  else assert.ok(sw.includes('"'+url+'"'),file+' is cached with the same version');
 }
 for(const motion of motions)for(const file of [motion.visual.atlas,motion.visual.flow.url]){
  assert.ok(fs.existsSync('apps/fitplan/'+file.replace(/^\.\//,'')),file+' exists');
 }
 assert.match(sw,/readPhotographicAssets/,'manifest assets are discovered for offline download');
 assert.doesNotMatch(fs.readFileSync('apps/fitplan/exercise-motion-embed.js','utf8'),/requestAnimationFrame|setInterval|setTimeout/);
 assert.doesNotMatch(fs.readFileSync('apps/fitplan/motion/rig-renderer.js','utf8'),/requestAnimationFrame|setInterval|setTimeout/);
});

test('Hip Thrust has its own photographic ascent and matching controlled return',()=>{
 const w=library(),lib=w.FitPlanMotionLibrary,hip=lib.resolve('Hip thrust'),push=lib.resolve('Pompki');
 assert.equal(hip.category,'glutes');assert.equal(hip.visual.kind,'photographic-sequence');
 assert.notEqual(hip.visual,push.visual);
 assert.notEqual(hip.visual.atlas,push.visual.atlas);
 assert.deepEqual(Array.from(hip.keyframes,k=>k.frame),[0,1,2,3,4,5,4,3,2,1,0]);
 assert.equal(lib.sample(hip,0).from,0);assert.equal(lib.sample(hip,.5).from,5);
 assert.equal(lib.sample(hip,1).from,0);
 assert.equal(lib.sample(hip,.25).mix,.5);assert.equal(lib.sample(hip,.75).mix,.5);
 assert.deepEqual(Array.from(hip.visual.flow.pairs,pair=>Array.from(pair)),[[0,1],[1,2],[2,3],[3,4],[4,5]]);
 assert.match(hip.phases[0].cue,/ławce/i);assert.match(hip.phases[0].cue,/stopy/i);
 assert.match(hip.phases[2].cue,/bez przeprostu lędźwi/i);
 assert.equal(lib.resolve('Push-Up'),push);
});

test('Hip Thrust dialog reuses the manual scrubber and cleans up its photographic scene',async t=>{
 const app=await createFitPlan(t);app.card('lista-cwiczen').click();await app.settle();
 const doc=app.w.document;
 const button=doc.querySelector('[data-fitplan-exercise="Hip thrust"]');assert.ok(button);
 assert.match(button.textContent,/Animacja ruchu/);
 button.click();
 const root=doc.querySelector('[data-exercise="hip-thrust"]');assert.ok(root);
 const stage=root.querySelector('.fitplan-pushup-stage'),poster=root.querySelector('.fitplan-motion-poster');
 assert.ok(poster);assert.ok(root.querySelector('.fitplan-motion-canvas'));
 assert.match(poster.style.backgroundImage,/hip-thrust-v1\/athlete\.webp/);
 const slider=root.querySelector('[data-push-progress]');
 assert.equal(slider.value,'0');assert.equal(poster.style.backgroundPosition,'0% 0%');
 slider.value='50';slider.dispatchEvent(new app.w.Event('input',{bubbles:true}));
 assert.equal(poster.style.backgroundPosition,'100% 100%');
 assert.match(root.querySelector('[data-push-output]').textContent,/Pełny wyprost/);
 slider.value='100';slider.dispatchEvent(new app.w.Event('input',{bubbles:true}));
 assert.equal(poster.style.backgroundPosition,'0% 0%');assert.equal(slider.value,'100');
 assert.ok(['loading','crossfade','asset-error'].includes(stage.dataset.renderer));
 assert.equal(root.querySelector('[data-push-play]'),null);
 doc.querySelector('.fitplan-dialog-close').click();
 assert.equal(doc.querySelector('.fitplan-motion-poster'),null);
 assert.equal(doc.querySelector('.fitplan-motion-canvas'),null);
 assert.deepEqual(app.errors,[]);
});

