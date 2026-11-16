'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {createFitPlan} = require('./fitplan-shell-harness.cjs');

const catalogSource = fs.readFileSync('apps/fitplan/data/food-catalog.js', 'utf8');
const dietSource = fs.readFileSync('apps/fitplan/modules/diet.js', 'utf8');
function catalog(){
  const context={window:{}};vm.runInNewContext(catalogSource,context);
  return context.window.FitPlanFoodCatalog;
}
test('all 111 foods have complete valid macronutrient profiles with conditional micronutrients',()=>{
 const data=catalog();
 assert.equal(data.products.length,111);
 assert.equal(new Set(data.products.map(p=>p.id)).size,111);
 for(const product of data.products){
  const n=product.nutrients;
  assert.ok(n,product.name);
  assert.ok(Object.isFrozen(n),product.name);
  for(const amount of Object.values(n.macros)){
   assert.equal(typeof amount,'number',product.name);
   assert.ok(Number.isFinite(amount)&&amount>=0&&amount<=100,product.name);
  }
  for(const section of ['vitamins','minerals','bioactives','other']){
   assert.ok(Array.isArray(n[section]),product.name+' '+section);
   assert.ok(n[section].every(item=>item.trim().length>0),product.name+' '+section);
  }
 }
 assert.deepEqual(Array.from(data.products.find(p=>p.name==='Woda').nutrients.vitamins),[]);
 assert.equal(data.products.find(p=>p.name==='Woda').nutrients.macros.protein,0);
 assert.ok(data.products.find(p=>p.name==='Łosoś, pieczony').nutrients.other.includes('omega-3 (EPA i DHA)'));
 assert.ok(data.products.find(p=>p.name==='Kurkuma').nutrients.bioactives.some(x=>x.includes('kurkumina')));
 assert.equal(data.products.find(p=>p.name==='Łosoś, pieczony').id,'mieso-losos-pieczony');
});
test('diet UI displays only available nutrients and no empty sections',async t=>{
 const app=await createFitPlan(t);
 app.card('dieta').click();await app.settle();
 const doc=app.w.document;
 const cards=[...doc.querySelectorAll('[data-food-product]')];
 assert.equal(cards.length,111);
 const broccoli=cards.find(x=>x.dataset.foodProduct==='warzywa-broku');
 assert.match(broccoli.querySelector('.fitplan-food-macro-panel').textContent,/Białko.*2,8 g/);
 assert.match(broccoli.querySelector('.fitplan-food-macro-panel').textContent,/Węglowodany.*6,6 g/);
 assert.match(broccoli.querySelector('.fitplan-food-macro-panel').textContent,/Tłuszcze.*0,4 g/);
 const details=broccoli.querySelector('.fitplan-food-micro-details');
 assert.ok(details&&!details.open);
 details.querySelector('summary').click();
 assert.equal(details.open,true);
 assert.match(details.textContent,/Witaminy/);
 assert.match(details.textContent,/glukozynolany/);
 const salmon=cards.find(x=>x.dataset.foodProduct==='mieso-losos-pieczony');
 assert.ok(salmon);
 assert.doesNotMatch(salmon.querySelector('.fitplan-food-macro-panel').textContent,/Węglowodany/);
 assert.match(salmon.querySelector('.fitplan-food-micro-details').textContent,/omega-3/);
 const water=cards.find(x=>x.dataset.foodProduct==='napoje-woda');
 assert.ok(water);
 assert.equal(water.querySelector('.fitplan-food-nutrients'),null);
 assert.ok(cards.filter(c=>c.querySelector('.fitplan-food-micro-details')).length>=70);
 assert.deepEqual(app.errors,[]);
});
test('the offline cache lists exactly the same versioned nutrient files as the HTML',()=>{
 const index=fs.readFileSync('apps/fitplan/index.html','utf8');
 const legacy=fs.readFileSync('apps/fitplan/legacy.html','utf8');
 const sw=fs.readFileSync('apps/fitplan/sw.js','utf8');
 for(const [file,markup] of [['./data/food-catalog.js',legacy],['./modules/diet.js',index],['./styles-loader.js',index]]){
  const regex=new RegExp(file.replaceAll('.','\\.')+'\\?v=([^"\\s]+)');
  const found=markup.match(regex);
  assert.ok(found,'missing version '+file);
  assert.ok(sw.includes(file+'?v='+found[1]),'offline version mismatch '+file);
 }
 assert.match(dietSource,/fitplan-food-micro-details/);
});
