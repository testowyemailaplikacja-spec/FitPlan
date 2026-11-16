const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function worker(options = {}) {
  const handlers = {}, scope = 'https://portal.test/apps/fitplan/';
  const cacheMaps = new Map();
  const fetches = [];
  const caches = {
    keys: async () => [...cacheMaps.keys()],
    delete: async name => cacheMaps.delete(name),
    open: async name => {
      if (!cacheMaps.has(name)) cacheMaps.set(name, new Map());
      const entries = cacheMaps.get(name);
      const key = req => typeof req === 'string' ? new URL(req, scope).href : req.url;
      return {
        keys: async () => [...entries.keys()].map(url => new Request(url)),
        match: async (req, opts = {}) => {
          const wanted = key(req);
          if (entries.has(wanted)) return entries.get(wanted).clone();
          if (opts.ignoreSearch) {
            const path = new URL(wanted).pathname;
            for (const [url, response] of entries) if (new URL(url).pathname === path) return response.clone();
          }
        },
        put: async (req, response) => entries.set(key(req), response.clone())
      };
    }
  };
  for (const [name, entries] of Object.entries(options.caches || {})) {
    cacheMaps.set(name, new Map(Object.entries(entries).map(([url, body]) => [new URL(url, scope).href, new Response(body)])));
  }
  const fetch = async req => {
    const url = new URL(typeof req === 'string' ? req : req.url, scope);
    fetches.push(url.href);
    if (options.offline) throw new TypeError('offline');
    // WIEDORA-CHANGE: WD-20261030-WIE-155-FITPLAN-UPDATE-01 | TASK: WIE-155 | AUTHOR: Codex / GPT-6 (full version unknown)
    if (options.htmlAsset && url.pathname.endsWith(options.htmlAsset)) {
      return new Response('<!doctype html><title>SPA fallback</title>', { headers: {'Content-Type':'text/html; charset=utf-8'} });
    }
    const pathname = url.pathname.slice(1)+(url.pathname.endsWith('/')?'index.html':'');
    return new Response(fs.existsSync(pathname) ? fs.readFileSync(pathname) : 'external', { status: 200 });
  };
  vm.runInNewContext(fs.readFileSync('apps/fitplan/sw.js','utf8'), {
    console, URL, Response, Request, caches, fetch,
    self: { registration:{scope}, location:{origin:'https://portal.test'}, clients:{claim:async()=>{}}, skipWaiting(){},
      addEventListener:(type,handler)=>{handlers[type]=handler;} }
  });
  async function event(type, payload = {}) {
    let work;
    handlers[type]({...payload, waitUntil:p=>{work=p;}});
    if (work) await work;
  }
  return { handlers, cacheMaps, fetches, event, caches };
}

test('stage 19 install keeps the initial cache minimal', async () => {
  const h = worker();
  await h.event('install');
  assert.equal(h.fetches.some(url => /anatomy|\.deflate/.test(url)), false);
  assert.ok(h.fetches.some(url => url.endsWith('/apps/fitplan/index.html')));
  assert.ok(h.fetches.length <= 2, 'install must not eagerly download the app package');
});

