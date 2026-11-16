const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM } = require('jsdom');
const { createFitPlan, until } = require('./fitplan-shell-harness.cjs');

const PROGRESS = 'planer-treningowy-progress-v1.6';
const CALENDAR = 'fitplan.calendar.entries.v2';
const plain = value => JSON.parse(JSON.stringify(value));
function realm(t, values = {}) {
  const dom = new JSDOM('', { url: 'https://portal.test/apps/fitplan/legacy.html', runScripts: 'outside-only' });
  t.after(() => dom.window.close());
  const w = dom.window;
  for (const [key, value] of Object.entries(values)) w.localStorage.setItem(key, value);
  w.eval(fs.readFileSync('apps/fitplan/data/app-data.js', 'utf8'));
  for (const file of ['core/storage.js', 'core/state.js']) {
    if (fs.existsSync('apps/fitplan/' + file)) w.eval(fs.readFileSync('apps/fitplan/' + file, 'utf8'));
  }
  assert.ok(w.FitPlanState, 'the central state must exist before consumers start');
  return w;
}

// Catches writes during boot and discarded future fields when marking a module.
test('central state reads legacy records without migrating or rewriting them', t => {
  const progress = '{"completed":{"dieta":true},"future":{"unit":"kg"}}';
  const calendar = '{"2026-10-04":{"note":"Nogi","time":"18:30","future":7}}';
  const w = realm(t, { [PROGRESS]: progress, [CALENDAR]: calendar });
  assert.equal(w.localStorage.getItem(PROGRESS), progress);
  assert.equal(w.localStorage.getItem(CALENDAR), calendar);
  assert.equal(w.FitPlanState.progress.isCompleted('dieta'), true);
  w.FitPlanState.progress.setCompleted('plan-treningowy', true);
  assert.deepEqual(JSON.parse(w.localStorage.getItem(PROGRESS)), { completed: { dieta: true, 'plan-treningowy': true }, future: { unit: 'kg' } });
  assert.equal(w.localStorage.getItem(CALENDAR), calendar);
  const snapshot = w.FitPlanState.snapshot();
  assert.equal(Reflect.set(snapshot.progress.completed, 'dieta', false), false);
  assert.equal(Reflect.set(snapshot.navigation, 'sectionId', 'dieta'), false);
  assert.equal(w.FitPlanState.progress.isCompleted('dieta'), true);
  assert.deepEqual(plain(snapshot.calendar.entries['2026-10-04']), { note: 'Nogi', time: '18:30', future: 7 });
});

// Catches read failures being treated as writes, including array-shaped data.
test('malformed stored values leave source untouched and still permit a safe snapshot', t => {
  for (const raw of ['{broken', 'null', '[]', '"text"', '{"completed":[]}']) {
    const w = realm(t, { [PROGRESS]: raw, [CALENDAR]: raw });
    assert.deepEqual(plain(w.FitPlanState.progress.completed()), {});
    assert.ok(w.FitPlanState.snapshot().calendar.entries);
    assert.equal(w.localStorage.getItem(PROGRESS), raw);
    assert.equal(w.localStorage.getItem(CALENDAR), raw);
  }
});

test('invalid imports cannot replace existing progress', t => {
  const raw = '{"completed":{"dieta":true}}';
  const w = realm(t, { [PROGRESS]: raw });
  for (const value of [null, [], 'text', { completed: [] }]) {
    assert.throws(() => w.FitPlanState.progress.write(value));
    assert.equal(w.localStorage.getItem(PROGRESS), raw);
  }
});

test('calendar operations preserve other days and refuse to overwrite an occupied target', t => {
  const w = realm(t, { [CALENDAR]: '{"2026-10-04":{"note":"Nogi","time":"18:30"},"2026-10-07":{"note":"Cardio","time":"19:00"}}' });
  const c = w.FitPlanState.calendar;
  assert.equal(c.move('2026-10-04', '2026-10-07'), false);
  assert.equal(c.move('2026-10-04', '2026-10-06'), true);
  c.save('2026-10-08', { note: '  Plecy  ', time: '17:00' });
  assert.equal(c.remove('2026-10-06'), true);
  assert.equal(c.remove('2026-10-06'), false);
  assert.deepEqual(JSON.parse(w.localStorage.getItem(CALENDAR)), { '2026-10-07': { note: 'Cardio', time: '19:00' }, '2026-10-08': { note: 'Plecy', time: '17:00' } });
  assert.throws(() => c.save('__proto__', { note: 'bad' }));
  assert.throws(() => c.save('2026-02-31', { note: 'bad' }));
});

