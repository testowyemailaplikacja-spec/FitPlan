'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {createFitPlan,until}=require('./fitplan-shell-harness.cjs');

test('111 food products retain unique identifiers and truthful unknown GI labels',()=>{
 const window={};
 vm.runInNewContext(fs.readFileSync('apps/fitplan/data/food-catalog.js','utf8'),{window});
 const catalog=window.FitPlanFoodCatalog;
 assert.equal(catalog.products.length,111);
 assert.equal(new Set(catalog.products.map(p=>p.id)).size,111);
 assert.ok(catalog.categories.some(x=>x.id==='straczkowe'));
 assert.ok(catalog.categories.some(x=>x.id==='nabial'));
 assert.ok(catalog.categories.some(x=>x.id==='tluszcze'));
 assert.ok(catalog.products.filter(p=>p.gi===null).length>=30);
 assert.ok(catalog.products.every(p=>p.nutrients&&['protein','carbs','fat'].every(k=>Number.isFinite(p.nutrients.macros[k]))));
 assert.ok(fs.readFileSync('apps/fitplan/modules/diet.js','utf8').includes('product.gi==null?"brak danych"'));
});
test('recipe calculations use shared ingredients and every recipe has macros',()=>{
 const window={};
 for(const p of ['food-catalog.js','recipes.js'])
   vm.runInNewContext(fs.readFileSync('apps/fitplan/data/'+p,'utf8'),{window});
 const recipes=window.FitPlanRecipeCatalog.build(window.FitPlanFoodCatalog);
 assert.equal(recipes.length,12);
 for(const recipe of recipes){
  assert.ok(recipe.ingredients.length>=2,recipe.name);
  assert.ok(recipe.totals,recipe.name);
  const byId=new Map(window.FitPlanFoodCatalog.products.map(x=>[x.id,x]));
  const expected=recipe.ingredients.reduce((n,x)=>n+byId.get(x.id).kcal*x.grams/100,0);
  assert.equal(recipe.totals.kcal,Math.round(expected*10)/10,recipe.name);
  assert.ok(recipe.totals.protein>=0&&recipe.totals.fat>=0);
 }
});
test('recipe tab is integrated into existing diet navigation',async t=>{
 const app=await createFitPlan(t);
 app.card('dieta').click();await app.settle();
 const d=app.w.document;
 const tab=d.getElementById('fitplan-diet-tab-recipes');
 assert.ok(tab,'recipe tab should exist');tab.click();
 assert.equal(d.getElementById('fitplan-diet-panel-recipes').hidden,false);
 assert.equal(d.querySelectorAll('.fitplan-recipe-card').length,12);
 assert.match(d.querySelector('.fitplan-recipe-macros').textContent,/kcal.*B.*W.*T/);
 assert.deepEqual(app.errors,[]);
});
test('FitPlan results tile is a functioning single-screen four-step control panel',async t=>{
 const app=await createFitPlan(t);
 let syncRequest=null;app.dom.window.addEventListener('portal-sync-request',event=>{syncRequest=event.detail;});
 app.card('podsumowanie-wynikow').click();await app.settle();
 const w=app.w,d=w.document;
 assert.equal(d.getElementById('moduleTitle').textContent,'Panel sterowania');
 assert.equal(d.getElementById('moduleTabs').hidden,true);
 assert.equal(d.getElementById('completeSectionBtn'),null);
 assert.ok(d.getElementById('fpdSummary'));
 assert.ok(d.getElementById('fpdEdit'));
 assert.ok(d.getElementById('fpdPhoto'));
 d.getElementById('fpdEdit').click();
 const f=d.getElementById('fpdForm');assert.equal(f.hidden,false);
 for(const [key,value] of Object.entries({weight:'82',height:'182',age:'30',formula:'male'}))
   f.elements.namedItem(key).value=value;
 f.querySelector('#fpdNext').click();
 f.elements.namedItem('goal').value='mass';
 f.elements.namedItem('activity').value='1.55';
 f.querySelector('#fpdNext').click();
 f.elements.namedItem('discipline').value='fbw';
 f.elements.namedItem('cycle').value='10';
 f.elements.namedItem('sessions').value='4';
 f.querySelector('#fpdNext').click();
 f.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
 const stored=JSON.parse(w.localStorage.getItem('fitplan.dashboard.profile.v1'));
 assert.equal(stored.weight,82);
 assert.equal(stored.cycle,10);
 assert.equal(stored.sessions,4);
 assert.equal(syncRequest?.appId,'fitplan');
 assert.equal(syncRequest?.dirty,true);
 assert.match(d.getElementById('fpdSummary').textContent,/BMI/);
 assert.match(d.getElementById('fpdSummary').textContent,/BMR i TDEE/);
 assert.match(d.getElementById('fpdSummary').textContent,/4 na 10 dni/);
 assert.deepEqual(app.errors,[]);
});
test('dashboard uses existing BMI and Mifflin-St Jeor calculators',async t=>{
 const app=await createFitPlan(t);
 const calc=app.dom.window.FitPlanDietTools;
 assert.ok(calc);
 assert.ok(Math.abs(calc.calculateBMI(180,81)-25)<0.00001);
 const q=calc.calculateCalorieNeeds({height:180,weight:81,age:30,formula:'male',activity:1.55});
 assert.equal(q.bmr,1790);
 assert.equal(q.tdee,2774.5);
});

