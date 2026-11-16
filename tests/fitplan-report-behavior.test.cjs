const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { createFitPlan, until } = require('./fitplan-shell-harness.cjs');

test('calendar countdowns remain chronological across seasons and the December year boundary', () => {
  const window = {};
  vm.runInNewContext(fs.readFileSync('apps/fitplan/calendar-enhancement.js', 'utf8'), { window, Date });
  const summary = window.FitPlanCalendarModel.seasonSummary;
  for (const [date, dayOfYear, label, days] of [
    [new Date(2026, 9, 18), 291, 'Do końca jesieni', 43],
    [new Date(2026, 11, 31), 365, 'Do końca roku', 0],
    [new Date(2027, 0, 1), 1, 'Do końca zimy', 58],
    [new Date(2028, 1, 29), 60, 'Do końca zimy', 0],
    [new Date(2028, 2, 1), 61, 'Do końca wiosny', 91],
    [new Date(2026, 5, 1), 152, 'Do końca lata', 91]
  ]) {
    const actual = summary(date);
    assert.equal(actual.dayOfYear, dayOfYear);
    assert.equal(actual.metrics[0].label, label);
    assert.equal(actual.metrics[0].days, days);
    const remaining = Array.from(actual.metrics, item => item.days);
    assert.deepEqual(remaining, [...remaining].sort((a, b) => a - b), date.toISOString());
  }
});

test('kettlebell levels persist across module reentry without tabs or completion controls', async t => {
  const app = await createFitPlan(t);
  const doc = app.w.document;
  assert.equal(doc.getElementById('progressPercent').closest('[hidden]').hidden, true);
  app.card('plan-treningowy').click(); await app.settle();
  assert.equal(doc.getElementById('moduleTabs').hidden, true);
  assert.equal(doc.getElementById('completeSectionBtn'), null);
  assert.equal(doc.getElementById('fpkLevels'), null);
  doc.getElementById('fpkKettlebell').click();
  doc.querySelector('[data-fpk-kb-goal]').click();
  const buttons = [...doc.querySelectorAll('[data-fpk-kb-level]')];
  for (const [index, button] of buttons.entries()) {
    button.click();
    assert.equal(button.getAttribute('aria-pressed'), 'true');
    assert.equal(doc.querySelectorAll('[data-fpk-kb-level][aria-pressed="true"]').length, 1);
    assert.equal(app.w.localStorage.getItem('fitplan.kettlebell.level.v1'), button.dataset.fpkKbLevel);
    if (index < buttons.length - 1) doc.getElementById('fpkKbBackToGoals').click();
  }
  app.w.FitPlanApp.home(); await app.settle();
  app.card('plan-treningowy').click(); await app.settle();
  doc.getElementById('fpkKettlebell').click();
  doc.querySelector('[data-fpk-kb-goal]').click();
  assert.equal(doc.querySelector('[data-fpk-kb-level="zawodowiec"]').getAttribute('aria-pressed'), 'true');
  assert.match(doc.getElementById('fpkKbLevel').textContent, /Zawodowiec/);
  assert.deepEqual(app.errors, []);
});

test('exercise category filter returns related exercises and has no course tabs', async t => {
  const app = await createFitPlan(t);
  app.card('lista-cwiczen').click(); await app.settle();
  const doc = app.w.document;
  assert.equal(doc.getElementById('moduleTabs').hidden, true);
  assert.equal(doc.getElementById('completeSectionBtn'), null);
  const select = doc.querySelector('.fitplan-exercise-filters select');
  assert.ok(select.querySelector('option[value="chest"]'));
  select.value = 'chest'; select.dispatchEvent(new app.w.Event('change'));
  assert.equal(doc.querySelectorAll('.fitplan-exercise-group').length, 1);
  assert.equal(doc.querySelector('.fitplan-exercise-group h4').textContent, 'Klatka piersiowa');
  assert.match(doc.querySelector('.fitplan-exercise-results').textContent, /Wyciskanie/);
  const search = doc.querySelector('.fitplan-exercise-filters input');
  search.value = 'nieistniejące ćwiczenie'; search.dispatchEvent(new app.w.Event('input'));
  assert.match(doc.querySelector('.fitplan-exercise-results').textContent, /Brak ćwiczeń/);
  assert.deepEqual(app.errors, []);
});

test('retrying the anatomy renderer cannot bring back its obsolete version label', async t => {
  const app = await createFitPlan(t);
  app.card('tabela-cwiczen').click(); await app.settle();
  const doc = app.w.document;
  await until(() => doc.querySelector('#fp-loading [data-action="retry"]'));
  assert.doesNotMatch(doc.querySelector('.fp-footer').textContent, /1\.7\.0/);
  doc.querySelector('#fp-loading [data-action="retry"]').click();
  await until(() => doc.querySelector('#fp-loading [data-action="retry"]'));
  assert.doesNotMatch(doc.querySelector('.fp-footer').textContent, /1\.7\.0/);
});

test('3D hit testing accepts only the active layer and chest selection colors all visible chest meshes', () => {
  const window = {};
  vm.runInNewContext(fs.readFileSync('apps/fitplan/data/muscles.js', 'utf8'), { window });
  const source = fs.readFileSync('apps/fitplan/modules/anatomy-runtime.js', 'utf8')
    .replace('window.FitAtlas={', 'window.AtlasController=xa;window.FitAtlas={');
  vm.runInNewContext(source, { window, console, TextDecoder, Uint8Array, Uint16Array, Uint32Array, Int8Array, Float32Array });
  const controller = Object.create(window.AtlasController.prototype);
  Object.assign(controller, {
    ready: true, width: 100, height: 100, triple: false, id: 'pectoralis', side: 'both',
    category: 'chest', groupHighlight: true, isolate: false,
    green: {}, materials: { muscle: {} },
    canvas: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }) },
    ndc: { set() {} }, getCamera() { return {}; }
  });
  controller.meshes = ['pectoralis', 'serratus', 'pectoralis_minor', 'biceps'].map(id => ({
    userData: { id, side: 'both', kind: 'muscle' }, visible: true
  }));
  for (const layer of ['superficial', 'deep']) {
    controller.layer = layer;
    controller.applyMaterials();
    const visible = controller.meshes.filter(mesh => mesh.visible);
    assert.ok(visible.every(mesh => window.FitPlanMuscles.find(muscle => muscle.id === mesh.userData.id).layer === layer));
    assert.deepEqual(visible.filter(mesh => mesh.material === controller.green).map(mesh => mesh.userData.id),
      layer === 'superficial' ? ['pectoralis', 'serratus'] : ['pectoralis_minor']);
    // Include visible out-of-layer meshes to verify the raycast guard independently of rendering.
    controller.meshes.forEach(mesh => { mesh.visible = true; });
    controller.raycaster = { setFromCamera() {}, intersectObjects(meshes) {
      assert.ok(meshes.length > 0);
      assert.ok(meshes.every(mesh => window.FitPlanMuscles.find(muscle => muscle.id === mesh.userData.id).layer === layer));
      return meshes.map(object => ({ object }));
    } };
    assert.equal(window.FitPlanMuscles.find(muscle => muscle.id === controller.hit(50, 50).userData.id).layer, layer);
  }
});
