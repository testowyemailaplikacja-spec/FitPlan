const test = require("node:test");
const assert = require("node:assert/strict");
const { createFitPlan } = require("./fitplan-shell-harness.cjs");
const { createTimer } = require("./fitplan-timer-harness.cjs");

const clickTab = (doc, name) => doc.querySelector('[data-fps-tab="' + name + '"]').click();
const events = (w, element, type) => element.dispatchEvent(new w.Event(type, { bubbles: true, cancelable: true }));

test("Start is a genuine seventh module with four accessible internal tabs", async t => {
  const app = await createFitPlan(t);
  assert.ok(app.card("start"));
  assert.equal(app.w.document.querySelectorAll("#sectionGrid .section-card").length, 7);
  app.card("start").click();await app.settle();
  const doc = app.w.document;
  assert.equal(app.w.FitPlanModules.active, "start");
  assert.equal(app.dom.window.location.pathname, "/apps/fitplan/modul/start/");
  assert.equal(doc.getElementById("moduleTabs").hidden, true);
  assert.equal(doc.getElementById("completeSectionBtn"), null);
  assert.deepEqual(Array.from(doc.querySelectorAll("[data-fps-tab]"), node => node.textContent.trim()),
    ["Konfiguracja", "Trening według planu", "Randomowy trening", "Stoper"]);
  clickTab(doc, "timer");
  assert.equal(doc.getElementById("fpsPanelTimer").hidden, false);
  assert.equal(doc.getElementById("fpsPanelConfig").hidden, true);
  assert.equal(doc.getElementById("fpsRemaining").textContent, "03:00");
  assert.ok(doc.querySelector(".fps-watch-face"), "compact CSS dial should be present");
  assert.equal(doc.getElementById("fpsWatchSvg"), null, "SVG screenshot rendering must not cover the watch");
  assert.equal(doc.querySelectorAll("#fpsWatchTicks .fps-watch-tick").length, 60);
  assert.equal(doc.querySelectorAll("#fpsWatchTicks .fps-watch-major").length, 12);
  doc.getElementById("fpsEditSettings").click();
  assert.equal(doc.getElementById("fpsPanelConfig").hidden, false);
  app.w.FitPlanApp.home();await app.settle();
  assert.equal(app.w.FitPlanModules.active, null);
  assert.deepEqual(app.errors, []);
});

test("individual round durations validate, save and survive navigation", async t => {
  const app = await createTimer(t);
  const w = app.w, doc = w.document;
  const form = doc.getElementById("fpsConfigForm");
  form.elements.namedItem("rounds").value = "3";
  form.elements.namedItem("mode").value = "custom";
  events(w,form.elements.namedItem("mode")[1],"change");
  assert.equal(doc.querySelectorAll("#fpsCustomRows [data-fps-round]").length,3);
  const rows = Array.from(doc.querySelectorAll("#fpsCustomRows [data-fps-round]"));
  rows[0].querySelector("[data-fps-work]").value = "03:00";
  rows[0].querySelector("[data-fps-rest]").value = "00:30";
  rows[1].querySelector("[data-fps-work]").value = "02:00";
  rows[1].querySelector("[data-fps-rest]").value = "00:20";
  rows[2].querySelector("[data-fps-work]").value = "01:00";
  rows[2].querySelector("[data-fps-rest]").value = "00:00";
  events(w,form,"submit");
  const saved = JSON.parse(w.localStorage.getItem("fitplan.start.settings.v1"));
  assert.equal(saved.mode,"custom");
  assert.deepEqual(Array.from(saved.custom, x=>[x.work,x.rest]),[[180,30],[120,20],[60,0]]);
  clickTab(doc,"timer");
  assert.match(doc.getElementById("fpsTimerSummary").textContent,/6 min 50 s/);
  doc.getElementById("fpsTimerStart").click();
  assert.equal(doc.getElementById("fpsTimerStart").disabled,true);
  app.step(3000);
  doc.getElementById("fpsTimerPause").click();
  assert.equal(doc.getElementById("fpsPhase").textContent,"PAUZA");
  doc.getElementById("fpsTimerStart").click();
  doc.getElementById("fpsTimerSkip").click();
  assert.equal(doc.getElementById("fpsPhase").textContent,"PRZERWA");
  doc.getElementById("fpsTimerSkip").click();
  assert.equal(doc.getElementById("fpsRemaining").textContent,"02:00");
  doc.getElementById("fpsTimerReset").click();
  assert.equal(doc.getElementById("fpsRemaining").textContent,"03:00");
  app.w.FitPlanApp.home();await app.settle();
  app.w.FitPlanApp.open("start");await app.settle();
  assert.equal(app.w.document.getElementById("fpsConfigForm").elements.namedItem("mode").value,"custom");
  assert.equal(app.w.document.querySelectorAll("#fpsCustomRows [data-fps-round]").length,3);
  assert.deepEqual(app.errors,[]);
});