test('dashboard builds an editable mixed cycle with rest days and a named custom workout',async t=>{
 const app=await createFitPlan(t);
 app.card('podsumowanie-wynikow').click();await app.settle();
 const d=app.w.document;
 d.getElementById('fpdEdit').click();
 d.querySelector('#fpdForm [name="cycle"]').value='7';
 d.querySelector('#fpdForm [name="sessions"]').value='3';
 d.getElementById('fpdBuildSchedule').click();
 const days=[...d.querySelectorAll('[data-fpd-day]')];
 assert.equal(days.length,7);
 days[0].value='kalistenika';days[0].dispatchEvent(new app.w.Event('change',{bubbles:true}));
 days[1].value='rest';days[1].dispatchEvent(new app.w.Event('change',{bubbles:true}));
 days[2].value='custom';days[2].dispatchEvent(new app.w.Event('change',{bubbles:true}));
 const custom=d.querySelector('[data-fpd-custom-day="3"]');
 assert.equal(custom.hidden,false);custom.value='Boks techniczny';
 assert.match(d.getElementById('fpdSchedule').textContent,/Dzień 1/);
 assert.match(d.getElementById('fpdSchedule').textContent,/Dzień 7/);
});

test('dashboard changes all 16 account avatars and converts an iframe photo for upload',async t=>{
 let selected='',uploaded=null;
 const user={id:'alice',name:'Alicja',avatarUrl:'preset:fit-01'};
 const app=await createFitPlan(t,{observeWindow(window){
  window.PortalAvatarPresets={
   items:Array.from({length:16},(_,i)=>({id:'fit-'+String(i+1).padStart(2,'0'),label:'Avatar '+(i+1),glyph:'●'})),
   render(container,value,name){container.replaceChildren();const el=container.ownerDocument.createElement('span');el.dataset.renderedAvatar=String(value||'');el.setAttribute('aria-label',name);container.append(el);return el;}
  };
  window.PortalAuth={
   ready:async()=>user,
   setPresetAvatar:async id=>{selected=id;return {...user,avatarUrl:'preset:'+id};},
   uploadAvatar:async file=>{uploaded=file;return {...user,avatarUrl:'https://example.invalid/avatar.webp'};},
   removeAvatar:async()=>({...user,avatarUrl:null})
  };
 }});
 app.card('podsumowanie-wynikow').click();await app.settle();
 const d=app.w.document;
 d.getElementById('fpdAccountButton').click();
 const choices=[...d.querySelectorAll('[data-fpd-avatar-preset]')];
 assert.equal(choices.length,16);
 choices[7].click();await until(()=>d.querySelector('#fpdAvatar [data-rendered-avatar]')?.dataset.renderedAvatar==='preset:fit-08');
 assert.equal(selected,'fit-08');
 assert.equal(d.querySelector('#fpdAvatar [data-rendered-avatar]').dataset.renderedAvatar,'preset:fit-08');

 d.getElementById('fpdAccountButton').click();
 const input=d.getElementById('fpdAvatarFile'),file=new app.w.File(['avatar'],'avatar.png',{type:'image/png'});
 Object.defineProperty(input,'files',{configurable:true,value:[file]});
 input.dispatchEvent(new app.w.Event('change',{bubbles:true}));await until(()=>uploaded);
 assert.ok(uploaded instanceof app.dom.window.File,'upload should receive a File from the parent realm');
 assert.match(fs.readFileSync('apps/fitplan/styles-loader.js','utf8'),/\/apps\/shared\/avatar-presets\.css/);
});

