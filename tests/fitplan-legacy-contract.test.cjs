const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");

const legacy=fs.readFileSync("apps/fitplan/legacy.html","utf8");
const router=fs.readFileSync("apps/fitplan/router.js","utf8");
const calendar=fs.readFileSync("apps/fitplan/calendar-enhancement.js","utf8");
const loader=fs.readFileSync("apps/fitplan/calendar-loader.js","utf8");
const index=fs.readFileSync("apps/fitplan/index.html","utf8");
const appData=fs.readFileSync("apps/fitplan/data/app-data.js","utf8");
const runtime=fs.readFileSync("apps/fitplan/runtime-loader.js","utf8");
const sw=fs.readFileSync("apps/fitplan/sw.js","utf8");
function shellAsset(file){
  const tag=[...index.matchAll(/<script src="([^" ]+)"/g)].find(match=>match[1].split("?")[0]==="./"+file);
  assert.ok(tag,"missing shell script: "+file);
  assert.match(tag[1],/\?v=.+/,"shell dependencies must be versioned");
  assert.ok(sw.includes(tag[1]),"offline cache must use the exact shell script URL: "+tag[1]);
  return tag[1];
}

test("FitPlan legacy keeps core navigation and exercise-table contracts",()=>{
  for(const token of [
    'function openSection(id)','function goHome()',
    'function switchTab(tab)',
  ]) assert.ok(legacy.includes(token),"missing legacy contract: "+token);
  const anatomy=fs.readFileSync("apps/fitplan/modules/anatomy.js","utf8");
  assert.match(anatomy,/atlas\.mount\(target\)/);
  assert.match(anatomy,/FitAtlas\?\.dispose\(\)/);
  assert.doesNotMatch(legacy,/FitAtlas|fitplan-model-data/);
});

