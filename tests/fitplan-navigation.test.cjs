const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { createFitPlan, until, tick } = require('./fitplan-shell-harness.cjs');

test('a dietary card keeps its external view and completion control without course tabs', async t => {
  const app = await createFitPlan(t);
  app.card('dieta').click(); await app.settle();
  assert.equal(app.w.FitPlanModules.active, 'dieta');
  assert.equal(app.count('/views/diet.html'), 1);
  assert.ok(app.w.document.querySelector('[data-fitplan-view="dieta"]'));
  assert.equal(app.dom.window.location.pathname, '/apps/fitplan/modul/dieta/');
  assert.equal(app.w.document.getElementById('moduleTabs').hidden, true);
  assert.equal(app.w.FitPlanApp.tab('questions'), false);
  assert.equal(app.w.document.getElementById('tab-note').hidden, false);
  assert.equal(app.dom.window.location.search, '');
  app.w.document.getElementById('completeSectionBtn').click(); await app.settle();
  assert.equal(JSON.parse(app.w.localStorage.getItem('planer-treningowy-progress-v1.6')).completed['dieta'], true);
  assert.equal(app.count('/views/diet.html'), 1);
  app.w.document.getElementById('backBtn').click(); await app.settle();
  assert.equal(app.w.FitPlanModules.active, null);
  assert.equal(app.dom.window.location.pathname, '/apps/fitplan/');
  assert.deepEqual(app.errors, []);
});

test('ordinary exercise navigation loads the deferred enhancement once and cleans up on leaving', async t => {
  const app = await createFitPlan(t);
  assert.equal(app.count('/modules/exercises-enhancement.js'), 0);
  app.card('tabela-cwiczen').click(); await app.settle();
  assert.equal(app.w.FitPlanModules.active, 'tabela-cwiczen');
  assert.equal(app.count('/modules/exercises-enhancement.js'), 1);
  assert.ok(app.w.FitPlanExerciseEnhancement);
  assert.ok(app.w.document.querySelector('[data-fitplan-view="tabela-cwiczen"] #atlasRoot'));
  app.w.FitPlanApp.home(); await app.settle();
  assert.equal(app.w.FitPlanModules.active, null);
  app.w.FitPlanApp.open('tabela-cwiczen'); await app.settle();
  assert.equal(app.count('/modules/exercises-enhancement.js'), 1);
  app.w.FitPlanApp.open('dieta'); await app.settle();
  assert.equal(app.w.FitPlanModules.active, 'dieta');
  assert.equal(app.w.document.querySelector('#atlasRoot'), null);
  assert.deepEqual(app.errors, []);
});

test('calendar reentry and exercise/calendar switches preserve saved notes without overlaying another module', async t => {
  // WIEDORA-CHANGE: WD-20261101-WIE-005-CURRENT-POOL-01 | TASK: WIE-005 | AUTHOR: Codex / GPT-6 (pełna wersja nieustalona)
  const now = new Date();
  const date = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-04';
  const saved = JSON.stringify({[date]:{note:'Nogi',time:'18:30'}});
  const app = await createFitPlan(t, { storage: { 'fitplan.calendar.entries.v2': saved } });
  app.card('kalendarz-treningowy').click(); await app.settle();
  await until(() => app.w.document.querySelector('#fitplanCalendarV2 [data-date]'));
  app.w.document.getElementById('backBtn').click(); await app.settle();
  app.card('kalendarz-treningowy').click(); await app.settle();
  assert.equal(app.w.document.getElementById('fitplanCalendarV2').style.display, 'block');
  app.w.document.querySelector('#fitplanCalendarV2 [data-date="'+date+'"]').click();
  assert.equal(app.w.document.getElementById('fpcNote').value, 'Nogi');
  assert.equal(app.w.document.getElementById('fpcTime').value, '18:30');
  app.w.FitPlanApp.open('tabela-cwiczen'); await app.settle();
  const calendar = app.w.document.getElementById('fitplanCalendarV2');
  assert.ok(!calendar || calendar.style.display === 'none');
  app.w.FitPlanApp.open('kalendarz-treningowy'); await app.settle();
  assert.equal(app.w.document.getElementById('fitplanCalendarV2').style.display, 'block');
  assert.equal(app.w.localStorage.getItem('fitplan.calendar.entries.v2'), saved);
  assert.equal(app.w.FitPlanModules.active, 'kalendarz-treningowy');
  assert.deepEqual(app.errors, []);
});

