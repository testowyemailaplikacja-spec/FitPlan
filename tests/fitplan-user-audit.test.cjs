const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { createFitPlan, tick, until } = require('./fitplan-shell-harness.cjs');
const PROGRESS = 'planer-treningowy-progress-v1.6', CALENDAR = 'fitplan.calendar.entries.v2';
const plain = x => JSON.parse(JSON.stringify(x));
async function calendar(t, options = {}) {
  const app = await createFitPlan(t, options);
  app.card('kalendarz-treningowy').click(); await app.settle();
  app.w.FitPlanState.calendar.setView({year:2026,month:9});
  app.w.document.querySelector('#fitplanCalendarV2 [data-act="today"]').click();
  app.w.FitPlanState.calendar.setView({year:2026,month:9,selected:null});
  app.w.FitPlanCalendarView.show(app.w.document.getElementById('fitplanCalendarMount'));
  return app;
}
const day = (app,date) => app.w.document.querySelector('[data-date="'+date+'"]').click();
const action = (app,name) => app.w.document.querySelector('#fitplanCalendarV2 [data-act="'+name+'"]').click();

test('calendar stays in normal layout with one back button and named day navigation', async t => {
  const app = await calendar(t), doc = app.w.document, root = doc.getElementById('fitplanCalendarV2');
  assert.notEqual(app.w.getComputedStyle(root).position, 'absolute');
  assert.equal(doc.querySelectorAll('#modulePage [data-act="back"]').length,0);
  assert.equal(root.querySelector('[data-act="prev"]').getAttribute('aria-label'),'Poprzedni miesiąc');
  const today = root.querySelector('[data-date="2026-10-07"]');
  assert.match(today.getAttribute('aria-label'),/07\.10\.2026/);
});

test('changing days cannot discard a dirty note when the user cancels', async t => {
  const app=await calendar(t); day(app,'2026-10-07');
  app.w.document.getElementById('fpcNote').value='Niezapisana notatka';
  app.w.confirm=()=>false;
  day(app,'2026-10-08');
  assert.equal(app.w.document.getElementById('fpcNote').value,'Niezapisana notatka');
  assert.equal(app.w.FitPlanState.snapshot().calendar.selected,'2026-10-07');
  app.w.document.getElementById('backBtn').click(); await app.settle();
  assert.equal(app.w.FitPlanState.snapshot().navigation.sectionId,'kalendarz-treningowy');
  assert.equal(app.w.document.getElementById('fpcNote').value,'Niezapisana notatka');
});

test('saving an empty calendar entry reports an error instead of creating a ghost day', async t => {
  const app=await calendar(t); day(app,'2026-10-07'); action(app,'save');
  assert.equal(app.dom.window.localStorage.getItem(CALENDAR),null);
  assert.match(app.w.document.getElementById('toast').textContent,/notatkę|godzinę/);
});

test('calendar translates new renderings and preserves user notes and focus across language changes', async t => {
  const app=await calendar(t,{storage:{[CALENDAR]:'{"2026-10-07":{"note":"Notatka","time":"18:30"}}'}});
  day(app,'2026-10-07');
  const note=app.w.document.getElementById('fpcNote'); note.value='Wróć'; note.focus();
  app.dom.window.dispatchEvent(new app.dom.window.CustomEvent('portal-preferences-change',{detail:{language:'en',theme:'gray'}})); await app.settle();
  assert.equal(app.w.document.documentElement.lang,'en');
  assert.equal(app.w.document.getElementById('fpcNote'),note);
  assert.equal(note.value,'Wróć');
  assert.equal(app.w.document.activeElement,note);
  assert.equal(app.w.document.querySelector('[data-act="today"]').textContent,'Today');
  assert.equal(app.w.document.querySelector('.fpc-editor').getAttribute('aria-label'),'Entry editor');
  app.w.confirm=()=>true; action(app,'next');
  assert.match(app.w.document.querySelector('.fpc-top h2').textContent,/November 2026/);
  app.dom.window.dispatchEvent(new app.dom.window.CustomEvent('portal-preferences-change',{detail:{language:'pl',theme:'light'}})); await app.settle();
  assert.equal(app.w.document.querySelector('[data-act="today"]').textContent,'Dzisiaj');
});

