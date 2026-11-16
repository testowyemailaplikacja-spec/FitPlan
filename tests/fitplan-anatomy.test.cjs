const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const { createFitPlan, tick, until } = require('./fitplan-shell-harness.cjs');
const root = 'apps/fitplan/';
const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

test('Home and light modules do not download or initialize anatomy', async t => {
  const app = await createFitPlan(t);
  assert.equal(app.w.FitAtlas, undefined, 'the heavy atlas must not be declared at startup');
  assert.ok(fs.statSync(root + 'legacy.html').size < 64 * 1024, 'the inline anatomy payload must be removed');
  assert.equal(app.w.document.getElementById('entryCount').textContent, '48');
  for (const id of ['dieta', 'plan-treningowy', 'podsumowanie-wynikow', 'kalendarz-treningowy']) {
    app.w.FitPlanApp.open(id); await app.settle();
  }
  assert.equal(app.requests.filter(url => /\/(?:modules\/anatomy(?:-runtime)?\.js|data\/anatomy-manifest\.json|assets\/anatomy\/)/.test(url)).length, 0);
  assert.deepEqual(app.errors, []);
});

test('extracted muscle data preserves every original description, exercise and identity', () => {
  assert.ok(fs.existsSync(root + 'data/muscles.js'), 'muscles must have their own data file');
  const window = {};
  vm.runInNewContext(fs.readFileSync(root + 'data/muscles.js', 'utf8'), { window });
  assert.equal(window.FitPlanMuscles.length, 48);
  assert.equal(sha256(JSON.stringify(window.FitPlanMuscles)), 'cf981cf4f317b74a6844073acb818b9aef9f8c286881252c4c247f647cde3328');
  assert.equal(Reflect.set(window.FitPlanMuscles[0], 'id', 'lost-muscle'), false);
  assert.equal(Reflect.set(window.FitPlanMuscles[0].ex, '0', 'lost-exercise'), false);
});

test('the external model retains the exact compressed bytes and all 99 decoded meshes', () => {
  assert.ok(fs.existsSync(root + 'data/anatomy-manifest.json'), 'the model must be external');
  const manifest = JSON.parse(fs.readFileSync(root + 'data/anatomy-manifest.json'));
  const compressed = Buffer.concat(manifest.chunks.map(chunk => {
    const bytes = fs.readFileSync(root + chunk.url);
    assert.equal(bytes.length, chunk.bytes);
    assert.equal(sha256(bytes), chunk.sha256);
    return bytes;
  }));
  assert.equal(compressed.length, 13922041);
  assert.equal(sha256(compressed), '70ca6102eb6508e1cc5ce700b1cb4dd6605e83453d5773c4c82941109d61714d');
  assert.equal(zlib.inflateSync(compressed).length, 30038916);
  const window = {};
  vm.runInNewContext(fs.readFileSync(root + 'data/muscles.js', 'utf8'), { window });
  // Inspect the real decoder at its closure boundary; rendering requires a GPU.
  const source = fs.readFileSync(root + 'modules/anatomy-runtime.js', 'utf8')
    .replace('window.FitAtlas={', 'window.decodeGeometry=()=>fm();window.FitAtlas={');
  vm.runInNewContext(source, { window, console, TextDecoder, Uint8Array, Uint16Array, Uint32Array, Int8Array, Float32Array });
  window.FitAtlas.setModel(new Uint8Array(compressed));
  const meshes = window.decodeGeometry();
  assert.equal(meshes.length, 99);
  const hashes = Object.fromEntries(['position', 'normal', 'index'].map(name => [name, crypto.createHash('sha256')]));
  for (const { geometry } of meshes) {
    for (const name of Object.keys(hashes)) {
      const array = (name === 'index' ? geometry.index : geometry.attributes[name]).array;
      hashes[name].update(Buffer.from(array.buffer, array.byteOffset, array.byteLength));
    }
  }
  assert.equal(hashes.position.digest('hex'), 'dee1bd74634ec7e7c97afe4b9771d1e5538063d91349ef8e9c0ae959047387ee');
  assert.equal(hashes.normal.digest('hex'), 'cb5822ce8afdf80664a1ed0673d19e1841da06aee69337a71ddd398f3c4b6262');
  assert.equal(hashes.index.digest('hex'), 'f94844ffc20695da38df6ab5135ac4f3a0c7e5a4fcca10833733f620854c0615');
});

