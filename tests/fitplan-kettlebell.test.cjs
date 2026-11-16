const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const {createFitPlan}=require("./fitplan-shell-harness.cjs");

test("kettlebell catalogue has distinct areas and four increasing exercise tiers",()=>{
 const window={};
 vm.runInNewContext(fs.readFileSync("apps/fitplan/data/kettlebell-catalog.js","utf8"),{window});
 const lib=window.FitPlanKettlebellCatalog;
 assert.equal(lib.items.length,31);
 assert.equal(lib.areas.length,10);
 assert.deepEqual(Array.from(lib.areas,x=>x.id),["full","shoulders","legs","abs","back","chest","arms","glutes","grip","custom"]);
 assert.equal(Object.keys(lib.levels).length,4);
 const sizes=["poczatkujacy","sredniozaawansowany","zaawansowany","zawodowiec"].map(level=>lib.available(level).length);
 assert.ok(sizes.every((x,i)=>x>0&&(i===0||x>sizes[i-1])));
 assert.ok(lib.available("poczatkujacy").every(x=>x.minLevel===1));
 assert.ok(lib.available("poczatkujacy","chest").length>0);
 assert.ok(lib.available("poczatkujacy","shoulders").length>0);
 assert.equal(lib.available("poczatkujacy").some(x=>x.id==="kb-snatch"),false);
 assert.equal(lib.available("zawodowiec").some(x=>x.id==="kb-snatch"),true);
 for(const goal of lib.areas.filter(x=>x.id!=="custom")){
  assert.ok(lib.suggest("poczatkujacy",goal.id).length>0,goal.id);
  assert.ok(lib.suggest("poczatkujacy",goal.id).every(id=>lib.available("poczatkujacy",goal.id).some(x=>x.id===id)));
 }
 assert.deepEqual(Array.from(lib.suggest("poczatkujacy","custom")),[]);
});

test("each training kind preserves an independent four-level choice",async t=>{
 const app=await createFitPlan(t);
 app.w.FitPlanApp.open("plan-treningowy");await app.settle();
 const d=app.w.document;
 const kinds=Array.from(d.querySelectorAll("[data-fpk-plan]"),b=>b.dataset.fpkPlan);
 assert.equal(kinds.length,11);
 for(const kind of kinds.filter(x=>x!=="kettlebell")){
  d.querySelector('[data-fpk-plan="'+kind+'"]').click();
  assert.equal(d.getElementById("fpkKettlebellFlow").hidden,false);
  const choice=kind==="fbw"?d.querySelector('#fpkKbGoalGrid [data-fpk-kb-goal="full"]'):d.querySelector("#fpkKbGoalGrid [data-fpk-kb-goal]");
  assert.ok(choice,kind);choice.click();
  assert.equal(d.querySelectorAll("#fpkKbLevels [data-fpk-kb-level]").length,4);
  d.querySelector('[data-fpk-kb-level="zaawansowany"]').click();
  assert.equal(app.w.localStorage.getItem("fitplan."+kind+".level.v1"),"zaawansowany");
  d.getElementById("fpkKbBackToLevel").click();
 }
 assert.deepEqual(app.errors,[]);
});

