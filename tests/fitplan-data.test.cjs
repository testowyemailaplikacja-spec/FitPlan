const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { JSDOM, ResourceLoader, VirtualConsole } = require('jsdom');

const dataSource = fs.readFileSync('apps/fitplan/data/app-data.js', 'utf8');
const legacy = fs.readFileSync('apps/fitplan/legacy.html', 'utf8');
const photographicManifest = fs.readFileSync('apps/fitplan/motion/photographic-manifest.js', 'utf8');
const moduleIds = ['kalendarz-treningowy', 'podsumowanie-wynikow', 'plan-treningowy', 'dieta', 'tabela-cwiczen', 'lista-cwiczen', 'start'];

test('accidental edits cannot change a module identity or its description', () => {
  const context = { window: {} };
  vm.runInNewContext(dataSource, context);
  const module = context.window.FitPlanData.modules[0];
  assert.equal(Reflect.set(module, 'id', 'lost-calendar'), false);
  assert.equal(Reflect.set(module, 'description', 'overwritten'), false);
  assert.equal(module.id, 'kalendarz-treningowy');
  assert.equal(module.description, 'Notatki i godziny treningów oraz dni odpoczynku w miesięcznym kalendarzu.');
});

test('legacy loads external data before rendering all seven modules and saved progress', async t => {
  const requests = [];
  class DataLoader extends ResourceLoader {
    fetch(url) {
      requests.push(url);
      if (new URL(url).pathname === '/apps/fitplan/data/app-data.js') {
        return Promise.resolve(Buffer.from(dataSource.replace('Przeglądaj produkty i porównuj ich orientacyjne parametry.', 'Opis z zewnętrznego pliku')));
      }
      if (new URL(url).pathname === '/apps/fitplan/data/muscles.js') return Promise.resolve(fs.readFileSync('apps/fitplan/data/muscles.js'));
      if (['/apps/fitplan/data/exercise-catalog.js', '/apps/fitplan/data/kettlebell-catalog.js', '/apps/fitplan/data/training-extensions.js', '/apps/fitplan/data/exercise-registry.js', '/apps/fitplan/data/food-catalog.js', '/apps/fitplan/data/recipes.js', '/apps/fitplan/exercise-motion.js', '/apps/fitplan/exercise-motion-embed.js', '/apps/fitplan/exercise-details.js'].includes(new URL(url).pathname) || new URL(url).pathname.startsWith('/apps/fitplan/motion/')) {
        return Promise.resolve(fs.readFileSync('.' + new URL(url).pathname));
      }
      // WIEDORA-CHANGE: WD-20261101-WIE-005-CURRENT-POOL-01 | TASK: WIE-005 | AUTHOR: Codex / GPT-6 (pełna wersja nieustalona)
      if (new URL(url).pathname.startsWith('/apps/fitplan/core/') || /^\/apps\/fitplan\/data\/[^/]+\.js$/.test(new URL(url).pathname)) return Promise.resolve(fs.readFileSync('.' + new URL(url).pathname));
      throw new Error('Unexpected test resource: ' + url);
    }
  }
  const errors = [];
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', error => errors.push(error.message));
  // Home uses the real light catalog and muscle data. Anatomy is deferred.
  const html = legacy.replace(/<script id="fitplan-model-data"[^>]*>[\s\S]*?<\/script>/, '');
  const dom = new JSDOM(html, {
    url: 'https://portal.test/apps/fitplan/legacy.html',
    runScripts: 'dangerously', resources: new DataLoader(), virtualConsole,
    beforeParse(window) {
      window.scrollTo = () => {};
      window.localStorage.setItem('planer-treningowy-progress-v1.6', '{"completed":{"plan-treningowy":true}}');
      window.localStorage.setItem('fitplan.calendar.entries.v2', '{"2026-10-04":{"note":"Nogi","time":"18:30"}}');
    }
  });
  t.after(() => dom.window.close());
  await new Promise(resolve => dom.window.addEventListener('load', resolve, { once: true }));
  const { window } = dom, document = window.document;
  assert.deepEqual(errors, []);
  assert.equal(requests.filter(url => new URL(url).pathname.endsWith('/data/app-data.js')).length, 1);
  assert.deepEqual(Array.from(window.FitPlanData.modules, module => module.id), moduleIds);
  assert.equal(document.querySelectorAll('#sectionGrid .section-card').length, 7);
  assert.equal(document.getElementById('sectionCount').textContent, '7');
  assert.equal(document.getElementById('entryCount').textContent, '48');
  assert.equal(document.getElementById('progressPercent').textContent, '14%');
  for (const [id, title] of [['plan-treningowy', 'Plan treningowy'], ['dieta', 'Dieta'], ['podsumowanie-wynikow', 'Panel sterowania']]) {
    window.openSection(id);
    assert.equal(document.getElementById('moduleTitle').textContent, title);
    assert.equal(document.getElementById('homePage').hidden, true);
    assert.equal(document.getElementById('modulePage').hidden, false);
    if (id === 'plan-treningowy' || id === 'dieta' || id === 'podsumowanie-wynikow') {
      assert.equal(document.getElementById('moduleTabs').hidden, true);
      assert.equal(window.switchTab('questions'), false);
      assert.equal(document.getElementById('tab-note').hidden, false);
      if (id !== 'dieta') assert.equal(document.getElementById('completeSectionBtn'), null);
      else assert.ok(document.getElementById('completeSectionBtn'));
      assert.equal(document.getElementById('tab-questions').childElementCount, 0);
      assert.equal(document.getElementById('tab-exam').childElementCount, 0);
    } else {
      window.switchTab('questions');
      assert.equal(document.getElementById('tab-questions').hidden, false);
      assert.ok(document.getElementById('tab-questions').textContent.trim());
      window.switchTab('exam');
      assert.equal(document.getElementById('tab-exam').hidden, false);
    }
    if (id === 'dieta') assert.match(document.getElementById('tab-note').textContent, /Opis z zewnętrznego pliku/);
    window.goHome();
    assert.equal(document.getElementById('homePage').hidden, false);
    assert.equal(document.querySelectorAll('#sectionGrid .section-card').length, 7);
  }
  assert.equal(window.localStorage.getItem('planer-treningowy-progress-v1.6'), '{"completed":{"plan-treningowy":true}}');
  assert.equal(window.localStorage.getItem('fitplan.calendar.entries.v2'), '{"2026-10-04":{"note":"Nogi","time":"18:30"}}');
  assert.deepEqual(errors, []);
});

