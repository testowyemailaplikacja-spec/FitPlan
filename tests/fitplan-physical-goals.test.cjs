'use strict';
// WIEDORA-CHANGE: WD-20261101-WIE-117-PHYSICAL-GOALS-01 | TASK: WIE-117 | AUTHOR: ChatGPT / GPT-6
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {createFitPlan}=require('./fitplan-shell-harness.cjs');
const src=fs.readFileSync('apps/fitplan/modules/physical-goals.js','utf8');
const KEY='fitplan.dashboard.profile.v1';
function fixture(raw=JSON.stringify({weight:92,height:185,goal:'recomp'})){
 const data=new Map(raw===null?[]:[[KEY,raw]]);
 const store={getItem:key=>data.has(key)?data.get(key):null,setItem:(key,value)=>data.set(key,value)};
 const scope={window:{},Date,Math};
 vm.runInNewContext(src,scope);
 return {store,api:scope.window.FitPlanPhysicalGoals,raw:()=>store.getItem(KEY)};
}
function add(api,store,options={}){
 api.add(store,{name:'Masa ciała',unit:'kg',start:92,target:82,date:'2026-01-01',frequency:14,...options});
 return api.read(store)[0].id;
}
test('physical goal tracks decrease, achievements, date sorting and persistent profile fields',()=>{
 const {store,api,raw}=fixture(),id=add(api,store);
 assert.equal(api.stats(api.read(store)[0]).remaining,10);
 api.record(store,id,'2026-02-01',87);
 let stats=api.stats(api.read(store)[0]);
 assert.equal(stats.percent,50);assert.equal(stats.remaining,5);
 api.record(store,id,'2026-01-15',90);
 stats=api.stats(api.read(store)[0]);
 assert.equal(stats.last.date,'2026-02-01');
 api.record(store,id,'2026-02-15',81);
 stats=api.stats(api.read(store)[0]);
 assert.equal(stats.achieved,true);assert.equal(stats.percent,100);assert.equal(stats.remaining,0);
 assert.equal(JSON.parse(raw()).height,185);
 assert.equal(JSON.parse(raw()).physicalGoals.version,1);
});
test('physical goal tracks increasing reps, regression and zero baseline',()=>{
 const {store,api}=fixture(null);
 const id=add(api,store,{name:'Podciągnięcia',unit:'powt.',start:0,target:10});
 api.record(store,id,'2026-02-01',4);
 let s=api.stats(api.read(store)[0]);assert.equal(s.percent,40);assert.equal(s.remaining,6);
 api.record(store,id,'2026-02-15',2);
 s=api.stats(api.read(store)[0]);assert.equal(s.percent,20);assert.equal(s.remaining,8);
});
test('invalid dates, duplicate entries, negative values and corrupted profile never overwrite data',()=>{
 const {api,store,raw}=fixture(),id=add(api,store);
 const original=raw();
 assert.throws(()=>api.record(store,id,'2026-01-01',90),/daty|datę|już pomiar/i);
 assert.throws(()=>api.record(store,id,'2099-01-01',90),/Data/i);
 assert.throws(()=>api.record(store,id,'2026-02-01',-1),/wynik/i);
 assert.throws(()=>api.add(store,{name:'x',unit:'kg',start:1,target:2,date:'2026-02-01',frequency:14}),/nazwę/i);
 assert.equal(raw(),original);
 const broken=fixture('{not-json');
 assert.throws(()=>add(broken.api,broken.store),/uszkodzony/i);
 assert.equal(broken.raw(),'{not-json');
});
test('deleting one measurement restores prior progress; baseline and complete history are protected',()=>{
 const {store,api}=fixture(),id=add(api,store);
 api.record(store,id,'2026-02-01',85);
 api.record(store,id,'2026-03-01',80);
 assert.throws(()=>api.removeCheckin(store,id,'2026-01-01'),/początkowy/i);
 api.removeCheckin(store,id,'2026-03-01');
 assert.equal(api.stats(api.read(store)[0]).remaining,3);
 api.removeGoal(store,id);
 assert.equal(api.read(store).length,0);
});
test('dashboard goal form persists independent check-ins and survives revisiting the module',async t=>{
 const app=await createFitPlan(t,{
  storage:{[KEY]:JSON.stringify({weight:92,height:185,age:30,formula:'male',activity:1.55,cycle:7,sessions:3,discipline:'fbw'})},
  observeWindow(window){window.FitPlanAccountMedia={list:async()=>[]};}
 });
 const updates=[];app.dom.window.addEventListener('portal-sync-request',e=>updates.push(e.detail));
 app.card('podsumowanie-wynikow').click();await app.settle();
 const d=app.w.document,form=d.getElementById('fpdGoalForm');
 assert.ok(form,'goals form is mounted inside the existing dashboard');
 form.elements.namedItem('start').value='92';
 form.elements.namedItem('target').value='82';
 form.elements.namedItem('date').value='2026-01-01';
 form.dispatchEvent(new app.w.Event('submit',{bubbles:true,cancelable:true}));
 assert.equal(d.querySelectorAll('.fpd-goal-card').length,1);
 const checkin=d.querySelector('.fpd-goal-checkin');
 checkin.elements.namedItem('date').value='2026-02-01';
 checkin.elements.namedItem('value').value='87';
 checkin.dispatchEvent(new app.w.Event('submit',{bubbles:true,cancelable:true}));
 assert.match(d.querySelector('.fpd-goal-remaining').textContent,/Pozostało: 5 kg/);
 assert.ok(updates.length>=2&&updates.every(x=>x.appId==='fitplan'&&x.dirty));
 app.card('kalendarz-treningowy').click();await app.settle();
 app.card('podsumowanie-wynikow').click();await app.settle();
 assert.match(app.w.document.querySelector('.fpd-goal-remaining').textContent,/Pozostało: 5 kg/);
 assert.deepEqual(app.errors,[]);
});
