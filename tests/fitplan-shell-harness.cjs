const fs = require('node:fs');
const path = require('node:path');
const { JSDOM, ResourceLoader, VirtualConsole } = require('jsdom');

const tick = () => new Promise(resolve => setImmediate(resolve));
async function until(predicate, message = 'FitPlan did not settle') {
  const end = Date.now() + 5000;
  while (!predicate()) {
    if (Date.now() > end) throw new Error(message);
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}

async function createFitPlan(t, options = {}) {
  const requests = [], errors = [], warnings = [];
  // DOM tests isolate the signed-in account integration and GPU. All FitPlan navigation is real.
  const legacy = fs.readFileSync('apps/fitplan/legacy.html', 'utf8')
    .replace(/<script id="fitplan-model-data"[^>]*>[\s\S]*?<\/script>/, '')
    .replace('<head>', '<head><script>window.scrollTo=()=>{};HTMLCanvasElement.prototype.getContext=()=>null;window.fetch=(input,options)=>parent.fetch(new URL(input,document.baseURI).href,options);Object.defineProperty(window.crypto,"subtle",{value:parent.crypto.subtle});</script>');
  const local = url => path.join(process.cwd(), new URL(url).pathname.slice(1));
  class LocalFiles extends ResourceLoader {
    fetch(url) {
      const pathname = new URL(url).pathname;
      requests.push(pathname);
      if (pathname === '/apps/fitplan/legacy.html') return Promise.resolve(Buffer.from(legacy));
      if (options.sharedPreferences && /\/apps\/shared\/(i18n-core|portal-nav)\.js$/.test(pathname)) {
        const source=fs.readFileSync(local(url));
        return options.delayI18n && pathname.endsWith('/i18n-core.js') ? options.delayI18n.then(()=>source) : Promise.resolve(source);
      }
      if (!pathname.startsWith('/apps/fitplan/')) return Promise.resolve(Buffer.from(''));
      if (options.guardFirst && pathname.endsWith('/router.js')) {
        return Promise.resolve(Buffer.from(fs.readFileSync('apps/shared/guest-access.js', 'utf8') + '\n' + fs.readFileSync(local(url), 'utf8')));
      }
      if (options.script) {
        const custom = options.script(pathname);
        if (custom) return custom;
      }
      return fs.existsSync(local(url)) ? Promise.resolve(fs.readFileSync(local(url))) : null;
    }
  }
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', error => errors.push(error.message));
  virtualConsole.on('warn', (...args) => warnings.push(args));
  const dom = new JSDOM(fs.readFileSync('apps/fitplan/index.html', 'utf8'), {
    url: 'https://portal.test' + (options.route || '/apps/fitplan/'),
    runScripts: 'dangerously', resources: new LocalFiles(), virtualConsole, pretendToBeVisual: true,
    beforeParse(window) {
      options.observeWindow?.(window);
      window.scrollTo = () => {};
      Object.defineProperty(window.crypto, 'subtle', { value: require('node:crypto').webcrypto.subtle });
      for (const [key, value] of Object.entries(options.storage || {})) window.localStorage.setItem(key, value);
      window.fetch = async input => {
        const url = new URL(typeof input === 'string' ? input : input.url, window.document.baseURI);
        requests.push(url.pathname);
        if (options.fetch) {
          const response = options.fetch(url.pathname);
          if (response) return response;
        }
        const file = local(url);
        return new Response(fs.existsSync(file) ? fs.readFileSync(file) : '', { status: fs.existsSync(file) ? 200 : 404 });
      };
    }
  });
  t.after(() => dom.window.close());
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('FitPlan shell load timed out')), 10000);
    dom.window.addEventListener('load', () => { clearTimeout(timeout); resolve(); }, { once: true });
  });
  await tick();
  const frame = dom.window.document.getElementById('appFrame');
  // The old atlas eagerly renders in legacy. Replace only its GPU boundary until stage 12.
  const stubGPU = w => { if (w.FitAtlas) w.FitAtlas = { muscles: w.FitAtlas.muscles, mount() {}, dispose() {} }; };
  if (!fs.existsSync('apps/fitplan/modules/anatomy.js')) stubGPU(frame.contentWindow);
  return {
    dom, frame, requests, errors, warnings,
    get w() { return frame.contentWindow; },
    count: suffix => requests.filter(url => url.endsWith(suffix)).length,
    card(id) {
      const title = frame.contentWindow.FitPlanData.modules.find(module => module.id === id).title;
      return [...frame.contentDocument.querySelectorAll('#sectionGrid .section-card')].find(card => card.querySelector('h3').textContent === title);
    },
    async settle() { await tick(); if (frame.contentWindow.FitPlanModules?.ready) await frame.contentWindow.FitPlanModules.ready; await tick(); }
  };
}
module.exports = { createFitPlan, until, tick };
