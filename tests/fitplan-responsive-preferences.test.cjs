const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {createFitPlan}=require('./fitplan-shell-harness.cjs');

test('stage 18 keeps explicit mobile breakpoints for shell and anatomy',()=>{
 const css=fs.readFileSync('apps/fitplan/styles/anatomy.css','utf8')+fs.readFileSync('apps/fitplan/styles/core.css','utf8');
 for(const width of ['1180','780','440','650']) assert.match(css,new RegExp('@media\\(max-width:'+width+'px\\)'),width+'px breakpoint');
 assert.match(css,/\.fp-nav\{[^}]*overflow-x:auto/);
 assert.match(css,/@media\(max-width:440px\)[\s\S]*\.fp-cards\{grid-template-columns:repeat\(2/);
});

test('stage 18 FitPlan document follows portal language and theme changes',async t=>{
 const app=await createFitPlan(t);
 const w=app.w,doc=w.document;
 assert.ok(w.FitPlanPreferences,'FitPlan preferences bridge must exist');
 app.dom.window.dispatchEvent(new app.dom.window.CustomEvent('portal:preferences',{detail:{language:'en',theme:'light'}}));
 await app.settle();
 assert.equal(doc.documentElement.lang,'en');
 assert.equal(doc.documentElement.dataset.theme,'light');
 assert.equal(doc.documentElement.style.colorScheme,'light');
 assert.equal(doc.querySelector('.hero h1').textContent,'Workout planner');
 assert.match(doc.querySelector('.hero p').textContent,/training/i);
 app.dom.window.dispatchEvent(new app.dom.window.CustomEvent('portal:preferences',{detail:{language:'pl',theme:'gray'}}));
 await app.settle();
 assert.equal(doc.documentElement.lang,'pl');
 assert.equal(doc.documentElement.dataset.theme,'gray');
 assert.equal(doc.documentElement.style.colorScheme,'dark');
 assert.match(doc.querySelector('.hero p').textContent,/trening/i);
 assert.deepEqual(app.errors,[]);
});

test('stage 18 preference bridge accepts only supported values',async t=>{
 const app=await createFitPlan(t);
 const doc=app.w.document;
 app.dom.window.dispatchEvent(new app.dom.window.CustomEvent('portal:preferences',{detail:{language:'xx',theme:'neon'}}));
 await app.settle();
 assert.equal(doc.documentElement.lang,'pl');
 assert.equal(doc.documentElement.dataset.theme,'gray');
});