test("custom work must be positive, rests may be zero and shortening cannot go negative", async t => {
  const app = await createFitPlan(t);
  app.w.FitPlanApp.open("start");await app.settle();
  const w=app.w,doc=w.document,form=doc.getElementById("fpsConfigForm");
  form.elements.namedItem("work").value="00:00";
  events(w,form,"submit");
  assert.match(doc.getElementById("fpsConfigFeedback").textContent,/Czas ćwiczenia/);
  assert.equal(w.localStorage.getItem("fitplan.start.settings.v1"),null);
  form.elements.namedItem("work").value="00:03";
  form.elements.namedItem("rest").value="00:15";
  doc.getElementById("fpsShortenRest").click();
  const rests = Array.from(doc.querySelectorAll("[data-fps-rest]"), el=>el.value);
  assert.deepEqual(rests,["00:15","00:05","00:00"]);
  events(w,form,"submit");
  assert.equal(JSON.parse(w.localStorage.getItem("fitplan.start.settings.v1")).custom[2].rest,0);
  assert.deepEqual(app.errors,[]);
});

test("editable plan and random exercises use the current FitPlan catalogue", async t => {
  const app = await createFitPlan(t);
  app.w.FitPlanApp.open("start");await app.settle();
  const w=app.w,doc=w.document;
  clickTab(doc,"plan");
  const select=doc.getElementById("fpsExerciseSelect");
  assert.ok(select.options.length>=90);
  select.value=select.options[0].value;
  doc.getElementById("fpsAddExercise").click();
  assert.equal(doc.querySelectorAll("#fpsPlanList li").length,1);
  assert.equal(JSON.parse(w.localStorage.getItem("fitplan.start.exercises.v1")).length,1);
  doc.getElementById("fpsLaunchPlan").click();
  assert.equal(doc.getElementById("fpsPanelTimer").hidden,false);
  assert.match(doc.getElementById("fpsSessionName").textContent,/Trening według planu/);
  doc.getElementById("fpsTimerReset").click();
  clickTab(doc,"random");
  doc.getElementById("fpsGenerateRandom").click();
  const random=Array.from(doc.querySelectorAll("#fpsRandomList li strong"),x=>x.textContent);
  assert.equal(random.length,5);
  assert.equal(new Set(random).size,5);
  doc.getElementById("fpsLaunchRandom").click();
  assert.match(doc.getElementById("fpsSessionName").textContent,/Randomowy trening/);
  app.w.FitPlanApp.home();await app.settle();
  assert.equal(app.w.FitPlanModules.active,null);
  assert.deepEqual(app.errors,[]);
});


test("single numbers mean minutes and form formats them when focus leaves", async t => {
  const app = await createTimer(t);
  const d = app.w.document, form = d.getElementById("fpsConfigForm");
  form.elements.namedItem("work").value = "1";
  form.elements.namedItem("rest").value = "2";
  events(app.w,form.elements.namedItem("work"),"focusout");
  assert.equal(form.elements.namedItem("work").value,"01:00");
  events(app.w,form,"submit");
  let saved=JSON.parse(app.w.localStorage.getItem("fitplan.start.settings.v1"));
  assert.equal(saved.work,60);
  assert.equal(saved.rest,120);

  form.elements.namedItem("mode").value="custom";
  events(app.w,form.elements.namedItem("mode")[1],"change");
  const rounds=[...d.querySelectorAll("#fpsCustomRows [data-fps-round]")];
  rounds[0].querySelector("[data-fps-work]").value="3";
  rounds[0].querySelector("[data-fps-rest]").value="0";
  events(app.w,form,"submit");
  saved=JSON.parse(app.w.localStorage.getItem("fitplan.start.settings.v1"));
  assert.equal(saved.custom[0].work,180);
  assert.equal(saved.custom[0].rest,0);
  assert.deepEqual(app.errors,[]);
});

test("sound preview and timer start play an offline fallback if WebAudio is unavailable", async t => {
  const heard=[];
  const app=await createTimer(t,w=>{
    w.AudioContext=undefined;
    w.webkitAudioContext=undefined;
    w.URL.createObjectURL=()=> "blob:timer-test-tone";
    w.URL.revokeObjectURL=()=>{};
    w.Audio=class {
      constructor(src){this.src=src;this.currentTime=0;this.playbackRate=1;}
      pause(){}
      play(){heard.push(this.playbackRate);return Promise.resolve();}
    };
  });
  const d=app.w.document;
  assert.ok(d.getElementById("fpsTestSound"));
  d.getElementById("fpsTestSound").click();
  assert.equal(heard.length,1);
  d.getElementById("fpsTimerStart").click();
  assert.ok(heard.length>=2);
  assert.deepEqual(app.errors,[]);
});
