'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const root='apps/fitplan/';
const scripts=[
  'data/app-data.js','data/muscles.js','data/exercise-catalog.js','exercise-motion.js',
  'motion/library.js','motion/photographic-manifest.js','motion/photographic-catalog.js',
  'motion/full-body-poses.js','motion/exercises/catalog-rigs.js','motion/pose-constraints.js',
  'motion/full-body-renderer.js','motion/renderer.js'
];
function fixture() {
  const window={};
  for(const filename of scripts){
    vm.runInNewContext(fs.readFileSync(root+filename,'utf8'),{window,globalThis:window,console},{filename});
  }
  return window;
}
const bones=[
  ['shoulderL','hipL'],['shoulderR','hipR'],['shoulderL','elbowL'],['elbowL','handL'],
  ['shoulderR','elbowR'],['elbowR','handR'],['hipL','kneeL'],['kneeL','ankleL'],
  ['hipR','kneeR'],['kneeR','ankleR']
];
test('all remaining mechanical models preserve bone lengths and do not flip joints during scrub',()=>{
  const w=fixture(),lib=w.FitPlanMotionLibrary,fix=w.FitPlanPoseConstraints;
  let checked=0,worstJump=0,worstDrift=0;
  for(const item of w.FitPlanExerciseCatalog.items){
    const def=lib.resolve(item.name);
    if(!def?.mechanicalDraft)continue;
    const initial=def.visual.poses[0];let previous=null;
    for(let i=0;i<=100;i++){
      const at=i/100,pose=fix.pose(def.visual,lib.sample(def,at));
      assert.ok(pose,'missing pose '+item.name+' '+at);
      for(const [a,b] of bones){
        const len=fix.span(initial[a],initial[b]),current=fix.span(pose[a],pose[b]);
        const percent=100*Math.abs(len-current)/len;
        worstDrift=Math.max(worstDrift,percent);
        assert.ok(percent<0.01,'bone length changed: '+item.name+' '+a+'–'+b+' '+at);
      }
      for(const [name,xy] of Object.entries(pose)){
        assert.ok(xy[0]>=0&&xy[0]<=800&&xy[1]>=0&&xy[1]<=400,'joint outside canvas: '+item.name+' '+name);
        if(previous){
          const movement=fix.span(xy,previous[name]);worstJump=Math.max(worstJump,movement);
          assert.ok(movement<15,'unexpected joint flip: '+item.name+' '+name+' '+at);
        }
      }
      previous=pose;
    }
    checked++;
  }
  assert.equal(checked,w.FitPlanMotionCoverage.draftCount);
  assert.ok(worstDrift<0.01);
  assert.ok(worstJump<15);
});
test('exercise-specific variants and bench equipment have correct mapping',()=>{
  const w=fixture(),lib=w.FitPlanMotionLibrary;
  for(const [name,pattern] of [['Sumo squat','sumoSquat'],['Arnold press','arnold'],['Face pull z rotacją','facePullRotated'],['Carries','walk']]){
    const definition=lib.resolve(name);
    if(definition?.mechanicalDraft)assert.equal(definition.visual.pattern,pattern);
  }
  const press=lib.resolve('Wyciskanie hantli na ławce dodatniej');
  if(press?.mechanicalDraft){
    assert.equal(press.visual.equipment,'dumbbell');
    assert.equal(press.visual.support,'incline-bench');
  }
  const close=lib.resolve('Wyciskanie wąsko');
  if(close?.mechanicalDraft)assert.equal(close.visual.equipment,'barbell');
  const sumo=lib.resolve('Sumo squat'),standard=lib.resolve('Przysiady');
  if(sumo?.mechanicalDraft&&standard?.mechanicalDraft)
    assert.notEqual(sumo.visual.poses[0].ankleL[0],standard.visual.poses[0].ankleL[0]);
});
class Node {
  constructor(tag){this.tag=tag;this.attrs={};this.children=[];this.style={};this.dataset={};this.classList={add:()=>{}};}
  append(...children){this.children.push(...children);}
  setAttribute(name,val){this.attrs[name]=String(val);}
  getAttribute(name){return this.attrs[name];}
  remove(){this.removed=true;}
}
function find(node,predicate){
  if(predicate(node))return node;
  for(const child of node.children){
    const found=find(child,predicate);if(found)return found;
  }
  return null;
}
test('all draft SVG renderers open, scrub, keep the head attached and dispose cleanly',()=>{
  const w=fixture();let checked=0;
  for(const item of w.FitPlanExerciseCatalog.items){
    const def=w.FitPlanMotionLibrary.resolve(item.name);
    if(!def?.mechanicalDraft)continue;
    const host={ownerDocument:{createElementNS:(ns,tag)=>new Node(tag)},style:{},dataset:{},append(svg){this.svg=svg;}};
    const player=w.FitPlanPoseRenderer.create(host,def);
    assert.equal(host.dataset.renderer,'mechanical-draft');
    for(const progress of [0,.25,.5,.75,1]){
      player.setPose(w.FitPlanMotionLibrary.sample(def,progress));
      assert.equal(host.svg.dataset.pose,String(progress*100));
    }
    const headGroup=find(host.svg,node=>node.attrs['data-part']==='head');
    assert.ok(headGroup,'head group '+item.name);
    const headEllipse=headGroup.children.find(node=>node.tag==='ellipse');
    assert.ok(headEllipse);
    assert.equal(headEllipse.attrs.cx,undefined,'head must not be offset a second time');
    assert.match(headGroup.attrs.transform,/translate\(/);
    player.dispose();assert.equal(host.svg.removed,true);
    checked++;
  }
  assert.equal(checked,w.FitPlanMotionCoverage.draftCount);
});
test('geometry solver loads before renderer and offline cache matches iframe version',()=>{
  const legacy=fs.readFileSync(root+'legacy.html','utf8');
  const worker=fs.readFileSync(root+'sw.js','utf8');
  const index=fs.readFileSync(root+'index.html','utf8');
  const scripts=['motion/full-body-poses.js','motion/exercises/catalog-rigs.js',
    'motion/pose-constraints.js','motion/full-body-renderer.js','motion/renderer.js'];
  let previous=-1;
  for(const filename of scripts){
    const match=legacy.match(new RegExp('\\./'+filename.replaceAll('.','\\.')+'\\?v=[^"]+'));
    assert.ok(match,filename+' missing from legacy');
    assert.ok(worker.includes('"'+match[0]+'"'),filename+' missing from SW');
    const place=legacy.indexOf(match[0]);assert.ok(place>previous,'script order '+filename);previous=place;
  }
  const frameVersion=index.match(/\.\/legacy\.html\?v=[^"]+/)?.[0];
  assert.ok(frameVersion);assert.ok(worker.includes('"'+frameVersion+'"'));
});

