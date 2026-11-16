const test = require('node:test');
const assert = require('node:assert/strict');
const { createTimer } = require('./fitplan-timer-harness.cjs');

test('a new timer session counts 3, 2, 1 before consuming the work duration', async t => {
  const a = await createTimer(t); a.configure(); a.click('fpsTimerStart');
  assert.equal(a.doc.getElementById('fpsPhase').textContent, 'ODLICZANIE');
  assert.equal(a.doc.getElementById('fpsRemaining').textContent, '3');
  assert.equal(a.doc.getElementById('fpsTimerSkip').disabled, true);
  a.step(1000); assert.equal(a.doc.getElementById('fpsRemaining').textContent, '2');
  a.step(1000); assert.equal(a.doc.getElementById('fpsRemaining').textContent, '1');
  a.step(1000);
  assert.equal(a.doc.getElementById('fpsPhase').textContent, 'TRENING');
  assert.equal(a.doc.getElementById('fpsRemaining').textContent, '00:10');
  a.step(1000); assert.equal(a.doc.getElementById('fpsRemaining').textContent, '00:09');
  assert.deepEqual(a.errors, []);
});

test('analog dial stays bounded and follows the countdown and elapsed work time', async t => {
  const a = await createTimer(t);
  a.configure('00:10', '00:00', '1');
  const watch = a.doc.querySelector('.fps-watch');
  assert.equal(watch.style.getPropertyValue('--fps-progress-angle'), '0.00deg');
  a.click('fpsTimerStart');
  a.step(2000);
  assert.equal(watch.style.getPropertyValue('--fps-progress-angle'), '0.00deg', 'countdown must not consume work progress');
  a.step(1000);
  assert.equal(a.doc.getElementById('fpsRemaining').textContent, '00:10');
  a.step(5000);
  assert.equal(watch.style.getPropertyValue('--fps-progress-angle'), '180.00deg');
  assert.equal(watch.style.getPropertyValue('--fps-hand-angle'), '30.00deg');
  a.click('fpsTimerReset');
  assert.equal(watch.style.getPropertyValue('--fps-progress-angle'), '0.00deg');
  assert.deepEqual(a.errors, []);
});

test('pausing and resuming preserves both the countdown and a running phase', async t => {
  const a = await createTimer(t); a.configure(); a.click('fpsTimerStart');
  a.step(1500); a.click('fpsTimerPause'); a.step(5000); a.click('fpsTimerStart');
  assert.equal(a.doc.getElementById('fpsRemaining').textContent, '2');
  a.step(1500); assert.equal(a.doc.getElementById('fpsRemaining').textContent, '00:10');
  a.step(2000); a.click('fpsTimerPause'); a.step(9000); a.click('fpsTimerStart');
  assert.equal(a.doc.getElementById('fpsPhase').textContent, 'TRENING');
  assert.equal(a.doc.getElementById('fpsRemaining').textContent, '00:08');
  a.click('fpsTimerReset');
  assert.equal(a.ticks.size, 0);
  assert.equal(a.doc.getElementById('fpsRemaining').textContent, '00:10');
});

test('late ticks catch up across countdown, work, rest and the final completion', async t => {
  const a = await createTimer(t); a.configure(); a.click('fpsTimerStart');
  a.step(16000);
  assert.equal(a.doc.getElementById('fpsPhase').textContent, 'TRENING');
  assert.equal(a.doc.getElementById('fpsRemaining').textContent, '00:09');
  assert.equal(a.doc.getElementById('fpsRound').textContent, 'Runda 2 / 2');
  a.step(9000);
  assert.equal(a.doc.getElementById('fpsPhase').textContent, 'KONIEC');
  assert.equal(a.ticks.size, 0);
  a.click('fpsTimerStart');
  assert.equal(a.doc.getElementById('fpsRemaining').textContent, '3');
});

test('Wake Lock follows a running session and releases even after a late grant', async t => {
  const sentinels = []; let releasePending;
  const a = await createTimer(t, w => Object.defineProperty(w.navigator, 'wakeLock', { value: {
    request: () => new Promise(resolve => { releasePending = () => {
      const lock = { released: false, addEventListener() {}, release() { this.released = true; return Promise.resolve(); } };
      sentinels.push(lock); resolve(lock);
    }; })
  } }));
  a.click('fpsTimerStart');
  assert.equal(typeof releasePending, 'function');
  a.click('fpsTimerReset'); releasePending(); await a.settle();
  assert.equal(sentinels[0].released, true, 'a stale request cannot keep the screen awake after reset');
  a.click('fpsTimerStart'); releasePending(); await a.settle();
  assert.match(a.doc.getElementById('fpsWakeStatus').textContent, /pozostaje włączony/);
  a.click('fpsTimerPause'); await a.settle();
  assert.equal(sentinels[1].released, true);
});