test('deep links and browser history activate modules and restore the requested tab', async t => {
  const app = await createFitPlan(t, { route: '/apps/fitplan/modul/dieta/?widok=exam' });
  await app.settle();
  assert.equal(app.w.FitPlanModules.active, 'dieta');
  assert.equal(app.w.document.getElementById('tab-note').hidden, false);
  assert.equal(app.dom.window.location.search, '', 'obsolete diet tabs must not remain in the URL');
  const startLength = app.dom.window.history.length;
  app.w.FitPlanApp.open('plan-treningowy'); await app.settle();
  assert.equal(app.dom.window.history.length, startLength + 1, 'the nested default-tab render must not push a separate route');
  app.dom.window.history.back();
  await until(() => app.dom.window.location.pathname.endsWith('/dieta/')); await app.settle();
  assert.equal(app.w.FitPlanModules.active, 'dieta');
  assert.equal(app.w.document.getElementById('tab-note').hidden, false);
  app.dom.window.history.forward();
  await until(() => app.dom.window.location.pathname.endsWith('/plan-treningowy/')); await app.settle();
  assert.equal(app.w.FitPlanModules.active, 'plan-treningowy');
  assert.equal(app.w.document.getElementById('tab-note').hidden, false);
  assert.deepEqual(app.errors, []);
});

test('a late fragment never overwrites a different module after a quick switch', async t => {
  let release;
  const delayed = new Promise(resolve => { release = resolve; });
  const app = await createFitPlan(t, { fetch: pathname => pathname.endsWith('/views/workout-plan.html') ? delayed : null });
  app.card('plan-treningowy').click(); await tick();
  assert.equal(app.count('/views/workout-plan.html'), 1);
  app.w.FitPlanApp.open('dieta'); await app.settle();
  release(new Response(fs.readFileSync('apps/fitplan/views/workout-plan.html'))); await tick(); await tick();
  assert.equal(app.w.FitPlanModules.active, 'dieta');
  assert.ok(app.w.document.querySelector('[data-fitplan-view="dieta"]'));
  assert.equal(app.w.document.querySelector('[data-fitplan-view="plan-treningowy"]'), null);
  assert.deepEqual(app.errors, []);
});

test('a failed fragment leaves the usable fallback and retries on the next entry', async t => {
  let attempts = 0;
  const app = await createFitPlan(t, { fetch: pathname => {
    if (pathname.endsWith('/views/diet.html') && ++attempts === 1) return Promise.resolve(new Response('', { status: 503 }));
    return null;
  } });
  app.card('dieta').click(); await app.settle();
  assert.equal(attempts, 1);
  assert.equal(app.w.document.getElementById('moduleTitle').textContent, 'Dieta');
  assert.ok(app.w.document.getElementById('completeSectionBtn'));
  app.w.FitPlanApp.home(); await app.settle(); app.card('dieta').click(); await app.settle();
  assert.equal(attempts, 2);
  assert.ok(app.w.document.querySelector('[data-fitplan-view="dieta"]'));
  assert.deepEqual(app.errors, []);
});

test('the lazy loader reinstalls a script after the iframe document reloads', async t => {
  const app = await createFitPlan(t);
  await app.w.FitPlanLazy.loadScript('./modules/exercises-enhancement.js?v=20261005-stage10');
  assert.ok(app.w.FitPlanExerciseEnhancement);
  const loaded = new Promise(resolve => app.frame.addEventListener('load', resolve, { once: true }));
  app.frame.src = './legacy.html?reload=1'; await loaded; await tick();
  await app.w.FitPlanLazy.loadScript('./modules/exercises-enhancement.js?v=20261005-stage10');
  assert.equal(app.count('/modules/exercises-enhancement.js'), 2);
  assert.ok(app.w.FitPlanExerciseEnhancement);
  assert.deepEqual(app.errors, []);
});