test("new FBW home/gym choices transfer selected plan to Start without losing original planner",async t=>{
 const app=await createFitPlan(t),w=app.w,d=w.document;
 w.FitPlanApp.open("plan-treningowy");await app.settle();
 d.querySelector('[data-fpk-plan="fbw"]').click();
 assert(d.querySelector('[data-fpk-kb-goal="fbw-home"]'));
 assert(d.querySelector('[data-fpk-kb-goal="fbw-gym"]'));
 d.querySelector('[data-fpk-kb-goal="fbw-gym"]').click();await app.settle();
 assert.equal(w.FitPlanModules.active,"start");
 assert.equal(d.getElementById("fpsPresetProgram").value,"fbw-gym");
 assert.equal(d.getElementById("fpsPanelPlan").hidden,false);
 assert.deepEqual(app.errors,[]);
});
test("kettlebell level leads to goals; choice can be edited and launched in Start timer",async t=>{
 const app=await createFitPlan(t);
 app.w.FitPlanApp.open("plan-treningowy");await app.settle();
 const w=app.w,d=w.document;
 d.querySelector('[data-fpk-plan="kettlebell"]').click();
 assert.equal(d.getElementById("fpkKettlebellFlow").hidden,false);
 assert.equal(d.getElementById("fpkChooser").hidden,true);
 assert.equal(d.getElementById("fpkKettlebellFlow").hidden,false);
 assert.equal(d.querySelectorAll("[data-fpk-kb-goal]").length,10);
 d.querySelector('[data-fpk-kb-goal="legs"]').click();
 assert.equal(d.getElementById("fpkKbDiscover").hidden,false);
 assert.ok(d.querySelectorAll("#fpkKbPrimary .fpk-kb-role-card").length>0);
 assert.ok(d.querySelectorAll("#fpkKbSecondary .fpk-kb-role-card").length>0);
 d.querySelector('[data-fpk-kb-level="poczatkujacy"]').click();
 assert.equal(d.getElementById("fpkKbEditor").hidden,false);
 assert.ok(d.querySelectorAll("#fpkKbSelectedList li").length>0);
 assert.equal(d.querySelector('[data-fpk-kb-add="kb-snatch"]'),null);
 d.getElementById("fpkKbSave").click();
 const stored=w.localStorage.getItem("fitplan.kettlebell.selection.v1.poczatkujacy.legs");
 assert.ok(Array.isArray(JSON.parse(stored)));
 d.getElementById("fpkKbLaunch").click();await app.settle();
 assert.equal(w.FitPlanModules.active,"start");
 assert.equal(d.getElementById("fpsPanelTimer").hidden,false);
 assert.match(d.getElementById("fpsSessionName").textContent,/Kettlebell.*Nogi.*Początkujący/);
 assert.equal(d.getElementById("fpsRemaining").textContent,"03:00");
 assert.match(d.getElementById("fpsTimerSummary").textContent,/czas całego zestawu/);
 assert.equal(d.getElementById("fpsTimerStart").disabled,false);
 assert.deepEqual(app.errors,[]);
});

test("custom kettlebell selection starts empty and remains distinct per level",async t=>{
 const app=await createFitPlan(t);
 app.w.FitPlanApp.open("plan-treningowy");await app.settle();
 const w=app.w,d=w.document;
 d.querySelector('[data-fpk-plan="kettlebell"]').click();
 d.querySelector('[data-fpk-kb-goal="custom"]').click();
 d.querySelector('[data-fpk-kb-level="sredniozaawansowany"]').click();
 assert.equal(d.querySelectorAll("#fpkKbSelectedList li").length,0);
 assert.equal(d.getElementById("fpkKbLaunch").disabled,true);
 const add=d.querySelector("#fpkKbAvailable [data-fpk-kb-add]");
 assert.ok(add);add.click();
 assert.equal(d.querySelectorAll("#fpkKbSelectedList li").length,1);
 d.getElementById("fpkKbSave").click();
 assert.equal(JSON.parse(w.localStorage.getItem("fitplan.kettlebell.selection.v1.sredniozaawansowany.custom")).length,1);
 d.getElementById("fpkKbBackToGoals").click();
 d.querySelector('[data-fpk-kb-level="sredniozaawansowany"]').click();
 assert.equal(d.querySelectorAll("#fpkKbSelectedList li").length,1);
 d.getElementById("fpkKbBackToGoals").click();
 d.querySelector('[data-fpk-kb-level="poczatkujacy"]').click();
 assert.equal(d.querySelectorAll("#fpkKbSelectedList li").length,0);
 assert.deepEqual(app.errors,[]);
});

test("Start Random kettlebell shortcut opens the same goal chooser with stored level",async t=>{
 const app=await createFitPlan(t);
 const w=app.w,d=w.document;
 w.localStorage.setItem("fitplan.kettlebell.level.v1","poczatkujacy");
 w.FitPlanApp.open("start");await app.settle();
 d.querySelector('[data-fps-tab="random"]').click();
 assert.ok(d.getElementById("fpsOpenKettlebell"));
 d.getElementById("fpsOpenKettlebell").click();await app.settle();
 assert.equal(w.FitPlanModules.active,"plan-treningowy");
 assert.equal(d.getElementById("fpkKettlebellFlow").hidden,false);
 assert.equal(d.getElementById("fpkKbGoals").hidden,false);
 assert.equal(d.getElementById("fpkKbEditor").hidden,true);
 assert.ok(d.querySelector('[data-fpk-kb-goal="full"]'));
 assert.deepEqual(app.errors,[]);
});
