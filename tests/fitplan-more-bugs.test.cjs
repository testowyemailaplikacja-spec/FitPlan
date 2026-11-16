'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('all current micronutrient labels have an explanation',()=>{
 const window={};vm.runInNewContext(fs.readFileSync('apps/fitplan/data/food-catalog.js','utf8'),{window});
 vm.runInNewContext(fs.readFileSync('apps/fitplan/modules/nutrient-guide.js','utf8'),{window});
 const all=new Set(window.FitPlanFoodCatalog.products.flatMap(p=>['vitamins','minerals','bioactives','other'].flatMap(k=>p.nutrients[k])));
 for(const term of all)assert.ok(window.FitPlanNutrientGuide.describe(term)?.length>20,term);
});
test('four training choices have matching controllers and view buttons',()=>{
 const source=fs.readFileSync('apps/fitplan/modules/workout-plan.js','utf8');
 const html=fs.readFileSync('apps/fitplan/views/workout-plan.html','utf8');
 for(const id of ['100-pompek','rozciaganie','joga','brzuch']){
  assert.ok(source.includes(id));assert.ok(html.includes('data-fpk-plan="'+id+'"'));
 }
});
test('BMI table provides gender selector and ranges without changing the core BMI formula',()=>{
 const source=fs.readFileSync('apps/fitplan/modules/diet-tools.js','utf8');
 assert.match(source,/name="gender"/);assert.match(source,/fitplan-bmi-table/);
 assert.ok(source.includes("weight/(height/100)**2"));assert.match(source,/bmi>=lower&&bmi<upper/);
});

test('BMI result renders a marked range and nutrient buttons open their descriptions',async t=>{
 const {createFitPlan}=require('./fitplan-shell-harness.cjs');
 const app=await createFitPlan(t);
 app.card('dieta').click();await app.settle();
 const doc=app.w.document;
 const bmiTab=doc.getElementById('fitplan-diet-tab-bmi');bmiTab.click();
 const form=doc.querySelector('[data-diet-calc="bmi"]');
 form.dispatchEvent(new app.w.Event('submit',{cancelable:true,bubbles:true}));
 const guide=doc.querySelector('.fitplan-bmi-guide');
 assert.equal(guide.hidden,false);
 assert.equal(guide.querySelectorAll('tbody tr').length,4);
 assert.match(guide.querySelector('[aria-current="true"]').textContent,/Zakres prawidłowy/);
 form.elements.namedItem('gender').value='male';
 form.elements.namedItem('weight').value='100';
 form.dispatchEvent(new app.w.Event('submit',{cancelable:true,bubbles:true}));
 assert.match(guide.querySelector('[aria-current="true"]').textContent,/Otyłość wg BMI/);
 doc.getElementById('fitplan-diet-tab-products').click();
 const button=doc.querySelector('[data-food-product="warzywa-broku"] .fitplan-nutrient-chip');
 assert.ok(button);
 button.click();
 const desc=button.closest('dd').querySelector('.fitplan-nutrient-info');
 assert.ok(desc?.textContent.length>30);
 assert.equal(button.getAttribute('aria-expanded'),'true');
 button.click();
 assert.equal(button.closest('dd').querySelector('.fitplan-nutrient-info'),null);
 assert.deepEqual(app.errors,[]);
});
