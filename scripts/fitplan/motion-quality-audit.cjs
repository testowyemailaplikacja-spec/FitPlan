'use strict';
// Read-only mechanical diagnostic for Work. No dependencies or external requests.
// node scripts/fitplan/motion-quality-audit.cjs --json
// node scripts/fitplan/motion-quality-audit.cjs --strict
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'../../apps/fitplan');
const scripts=['data/app-data.js','data/muscles.js','data/exercise-catalog.js','exercise-motion.js',
  'motion/library.js','motion/photographic-manifest.js','motion/photographic-catalog.js',
  'motion/full-body-poses.js','motion/exercises/catalog-rigs.js','motion/pose-constraints.js',
  'motion/landmark-constraints.js'];
const bones=[['shoulderL','hipL'],['shoulderR','hipR'],['shoulderL','elbowL'],['elbowL','handL'],
 ['shoulderR','elbowR'],['elbowR','handR'],['hipL','kneeL'],['kneeL','ankleL'],['hipR','kneeR'],['kneeR','ankleR']];
function load(){
 const window={};for(const script of scripts)vm.runInNewContext(
  fs.readFileSync(path.join(root,script),'utf8'),{window,globalThis:window,console},{filename:script});
 return window;
}
function angle(a,b,c){
 const u=[a[0]-b[0],a[1]-b[1]],v=[c[0]-b[0],c[1]-b[1]];
 const cosine=(u[0]*v[0]+u[1]*v[1])/(Math.hypot(...u)*Math.hypot(...v));
 return 180/Math.PI*Math.acos(Math.max(-1,Math.min(1,cosine)));
}
const round=x=>Math.round(x*100)/100;
function audit(){
 const w=load(),lib=w.FitPlanMotionLibrary,c=w.FitPlanPoseConstraints;
 const rows=fs.readFileSync(path.resolve(root,'../../docs/FITPLAN_EXERCISE_REVIEW_1_98.md'),'utf8')
  .split('\n').filter(v=>/^\| \d+ \|/.test(v)).map(v=>{
   const cells=v.split('|').map(x=>x.trim());return {number:+cells[1],name:cells[2]};});
 const errors=[],blockers=[],warnings=[],exercises=[];
 const add=(target,row,code,description,metrics={})=>target.push({number:row.number,name:row.name,code,description,...metrics});
 const catalogCount=w.FitPlanExerciseCatalog.items.length;
 if(rows.length!==catalogCount)errors.push({code:'ORDER_COUNT',actual:rows.length,expected:catalogCount});
 const coverage=w.FitPlanMotionCoverage;
 if(coverage.draftCount+coverage.existingCount!==catalogCount||coverage.unmapped.length||coverage.duplicates.length||coverage.unknown.length)
  errors.push({code:'COVERAGE',coverage});
 let poses=0,maxBoneDrift=0,maxJointJump=0,checked=0;
 const unique=new Set();
 for(const row of rows){
  if(unique.has(row.name))add(errors,row,'DUPLICATE','Duplicate in ordered review');
  unique.add(row.name);
  const item=w.FitPlanExerciseCatalog.get(row.name),def=lib.resolve(row.name);
  if(!item||(!def&&!w.FitPlanExerciseMotion.has(row.name))){
   add(errors,row,'MISSING','Missing catalog item or motion provider');continue;
  }
  if(def&&w.FitPlanExerciseMotion.has(row.name))add(errors,row,'OVERLAP','Two providers');
  if(!def?.mechanicalDraft){
   exercises.push({...row,kind:'separate',pattern:null});continue;
  }
  checked++;const base=c.pose(def.visual,lib.sample(def,0)),peak=c.pose(def.visual,lib.sample(def,.5));
  let maxStep=0,minElbow=180,minAt=0,prev=null;
  for(let i=0;i<=100;i++){
   const t=i/100,p=c.pose(def.visual,lib.sample(def,t));poses++;
   for(const [a,b] of bones){
    const delta=Math.abs(c.span(p[a],p[b])-c.span(base[a],base[b]));
    maxBoneDrift=Math.max(maxBoneDrift,delta);
    if(delta>.01)add(errors,row,'BONE_STRETCH','Segment length changes',{percent:i,segment:a+'-'+b,delta:round(delta)});
   }
   for(const [joint,v] of Object.entries(p)){
    if(!v.every((n,axis)=>Number.isFinite(n)&&n>=0&&n<=(axis?400:800)))
     add(errors,row,'OUTSIDE_CANVAS','Joint outside frame',{percent:i,joint,point:v});
    if(prev)maxStep=Math.max(maxStep,c.span(v,prev[joint]));
   }
   for(const side of ['L','R']){
    const ang=angle(p['shoulder'+side],p['elbow'+side],p['hand'+side]);
    if(ang<minElbow){minElbow=ang;minAt=i;}
   }
   prev=p;
  }
  maxJointJump=Math.max(maxJointJump,maxStep);
  if(maxStep>15)add(errors,row,'JUMP','Discontinuous limb movement',{maxStep:round(maxStep)});
  if(minElbow<20)add(blockers,row,'ACUTE_ELBOW','Extremely acute 2D elbow configuration',
    {minDegrees:round(minElbow),atPercent:minAt});
  const start=angle(base.shoulderL,base.elbowL,base.handL),
    end=angle(peak.shoulderL,peak.elbowL,peak.handL);
  if(def.visual.pattern==='overhead'&&end<start-30)
   add(blockers,row,'OVERHEAD_WRONG_DIRECTION','Press makes elbow flex while hand lifts',
    {startDegrees:round(start),peakDegrees:round(end)});
  if(def.previewUnavailable)add(blockers,row,'NO_MOTION','Preview deliberately disabled; needs a working model');
  for(const [property,code] of Object.entries({
   requiresDepthVisualization:'NEEDS_3D',supportNotModeled:'SUPPORT_MISSING',
   terrainNotModeled:'TERRAIN_MISSING',equipmentNotModeled:'EQUIPMENT_MISSING',
   fineJointsNotModeled:'SMALL_JOINTS_MISSING',gripNotModeled:'GRIP_MISSING',
   ambiguousExercise:'AMBIGUOUS_VARIANT'
  }))if(def[property])add(warnings,row,code,'Unresolved fidelity limitation');
  exercises.push({...row,kind:'draft2d',pattern:def.visual.pattern,maxStep:round(maxStep),
   minElbow:round(minElbow),startElbow:round(start),peakElbow:round(end)});
 }
 if(checked!==coverage.draftCount)errors.push({code:'DRAFT_COUNT',actual:checked,expected:coverage.draftCount});
 const bench=fs.readFileSync(path.join(root,'exercise-motion.js'),'utf8');
 if(/if\s*\(canDraw\s*&&\s*!reduceMotion\)\s*setPlaying\(true\)/.test(bench))
  add(warnings,{number:37,name:'Wyciskanie sztangi na ławce płaskiej'},'BENCH_AUTOPLAY',
   'Bench animation auto-plays for users without reduced-motion preference');
 return {schema:'FitPlanMotionQualityV1',summary:{
  catalog:catalogCount,ordered:rows.length,drafts:checked,patterns:w.FitPlanMotionTemplates.patterns.length,
  poses,maxBoneDrift:round(maxBoneDrift),maxJointJump:round(maxJointJump),
  errors:errors.length,blockers:blockers.length,warnings:warnings.length
 },errors,blockers,warnings,exercises};
}
if(require.main===module){
 const result=audit();
 if(process.argv.includes('--json'))console.log(JSON.stringify(result,null,2));
 else{
  console.log(JSON.stringify(result.summary,null,2));
  for(const item of [...result.errors,...result.blockers,...result.warnings])
   console.log('['+(item.number??'-')+'] '+(item.name??'')+' '+item.code+' '+(item.description??''));
 }
 if(process.argv.includes('--strict')&&(result.errors.length||result.blockers.length))process.exitCode=1;
}
module.exports={audit,angle};

