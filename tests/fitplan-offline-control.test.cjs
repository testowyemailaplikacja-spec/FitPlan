const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM } = require('jsdom');

test('automatic offline refresh returns to a ready and usable download control', async t => {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'https://portal.test/apps/fitplan/', runScripts: 'outside-only'
  });
  t.after(() => dom.window.close());
  const w = dom.window, requests = [];
  const worker = { postMessage: message => requests.push(message.type) };
  const registration = { active: worker };
  const serviceWorker = new w.EventTarget();
  serviceWorker.register = async () => registration;
  serviceWorker.ready = Promise.resolve(registration);
  Object.defineProperty(w.navigator, 'serviceWorker', { value: serviceWorker });
  w.localStorage.setItem('portal-offline-enabled:fitplan', '1');
  w.eval(fs.readFileSync('apps/shared/offline-control.js', 'utf8'));
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(requests, ['REFRESH_APP'], 'an existing package refreshes automatically');

  serviceWorker.dispatchEvent(new w.MessageEvent('message', {
    data: { appId: 'fitplan', type: 'CACHE_PROGRESS', done: 1, total: 3 }
  }));
  const button = w.document.querySelector('.offline-control');
  assert.match(button.textContent, /Pobieranie 33%/);
  serviceWorker.dispatchEvent(new w.MessageEvent('message', {
    data: { appId: 'fitplan', type: 'REFRESH_DONE', done: 3, total: 3, failed: 0 }
  }));
  assert.equal(button.disabled, false, 'completed refresh must allow another download');
  assert.match(button.textContent, /Offline gotowe/);
  assert.ok(Number(w.localStorage.getItem('portal-offline-refreshed:fitplan')) > 0);
});
