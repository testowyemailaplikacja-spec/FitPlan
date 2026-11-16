'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
const path=require('node:path');
const {audit,angle}=require('../scripts/fitplan/motion-quality-audit.cjs');
const SCRIPT=path.join(__dirname,'../scripts/fitplan/motion-quality-audit.cjs');
test('all numbered exercises have no coverage or geometric integrity failures',()=>{
 const report=audit();
 assert.equal(report.schema,'FitPlanMotionQualityV1');
 assert.equal(report.summary.catalog,report.summary.ordered);
 assert.ok(report.summary.catalog>=98);
 assert.ok(report.summary.drafts<=report.summary.catalog);
 assert.equal(report.summary.poses,report.summary.drafts*101);
 assert.deepEqual(report.errors,[],'must resolve every pure geometry/integrity regression');
 assert.ok(report.summary.maxJointJump<=15);
 assert.ok(report.summary.maxBoneDrift<.01);
 assert.equal(report.exercises.length,report.summary.catalog);
 assert.equal(new Set(report.exercises.map(x=>x.name)).size,report.summary.catalog);
 for(const [index,item] of report.exercises.entries())assert.equal(item.number,index+1);
});
test('every severe flexion and reversed press is detected from measured coordinates',()=>{
 const report=audit();
 for(const issue of report.blockers){
  assert.ok(Number.isInteger(issue.number)&&issue.number>=1&&issue.number<=report.summary.catalog,JSON.stringify(issue));
  assert.ok(report.exercises.some(row=>row.number===issue.number&&row.name===issue.name));
  if(issue.code==='ACUTE_ELBOW'){
   assert.ok(issue.minDegrees>=0&&issue.minDegrees<20);
   assert.ok(issue.atPercent>=0&&issue.atPercent<=100);
  } else if(issue.code==='OVERHEAD_WRONG_DIRECTION'){
   assert.ok(issue.startDegrees-issue.peakDegrees>30);
  } else assert.equal(issue.code,'NO_MOTION');
 }
});
test('read-only CLI emits parseable JSON and --strict matches unsolved blockers',()=>{
 const result=audit();
 const normal=spawnSync(process.execPath,[SCRIPT,'--json'],{encoding:'utf8'});
 assert.equal(normal.status,0,normal.stderr);
 const json=JSON.parse(normal.stdout);
 assert.deepEqual(json.summary,result.summary);
 const strict=spawnSync(process.execPath,[SCRIPT,'--strict'],{encoding:'utf8'});
 assert.equal(strict.status,(result.errors.length||result.blockers.length)?1:0);
});
test('elbow angle helper normalizes physical extremes',()=>{
 assert.ok(Math.abs(angle([0,1],[0,0],[0,-1])-180)<.0001);
 assert.ok(Math.abs(angle([1,0],[0,0],[0,1])-90)<.0001);
 assert.ok(Math.abs(angle([1,0],[0,0],[1,0]))<.0001);
});