test('downloading FitPlan also saves external module data for a cold offline start', async () => {
  const handlers = {}, entries = new Map(), scope = 'https://portal.test/apps/fitplan/';
  let online = true;
  const cache = {
    match: async request => entries.get(typeof request === 'string' ? request : request.url),
    put: async (request, response) => entries.set(typeof request === 'string' ? request : request.url, response.clone())
  };
  const messages = [];
  vm.runInNewContext(fs.readFileSync('apps/fitplan/sw.js', 'utf8'), {
    URL, Response, console,
    caches: { open: async () => cache, keys: async () => [], delete: async () => true },
    fetch: async request => {
      if (!online) throw new TypeError('offline');
      const url = typeof request === 'string' ? request : request.url;
      const pathname = new URL(url).pathname;
      return new Response(
        pathname.endsWith('/data/app-data.js') ? dataSource
          : pathname.endsWith('/motion/photographic-manifest.js') ? photographicManifest
            : pathname.startsWith('/apps/fitplan/core/') ? fs.readFileSync('.' + pathname)
              : 'existing asset'
      );
    },
    self: { registration: { scope }, location: { origin: 'https://portal.test' },
      addEventListener: (type, handler) => { handlers[type] = handler; } }
  });
  let work;
  handlers.message({ data: { type: 'CACHE_APP' }, source: { postMessage: message => messages.push(message) }, waitUntil: promise => { work = promise; } });
  await work;
  assert.equal(messages.at(-1).type, 'CACHE_DONE');
  online = false;
  let response;
  handlers.fetch({ request: { method: 'GET', mode: 'same-origin', url: scope + legacy.match(/<script src="\.\/(data\/app-data\.js\?v=[^"]+)"/)[1] }, respondWith: promise => { response = promise; } });
  const offlineResponse = await response;
  assert.equal(offlineResponse.ok, true, 'the new data dependency must be available after downloading the app');
  const context = { window: {} };
  const cachedData = await offlineResponse.text();
  vm.runInNewContext(cachedData, context);
  assert.deepEqual(Array.from(context.window.FitPlanData.modules, module => module.id), moduleIds);
  const cold = new JSDOM('', { url: scope, runScripts: 'outside-only' });
  try {
    cold.window.eval(cachedData);
    for (const name of ['storage', 'state']) {
      handlers.fetch({ request: { method: 'GET', mode: 'same-origin', url: scope + 'core/' + name + '.js?v=' + (name === 'state' ? (legacy.match(/core\/state\.js\?v=([^\"]+)/)?.[1] || '') : '20261007-user-audit') }, respondWith: promise => { response = promise; } });
      const cached = await response;
      assert.equal(cached.ok, true, 'cold offline state dependency: ' + name);
      cold.window.eval(await cached.text());
    }
    cold.window.FitPlanState.progress.setCompleted('dieta', true);
    assert.equal(cold.window.FitPlanState.progress.isCompleted('dieta'), true);
  } finally { cold.window.close(); }
});

