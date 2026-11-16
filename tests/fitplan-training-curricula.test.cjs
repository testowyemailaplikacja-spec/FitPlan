const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const {createFitPlan}=require("./fitplan-shell-harness.cjs");
function readSource(){
 const window={};
 for(const file of ["muscles.js","exercise-catalog.js","kettlebell-catalog.js","training-extensions.js","exercise-registry.js"])
   vm.runInNewContext(fs.readFileSync("apps/fitplan/data/"+file,"utf8"),{window});
 return window;
}
const choose=(d,sport,goal,level="poczatkujacy")=>{
 d.querySelector('[data-fpk-plan="'+sport+'"]').click();
 const tile=d.querySelector('[data-fpk-kb-goal="'+goal+'"]');
 assert.ok(tile,"Missing goal "+goal+" of "+sport);tile.click();
 assert.equal(d.getElementById("fpkKbDiscover").hidden,false);
 assert.ok(d.querySelector("#fpkKbLevels [data-fpk-kb-level]"));
 d.querySelector('[data-fpk-kb-level="'+level+'"]').click();
 assert.equal(d.getElementById("fpkKbEditor").hidden,false);
};
test("single repository data source resolves every calisthenics stage and martial arts drill",()=>{
 const {FitPlanExerciseRegistry:r,FitPlanTrainingExtensions:x}=readSource();
 assert.equal(x.items.length,164);
 assert.equal(r.items.length,287);
 assert.equal(x.progressions.length,13);
 assert.equal(x.combat.length,16);
 assert.equal(new Set(r.items.map(x=>x.displayName.toLowerCase().replaceAll("'",""))).size,r.items.length);
 const movements=[...x.progressions.flatMap(track=>track.stages.flatMap(s=>s.moves)),...x.combat.flatMap(c=>c.moves)];
 assert.ok(movements.length>=140);
 for(const name of movements)assert.ok(r.get(name),"Unresolved exercise: "+name);
 for(const item of x.items){const canonical=r.get(item.id);assert.ok(canonical,"Missing "+item.id);assert.equal(canonical.muscleProfile.status,"qualitative");assert.ok(canonical.muscleProfile.primary.length>0);
  assert.ok([...canonical.muscleProfile.primary,...canonical.muscleProfile.secondary].every(z=>z.share===null));
 }
});
test("stage graphs contain preparation before demanding skills, no repeated exercise definitions",()=>{
 const {FitPlanTrainingExtensions:x}=readSource();
 const byId=id=>x.progressions.find(p=>p.id===id);
 for(const id of ["pullup","high-pull","dips","muscle-up","planche","dragon","front-lever","back-lever","handstand","lsit","pistol","flag","acro"])assert.ok(byId(id));
 const mu=byId("muscle-up");
 assert.ok(mu.stages[0].moves.some(x=>x.includes("Pull-Up")));
 assert.ok(mu.stages.some(s=>s.moves.includes("Dips")));
 assert.ok(mu.stages.some(s=>s.moves.includes("Chest-to-Bar Pull-Up")));
 assert.ok(mu.stages.some(s=>s.moves.includes("Low-Bar Muscle-Up Transition")));
 assert.equal(mu.stages.at(-1).moves.at(-1),"Strict Bar Muscle-Up");
 assert.equal(byId("planche").stages.at(-1).moves.at(-1),"Full Planche");
 assert.equal(byId("dragon").stages.at(-1).moves.at(-1),"Dragon Flag");
 assert.equal(byId("acro").coach,true);
 assert.ok(byId("acro").stages.at(-1).moves.includes("Back Tuck Somersault"));
});
test("a shared goal/level/editor is available across every training family",async t=>{
 const app=await createFitPlan(t);app.w.FitPlanApp.open("plan-treningowy");await app.settle();
 const w=app.w,d=w.document;
 const goals={
 "kettlebell":"back","crossfit":"strength","kalistenika":"chest","split":"back",
 "fbw":"legs","push-pull":"push","sztuki-walki":"straights",
 "rozciaganie":"shoulders","joga":"yoga-balance","brzuch":"full"};
 for(const [sport,goal] of Object.entries(goals)){
  choose(d,sport,goal);
  assert.equal(w.localStorage.getItem("fitplan."+sport+".level.v1"),"poczatkujacy");
  assert.ok(d.getElementById("fpkKbAvailable").children.length,sport);
  d.getElementById("fpkKbBackToLevel").click();
 }
 // WIEDORA-CHANGE: WD-20261101-WIE-005-CURRENT-POOL-01 | TASK: WIE-005 | AUTHOR: Codex / GPT-6 (pełna wersja nieustalona)
 // The dedicated three-tier push-up program intentionally replaces the generic editor.
 d.querySelector('[data-fpk-plan="100-pompek"]').click();
 d.querySelector('[data-fpk-kb-goal="pushup-100"]').click();
 assert.equal(d.getElementById('fpkPushup100').hidden,false);
 assert.equal(d.getElementById('fpkKbDiscover').hidden,true);
 assert.deepEqual(app.errors,[]);
});
test("combat sport lesson has low kicks, straight punches, uppercuts and stamina workouts",async t=>{
 const app=await createFitPlan(t);app.w.FitPlanApp.open("plan-treningowy");await app.settle();
 const w=app.w,d=w.document;
 d.querySelector('[data-fpk-plan="sztuki-walki"]').click();
 for(const goal of ["straights","hooks","uppercuts","low-kick","teep","roundhouse","side-kick","front-kick","back-kick","aerobic","anaerobic","endurance"]){
  assert.ok(d.querySelector('[data-fpk-kb-goal="'+goal+'"]'),goal);
 }
 d.querySelector('[data-fpk-kb-goal="low-kick"]').click();
 assert.match(d.getElementById("fpkKbPrimary").textContent,/Low Round Kick/);
 d.querySelector('[data-fpk-kb-level="sredniozaawansowany"]').click();
 assert.ok(d.getElementById("fpkKbSelectedList").textContent.includes("Low Round Kick"));
 d.getElementById("fpkKbLaunch").click();await app.settle();
 assert.equal(w.FitPlanModules.active,"start");
 assert.match(d.getElementById("fpsSessionName").textContent,/Sztuki walki/);
 assert.deepEqual(app.errors,[]);
});
// WIEDORA-CHANGE: WD-20261101-WIE-115-CALISTHENICS-01 | TASK: WIE-115 | AUTHOR: ChatGPT / GPT-6
test("calisthenics goal academy opens muscle-up stages, requires self-assessment and creates FBW A/B",async t=>{
 const app=await createFitPlan(t);app.w.FitPlanApp.open("plan-treningowy");await app.settle();
 const w=app.w,d=w.document;
 d.querySelector('[data-fpk-plan="kalistenika"]').click();
 assert.equal(d.querySelectorAll('[data-fpk-skill]').length,25);
 d.querySelector('[data-fpk-skill="muscle-up"]').click();
 assert.equal(d.getElementById("fpkSkillDetails").hidden,false);
 const steps=[...d.querySelectorAll(".fpk-cali-step")];
 assert.equal(steps.length,5);
 assert.match(steps[0].textContent,/Band-Assisted Pull-Up/);
 assert.match(steps.at(-1).textContent,/Strict Bar Muscle-Up/);
 const setup=d.querySelector("#fpkSkillDetails .fpk-cali-panel");
 assert.ok(setup);
 const select=setup.querySelector("select");
 select.value="1";
 const inputs=[...setup.querySelectorAll('input[type="checkbox"]')];
 assert.equal(inputs.length,2);
 const startButton=setup.querySelector("button.primary");
 startButton.click();
 assert.match(d.querySelector("#fpkSkillDetails .fpk-cali-status").textContent,/sprzętu/i);
 inputs[1].checked=true;
 startButton.click();
 assert.match(d.querySelector("#fpkSkillDetails .fpk-cali-status").textContent,/poprzednich/i);
 inputs[0].checked=true;
 startButton.click();
 const saved=JSON.parse(w.localStorage.getItem("fitplan.calisthenics.path.v1.muscle-up"));
 assert.equal(saved.stageIndex,1);
 assert.equal(saved.logs.length,0);
 assert.equal(d.querySelectorAll("#fpkSkillDetails .fpk-cali-session").length,2);
 assert.equal(d.querySelectorAll("#fpkSkillDetails .fpk-cali-set-grid input").length,11);
 assert.deepEqual(app.errors,[]);
});
test("abdominal and 100-push-up plans expose purpose-built goals",async t=>{
 const app=await createFitPlan(t);app.w.FitPlanApp.open("plan-treningowy");await app.settle();
 const d=app.w.document;
 d.querySelector('[data-fpk-plan="brzuch"]').click();
 const abs=[...d.querySelectorAll('[data-fpk-kb-goal]')].map(x=>x.dataset.fpkKbGoal);
 for(const id of ["rectus-upper","rectus-lower","obliques","anti-extension","anti-rotation"])assert.ok(abs.includes(id),id);
 assert.match(d.getElementById("fpkGoalInfo").textContent,/akcent treningowy/i);
 d.getElementById("fpkKbBackToLevel").click();
 d.querySelector('[data-fpk-plan="100-pompek"]').click();
 const push=[...d.querySelectorAll('[data-fpk-kb-goal]')].map(x=>x.dataset.fpkKbGoal);
 assert.deepEqual(push,["pushup-100","custom"]);
 assert.match(d.getElementById("fpkGoalInfo").textContent,/100 pompek w jednej serii/i);
});
test("yoga uses thematic practice areas instead of generic muscle groups",async t=>{
 const app=await createFitPlan(t);app.w.FitPlanApp.open("plan-treningowy");await app.settle();
 const d=app.w.document;
 d.querySelector('[data-fpk-plan="joga"]').click();
 const goals=[...d.querySelectorAll('[data-fpk-kb-goal]')];
 assert.deepEqual(goals.map(x=>x.dataset.fpkKbGoal),[
  "yoga-flow","yoga-breath","yoga-balance","yoga-mobility","yoga-core","yoga-backbend","yoga-inversions","custom"
 ]);
 assert.match(goals.map(x=>x.textContent).join(" "),/Oddech i regeneracja/);
 assert.match(goals.map(x=>x.textContent).join(" "),/Przygotowanie do pozycji odwróconych/);
 for(const id of ["yoga-breath","yoga-balance","yoga-mobility","yoga-core","yoga-backbend","yoga-inversions"]){
  d.querySelector('[data-fpk-kb-goal="'+id+'"]').click();
  assert.ok(d.getElementById("fpkKbPrimary").children.length,id+" must contain matching exercises");
  d.getElementById("fpkKbBrowseBack").click();
 }
 assert.deepEqual(app.errors,[]);
});
test("offline bundle includes expanded catalogue ahead of registry and versioned planner",()=>{
 const legacy=fs.readFileSync("apps/fitplan/legacy.html","utf8");
 const sw=fs.readFileSync("apps/fitplan/sw.js","utf8");
 const index=fs.readFileSync("apps/fitplan/index.html","utf8");
 assert.ok(legacy.indexOf("training-extensions.js")<legacy.indexOf("exercise-registry.js"));
 for(const part of ["training-extensions.js?v=20261101-cali-1","exercise-registry.js?v=20261023-training-curricula-2"])assert.ok(sw.includes(part),part);
 const startScript=index.match(/src="\.\/(modules\/start\.js\?v=[^\"]+)"/);
 assert.ok(startScript, 'the timer must use a versioned script');
 assert.ok(sw.includes(startScript[1]), 'the offline timer must match the active timer script');
 // WIEDORA-CHANGE: WD-20261101-WIE-005-CURRENT-POOL-01 | TASK: WIE-005 | AUTHOR: Codex / GPT-6 (pełna wersja nieustalona)
 const plannerScript=index.match(/src="\.\/(modules\/workout-plan\.js\?v=[^\"]+)"/);
 assert.ok(plannerScript,'planner script must be versioned');
 assert.ok(sw.includes(plannerScript[1]),'offline planner must match the active script');
});
