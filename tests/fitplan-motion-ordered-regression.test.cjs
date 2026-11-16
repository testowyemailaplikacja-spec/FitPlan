'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const root='apps/fitplan/';
const files=['data/app-data.js','data/muscles.js','data/exercise-catalog.js','exercise-motion.js',
'motion/library.js','motion/photographic-manifest.js','motion/photographic-catalog.js',
'motion/full-body-poses.js','motion/exercises/catalog-rigs.js','motion/pose-constraints.js','motion/landmark-constraints.js'];
function fixture(){
 const w={};for(const file of files)vm.runInNewContext(fs.readFileSync(root+file,'utf8'),{window:w,globalThis:w,console},{filename:file});
 return w;
}
test('original ordered review covers exactly 98 existing catalog entries, without missing or duplicate names',()=>{
 const w=fixture(),source=fs.readFileSync('docs/FITPLAN_EXERCISE_REVIEW_1_98.md','utf8');
 const rows=source.split('\n').filter(row=>/^\| \d+ \|/.test(row));
 assert.equal(rows.length,98);
 const names=rows.map((row,index)=>{
  const cells=row.split('|').map(x=>x.trim()),n=Number(cells[1]);
  assert.equal(n,index+1,'sequential numbering');
  return cells[2];
 });
 assert.equal(new Set(names).size,98);
 const official=new Set(w.FitPlanExerciseCatalog.items.map(item=>item.name));
 for(const name of names){
  assert.ok(official.has(name),'must be actual catalog exercise: '+name);
  assert.ok(w.FitPlanMotionLibrary.resolve(name)||w.FitPlanExerciseMotion.has(name),'motion provider: '+name);
 }
});
test('Hip Thrust photographic timeline traverses six audited frames and returns without wrapping',()=>{
 const w=fixture(),lib=w.FitPlanMotionLibrary,d=lib.resolve('Hip thrust');
 assert.equal(d.visual.kind,'photographic-sequence');
 assert.equal(d.visual.atlas,'./assets/motion/hip-thrust-v1/athlete.webp');
 assert.equal(d.visual.flow.url,'./assets/motion/hip-thrust-v1/flow.png');
 assert.deepEqual(Array.from(d.keyframes,key=>key.frame),[0,1,2,3,4,5,4,3,2,1,0]);
 assert.deepEqual(Array.from(d.visual.flow.pairs,pair=>Array.from(pair)),[[0,1],[1,2],[2,3],[3,4],[4,5]]);
 for(let i=0;i<=100;i++){
  const pose=lib.sample(d,i/100);
  assert.ok(pose.from>=0&&pose.from<=5);assert.ok(pose.to>=0&&pose.to<=5);
  assert.ok(Math.abs(pose.to-pose.from)<=1,'only neighbouring authored frames may blend');
 }
 assert.equal(lib.sample(d,0).from,0);
 assert.equal(lib.sample(d,.5).from,5);
 assert.equal(lib.sample(d,1).from,0);
 assert.equal(lib.sample(d,1).progress,1);
 assert.match(d.phases[0].cue,/stopy płasko/i);
 assert.match(d.phases[2].cue,/bez przeprostu lędźwi/i);
 const atlas=fs.readFileSync(root+d.visual.atlas.replace(/^\.\//,''));
 const flow=fs.readFileSync(root+d.visual.flow.url.replace(/^\.\//,''));
 assert.equal(atlas.subarray(0,4).toString('ascii'),'RIFF');
 assert.equal(atlas.subarray(8,12).toString('ascii'),'WEBP');
 assert.equal(atlas.readUInt16LE(26)&0x3fff,1448);
 assert.equal(atlas.readUInt16LE(28)&0x3fff,1086);
 assert.equal(flow.subarray(1,4).toString('ascii'),'PNG');
 assert.equal(flow.readUInt32BE(16),1448);
 assert.equal(flow.readUInt32BE(20),905);
});
test('glute variants 2–8 are separate, and 3D-dependent models are explicitly flagged',()=>{
 const w=fixture(),resolve=w.FitPlanMotionLibrary.resolve,by=name=>resolve(name);
 const side=by('Side step'),band=by('Chód bokiem z gumą'),monster=by('Monster walk');
 if(side?.mechanicalDraft&&band?.mechanicalDraft)assert.notEqual(side.visual.pattern,band.visual.pattern);
 if(band?.mechanicalDraft&&monster?.mechanicalDraft)assert.notEqual(band.visual.pattern,monster.visual.pattern);
 for(const name of ['Chód bokiem z gumą','Monster walk']){
  const definition=by(name);if(!definition?.mechanicalDraft)continue;
  assert.equal(definition.visual.equipment,'band');
  const visual=definition.visual,c=w.FitPlanPoseConstraints,lib=w.FitPlanMotionLibrary;
  const start=c.pose(visual,lib.sample(by(name),0)),end=c.pose(visual,lib.sample(by(name),.5));
  assert.ok(c.span(start.ankleR,end.ankleR)>40,'side-step leg changes position');
 }
 for(const name of ['Kontrolowana rotacja biodra','Ćwiczenie muszla']){
  const definition=by(name);if(definition?.mechanicalDraft)assert.equal(definition.requiresDepthVisualization,true);
 }
 const single=by('Single-leg work');if(single?.mechanicalDraft)assert.equal(single.ambiguousExercise,true);
 const abduction=by('Odwodzenie nogi');if(abduction?.mechanicalDraft)assert.equal(abduction.visual.pattern,'abduction');
});
test('audited steps, pulley, incline, landmine and suitcase loading retain their roles',()=>{
 const w=fixture(),lib=w.FitPlanMotionLibrary,c=w.FitPlanPoseConstraints;
 const pose=(name,t)=>{const d=lib.resolve(name);return c.pose(d.visual,lib.sample(d,t))};
 const step=lib.resolve('Wejścia na stopień');
 if(step?.mechanicalDraft){
  const bottom=pose('Wejścia na stopień',0),up=pose('Wejścia na stopień',.5);
  assert.equal(step.visual.equipment,'step');assert.ok(c.span(bottom.ankleR,up.ankleR)<.1);
  assert.ok(up.hipL[1]<bottom.hipL[1]-30);
 }
 const incline=lib.resolve('Wyciskanie hantli na ławce dodatniej');
 if(incline?.mechanicalDraft){
  assert.equal(incline.visual.support,'incline-bench');
  assert.ok(c.span(pose('Wyciskanie hantli na ławce dodatniej',0).handL,
    pose('Wyciskanie hantli na ławce dodatniej',.5).handL)>80);
 }
 const pulldown=lib.resolve('Ściąganie drążka');
 if(pulldown?.mechanicalDraft){
  const start=pose('Ściąganie drążka',0),end=pose('Ściąganie drążka',.5);
  assert.ok(start.handL[1]<start.shoulderL[1]);assert.ok(end.handL[1]>start.handL[1]+75);
 }
 const landmine=lib.resolve('Landmine press');if(landmine?.mechanicalDraft)assert.equal(landmine.visual.equipment,'landmine');
 const suitcase=lib.resolve('Spacer z obciążeniem po jednej stronie');if(suitcase?.mechanicalDraft)assert.equal(suitcase.visual.equipment,'singleDumbbell');
 const extension=lib.resolve('Prostowania na wyciągu');
 if(extension?.mechanicalDraft)assert.ok(c.span(pose('Prostowania na wyciągu',0).handL,pose('Prostowania na wyciągu',.5).handL)>50);
});
test('new constraint script is loaded ahead of landmark renderer and service worker caches the exact version',()=>{
 const html=fs.readFileSync(root+'legacy.html','utf8'),sw=fs.readFileSync(root+'sw.js','utf8'),index=fs.readFileSync(root+'index.html','utf8');
 for(const path of ['motion/landmark-constraints.js','motion/rig-renderer.js','motion/full-body-poses.js',
 'motion/exercises/catalog-rigs.js','motion/pose-constraints.js','motion/full-body-renderer.js','exercise-motion-embed.js']){
  const src=html.match(new RegExp('\\./'+path.replaceAll('.','\\.')+'\\?v=[^"]+'))?.[0];
  assert.ok(src,'loaded script: '+path);assert.ok(sw.includes('"'+src+'"'),'matching cache: '+path);
 }
 assert.ok(html.indexOf('motion/landmark-constraints.js')<html.indexOf('motion/rig-renderer.js'));
 const iframe=index.match(/\.\/legacy\.html\?v=[^"]+/)?.[0];
 assert.ok(sw.includes('"'+iframe+'"'),'iframe and sw version match');
});


test('all inverse ankle/wrist exercises are distinct and joints remain in place',()=>{
 const w=fixture(),lib=w.FitPlanMotionLibrary,c=w.FitPlanPoseConstraints;
 const pairs=[
  ['Nawracanie stopy z gumą','Odwracanie stopy z gumą','ankleEversion','ankleInversion','ankleL'],
  ['Prostowanie nadgarstków','Uginanie nadgarstków','wristExtension','wristCurl','handL']
 ];
 for(const [first,second,a,b,joint] of pairs){
  const one=lib.resolve(first),two=lib.resolve(second);
  if(!one?.mechanicalDraft||!two?.mechanicalDraft)continue;
  assert.equal(one.visual.pattern,a);assert.equal(two.visual.pattern,b);
  for(const d of [one,two]){
   const initial=c.pose(d.visual,lib.sample(d,0)),peak=c.pose(d.visual,lib.sample(d,.5));
   assert.ok(c.span(initial[joint],peak[joint])<.01,'local rotation must not translate '+joint);
  }
 }
});
test('stable landmine radius, dip ground clearance and step support survive a complete scrub',()=>{
 const w=fixture(),lib=w.FitPlanMotionLibrary,c=w.FitPlanPoseConstraints;
 const landmine=lib.resolve('Landmine press'),pivot=[260,363];
 const at=(d,percent)=>c.pose(d.visual,lib.sample(d,percent));
 if(landmine?.mechanicalDraft){
  const radius=c.span(at(landmine,0).handR,pivot);
  for(let i=0;i<=100;i++)assert.ok(Math.abs(c.span(at(landmine,i/100).handR,pivot)-radius)<.01,'bar must not telescope');
 }
 const dip=lib.resolve('Dipy');
 if(dip?.mechanicalDraft){
  assert.equal(dip.visual.support,'dip-bars');
  for(let i=0;i<=100;i++){
   const p=at(dip,i/100);
   assert.ok(p.ankleL[1]+7<=363,'feet must remain above ground');
   assert.ok(p.ankleR[1]+7<=363,'feet must remain above ground');
  }
 }
 const step=lib.resolve('Wejścia na stopień');
 if(step?.mechanicalDraft){
  assert.equal(step.visual.equipment,'step');
  assert.ok(c.span(at(step,0).ankleR,at(step,.5).ankleR)<.01);
  const top=at(step,.5);
  assert.ok(Math.abs(top.ankleL[1]+7-323)<2,'active foot on step surface');
 }
});
test('incomplete spatial exercises never advertise a validated mechanical preview',()=>{
 const w=fixture(),lib=w.FitPlanMotionLibrary;
 for(const [name,property] of [['Ćwiczenie muszla','previewUnavailable'],['Copenhagen plank','supportNotModeled'],
  ['Marsz pod górę','terrainNotModeled'],['Wall slides','requiresDepthVisualization'],['Arnold press','requiresDepthVisualization'],
  ['Face pull z rotacją','requiresDepthVisualization'],['Skakanka','equipmentNotModeled'],['Dorsiflexion raises','fineJointsNotModeled'],
  ['Prostowanie palców z gumą','fineJointsNotModeled'],['Podciąganie podchwytem','gripNotModeled']]){
  const definition=lib.resolve(name);if(definition?.mechanicalDraft)assert.equal(definition[property],true);
 }
 const embed=fs.readFileSync(root+'exercise-motion-embed.js','utf8');
 assert.match(embed,/if\(definition\.previewUnavailable\)\{/);
 assert.match(embed,/slider\.disabled=true/);
 assert.match(embed,/supportNotModeled/);
 assert.match(embed,/terrainNotModeled/);
 assert.match(embed,/gripNotModeled/);
});
test('SVG renderer rotates local wrist/foot diagrams in opposite directions and removes all scenes',()=>{
 const w=fixture();
 for(const script of ['motion/full-body-renderer.js','motion/renderer.js'])
  vm.runInNewContext(fs.readFileSync(root+script,'utf8'),{window:w,console},{filename:script});
 class Node {
  constructor(tag){this.tag=tag;this.attrs={};this.children=[];this.dataset={};this.style={};this.classList={add(){}};}
  setAttribute(key,val){this.attrs[key]=String(val);}
  append(...elements){this.children.push(...elements);}
  remove(){this.removed=true;}
 }
 let count=0;
 for(const item of w.FitPlanExerciseCatalog.items){
  const d=w.FitPlanMotionLibrary.resolve(item.name);if(!d?.mechanicalDraft)continue;
  const host={ownerDocument:{createElementNS:(uri,tag)=>new Node(tag)},style:{},dataset:{},append(svg){this.svg=svg;}};
  const renderer=w.FitPlanPoseRenderer.create(host,d);
  for(const step of [0,.25,.5,.75,1])renderer.setPose(w.FitPlanMotionLibrary.sample(d,step));
  assert.equal(host.svg.dataset.pose,'100');
  renderer.setPose(w.FitPlanMotionLibrary.sample(d,.5));
  if(d.visual.pattern==='ankleEversion')assert.equal(host.svg.dataset.footTilt,'27');
  if(d.visual.pattern==='ankleInversion')assert.equal(host.svg.dataset.footTilt,'-27');
  if(d.visual.pattern==='wristExtension')assert.equal(host.svg.dataset.wristTilt,'-36');
  if(d.visual.pattern==='wristCurl')assert.equal(host.svg.dataset.wristTilt,'36');
  renderer.dispose();assert.equal(host.svg.removed,true);
  count++;
 }
 assert.equal(count,w.FitPlanMotionCoverage.draftCount);
});

