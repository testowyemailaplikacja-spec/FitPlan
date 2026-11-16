const test = require('node:test');
const assert = require('node:assert/strict');
const { createFitPlan } = require('./fitplan-shell-harness.cjs');

const MODULES = ['plan-treningowy','tabela-cwiczen','dieta','kalendarz-treningowy','podsumowanie-wynikow','lista-cwiczen'];
const LIGHT = MODULES.filter(id => id !== 'tabela-cwiczen');

test('stage 17 regression: every module can be entered from Home and returns cleanly', async t => {
  const app = await createFitPlan(t);
  for (const id of MODULES) {
    app.w.FitPlanApp.open(id); await app.settle();
    assert.equal(app.w.FitPlanModules.active, id, id + ' must activate');
    assert.equal(app.dom.window.location.pathname, '/apps/fitplan/modul/' + id + '/');
    app.w.FitPlanApp.home(); await app.settle();
    assert.equal(app.w.FitPlanModules.active, null, id + ' must deactivate on Home');
    assert.equal(app.dom.window.location.pathname, '/apps/fitplan/');
    assert.equal(app.w.document.getElementById('homePage').hidden, false);
  }
  assert.deepEqual(app.errors, []);
});

test('stage 17 regression: switching across every light-module pair never overlays the previous view', async t => {
  const app = await createFitPlan(t);
  for (const from of LIGHT) {
    app.w.FitPlanApp.open(from); await app.settle();
    for (const to of LIGHT) {
      if (to === from) continue;
      app.w.FitPlanApp.open(to); await app.settle();
      assert.equal(app.w.FitPlanModules.active, to, from + ' -> ' + to);
      const views = [...app.w.document.querySelectorAll('[data-fitplan-view]')]
        .filter(node => !node.hidden && node.offsetParent !== null || node.closest('#modulePage:not([hidden])'))
        .map(node => node.dataset.fitplanView);
      assert.ok(app.w.document.querySelector('[data-fitplan-view="' + to + '"]'), to + ' view must exist');
      assert.equal(app.w.document.querySelector('[data-fitplan-view="' + from + '"]'), null, from + ' view must be removed');
    }
    app.w.FitPlanApp.home(); await app.settle();
  }
  assert.deepEqual(app.errors, []);
});

test('stage 17 regression: progress survives module churn and calendar data remains byte-stable', async t => {
  const calendar = '{"2026-10-06":{"note":"Regresja","time":"18:00","future":7}}';
  const app = await createFitPlan(t, { storage: { 'fitplan.calendar.entries.v2': calendar } });
  app.w.FitPlanApp.open('dieta'); await app.settle();
  app.w.document.getElementById('completeSectionBtn').click(); await app.settle();
  for (const id of ['plan-treningowy','kalendarz-treningowy','podsumowanie-wynikow','dieta']) {
    app.w.FitPlanApp.open(id); await app.settle();
  }
  assert.equal(app.w.FitPlanState.progress.isCompleted('dieta'), true);
  assert.equal(app.dom.window.localStorage.getItem('fitplan.calendar.entries.v2'), calendar);
  assert.deepEqual(app.errors, []);
});

test('stage 17 regression: repeated anatomy enter/leave cycles do not duplicate heavy bundles', async t => {
  const app = await createFitPlan(t);
  for (let i = 0; i < 3; i++) {
    app.w.FitPlanApp.open('tabela-cwiczen'); await app.settle();
    assert.equal(app.w.FitPlanModules.active, 'tabela-cwiczen');
    app.w.FitPlanApp.home(); await app.settle();
    assert.ok(app.w.document.querySelector('#atlasRoot'), 'reusable atlas host stays mounted for the module view');
    assert.equal(app.w.document.querySelector('#atlasRoot').childElementCount, 0, 'atlas cleanup must empty the reusable host');
    assert.equal(app.w.document.body.classList.contains('atlas-open'), false);
  }
  assert.equal(app.count('/modules/anatomy.js'), 1);
  assert.equal(app.count('/modules/anatomy-runtime.js'), 1);
  assert.equal(app.count('/data/anatomy-manifest.json'), 1);
  assert.deepEqual(app.errors, []);
});
