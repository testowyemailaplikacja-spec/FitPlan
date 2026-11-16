// WIEDORA-CHANGE: WD-20261101-WIE-005-NATIVE-REGRESSION-10 | TASK: WIE-005 | AUTHOR: Codex / GPT-6 (pełna wersja nieustalona)
'use strict';
// WIEDORA-CHANGE: WD-20261101-WIE-161-FITPLAN-DIET-SEARCH-01 | TASK: WIE-161 | AUTHOR: ChatGPT / GPT-6
const test=require('node:test');
const assert=require('node:assert/strict');
const {createFitPlan}=require('./fitplan-shell-harness.cjs');

test('diet product search shows matching food cards and their categories only',async t=>{
 const app=await createFitPlan(t);app.card('dieta').click();await app.settle();
 const doc=app.w.document,search=doc.getElementById('fitplanFoodSearch');
 assert.ok(search,'product search input exists');
 const cards=[...doc.querySelectorAll('[data-food-product]')];
 assert.equal(cards.length,111);
 search.value='tofu';search.dispatchEvent(new app.w.Event('input',{bubbles:true}));
 const matching=cards.filter(card=>!card.hidden);
 // The category is explicitly "Rośliny strączkowe i tofu"; all seven belong.
 assert.deepEqual(matching.map(card=>card.querySelector('h4').textContent),[
  'Ciecierzyca, gotowana','Soczewica, gotowana','Fasola czerwona, gotowana',
  'Fasola biała, gotowana','Groszek zielony, gotowany','Tofu naturalne, twarde','Tempeh'
 ]);
 assert.ok(cards.filter(card=>!matching.includes(card)).every(card=>card.hidden));
 search.value='tofu naturalne';search.dispatchEvent(new app.w.Event('input',{bubbles:true}));
 assert.deepEqual(cards.filter(card=>!card.hidden).map(card=>card.querySelector('h4').textContent),['Tofu naturalne, twarde']);
 assert.equal(doc.getElementById('fitplanFoodSearchStatus').getAttribute('role'),'status');
 assert.ok(doc.getElementById('fitplanFoodSearchStatus').textContent.includes('Znaleziono'));
 assert.deepEqual(app.errors,[]);
});

test('no result shows an accessible empty state and clear restores all food groups',async t=>{
 const app=await createFitPlan(t);app.card('dieta').click();await app.settle();
 const doc=app.w.document,search=doc.getElementById('fitplanFoodSearch');
 const groups=[...doc.querySelectorAll('.fitplan-food-group')],initialOpens=groups.map(group=>group.open);
 search.value='nieistniejacyprodukt123';search.dispatchEvent(new app.w.Event('input',{bubbles:true}));
 assert.ok(groups.every(group=>group.hidden));
 assert.equal(doc.querySelector('.fitplan-food-search-empty').hidden,false);
 assert.equal(doc.querySelector('.fitplan-food-toolbar button').hidden,false);
 doc.querySelector('.fitplan-food-toolbar button').click();
 assert.equal(search.value,'');
 assert.ok(groups.every(group=>!group.hidden));
 assert.deepEqual(groups.map(group=>group.open),initialOpens);
 assert.equal(doc.querySelector('.fitplan-food-search-empty').hidden,true);
 assert.equal(doc.querySelectorAll('[data-food-product]:not([hidden])').length,111);
 assert.deepEqual(app.errors,[]);
});

test('product search does not disturb recipe and calorie calculator tabs',async t=>{
 const app=await createFitPlan(t);app.card('dieta').click();await app.settle();
 const doc=app.w.document,search=doc.getElementById('fitplanFoodSearch');
 search.value='ryż';search.dispatchEvent(new app.w.Event('input',{bubbles:true}));
 doc.getElementById('fitplan-diet-tab-recipes').click();
 assert.equal(doc.querySelectorAll('.fitplan-recipe-card').length,12);
 doc.getElementById('fitplan-diet-tab-calories').click();
 assert.ok(doc.querySelector('[data-diet-calc="calories"]'));
 doc.getElementById('fitplan-diet-tab-products').click();
 assert.equal(search.value,'ryż');
 assert.deepEqual(app.errors,[]);
});