test('lazy scripts cannot start in the iframe initial about:blank document', async t => {
  const { JSDOM } = require('jsdom');
  const dom = new JSDOM('<iframe id="appFrame"></iframe>', {
    url: 'https://portal.test/apps/fitplan/', runScripts: 'outside-only'
  });
  t.after(() => dom.window.close());
  await tick();
  const frame = dom.window.document.getElementById('appFrame');
  dom.window.eval(fs.readFileSync('apps/fitplan/lazy-loader.js', 'utf8'));
  assert.equal(frame.contentWindow.FitPlanLazy, undefined, 'initial blank navigation must not own a pending script load');
  // Browsers can reuse the initial Window for its first same-origin document.
  frame.contentDocument.body.innerHTML = '<main id="homePage"></main>';
  frame.dispatchEvent(new dom.window.Event('load'));
  assert.ok(frame.contentWindow.FitPlanLazy, 'the actual FitPlan document must receive its loader');
});

test('invalid successful view responses remain retryable with the legacy fallback', async t => {
  for (const [id, file, invalid] of [
    ['dieta', 'diet.html', '<html>Temporary upstream error</html>'],
    ['kalendarz-treningowy', 'calendar.html', '<section data-fitplan-view="kalendarz-treningowy"></section>'],
    ['tabela-cwiczen', 'exercises.html', '<section data-fitplan-view="tabela-cwiczen"></section>']
  ]) {
    await t.test(id, async t => {
      let attempts = 0;
      const app = await createFitPlan(t, { fetch: pathname => {
        if (pathname.endsWith('/views/' + file) && ++attempts === 1) return Promise.resolve(new Response(invalid));
        return null;
      } });
      app.card(id).click(); await app.settle();
      assert.equal(attempts, 1);
      // WIEDORA-CHANGE: WD-20261029-WIE-005-REGRESSION-CODEX2 | TASK: WIE-005 | AUTHOR: Codex / GPT-6
      if (id === 'tabela-cwiczen') {
        assert.ok(app.w.document.querySelector('#atlasRoot .fp'), 'atlas fallback stays usable after an invalid fragment');
        assert.equal(app.w.document.getElementById('completeSectionBtn'), null);
      } else if (id === 'kalendarz-treningowy') {
        assert.equal(app.w.document.getElementById('completeSectionBtn'), null, 'calendar remains a single-screen tool');
        assert.match(app.w.document.querySelector('#tab-note')?.textContent || '', /Kalendarz treningowy/, 'legacy calendar note remains available');
      } else assert.ok(app.w.document.getElementById('completeSectionBtn'));
      app.w.FitPlanApp.home(); await app.settle();
      app.card(id).click(); await app.settle();
      assert.equal(attempts, 2, 'an invalid fragment must not poison the cache');
      assert.ok(app.w.document.querySelector('[data-fitplan-view="' + id + '"]'));
      assert.deepEqual(app.errors, []);
    });
  }
});

// WIEDORA-CHANGE: WD-20261029-WIE-007-PUBLIC-TEST-CODEX1 | TASK: WIE-007 | AUTHOR: Codex / GPT-6
test('a guest can open anatomy after the free calendar', async t => {
  const app = await createFitPlan(t, { guardFirst: true });
  app.card('kalendarz-treningowy').click(); await app.settle();
  app.card('tabela-cwiczen').click(); await app.settle();
  assert.equal(app.w.document.getElementById('portalGuestLockOverlay'), null);
  assert.equal(app.w.FitPlanModules.active, 'tabela-cwiczen');
  assert.ok(app.count('/modules/anatomy.js') > 0);
  assert.equal(app.dom.window.location.pathname, '/apps/fitplan/modul/tabela-cwiczen/');
  assert.deepEqual(app.errors, []);
});

