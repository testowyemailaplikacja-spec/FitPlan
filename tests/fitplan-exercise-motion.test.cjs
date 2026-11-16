const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const {createFitPlan}=require("./fitplan-shell-harness.cjs");

test("bench press motion model exposes four real movement phases",()=>{
  const window={};
  const source=fs.readFileSync("apps/fitplan/exercise-motion.js","utf8");
  vm.runInNewContext(source,{window});
  const motion=window.FitPlanExerciseMotion;
  assert.ok(motion);
  assert.equal(motion.has("Wyciskanie sztangi na ławce płaskiej"),true);
  assert.equal(motion.has("Barbell Bench Press"),true);
  assert.equal(motion.has("Przysiady"),false);
  assert.equal(motion.phases.length,4);
  assert.deepEqual(Array.from(motion.phases,phase=>phase.label),["Tempo 1","Tempo 2","Tempo 3","Tempo 4"]);
  assert.ok(motion.phases.every(phase=>phase.cue.length>60));
  assert.match(source,/function project\(/);
  assert.match(source,/getContext\("2d"\)/);
});

test("bench press dialog renders controls and four separate phase windows",async t=>{
  const app=await createFitPlan(t);
  app.card("lista-cwiczen").click();
  await app.settle();
  const doc=app.w.document;
  const exercise=doc.querySelector('[data-fitplan-exercise="Wyciskanie sztangi na ławce płaskiej"]');
  assert.ok(exercise);
  assert.match(exercise.textContent,/Model 3D/);
  exercise.click();
  const model=doc.querySelector(".fitplan-motion");
  assert.ok(model);
  assert.equal(model.querySelectorAll(".fitplan-motion-phase-button").length,4);
  assert.equal(model.querySelectorAll(".fitplan-motion-phase-card").length,4);
  assert.ok(model.querySelector(".fitplan-motion-play"));
  assert.ok(model.querySelector('.fitplan-motion-range input[type="range"]'));
  model.querySelector('[data-motion-phase="2"]').click();
  assert.match(model.querySelector(".fitplan-motion-output").textContent,/Tempo 3/);
  assert.match(model.querySelector(".fitplan-motion-cue").textContent,/przedramiona/i);
  assert.deepEqual(app.errors,[]);
});

test("motion assets are versioned consistently in shell and offline package",()=>{
  const index=fs.readFileSync("apps/fitplan/index.html","utf8");
  const legacy=fs.readFileSync("apps/fitplan/legacy.html","utf8");
  const styles=fs.readFileSync("apps/fitplan/styles-loader.js","utf8");
  const worker=fs.readFileSync("apps/fitplan/sw.js","utf8");
  const iframe=index.match(/\.\/legacy\.html\?v=[^"]+/)?.[0];
  const exerciseList=index.match(/\.\/modules\/exercise-list\.js\?v=[^"]+/)?.[0];
  assert.ok(iframe&&worker.includes('"'+iframe+'"'),'iframe version cached');
  assert.ok(exerciseList&&worker.includes('"'+exerciseList+'"'),'exercise list version cached');
  const styleLoader=index.match(/\.\/styles-loader\.js\?v=([^"']+)/);
  assert.ok(styleLoader&&worker.includes(`"./styles-loader.js?v=${styleLoader[1]}"`));
  assert.match(legacy,/exercise-motion\.js\?v=20261020-motion-1/);
  assert.match(legacy,/exercise-details\.js\?v=20261023-training-curricula-2/);
  assert.match(styles,new RegExp(`VERSION="${styleLoader[1]}"`));
  for(const asset of [
    "./exercise-motion.js?v=20261020-motion-1",
    "./exercise-details.js?v=20261023-training-curricula-2",
    `./styles/core.css?v=${styleLoader[1]}`
  ])assert.ok(worker.includes(asset),asset);
});

