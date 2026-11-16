'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {createFitPlan}=require('./fitplan-shell-harness.cjs');
test('the diet offers BMI and TDEE tabs without restoring course tabs',async t=>{
 const app=await createFitPlan(t);
 app.card('dieta').click();await app.settle();
 const doc=app.w.document;
 const tabs=[...doc.querySelectorAll('.fitplan-diet-tab')];
 assert.deepEqual(tabs.map(tab=>tab.textContent),['Produkty','Kalkulator BMI','Zapotrzebowanie kaloryczne','Przepisy kulinarne']);
 assert.equal(doc.querySelectorAll('[data-food-product]').length,111);
 assert.equal(doc.getElementById('moduleTabs').hidden,true);
 tabs[1].click();
 const bmi=doc.querySelector('[data-diet-calc="bmi"]');
 assert.equal(doc.getElementById('fitplan-diet-panel-bmi').hidden,false);
 bmi.dispatchEvent(new app.w.Event('submit',{cancelable:true,bubbles:true}));
 assert.match(bmi.nextElementSibling.textContent,/BMI: 22,9/);
 tabs[2].click();
 const calories=doc.querySelector('[data-diet-calc="calories"]');
 calories.elements.namedItem('formula').value='male';
 calories.dispatchEvent(new app.w.Event('submit',{cancelable:true,bubbles:true}));
 assert.match(calories.nextElementSibling.textContent,/BMR: 1[\s\u00a0\u202f]?649 kcal/);
 assert.match(calories.nextElementSibling.textContent,/TDEE: 1[\s\u00a0\u202f]?979 kcal/);
 tabs[0].click();
 assert.equal(doc.getElementById('fitplan-diet-panel-products').hidden,false);
 assert.deepEqual(app.errors,[]);
});
test('calculation assets and offline versions agree',()=>{
 const index=fs.readFileSync('apps/fitplan/index.html','utf8');
 const sw=fs.readFileSync('apps/fitplan/sw.js','utf8');
 const source=fs.readFileSync('apps/fitplan/modules/diet-tools.js','utf8');
 for(const file of ['./modules/diet-tools.js','./modules/diet.js','./styles-loader.js']){
  const version=index.match(new RegExp(file.replaceAll('.','\\.')+'\\?v=([^"\\s]+)'))?.[1];
  assert.ok(version,file);assert.ok(sw.includes(file+'?v='+version));
 }
 assert.match(source,/Mifflina/);
 const cache=sw.match(/const CACHE_NAME="portal-offline-"\+APP_ID\+"-([^"]+)"/)?.[1];
 assert.ok(cache,'service worker cache is versioned');
});