test('touch lock keeps the clock running and Escape restores access to controls', async t => {
  const a = await createTimer(t); a.configure(); a.click('fpsTimerStart');
  a.click('fpsTimerLock');
  assert.equal(a.doc.getElementById('fpsTouchLock').hidden, false);
  a.step(4000);
  assert.equal(a.doc.getElementById('fpsLockedTime').textContent, '00:09');
  a.doc.dispatchEvent(new a.w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(a.doc.getElementById('fpsTouchLock').hidden, true);
  assert.equal(a.doc.getElementById('fpsRemaining').textContent, '00:09');
  assert.deepEqual(a.errors, []);
});

test('sound and vibration mark the last three seconds and can both be disabled', async t => {
  const sounds = [], vibrations = [];
  const a = await createTimer(t, w => {
    w.AudioContext = class {
      constructor() { this.currentTime = 0; this.state = 'running'; this.destination = {}; }
      resume() { return Promise.resolve(); } close() { return Promise.resolve(); }
      createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, disconnect() {} }; }
      createOscillator() { const node = { frequency: { value: 0 }, connect() {}, disconnect() {}, start() { sounds.push(node.frequency.value); }, stop() {} }; return node; }
    };
    Object.defineProperty(w.navigator, 'vibrate', { value: pattern => { vibrations.push(pattern); return true; } });
  });
  a.configure('00:05', '00:00', '1'); a.click('fpsTimerStart');
  a.step(3000); sounds.length = 0; vibrations.length = 0;
  a.step(2000); a.step(1000); a.step(1000); a.step(1000);
  assert.equal(sounds.length, 4, '3, 2, 1 and the final signal');
  assert.equal(vibrations.filter(pattern => pattern !== 0).length, 4);
  for (const id of ['fpsSound', 'fpsVibration']) {
    const input = a.doc.getElementById(id); input.checked = false;
    input.dispatchEvent(new a.w.Event('change', { bubbles: true }));
  }
  const count = sounds.length; a.click('fpsTimerStart'); a.step(8000);
  assert.equal(sounds.length, count);
  assert.equal(vibrations.filter(pattern => pattern !== 0).length, 4);
  assert.equal(vibrations.at(-1), 0, 'disabling vibration cancels a pending pattern');
  const saved = JSON.parse(a.w.localStorage.getItem('fitplan.start.timer-options.v1'));
  assert.equal(saved.sound, false); assert.equal(saved.vibration, false);
});

test('a sleeping performance clock cannot freeze elapsed training time', async t => {
  const a = await createTimer(t); a.configure(); a.click('fpsTimerStart');
  Object.defineProperty(a.w.performance, 'now', { value: () => 0 });
  a.step(5000);
  assert.equal(a.doc.getElementById('fpsRemaining').textContent, '00:08');
});

test('returning to the visible page reacquires a released screen lock', async t => {
  let hidden = false, requests = 0; const locks = [];
  const a = await createTimer(t, w => {
    Object.defineProperty(w.document, 'hidden', { get: () => hidden });
    Object.defineProperty(w.navigator, 'wakeLock', { value: { request: async () => {
      requests++; const lock = { released: false, addEventListener() {}, async release() { this.released = true; } };
      locks.push(lock); return lock;
    } } });
  });
  a.click('fpsTimerStart'); await a.settle();
  hidden = true; a.doc.dispatchEvent(new a.w.Event('visibilitychange')); await a.settle();
  assert.equal(locks[0].released, true);
  hidden = false; a.doc.dispatchEvent(new a.w.Event('visibilitychange')); await a.settle();
  assert.equal(requests, 2);
  assert.equal(locks[1].released, false);
  a.w.FitPlanApp.home(); await a.settle();
  assert.equal(locks[1].released, true);
  assert.equal(a.ticks.size, 0);
});

test('a denied screen lock and unavailable sound never prevent the timer from running', async t => {
  const a = await createTimer(t, w => Object.defineProperty(w.navigator, 'wakeLock', { value: {
    request: async () => { throw new Error('denied'); }
  } }));
  a.click('fpsTimerStart'); await a.settle();
  assert.match(a.doc.getElementById('fpsWakeStatus').textContent, /System nie pozwolił/);
  a.step(4000);
  assert.equal(a.doc.getElementById('fpsRemaining').textContent, '02:59');
  assert.deepEqual(a.errors, []);
});

test('holding Unlock cannot open the global reporter navigation menu', async t => {
 const a=await createTimer(t),parent=a.dom.window;
 parent.AppSupabase={auth:{getSession:async()=>({data:{session:null}})}};
 parent.PointerEvent=parent.MouseEvent;a.w.PointerEvent=a.w.MouseEvent;
 parent.eval(require('node:fs').readFileSync('js/bug-reporter.js','utf8'));
 await a.settle();a.click('fpsTimerStart');a.click('fpsTimerLock');
 const down=new a.w.Event('pointerdown',{bubbles:true,cancelable:true});
 Object.assign(down,{pointerType:'touch',button:0,pointerId:1,isPrimary:true,clientX:10,clientY:10});
 a.doc.getElementById('fpsUnlock').dispatchEvent(down);
 await new Promise(resolve=>setTimeout(resolve,1100));
 assert.equal(a.doc.getElementById('fpsTouchLock').hidden,true);
 assert.equal(parent.document.querySelector('.portal-bug-menu').hidden,true);
 parent.dispatchEvent(new parent.Event('pagehide'));
});