test('shared language controller round-trips PL and EN without leaving an English hero', async t => {
  const app=await createFitPlan(t);
  app.dom.window.eval(fs.readFileSync('apps/shared/i18n-core.js','utf8'));
  app.dom.window.eval(fs.readFileSync('apps/shared/portal-nav.js','utf8'));
  app.dom.window.PortalPreferences.setLanguage('en'); await app.settle();
  app.dom.window.PortalPreferences.setLanguage('pl'); await app.settle();
  assert.equal(app.w.document.querySelector('.hero h1').textContent,'Planer treningowy');
  assert.match(app.w.document.querySelector('.hero p').textContent,/Narzędzie/);
  app.dom.window.PortalPreferences.setTheme('blue'); await app.settle();
  assert.equal(app.w.document.documentElement.dataset.theme,'blue');
});

test('malformed persisted data cannot be silently overwritten by a calendar save', async t => {
  const app=await createFitPlan(t,{storage:{[CALENDAR]:'{broken'}});
  assert.throws(()=>app.w.FitPlanState.calendar.save('2026-10-07',{note:'new'}));
  assert.equal(app.dom.window.localStorage.getItem(CALENDAR),'{broken');
});

test('complete backup carries calendar notes and preserves legacy import compatibility', async t => {
  const app=await createFitPlan(t,{storage:{[PROGRESS]:'{"completed":{"dieta":true},"future":42}',[CALENDAR]:'{"2026-10-07":{"note":"Nogi","time":"18:30","future":7}}'}});
  assert.ok(app.w.FitPlanState.backup);
  const data=plain(app.w.FitPlanState.backup.export());
  assert.deepEqual(data,{format:'fitplan-backup',version:2,progress:{completed:{dieta:true},future:42},calendar:{'2026-10-07':{note:'Nogi',time:'18:30',future:7}}});
  app.w.FitPlanState.backup.import({completed:{'plan-treningowy':true}});
  assert.deepEqual(JSON.parse(app.dom.window.localStorage.getItem(CALENDAR)),data.calendar);
  app.w.FitPlanState.backup.import(data);
  assert.deepEqual(JSON.parse(app.dom.window.localStorage.getItem(PROGRESS)),data.progress);
});

test('bad backup or failure of its second write leaves both old records unchanged', async t => {
  const p='{"completed":{"dieta":true}}',c='{"2026-10-07":{"note":"old","time":"18:30"}}';
  const app=await createFitPlan(t,{storage:{[PROGRESS]:p,[CALENDAR]:c}}), state=app.w.FitPlanState;
  assert.ok(state.backup);
  for(const calendar of [[],{'2026-02-31':{note:'bad'}},{'2026-10-07':{note:42}}]){
    assert.throws(()=>state.backup.import({format:'fitplan-backup',version:2,progress:{completed:{}},calendar}));
  }
  assert.throws(()=>state.backup.import({unrelated:true}));
  const original=app.w.Storage.prototype.setItem;
  app.w.Storage.prototype.setItem=function(k,v){if(k===CALENDAR&&v!==c)throw new Error('quota'); return original.call(this,k,v);};
  assert.throws(()=>state.backup.import({format:'fitplan-backup',version:2,progress:{completed:{}},calendar:{}}),/quota/);
  app.w.Storage.prototype.setItem=original;
  assert.equal(app.dom.window.localStorage.getItem(PROGRESS),p);
  assert.equal(app.dom.window.localStorage.getItem(CALENDAR),c);
});