test("router is the only extension allowed to wrap legacy navigation",()=>{
  assert.match(router,/wrap\(w,"openSection"/);
  assert.match(router,/wrap\(w,"goHome"/);
  assert.match(router,/wrap\(w,"switchTab"/);
  assert.doesNotMatch(calendar,/window\.openSection|__fpc|__orig/);
  assert.doesNotMatch(loader,/openSection|goHome|switchTab/);
});

test("calendar is isolated from sibling module visibility",()=>{
  assert.doesNotMatch(calendar,/fpcHidden|dataset\.fpcHidden/);
  assert.doesNotMatch(calendar,/querySelectorAll\('\[data-fpc-hidden/);
  assert.doesNotMatch(calendar,/r\.style\.position\s*=\s*["']absolute/,"calendar must remain in its module's normal layout");
  assert.ok(fs.readFileSync("apps/fitplan/core/storage.js","utf8").includes('fitplan.calendar.entries.v2'),"calendar storage key must remain stable");
});

test("calendar asset versions are aligned",()=>{
  const inner=loader.match(/calendar-enhancement\.js\?v=([^"']+)/)?.[1];
  const outer=index.match(/calendar-loader\.js\?v=([^"']+)/)?.[1];
  assert.equal(inner,outer);
});

test("FitPlan shell keeps legacy iframe and external router boundaries",()=>{
  assert.match(index,/id="appFrame" src="\.\/legacy\.html(?:\?v=[^" ]+)?"/);
  assert.match(index,/src="\.\/router\.js\?v=[^\" ]+"/);
  assert.match(index,/src="\.\/calendar-loader\.js\?v=/);
});


test("FitPlan extracted app data keeps all module identities",()=>{
  const context={window:{}};
  vm.runInNewContext(appData,context);
  assert.deepEqual(Array.from(context.window.FitPlanData.modules,module=>module.id),[
    "kalendarz-treningowy","podsumowanie-wynikow","plan-treningowy","dieta","tabela-cwiczen","lista-cwiczen","start"
  ]);
  assert.equal(context.window.FitPlanData.categoryMeta.deep,"Mięśnie głębokie");
});


test("FitPlan split styles are loaded outside the legacy monolith",()=>{
  const styleLoader=fs.readFileSync("apps/fitplan/styles-loader.js","utf8");
  const coreCss=fs.readFileSync("apps/fitplan/styles/core.css","utf8");
  const anatomyCss=fs.readFileSync("apps/fitplan/styles/anatomy.css","utf8");
  const sw=fs.readFileSync("apps/fitplan/sw.js","utf8");
  shellAsset("styles-loader.js");
  assert.match(styleLoader,/\.\/styles\/core\.css/);
  assert.match(styleLoader,/\.\/styles\/anatomy\.css/);
  assert.match(coreCss,/\.section-grid/);
  assert.doesNotMatch(coreCss,/\.fp-stage/);
  assert.match(anatomyCss,/\.fp-stage/);
  assert.match(anatomyCss,/\.fp-muscle-card/);
  assert.match(sw,/\.\/styles\/core\.css/);
  assert.match(sw,/\.\/styles\/anatomy\.css/);
});


test("FitPlan stage 6 exposes a guarded runtime boundary outside legacy",()=>{
  const sw=fs.readFileSync("apps/fitplan/sw.js","utf8");
  assert.match(index,/src="\.\/runtime-loader\.js\?v=20261006-stage13"/);
  assert.match(runtime,/FitPlanRuntime/);
  assert.match(runtime,/fitplan:runtime:ready/);
  assert.match(runtime,/required=\["openSection","goHome","switchTab"\]/);
  assert.doesNotMatch(runtime,/localStorage|sessionStorage/);
  assert.doesNotMatch(runtime,/__orig|__portalWrapped/);
  assert.match(sw,/\.\/runtime-loader\.js\?v=20261006-stage13/);
  assert.match(sw,/portal-offline-/);
});


test("FitPlan extracted progress service preserves the legacy storage contract",()=>{
  const progress=fs.readFileSync("apps/fitplan/progress.js","utf8");
  const sw=fs.readFileSync("apps/fitplan/sw.js","utf8");
  const store=new Map([["planer-treningowy-progress-v1.6",'{"completed":{"dieta":true}}']]);
  class Event{constructor(type){this.type=type}}
  const window={addEventListener:()=>{}};
  const context={window,document:{getElementById:()=>null},CustomEvent:Event,localStorage:{getItem:key=>store.get(key)??null,setItem:(key,value)=>store.set(key,String(value))}};
  window.dispatchEvent=()=>{};
  for(const source of [appData,fs.readFileSync("apps/fitplan/core/storage.js","utf8"),fs.readFileSync("apps/fitplan/core/state.js","utf8"),progress])vm.runInNewContext(source,context);
  assert.equal(window.FitPlanProgress.key,"planer-treningowy-progress-v1.6");
  assert.equal(window.FitPlanProgress.isCompleted("dieta"),true);
  window.FitPlanProgress.setCompleted("plan-treningowy",true);
  assert.equal(JSON.parse(store.get("planer-treningowy-progress-v1.6")).completed["plan-treningowy"],true);
  assert.match(index,/src="\.\/progress\.js\?v=20261006-stage13"/);
  assert.match(sw,/\.\/progress\.js\?v=20261006-stage13/);
});


test("FitPlan stage 6 app controller depends on runtime instead of legacy globals",()=>{
  const controller=fs.readFileSync("apps/fitplan/app-controller.js","utf8");
  const sw=fs.readFileSync("apps/fitplan/sw.js","utf8");
  assert.match(index,/runtime-loader\.js\?v=20261006-stage13[\s\S]*app-controller\.js\?v=20261006-stage15/);
  assert.match(controller,/FitPlanRuntime/);
  assert.match(controller,/FitPlanApp/);
  assert.match(controller,/fitplan:app:ready/);
  assert.doesNotMatch(controller,/localStorage|sessionStorage|__orig|__portalWrapped/);
  assert.match(sw,/\.\/app-controller\.js\?v=20261006-stage15/);
});


test("FitPlan stage 6 shell order is deterministic and offline-complete",()=>{
  const sw=fs.readFileSync("apps/fitplan/sw.js","utf8");
  const order=["progress.js?v=20261006-stage13","runtime-loader.js?v=20261006-stage13","app-controller.js?v=20261006-stage15","router.js"];
  let cursor=-1;
  for(const asset of order){const next=index.indexOf(asset);assert.ok(next>cursor,"wrong stage 6 script order: "+asset);cursor=next;assert.ok(sw.includes("./"+asset),"missing offline stage 6 asset: "+asset);}
  assert.match(fs.readFileSync("apps/fitplan/core/storage.js","utf8"),/planer-treningowy-progress-v1\.6/);
  assert.match(legacy,/function openSection\(id\)/);
  assert.match(legacy,/function goHome\(\)/);
  assert.match(legacy,/function switchTab\(tab\)/);
});


test("FitPlan stage 7 keeps router as the sole navigation wrapper",()=>{
  const runtime=fs.readFileSync("apps/fitplan/runtime-loader.js","utf8");
  const controller=fs.readFileSync("apps/fitplan/app-controller.js","utf8");
  const progress=fs.readFileSync("apps/fitplan/progress.js","utf8");
  const styleLoader=fs.readFileSync("apps/fitplan/styles-loader.js","utf8");
  const extensions=[["runtime",runtime],["controller",controller],["progress",progress],["calendar",calendar],["calendar-loader",loader],["styles-loader",styleLoader]];
  assert.match(router,/wrap\(w,"openSection"/);
  assert.match(router,/wrap\(w,"goHome"/);
  assert.match(router,/wrap\(w,"switchTab"/);
  for(const [name,source] of extensions){
    assert.doesNotMatch(source,/w\["(?:openSection|goHome|switchTab)"\]\s*=(?![=>])|w\.(?:openSection|goHome|switchTab)\s*=(?![=>])|window\.(?:openSection|goHome|switchTab)\s*=(?![=>])/,name+" must not replace navigation globals");
    assert.doesNotMatch(source,/__portalWrapped|__orig/,name+" must not implement router wrappers");
  }
  assert.match(runtime,/openSection:w\.openSection\.bind\(w\)/);
  assert.match(runtime,/goHome:w\.goHome\.bind\(w\)/);
  assert.match(runtime,/switchTab:w\.switchTab\.bind\(w\)/);
});


test("FitPlan stage 9 view fragments are external and offline",()=>{
 const loader=fs.readFileSync("apps/fitplan/view-loader.js","utf8"),sw=fs.readFileSync("apps/fitplan/sw.js","utf8");
 shellAsset("view-loader.js");assert.match(loader,/FitPlanViews/);
 for(const file of ["calendar.html","results.html","workout-plan.html","diet.html","exercises.html","exercise-list.html"]){assert.ok(fs.readFileSync("apps/fitplan/views/"+file,"utf8").includes("data-fitplan-view"));assert.ok(sw.includes("./views/"+file));}
 assert.match(sw,/portal-offline-/);
});


test("FitPlan stage 10 lazy loader defers exercise enhancement",()=>{
 const lazy=fs.readFileSync("apps/fitplan/lazy-loader.js","utf8"),exercise=fs.readFileSync("apps/fitplan/modules/exercises.js","utf8"),sw=fs.readFileSync("apps/fitplan/sw.js","utf8");
 assert.match(index,/lazy-loader\.js\?v=20261005-stage12/);assert.match(lazy,/FitPlanLazy/);assert.match(exercise,/loadScript\("\.\/modules\/exercises-enhancement\.js\?v=[^" ]+"\)/);const enhancement=exercise.match(/loadScript\("([^" ]+)"/)[1];assert.ok(sw.includes(enhancement),"offline cache keeps the exact enhancement version");assert.doesNotMatch(index,/exercises-enhancement\.js/);assert.match(sw,/portal-offline-/);
});


test("FitPlan stage 11 keeps asset payload lean outside anatomy",()=>{
  const treeLike=[
    ["icon.svg",fs.statSync("apps/fitplan/icon.svg").size],
    ["styles/core.css",fs.statSync("apps/fitplan/styles/core.css").size],
    ["styles/anatomy.css",fs.statSync("apps/fitplan/styles/anatomy.css").size],
    ["calendar-enhancement.js",fs.statSync("apps/fitplan/calendar-enhancement.js").size]
  ];
  for(const [name,size] of treeLike) assert.ok(size<64*1024,name+" unexpectedly became a heavy asset");
  const sw=fs.readFileSync("apps/fitplan/sw.js","utf8");
  assert.doesNotMatch(sw,/\.\/styles\/legacy\.css/,"obsolete combined CSS must not be pre-cached");
  assert.match(sw,/portal-offline-/);
});


test("FitPlan stage 14 namespaces app events and module-local interactions",()=>{
  const events=fs.readFileSync("apps/fitplan/core/events.js","utf8");
  const state=fs.readFileSync("apps/fitplan/core/state.js","utf8");
  const sw=fs.readFileSync("apps/fitplan/sw.js","utf8");
  assert.match(legacy,/data-fitplan-app="true"/);
  assert.match(legacy,/core\/events\.js\?v=20261006-stage14/);
  assert.match(events,/FitPlanEvents/);
  assert.match(events,/stateChange:"fitplan:state:change"/);
  assert.match(state,/FitPlanEvents\.emit\(window, 'stateChange'/);
  assert.match(calendar,/FitPlanEvents\?\.on/);
  assert.doesNotMatch(calendar,/document\.addEventListener\("click"/);
  assert.match(calendar,/r\.addEventListener\("click",handleClick,true\)/);
  assert.match(calendar,/#fitplanCalendarV2 input:focus-visible/);
  shellAsset("calendar-loader.js");
  assert.match(sw,/core\/events\.js\?v=20261006-stage14/);
  assert.ok(sw.includes(loader.match(/loadScript\("([^" ]+)"/)[1]));
});


test("FitPlan stage 15 provides a central module error boundary",()=>{
  const registry=fs.readFileSync("apps/fitplan/modules/registry.js","utf8");
  const calendarModule=fs.readFileSync("apps/fitplan/modules/calendar.js","utf8");
  const sw=fs.readFileSync("apps/fitplan/sw.js","utf8");
  assert.match(registry,/box\.dataset\.fitplanModuleError=id/);
  assert.match(registry,/Pozostałe części FitPlan nadal działają/);
  assert.match(registry,/activation=null;active=null/);
  assert.match(registry,/retry-module/);
  assert.match(registry,/controller\.deactivate\?\./);
  assert.equal(calendarModule.match(/loadScript\("([^" ]+)"/)[1],loader.match(/loadScript\("([^" ]+)"/)[1],"both calendar consumers use one asset version");
  shellAsset("modules/registry.js");
  shellAsset("modules/calendar.js");
  assert.match(sw,/portal-offline-/);
  assert.ok(sw.includes(shellAsset("modules/registry.js")));
  assert.ok(sw.includes(shellAsset("modules/calendar.js")));
});


test("FitPlan stage 20 legacy shell no longer duplicates extracted anatomy code",()=>{
  const anatomyCss=fs.readFileSync("apps/fitplan/styles/anatomy.css","utf8");
  assert.match(anatomyCss,/\.atlas-open \.shell/);
  assert.match(anatomyCss,/\.fp-stage/);
  assert.doesNotMatch(legacy,/FitPlan: interactive spatial atlas/);
  assert.doesNotMatch(legacy,/\.fp-stage\{/);
  assert.doesNotMatch(legacy,/\.fp-muscle-card/);
  assert.doesNotMatch(legacy,/FitAtlas|fitplan-model-data/);
  assert.ok(Buffer.byteLength(legacy)<24*1024,"legacy shell should stay below 24 KiB after stage 20 cleanup");
});