test('failed writes propagate without changing persisted or transient state', t => {
  const raw = '{"completed":{"dieta":true}}';
  const w = realm(t, { [PROGRESS]: raw });
  const original = w.Storage.prototype.setItem;
  w.Storage.prototype.setItem = function () { throw new w.DOMException('quota', 'QuotaExceededError'); };
  assert.throws(() => w.FitPlanState.progress.setCompleted('plan-treningowy', true), /quota/);
  assert.throws(() => w.FitPlanState.calendar.save('2026-10-08', { note: 'Nogi' }), /quota/);
  w.Storage.prototype.setItem = original;
  assert.equal(w.localStorage.getItem(PROGRESS), raw);
  assert.equal(w.localStorage.getItem(CALENDAR), null);
  assert.deepEqual(plain(w.FitPlanState.snapshot().navigation), { sectionId: null, tab: 'note' });
});

test('state reads external updates and sends a refresh signal for storage changes', t => {
  const w = realm(t);
  let changes = 0;
  w.addEventListener('fitplan:state:change', () => changes++);
  w.localStorage.setItem(PROGRESS, '{"completed":{"dieta":true}}');
  w.dispatchEvent(new w.StorageEvent('storage', { key: PROGRESS, storageArea: w.localStorage }));
  assert.equal(w.FitPlanState.progress.isCompleted('dieta'), true);
  assert.equal(changes, 1);
  w.localStorage.setItem(CALENDAR, '{"2026-10-04":{"note":"nowy","time":"12:00"}}');
  w.FitPlanState.calendar.save('2026-10-05', { note: 'drugi', time: '13:00' });
  assert.deepEqual(JSON.parse(w.localStorage.getItem(CALENDAR)), { '2026-10-04': { note: 'nowy', time: '12:00' }, '2026-10-05': { note: 'drugi', time: '13:00' } });
});

test('navigation accepts only existing modules and tabs without persisting view state', t => {
  const w = realm(t);
  assert.equal(w.FitPlanState.setNavigation('dieta', 'note'), true);
  assert.equal(w.FitPlanState.setNavigation('dieta', 'questions'), false);
  assert.equal(w.FitPlanState.setNavigation('dieta', 'exam'), false);
  assert.deepEqual(plain(w.FitPlanState.snapshot().navigation), { sectionId: 'dieta', tab: 'note' });
  assert.equal(w.FitPlanState.setNavigation('missing', 'exam'), false);
  assert.equal(w.FitPlanState.setNavigation('dieta', 'missing'), false);
  assert.deepEqual(plain(w.FitPlanState.snapshot().navigation), { sectionId: 'dieta', tab: 'note' });
  w.FitPlanState.setNavigation(null);
  assert.deepEqual(plain(w.FitPlanState.snapshot().navigation), { sectionId: null, tab: 'note' });
  assert.equal(w.localStorage.length, 0);
});

test('reset preserves its previous scope and cannot remove calendar entries', t => {
  const w = realm(t, { [PROGRESS]: '{"completed":{"dieta":true}}', [CALENDAR]: '{"2026-10-04":{"note":"Nogi"}}' });
  w.FitPlanState.progress.reset();
  assert.equal(w.localStorage.getItem(PROGRESS), null);
  assert.equal(w.localStorage.getItem(CALENDAR), '{"2026-10-04":{"note":"Nogi"}}');
  assert.deepEqual(plain(w.FitPlanState.progress.completed()), {});
});

// Removing any consumer adapter would leave the two public APIs or UI out of sync.
test('shell and legacy share progress state while boot leaves saved bytes untouched', async t => {
  const progress = '{"completed":{"dieta":true},"future":42}';
  const calendar = '{"2026-10-04":{"note":"Nogi","time":"18:30"}}';
  const app = await createFitPlan(t, { storage: { [PROGRESS]: progress, [CALENDAR]: calendar } });
  assert.ok(app.w.FitPlanState, 'legacy must load central state before its boot code');
  assert.equal(app.dom.window.FitPlanState, app.w.FitPlanState);
  assert.equal(app.dom.window.localStorage.getItem(PROGRESS), progress);
  assert.equal(app.dom.window.localStorage.getItem(CALENDAR), calendar);
  assert.equal(app.w.document.getElementById('progressPercent').textContent, '14%');
  app.dom.window.FitPlanProgress.setCompleted('plan-treningowy', true);
  assert.equal(app.w.document.getElementById('progressPercent').textContent, '29%');
  app.card('dieta').click(); await app.settle();
  app.w.document.getElementById('completeSectionBtn').click(); await app.settle();
  assert.equal(app.dom.window.FitPlanProgress.isCompleted('dieta'), false);
  assert.deepEqual(JSON.parse(app.dom.window.localStorage.getItem(PROGRESS)), { completed: { dieta: false, 'plan-treningowy': true }, future: 42 });
  assert.equal(app.dom.window.localStorage.getItem(CALENDAR), calendar);
  assert.deepEqual(app.errors, []);
});