test('a guest direct link opens the public anatomy module', async t => {
  const app = await createFitPlan(t, { guardFirst: true, route: '/apps/fitplan/modul/tabela-cwiczen/' });
  await app.settle();
  assert.equal(app.w.document.getElementById('portalGuestLockOverlay'), null);
  assert.equal(app.w.FitPlanModules.active, 'tabela-cwiczen');
  assert.ok(app.count('/modules/anatomy.js') > 0);
  assert.equal(app.w.document.getElementById('homePage').hidden, true);
  assert.deepEqual(app.errors, []);
});

test('an unknown module leaves the active atlas and its layout intact', async t => {
  const app = await createFitPlan(t);
  app.card('tabela-cwiczen').click(); await app.settle();
  app.w.FitPlanApp.open('missing-module'); await app.settle();
  assert.equal(app.w.FitPlanModules.active, 'tabela-cwiczen');
  assert.ok(app.w.document.body.classList.contains('atlas-open'));
  assert.ok(app.w.document.querySelector('#atlasRoot .fp'));
  assert.equal(app.dom.window.location.pathname, '/apps/fitplan/modul/tabela-cwiczen/');
  assert.deepEqual(app.errors, []);
});


test('stage 15 isolates a broken calendar module and keeps sibling modules usable', async t => {
  let attempts = 0;
  const app = await createFitPlan(t, { script: pathname => {
    if (pathname.endsWith('/calendar-enhancement.js') && ++attempts <= 2) {
      return Promise.resolve(Buffer.from('/* simulated broken calendar bundle */'));
    }
    return null;
  } });
  app.card('kalendarz-treningowy').click(); await app.settle();
  assert.equal(app.w.FitPlanModules.active, null, 'failed module must release the active slot');
  const error = app.w.document.querySelector('[data-fitplan-module-error="kalendarz-treningowy"]');
  assert.ok(error, 'failed module must render a local recovery boundary');
  assert.match(error.textContent, /Pozostałe części FitPlan nadal działają/);

  app.w.FitPlanApp.open('dieta'); await app.settle();
  assert.equal(app.w.FitPlanModules.active, 'dieta');
  assert.ok(app.w.document.querySelector('[data-fitplan-view="dieta"]'));

  app.w.FitPlanApp.open('kalendarz-treningowy'); await app.settle();
  await until(() => app.w.document.querySelector('#fitplanCalendarV2 [data-date]'));
  assert.equal(app.w.FitPlanModules.active, 'kalendarz-treningowy');
  assert.ok(attempts >= 3, 'calendar bundle must remain retryable after a module failure');
  assert.deepEqual(app.errors, []);
});

test('stage 15 keeps anatomy failure local and Home remains available', async t => {
  const app = await createFitPlan(t, { fetch: pathname => {
    if (pathname.endsWith('/data/anatomy-manifest.json')) return Promise.resolve(new Response('', { status: 503 }));
    return null;
  } });
  app.card('tabela-cwiczen').click(); await app.settle();
  assert.ok(app.w.document.querySelector('#atlasRoot [data-fitplan-action="retry"]'));
  app.w.FitPlanApp.home(); await app.settle();
  assert.equal(app.w.document.getElementById('homePage').hidden, false);
  assert.equal(app.w.FitPlanModules.active, null);
  app.card('plan-treningowy').click(); await app.settle();
  assert.equal(app.w.FitPlanModules.active, 'plan-treningowy');
  assert.deepEqual(app.errors, []);
});


test('stage 15 contains a controller bundle failure instead of leaving a dead module', async t => {
  const app = await createFitPlan(t, { script: pathname => {
    if (pathname.endsWith('/modules/diet.js')) return Promise.resolve(Buffer.from('/* simulated missing diet controller */'));
    return null;
  } });
  app.card('dieta').click(); await app.settle();
  assert.equal(app.w.FitPlanModules.get('dieta'), null);
  assert.ok(app.w.document.querySelector('[data-fitplan-module-error="dieta"]'));
  assert.equal(app.w.FitPlanModules.active, null);
  app.w.FitPlanApp.open('plan-treningowy'); await app.settle();
  assert.equal(app.w.FitPlanModules.active, 'plan-treningowy');
  assert.ok(app.w.document.querySelector('[data-fitplan-view="plan-treningowy"]'));
  assert.deepEqual(app.errors, []);
});