test('opening anatomy loads it once, reuses its data and disposes it when leaving', async t => {
  const app = await createFitPlan(t);
  app.card('tabela-cwiczen').click(); await app.settle();
  assert.equal(app.count('/modules/anatomy.js'), 1);
  assert.equal(app.count('/modules/anatomy-runtime.js'), 1);
  assert.equal(app.count('/data/anatomy-manifest.json'), 1);
  app.w.document.querySelector('#atlasRoot [data-category="all"]').click();
  assert.equal(app.w.document.querySelectorAll('#atlasRoot .fp-muscle-card').length, 48);
  const loadedChunks = app.requests.filter(url => url.includes('/assets/anatomy/')).length;
  assert.ok(loadedChunks > 0);
  app.w.FitPlanApp.home(); await app.settle();
  assert.equal(app.w.document.body.classList.contains('atlas-open'), false);
  assert.equal(app.w.FitPlanModules.active, null);
  app.w.FitPlanApp.open('tabela-cwiczen'); await app.settle();
  assert.equal(app.count('/modules/anatomy-runtime.js'), 1);
  assert.equal(app.requests.filter(url => url.includes('/assets/anatomy/')).length, loadedChunks);
  app.w.document.querySelector('#atlasRoot [data-module="kalendarz-treningowy"]').click(); await app.settle();
  assert.equal(app.w.FitPlanModules.active, 'kalendarz-treningowy');
  assert.equal(app.w.document.querySelector('#atlasRoot'), null);
  assert.equal(app.w.document.getElementById('fitplanCalendarV2').style.display, 'block');
  assert.deepEqual(app.errors, []);
});

test('leaving during anatomy loading prevents a late atlas mount', async t => {
  let release;
  const delayed = new Promise(resolve => { release = resolve; });
  const app = await createFitPlan(t, { fetch: url => url.endsWith('/data/anatomy-manifest.json') ? delayed : null });
  app.card('tabela-cwiczen').click();
  const end = Date.now() + 5000;
  while (!app.count('/data/anatomy-manifest.json') && Date.now() < end) await tick();
  assert.equal(app.count('/data/anatomy-manifest.json'), 1);
  const pending = app.w.FitPlanModules.ready;
  app.w.FitPlanApp.open('dieta'); await app.settle();
  release(new Response(fs.readFileSync(root + 'data/anatomy-manifest.json'))); await pending;
  assert.equal(app.w.FitPlanModules.active, 'dieta');
  assert.equal(app.w.document.querySelector('.fp'), null);
  assert.equal(app.w.document.getElementById('moduleTitle').textContent, 'Dieta');
  assert.deepEqual(app.errors, []);
});

test('a failed model load offers retry and does not block other modules', async t => {
  let attempts = 0;
  const app = await createFitPlan(t, { fetch: url => {
    if (url.endsWith('/data/anatomy-manifest.json') && ++attempts === 1) return Promise.resolve(new Response('', { status: 503 }));
    return null;
  } });
  app.card('tabela-cwiczen').click(); await app.settle();
  assert.equal(attempts, 1);
  const retry = app.w.document.querySelector('#atlasRoot [data-fitplan-action="retry"]');
  assert.ok(retry);
  retry.click();
  await until(() => app.w.document.querySelector('#atlasRoot .fp'));
  assert.equal(attempts, 2);
  app.w.FitPlanApp.open('plan-treningowy'); await app.settle();
  assert.equal(app.w.FitPlanModules.active, 'plan-treningowy');
  assert.deepEqual(app.errors, []);
});