// A successful HTTP status for an HTML fallback must not retire a working package.
// WIEDORA-CHANGE: WD-20261030-WIE-155-FITPLAN-UPDATE-01 | TASK: WIE-155 | AUTHOR: Codex / GPT-6 (full version unknown)
for (const asset of ['/modules/start.js', '/styles/start.css']) {
  test('HTML returned for '+asset+' does not complete an offline upgrade', async () => {
    const messages=[];
    const h=worker({htmlAsset:asset,caches:{'portal-offline-fitplan-old':{
      './index.html':'working-old-shell','./app-controller.js?v=old':'working-old-code'
    }}});
    await h.event('install');await h.event('activate');
    await h.event('message',{data:{type:'REFRESH_APP'},source:{postMessage:m=>messages.push(m)}});
    const done=messages.find(m=>m.type==='REFRESH_DONE');
    assert.ok(done.failed>0,'HTML is not a valid executable/style asset, despite HTTP 200');
    assert.equal(h.cacheMaps.has('portal-offline-fitplan-old'),true,'failed upgrade must retain the prior package');
    for(const [name,entries] of h.cacheMaps)if(name!=='portal-offline-fitplan-old'){
      assert.equal(entries.has('https://portal.test/apps/fitplan/offline-ready'),false,'incomplete package must not be marked ready');
    }
  });

  test('runtime HTML for '+asset+' cannot overwrite the saved offline asset',async()=>{
    const generation=fs.readFileSync('apps/fitplan/sw.js','utf8').match(/-cache-([^";]+)/)[1];
    const name='portal-offline-fitplan-cache-'+generation,url='https://portal.test/apps/fitplan'+asset+'?v=saved-version';
    const h=worker({htmlAsset:asset,caches:{[name]:{[url]:'known-good-offline-asset'}}});
    let response;h.handlers.fetch({request:new Request(url),respondWith:p=>{response=p;}});
    assert.equal(await (await response).text(),'known-good-offline-asset','runtime must serve the valid saved response instead of HTML');
    await new Promise(resolve=>setImmediate(resolve));
    assert.equal(await (await (await h.caches.open(name)).match(url)).text(),'known-good-offline-asset','bad network response must not poison the cache');
  });
}

test('activation retains the previous package without copying stale code into the new cache', async () => {
  const old='portal-offline-fitplan-old';
  const h=worker({caches:{[old]:{
    './app-controller.js?v=old':'stale-code',
    './assets/anatomy/70ca6102eb6508e1-01.deflate':'model'
  }}});
  await h.event('activate');
  assert.equal(h.cacheMaps.has(old), true);
  const current=[...h.cacheMaps.keys()].find(name=>name!=='portal-offline-fitplan-old');
  const entries=h.cacheMaps.get(current);
  assert.equal([...entries.keys()].some(url=>url.includes('app-controller.js')), false, 'stale code must not migrate into a new generation');
  assert.equal([...entries.keys()].some(url=>url.includes('/assets/anatomy/')), true, 'immutable anatomy chunks may be reused');
});

test('a complete offline replacement removes the previous package', async () => {
  const h=worker({caches:{'portal-offline-fitplan-old':{'./app-controller.js?v=old':'old-code'}}});
  await h.event('install'); await h.event('activate');
  await h.event('message',{data:{type:'CACHE_APP'}});
  assert.equal(h.cacheMaps.has('portal-offline-fitplan-old'),false);
});

test('stage 19 failed refresh does not destroy a previously working offline response', async () => {
  const current=fs.readFileSync('apps/fitplan/sw.js','utf8').match(/-cache-([^";]+)/)[1];
  const h=worker({offline:true,caches:{['portal-offline-fitplan-cache-'+current]:{
    '/apps/fitplan/index.html':'known-good-shell'
  }}});
  let response;
  h.handlers.fetch({request:{method:'GET',mode:'navigate',url:'https://portal.test/apps/fitplan/modul/dieta/'},respondWith:p=>{response=p;}});
  assert.equal(await (await response).text(),'known-good-shell');
});

test('offline activation keeps scripts required by the previously downloaded shell', async () => {
  const h=worker({offline:true,caches:{'portal-offline-fitplan-old':{
    './index.html':'old-shell', './legacy.html':'old-legacy',
    './app-controller.js?v=old':'required-old-code'
  }}});
  await h.event('install'); await h.event('activate');
  let response;
  h.handlers.fetch({request:new Request('https://portal.test/apps/fitplan/app-controller.js?v=old'),respondWith:p=>{response=p;}});
  assert.equal(await (await response).text(),'required-old-code');
});

test('a partial new installation falls back to the previous offline shell', async () => {
  const h=worker({caches:{'portal-offline-fitplan-old':{
    './index.html':'old-shell', './legacy.html':'old-legacy',
    './app-controller.js?v=old':'required-old-code'
  }}});
  await h.event('install'); await h.event('activate');
  // A broken network must return a coherent old shell until CACHE_APP completes.
  const offline=worker({offline:true,caches:Object.fromEntries([...h.cacheMaps].map(([name,entries])=>[name,Object.fromEntries([...entries].map(([url,r])=>[url,'new-shell']))]))});
  const previous=await offline.caches.open('portal-offline-fitplan-old');await previous.put('https://portal.test/apps/fitplan/index.html',new Response('old-shell'));
  let response;
  offline.handlers.fetch({request:{method:'GET',mode:'navigate',url:'https://portal.test/apps/fitplan/'},respondWith:p=>{response=p;}});
  assert.equal(await (await response).text(),'old-shell');
});

test('completing an offline update refreshes a migrated inline legacy screen',async()=>{
  const h=worker({caches:{'portal-offline-fitplan-old':{'./index.html':'old-shell','./legacy.html':'old-ui','./app-controller.js?v=old':'old-code'}}});
  await h.event('install');await h.event('activate');await h.event('message',{data:{type:'CACHE_APP'}});
  const current=[...h.cacheMaps.keys()][0];
  assert.equal(await h.cacheMaps.get(current).get('https://portal.test/apps/fitplan/legacy.html').text(),fs.readFileSync('apps/fitplan/legacy.html','utf8'));
});

test('an old shell gets its exact old script before a differently versioned new script',async()=>{
  const generation=fs.readFileSync('apps/fitplan/sw.js','utf8').match(/-cache-([^";]+)/)[1];
  const h=worker({offline:true,caches:{'portal-offline-fitplan-old':{'./core/state.js?v=old':'old-state'},['portal-offline-fitplan-cache-'+generation]:{'./core/state.js?v=new':'new-state'}}});
  let response;h.handlers.fetch({request:new Request('https://portal.test/apps/fitplan/core/state.js?v=old'),respondWith:p=>{response=p;}});
  assert.equal(await (await response).text(),'old-state');
});