test('dashboard converts an iframe progress photo before account upload',async t=>{
 let uploaded=null;
 const app=await createFitPlan(t,{observeWindow(window){
  window.FitPlanAccountMedia={list:async()=>[],upload:async file=>{uploaded=file;},remove:async()=>true};
 }});
 app.card('podsumowanie-wynikow').click();await app.settle();
 const input=app.w.document.getElementById('fpdPhoto'),file=new app.w.File(['progress'],'progress.webp',{type:'image/webp'});
 Object.defineProperty(input,'files',{configurable:true,value:[file]});
 input.dispatchEvent(new app.w.Event('change',{bubbles:true}));await until(()=>uploaded);
 assert.ok(uploaded instanceof app.dom.window.File,'account storage should receive a File from the parent realm');
 await until(()=>/zapisano na Twoim koncie/.test(app.w.document.getElementById('fpdPhotoNotice').textContent));
});

test('each expanded food micronutrient has a useful description',()=>{
 const window={};
 vm.runInNewContext(fs.readFileSync('apps/fitplan/data/food-catalog.js','utf8'),{window});
 vm.runInNewContext(fs.readFileSync('apps/fitplan/modules/nutrient-guide.js','utf8'),{window});
 const tags=new Set(window.FitPlanFoodCatalog.products.flatMap(p=>['vitamins','minerals','bioactives','other'].flatMap(key=>p.nutrients[key])));
 for(const tag of tags)assert.ok(window.FitPlanNutrientGuide.describe(tag)?.length>20,tag);
});

test('dashboard calendar dates use local calendar days, not UTC midnights',()=>{
 const source=fs.readFileSync('apps/fitplan/modules/results.js','utf8');
 assert.match(source,/function localDateKey\(value=new Date\(\)\)/);
 assert.match(source,/value\.getFullYear\(\)/);
 assert.match(source,/value\.getMonth\(\)\+1/);
 assert.match(source,/value\.getDate\(\)/);
 assert.doesNotMatch(source,/toISOString\(\)\.slice\(0,10\)/);
});
test('photo gallery delegates persistence and cleanup to the signed-in account service',()=>{
 const source=fs.readFileSync('apps/fitplan/modules/results.js','utf8');
 assert.match(source,/FitPlanAccountMedia/);
 assert.match(source,/activeDisposer=\(\)=>/);
 assert.doesNotMatch(source,/indexedDB/);
});

test('dashboard does not mistake an arbitrary calendar note for a finished workout',()=>{
 const source=fs.readFileSync('apps/fitplan/modules/results.js','utf8');
 assert.match(source,/"Ostatni wpis w kalendarzu"/);
 assert.match(source,/"Następny wpis w kalendarzu"/);
 assert.match(source,/"Ostatni trening",last\|\|"Nie podano"/);
 assert.match(source,/Number\.isInteger\(data\.sessions\)/);
 assert.match(source,/data\.last>data\.next/);
});