test('stale delete and move refuse to remove a changed calendar record', async t => {
  const app=await createFitPlan(t,{storage:{[CALENDAR]:'{"2026-10-07":{"note":"new","time":"18:30"}}'}});
  const c=app.w.FitPlanState.calendar, before=app.dom.window.localStorage.getItem(CALENDAR);
  assert.throws(()=>c.remove('2026-10-07',{note:'old',time:'18:30'}));
  assert.throws(()=>c.move('2026-10-07','2026-10-08',{note:'old',time:'18:30'}));
  assert.equal(app.dom.window.localStorage.getItem(CALENDAR),before);
});

test('the export and import buttons use the complete backup rather than progress alone', async t => {
  const app=await createFitPlan(t,{storage:{[CALENDAR]:'{"2026-10-07":{"note":"Kopia","time":"18:30"}}'}});
  let exported;
  app.w.Blob=class {constructor(parts){exported=JSON.parse(parts.join(''));}};
  app.w.URL.createObjectURL=()=> 'blob:test'; app.w.URL.revokeObjectURL=()=>{};
  app.w.HTMLAnchorElement.prototype.click=()=>{};
  app.w.document.getElementById('exportBtn').click();
  assert.equal(exported.calendar['2026-10-07'].note,'Kopia');
  exported.calendar['2026-10-07'].note='Przywrócona';
  const input=app.w.document.getElementById('importFile'); app.w.confirm=()=>true;
  Object.defineProperty(input,'files',{value:[{text:async()=>JSON.stringify(exported)}]});
  input.dispatchEvent(new app.w.Event('change')); await tick();
  assert.equal(JSON.parse(app.dom.window.localStorage.getItem(CALENDAR))['2026-10-07'].note,'Przywrócona');
});

test('home presents the completed results control panel as an available module',async t=>{
  const app=await createFitPlan(t);
  assert.doesNotMatch(app.card('podsumowanie-wynikow').textContent,/W przygotowaniu/);
  assert.match(app.card('podsumowanie-wynikow').textContent,/Panel sterowania/);
  for(const id of ['plan-treningowy','dieta','kalendarz-treningowy']) assert.doesNotMatch(app.card(id).textContent,/W przygotowaniu/);
});

test('clicking the selected day preserves an unsaved editor', async t => {
  const app=await calendar(t); day(app,'2026-10-07');
  const note=app.w.document.getElementById('fpcNote'); note.value='Mój szkic';
  day(app,'2026-10-07');
  assert.equal(app.w.document.getElementById('fpcNote'),note);
  assert.equal(note.value,'Mój szkic');
});

test('canceling a history change keeps the calendar draft and its matching URL', async t => {
  const app=await calendar(t); day(app,'2026-10-07');
  app.w.document.getElementById('fpcNote').value='Mój szkic';
  let confirmations=0; app.w.confirm=()=>{confirmations++;return false;};
  app.dom.window.history.pushState({},'','/apps/fitplan/modul/dieta/');
  app.dom.window.dispatchEvent(new app.dom.window.PopStateEvent('popstate'));
  await app.settle();
  assert.equal(confirmations,1);
  assert.equal(app.dom.window.location.pathname,'/apps/fitplan/modul/kalendarz-treningowy/');
  assert.equal(app.w.document.getElementById('fpcNote').value,'Mój szkic');
});

test('English searches find the exercise labels shown in the atlas', async t => {
  const app=await createFitPlan(t);
  app.dom.window.eval(fs.readFileSync('apps/shared/i18n-core.js','utf8'));
  app.dom.window.eval(fs.readFileSync('apps/shared/portal-nav.js','utf8'));
  app.dom.window.PortalPreferences.setLanguage('en');
  app.w.FitPlanApp.open('tabela-cwiczen'); await app.settle();
  const search=app.w.document.querySelector('#atlasRoot input[type="search"]');
  for(const query of ['bench press','push-ups','pectoralis major','wyciskanie','pectora']){
    search.value=query; search.dispatchEvent(new app.w.Event('input',{bubbles:true})); await tick();
    assert.ok([...app.w.document.querySelectorAll('.fp-muscle-card')].some(card=>card.dataset.muscle==='pectoralis'),query+' should find pectoralis major');
  }
});

