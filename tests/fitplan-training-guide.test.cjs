// WIEDORA-CHANGE: WD-20261101-FITPLAN-SYSTEMS-UX-01 | TASK: FitPlan systems UX | AUTHOR: ChatGPT / GPT-6
'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'apps/fitplan/modules/training-guide.js'),'utf8');
const html=fs.readFileSync(path.join(root,'apps/fitplan/views/workout-plan.html'),'utf8');
function setup(){
 const dom=new JSDOM(html,{url:'https://example.test/apps/fitplan/'});
 const window=dom.window;
 const context=vm.createContext({window});
 vm.runInContext(source,context,{filename:'training-guide.js'});
 const host=window.document.querySelector('[data-fitplan-view="plan-treningowy"]');
 return {window,doc:window.document,host,api:window.FitPlanTrainingGuide};
}
test('All eleven original training systems are preserved with unique keys',()=>{
 const {host,api}=setup(),buttons=[...host.querySelectorAll('#fpkPlans [data-fpk-plan]')];
 assert.equal(buttons.length,11);
 assert.equal(new Set(buttons.map(b=>b.dataset.fpkPlan)).size,11);
 const ranked=api.rank('general','home','beginner');
 assert.equal(ranked.length,11);
 assert.deepEqual(new Set(ranked.map(m=>m.id)),new Set(buttons.map(b=>b.dataset.fpkPlan)));
});
test('Recommendations follow explicit goals without writing to local storage',()=>{
 const {host,doc,api}=setup();
 const choices=[];
 api.mount({host,doc,selectSport:id=>choices.push(id)});
 assert.equal(host.querySelectorAll('#fpkGuideResults button').length,3);
 assert.equal(host.querySelector('#fpkGuideResults button').dataset.fpkRecommend,'fbw');
 const goal=host.querySelector('#fpkGuideGoal');
 goal.value='pushups';goal.dispatchEvent(new doc.defaultView.Event('change',{bubbles:true}));
 assert.equal(host.querySelector('#fpkGuideResults button').dataset.fpkRecommend,'100-pompek');
 host.querySelector('#fpkGuideResults button').click();
 assert.deepEqual(choices,['100-pompek']);
 const place=host.querySelector('#fpkGuidePlace');
 place.value='gym';place.dispatchEvent(new doc.defaultView.Event('change',{bubbles:true}));
 assert.equal(host.querySelectorAll('#fpkGuideResults button').length,3);
 host.querySelector('#fpkGuideReset').click();
 assert.equal(goal.value,'general');
 assert.equal(place.value,'any');
 assert.equal(host.querySelector('#fpkGuideExperience').value,'beginner');
 assert.equal(host.querySelector('#fpkGuideResults button').dataset.fpkRecommend,'fbw');
 assert.equal(host.querySelectorAll('#fpkPlans [data-fpk-plan]').length,11);
});
test('Place changes method preferences without removing options',()=>{
 const {api}=setup(),home=api.rank('skills','home','beginner'),gym=api.rank('skills','gym','beginner');
 assert.equal(home[0].id,'kalistenika');
 assert.equal(gym[0].id,'sztuki-walki');
 assert.equal(home.length,11);
 assert.equal(gym.length,11);
});
test('Mount is idempotent and optional comparison stays available',()=>{
 const {host,doc,api}=setup();
 api.mount({host,doc,selectSport:()=>{}});
 api.mount({host,doc,selectSport:()=>{}});
 assert.equal(host.querySelectorAll('#fpkGuideResults button').length,3);
 assert.equal(host.querySelectorAll('#fpkPlans .fpk-plan-badge').length,11);
 assert.equal(host.querySelector('#fpkAllMethods').tagName,'DETAILS');
 assert.equal(host.querySelector('#fpkKbCircuitLauncher').tagName,'BUTTON');
});