test('central navigation follows cards, tabs, browser restore and legacy back button', async t => {
  const app = await createFitPlan(t);
  assert.ok(app.w.FitPlanState);
  const nav = () => plain(app.w.FitPlanState.snapshot().navigation);
  app.card('dieta').click(); await app.settle();
  assert.deepEqual(nav(), { sectionId: 'dieta', tab: 'note' });
  app.w.document.querySelector('[data-tab="questions"]').click();
  assert.deepEqual(nav(), { sectionId: 'dieta', tab: 'note' });
  assert.equal(new URL(app.dom.window.location.href).searchParams.get('widok'), null);
  app.w.openSection('missing');
  assert.deepEqual(nav(), { sectionId: 'dieta', tab: 'note' });
  app.dom.window.history.pushState({}, '', '/apps/fitplan/modul/plan-treningowy/?widok=exam');
  app.dom.window.dispatchEvent(new app.dom.window.PopStateEvent('popstate'));
  await app.settle();
  assert.deepEqual(nav(), { sectionId: 'plan-treningowy', tab: 'note' });
  assert.equal(app.w.document.getElementById('moduleTabs').hidden, true);
  app.w.document.getElementById('backBtn').click(); await app.settle();
  assert.deepEqual(nav(), { sectionId: null, tab: 'note' });
  assert.equal(app.dom.window.location.pathname, '/apps/fitplan/');
  assert.deepEqual(app.errors, []);
});

// WIEDORA-CHANGE: WD-20261029-WIE-007-PUBLIC-TEST-CODEX1 | TASK: WIE-007 | AUTHOR: Codex / GPT-6
test('guest navigation moves from calendar to public anatomy', async t => {
  const app = await createFitPlan(t, { guardFirst: true });
  assert.ok(app.w.FitPlanState);
  app.card('kalendarz-treningowy').click(); await app.settle();
  assert.deepEqual(plain(app.w.FitPlanState.snapshot().navigation), { sectionId: 'kalendarz-treningowy', tab: 'note' });
  app.w.FitPlanApp.open('tabela-cwiczen'); await app.settle();
  assert.deepEqual(plain(app.w.FitPlanState.snapshot().navigation), { sectionId: 'tabela-cwiczen', tab: 'note' });
});

test('calendar edits use current central data and survive leave, reenter, and external refresh', async t => {
  const app = await createFitPlan(t, { storage: { [CALENDAR]: '{"2026-10-04":{"note":"Nogi","time":"18:30"}}' } });
  assert.ok(app.w.FitPlanState);
  app.w.FitPlanState.calendar.setView({ year: 2026, month: 9 });
  app.card('kalendarz-treningowy').click(); await app.settle();
  const doc = app.w.document;
  const act = name => doc.querySelector('#fitplanCalendarV2 [data-act="' + name + '"]').click();
  const day = date => doc.querySelector('#fitplanCalendarV2 [data-date="' + date + '"]').click();
  day('2026-10-04');
  assert.equal(doc.getElementById('fpcNote').value, 'Nogi');
  act('move'); day('2026-10-06');
  app.dom.window.localStorage.setItem(CALENDAR, '{"2026-10-06":{"note":"Nogi","time":"18:30"},"2026-10-09":{"note":"Z innej karty","time":"08:00"}}');
  app.w.dispatchEvent(new app.w.StorageEvent('storage', { key: CALENDAR, storageArea: app.w.localStorage }));
  assert.match(doc.querySelector('[data-date="2026-10-09"]').textContent, /Z innej karty/);
  day('2026-10-08'); doc.getElementById('fpcNote').value = 'Plecy'; doc.getElementById('fpcTime').value = '17:00'; act('save');
  assert.deepEqual(JSON.parse(app.dom.window.localStorage.getItem(CALENDAR)), { '2026-10-06': { note: 'Nogi', time: '18:30' }, '2026-10-09': { note: 'Z innej karty', time: '08:00' }, '2026-10-08': { note: 'Plecy', time: '17:00' } });
  doc.getElementById('backBtn').click(); await app.settle();
  app.card('kalendarz-treningowy').click(); await app.settle();
  day('2026-10-08'); assert.equal(doc.getElementById('fpcNote').value, 'Plecy');
  app.w.confirm=()=>true; act('delete');
  assert.equal(JSON.parse(app.dom.window.localStorage.getItem(CALENDAR))['2026-10-08'], undefined);
  assert.equal(app.w.FitPlanState.snapshot().calendar.selected, null);
  assert.deepEqual(app.errors, []);
});

