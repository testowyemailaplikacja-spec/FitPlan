const test = require('node:test');
const assert = require('node:assert/strict');
const { harness } = require('./script-harness.cjs');
const { createFitPlan } = require('./fitplan-shell-harness.cjs');
const PROGRESS='planer-treningowy-progress-v1.6', CALENDAR='fitplan.calendar.entries.v2';
const notes='{"2026-10-07":{"note":"Nogi","time":"18:30"}}';
const start=options=>{const h=harness({app:'fitplan',...options});h.run('js/progress-storage.js');h.run('apps/shared/account-sync.js');return h;};

test('FitPlan cloud snapshots include calendar notes and sign-out clears their account copy',async()=>{
  const h=start({local:{[CALENDAR]:notes}}); await h.flush();
  assert.equal(h.database.get('user_app_state:alice:fitplan').state.storage[CALENDAR],notes);
  h.emitAuth(null); assert.equal(h.context.localStorage.getItem(CALENDAR),null);
});

test('an old FitPlan cloud snapshot does not erase existing local calendar notes',()=>{
  const h=harness({app:'fitplan',local:{[CALENDAR]:notes}});h.run('js/progress-storage.js');
  h.context.PortalProgressStorage.applySnapshot('fitplan',{[PROGRESS]:'{"completed":{}}'});
  assert.equal(h.context.localStorage.getItem(CALENDAR),notes);
  h.context.PortalProgressStorage.applySnapshot('fitplan',{[PROGRESS]:'{"completed":{}}',[CALENDAR]:null});
  assert.equal(h.context.localStorage.getItem(CALENDAR),null,'a current explicit empty calendar must restore correctly');
});

test('switching accounts cannot seed a new account with the previous calendar',async()=>{
  const h=start({user:'bob',local:{[CALENDAR]:notes,'portal-progress-owners-v1':'{"fitplan":"alice"}'}});
  await h.flush();
  assert.equal(h.context.localStorage.getItem(CALENDAR),null);
  assert.equal(h.database.get('user_app_state:bob:fitplan').state.storage[CALENDAR],null);
});

test('calendar migration remains pending across a reload of an old cloud snapshot',async()=>{
  const rows={'user_app_state:alice:fitplan':{revision:5,state:{schema:3,storage:{[PROGRESS]:'{"completed":{}}'}}}};
  const h=start({rows,local:{[CALENDAR]:notes,'portal-progress-owners-v1':'{"fitplan":"alice"}'}}); await h.flush();
  assert.equal(h.context.localStorage.getItem(CALENDAR),notes);
  const next=start({rows,local:Object.fromEntries(h.context.localStorage.data)}); await next.flush();
  assert.equal(next.database.get('user_app_state:alice:fitplan').state.storage[CALENDAR],notes);
});

test('FitPlan iframe writes report persisted changes to the parent sync controller',async t=>{
  const app=await createFitPlan(t); const changes=[];
  app.dom.window.addEventListener('portal-sync-request',e=>changes.push(e.detail));
  app.w.FitPlanState.calendar.save('2026-10-07',{note:'Nogi',time:'18:30'});
  app.w.FitPlanState.progress.setCompleted('dieta',true);
  assert.equal(changes.length,2);
  assert.ok(changes.every(e=>e.appId==='fitplan'&&e.dirty===true));
});

test('an iframe sync request records an offline edit for the next sign-in',async()=>{
  const h=start({rows:{'user_app_state:alice:fitplan':{revision:5,state:{schema:3,storage:{[PROGRESS]:null,[CALENDAR]:null}}}}}); await h.flush();
  h.context.navigator.onLine=false;
  h.context.localStorage.setItem(CALENDAR,notes);
  h.context.dispatchEvent(new CustomEvent('portal-sync-request',{detail:{appId:'fitplan',dirty:true}}));
  await h.advance(2000);
  const meta=JSON.parse(h.context.localStorage.getItem('portal-account-sync-meta:alice:fitplan'));
  assert.ok(meta.dirtyAt>meta.lastPulledAt);
});

test('a guest calendar survives reopening FitPlan without importing account data',async()=>{
  const h=start({user:null,local:{[CALENDAR]:notes}});await h.flush();
  assert.equal(h.context.localStorage.getItem(CALENDAR),notes);
  assert.equal(h.writes.length,0);
});

test('sign-out permits a new guest calendar to survive a later visit',async()=>{
  const h=start({local:{[CALENDAR]:notes}});await h.flush();h.emitAuth(null);
  h.context.localStorage.setItem(CALENDAR,notes);
  const guest=start({user:null,local:Object.fromEntries(h.context.localStorage.data)});await guest.flush();
  assert.equal(guest.context.localStorage.getItem(CALENDAR),notes);
});

test('an expired account session clears its private cached calendar',async()=>{
  const h=start({user:null,local:{[CALENDAR]:notes,'portal-progress-owners-v1':'{"fitplan":"alice"}'}});await h.flush();
  assert.equal(h.context.localStorage.getItem(CALENDAR),null);
});

test('first login preserves guest notes when the existing account calendar is empty',async()=>{
  const h=start({local:{[CALENDAR]:notes},rows:{'user_app_state:alice:fitplan':{revision:5,state:{schema:3,storage:{[PROGRESS]:null,[CALENDAR]:null}}}}});await h.flush();
  assert.equal(h.context.localStorage.getItem(CALENDAR),notes);
  await h.advance(1000);
  assert.equal(h.database.get('user_app_state:alice:fitplan').state.storage[CALENDAR],notes);
});

test('first login preserves both same-day notes and times without mixing known accounts',async()=>{
  const account='{"2026-10-07":{"note":"Cardio","time":"09:00","future":42}}';
  const h=start({local:{[CALENDAR]:notes},rows:{'user_app_state:alice:fitplan':{revision:5,state:{schema:3,storage:{[PROGRESS]:null,[CALENDAR]:account}}}}});await h.flush();
  const entry=JSON.parse(h.context.localStorage.getItem(CALENDAR))['2026-10-07'];
  assert.match(entry.note,/Cardio/);assert.match(entry.note,/Nogi/);assert.match(entry.note,/18:30/);
  assert.equal(entry.time,'09:00');assert.equal(entry.future,42);
});