for (const file of ['exercises-enhancement.js', 'anatomy.js', 'anatomy-runtime.js']) {
  test('retry recovers when ' + file + ' first returns successful HTTP without its API', async t => {
    let attempts = 0;
    const app = await createFitPlan(t, { script: pathname => {
      if (pathname.endsWith('/modules/' + file) && ++attempts === 1) {
        return Promise.resolve(Buffer.from('/* truncated response */'));
      }
      return null;
    } });
    app.card('tabela-cwiczen').click(); await app.settle();
    assert.equal(attempts, 1);
    const retry = app.w.document.querySelector('#atlasRoot button');
    assert.ok(retry, 'a failed lazy API must offer recovery');
    retry.click();
    await until(() => app.w.document.querySelector('#atlasRoot .fp'), file + ' retry did not recover');
    assert.equal(attempts, 2, 'retry must fetch the invalid script again');
    app.w.FitPlanApp.home(); await app.settle();
    app.card('tabela-cwiczen').click(); await app.settle();
    assert.equal(attempts, 2, 'the valid script must be reused');
    assert.deepEqual(app.errors, []);
  });
}

test('an explicit offline download saves all shell dependencies and the exact external model', async () => {
  const handlers = {}, entries = new Map(), requests = [], cacheNames = [];
  const scope = 'https://portal.test/apps/fitplan/';
  let online = true;
  const cache = {
    match: async request => entries.get(typeof request === 'string' ? request : request.url),
    put: async (request, response) => entries.set(typeof request === 'string' ? request : request.url, response.clone())
  };
  vm.runInNewContext(fs.readFileSync(root + 'sw.js', 'utf8'), {
    URL, Response, console, caches: { open: async name => { cacheNames.push(name); return cache; }, keys: async () => [], delete: async () => true },
    fetch: async request => {
      if (!online) throw new TypeError('offline');
      const url = new URL(typeof request === 'string' ? request : request.url);
      requests.push(url.href);
      const file = url.pathname.slice(1);
      return new Response(fs.existsSync(file) && fs.statSync(file).isFile() ? fs.readFileSync(file) : 'external platform asset');
    },
    self: { registration: { scope }, location: { origin: 'https://portal.test' }, skipWaiting() {},
      addEventListener: (type, handler) => { handlers[type] = handler; } }
  });
  let work;
  handlers.install({ waitUntil: promise => { work = promise; } }); await work;
  assert.equal(requests.some(url => url.includes('/assets/anatomy/') || url.includes('/modules/anatomy')), false);
  const messages = [];
  handlers.message({ data: { type: 'CACHE_APP' }, source: { postMessage: message => messages.push(message) }, waitUntil: promise => { work = promise; } }); await work;
  assert.equal(messages.at(-1).type, 'CACHE_DONE');
  assert.ok(requests.includes(scope + 'data/muscles.js?v=20261005-stage12'));
  online = false;
  async function offline(asset) {
    let result;
    handlers.fetch({ request: { method: 'GET', mode: 'same-origin', url: new URL(asset, scope).href }, respondWith: promise => { result = promise; } });
    const response = await result;
    assert.equal(response.ok, true, asset + ' must survive a cold offline start');
    return Buffer.from(await response.arrayBuffer());
  }
  const shell = fs.readFileSync(root + 'index.html', 'utf8');
  for (const match of shell.matchAll(/<script src="([^" ]+)"/g)) {
    assert.ok(requests.includes(new URL(match[1], scope).href), 'downloaded dependency version: ' + match[1]);
    const bytes = await offline(match[1]);
    assert.equal(bytes.toString(), fs.readFileSync(new URL(match[1], scope).pathname.slice(1), 'utf8'));
  }
  const manifest = JSON.parse((await offline('data/anatomy-manifest.json?v=20261005-stage12')).toString());
  const chunks = [];
  for (const chunk of manifest.chunks) chunks.push(await offline(chunk.url));
  assert.equal(sha256(Buffer.concat(chunks)), '70ca6102eb6508e1cc5ce700b1cb4dd6605e83453d5773c4c82941109d61714d');
  const deferredSources = ['modules/exercises-enhancement.js', 'modules/anatomy.js', 'modules/exercises.js'];
  for (const source of deferredSources) {
    const asset = fs.readFileSync(root + source, 'utf8').match(/loadScript\("\.\/([^" ]+)"/)[1];
    assert.ok(requests.includes(scope + asset), 'downloaded deferred dependency version: ' + asset);
    assert.equal((await offline(asset)).toString(), fs.readFileSync(root + asset.split('?')[0], 'utf8'));
  }
  assert.ok(cacheNames.every(name => name.startsWith('portal-offline-fitplan-')));
});