test('a denied progress write and invalid file import do not claim success in the UI', async t => {
  const app = await createFitPlan(t, { storage: { [PROGRESS]: '{"completed":{"dieta":true}}' } });
  assert.ok(app.w.FitPlanState);
  const w = app.w, original = w.Storage.prototype.setItem;
  w.Storage.prototype.setItem = function () { throw new w.DOMException('quota', 'QuotaExceededError'); };
  app.card('dieta').click(); await app.settle();
  w.document.getElementById('completeSectionBtn').click(); await app.settle();
  assert.match(w.document.getElementById('toast').textContent, /Nie udało się zapisać/);
  assert.equal(w.FitPlanState.progress.isCompleted('dieta'), true);
  const input = w.document.getElementById('importFile');
  w.confirm = () => true;
  const file = { text: async () => '{"completed":{"plan-treningowy":true}}' };
  Object.defineProperty(input, 'files', { configurable: true, value: [file] });
  input.dispatchEvent(new w.Event('change'));
  await until(() => input.value === '' && /Nie udało się zapisać/.test(w.document.getElementById('toast').textContent));
  await new Promise(resolve => setImmediate(resolve));
  assert.doesNotMatch(w.document.getElementById('toast').textContent, /zaimportowane/);
  w.Storage.prototype.setItem = original;
  let alerts = 0; w.alert = () => alerts++;
  Object.defineProperty(input, 'files', { configurable: true, value: [{ text: async () => '[]' }] });
  input.dispatchEvent(new w.Event('change')); await until(() => alerts === 1);
  assert.equal(w.FitPlanState.progress.isCompleted('dieta'), true);
  assert.deepEqual(app.errors, []);
});

test('an untouched empty editor refreshes a newly added external entry before Save', async t => {
  const app = await createFitPlan(t);
  app.w.FitPlanState.calendar.setView({ year: 2026, month: 9 });
  app.card('kalendarz-treningowy').click(); await app.settle();
  const doc = app.w.document;
  doc.querySelector('[data-date="2026-10-08"]').click();
  const raw = '{"2026-10-08":{"note":"Z innej karty","time":"08:00","future":42}}';
  app.dom.window.localStorage.setItem(CALENDAR, raw);
  app.w.dispatchEvent(new app.w.StorageEvent('storage', { key: CALENDAR, storageArea: app.w.localStorage }));
  assert.equal(doc.getElementById('fpcNote').value, 'Z innej karty');
  assert.equal(doc.getElementById('fpcTime').value, '08:00');
  doc.querySelector('[data-act="save"]').click();
  assert.deepEqual(JSON.parse(app.w.localStorage.getItem(CALENDAR)), { '2026-10-08': { note: 'Z innej karty', time: '08:00', future: 42 } });
});

test('saving a dirty same-day draft refuses to overwrite a later external edit', async t => {
  const app = await createFitPlan(t, { storage: { [CALENDAR]: '{"2026-10-08":{"note":"Nogi","time":"18:30"}}' } });
  app.w.FitPlanState.calendar.setView({ year: 2026, month: 9 });
  app.card('kalendarz-treningowy').click(); await app.settle();
  const doc = app.w.document;
  doc.querySelector('[data-date="2026-10-08"]').click();
  doc.getElementById('fpcNote').value = 'Mój szkic';
  const raw = '{"2026-10-08":{"note":"Zmiana z drugiej karty","time":"09:00"}}';
  app.dom.window.localStorage.setItem(CALENDAR, raw);
  app.w.dispatchEvent(new app.w.StorageEvent('storage', { key: CALENDAR, storageArea: app.w.localStorage }));
  assert.equal(doc.getElementById('fpcNote').value, 'Mój szkic');
  doc.querySelector('[data-act="save"]').click();
  assert.equal(app.w.localStorage.getItem(CALENDAR), raw);
  assert.equal(doc.getElementById('fpcNote').value, 'Mój szkic');
  assert.match(doc.getElementById('toast').textContent, /Wpis zmienił się/);
  // Discarding the draft and reopening reads the current record and permits a new edit.
  doc.querySelector('[data-act="discard"]').click();
  doc.querySelector('[data-date="2026-10-08"]').click();
  assert.equal(doc.getElementById('fpcNote').value, 'Zmiana z drugiej karty');
  doc.getElementById('fpcNote').value = 'Nowy trening';
  doc.querySelector('[data-act="save"]').click();
  assert.equal(JSON.parse(app.w.localStorage.getItem(CALENDAR))['2026-10-08'].note, 'Nowy trening');
});