// WIEDORA-CHANGE: WD-20261029-WIE-007-PUBLIC-TEST-CODEX1 | TASK: WIE-007 | AUTHOR: Codex / GPT-6
test('FitPlan public anatomy opens for a guest without a login dialog',async t=>{
  const app=await createFitPlan(t,{guardFirst:true});app.card('tabela-cwiczen').click();await app.settle();
  assert.equal(app.w.document.getElementById('portalGuestLockOverlay'),null);
  assert.equal(app.w.FitPlanModules.active,'tabela-cwiczen');
});

test('without WebGL the model controls are disabled and muscle descriptions remain usable',async t=>{
  const app=await createFitPlan(t);app.w.FitPlanApp.open('tabela-cwiczen');await app.settle();
  await until(()=>app.w.document.querySelector('.fp-loader [data-action="retry"]'));
  for(const button of app.w.document.querySelectorAll('[data-view],[data-zoom],[data-spin]'))assert.equal(button.disabled,true);
  app.w.document.querySelector('[data-category="legs"]').click();
  app.w.document.querySelector('.fp-muscle-card').click();
  assert.ok(app.w.document.querySelector('.fp-detail h3').textContent);
  assert.equal(app.w.document.querySelector('[data-action="focus"]').disabled,true);
  assert.doesNotMatch(app.w.document.querySelector('.fp-loader').textContent,/zapisany plik HTML/);
});

test('a saved EN preference still returns to Polish when shared translations load late',async t=>{
  let parent,release;const delayI18n=new Promise(resolve=>{release=resolve;});
  const pending=createFitPlan(t,{storage:{'portal-language-v1':'en'},sharedPreferences:true,delayI18n,observeWindow:w=>{parent=w;}});
  await until(()=>parent?.document.querySelector('#appFrame')?.contentDocument?.readyState==='complete');
  release();const app=await pending;await app.settle();
  app.dom.window.PortalPreferences.setLanguage('pl');await app.settle();
  assert.equal(app.w.document.querySelector('.hero h1').textContent,'Planer treningowy');
});

test('becoming a guest keeps public FitPlan modules accessible',async t=>{
  const app=await createFitPlan(t);let authChange,session={user:{id:'fixture-only'}};
  app.dom.window.AppSupabase={auth:{getSession:async()=>({data:{session}}),onAuthStateChange:fn=>{authChange=fn;}}};
  app.dom.window.eval(fs.readFileSync('apps/shared/guest-access.js','utf8'));await tick();
  app.w.FitPlanApp.open('tabela-cwiczen');await app.settle();
  session=null;authChange('SIGNED_OUT',null);await app.settle();
  app.dom.window.history.pushState({},'','/apps/fitplan/modul/tabela-cwiczen/');
  app.dom.window.dispatchEvent(new app.dom.window.PopStateEvent('popstate'));await app.settle();
  assert.equal(app.w.FitPlanState.snapshot().navigation.sectionId,'tabela-cwiczen');
  assert.equal(app.w.document.getElementById('modulePage').hidden,false);
  assert.equal(app.dom.window.location.pathname,'/apps/fitplan/modul/tabela-cwiczen/');
});

test('sign-out removes a private calendar draft from the visible page',async t=>{
  const app=await calendar(t);let authChange;
  app.dom.window.AppSupabase={auth:{getSession:async()=>({data:{session:{user:{id:'fixture-only'}}}}),onAuthStateChange:fn=>{authChange=fn;}}};
  app.dom.window.eval(fs.readFileSync('apps/shared/guest-access.js','utf8'));await tick();await app.settle();
  day(app,'2026-10-07');app.w.document.getElementById('fpcNote').value='Prywatny szkic';
  app.w.confirm=()=>{throw new Error('sign-out must not keep a private editor open');};
  authChange('SIGNED_OUT',null);await app.settle();
  assert.equal(app.w.document.getElementById('homePage').hidden,false);
  assert.equal(app.w.FitPlanState.snapshot().calendar.selected,null);
});
