const { createFitPlan } = require('./fitplan-shell-harness.cjs');

async function createTimer(t, setup) {
  const app = await createFitPlan(t);
  const w = app.w, doc = w.document;
  let now = 0, id = 0;
  const ticks = new Map();
  Object.defineProperty(w.performance, 'now', { value: () => now, configurable: true });
  w.Date.now = () => 1792950000000 + now;
  w.setInterval = fn => { ticks.set(++id, fn); return id; };
  w.clearInterval = key => ticks.delete(key);
  setup?.(w);
  app.w.FitPlanApp.open('start');
  await app.settle();
  doc.querySelector('[data-fps-tab="timer"]').click();
  const click = id => doc.getElementById(id).click();
  const step = ms => { now += ms; for (const fn of [...ticks.values()]) fn(); };
  const configure = (work = '00:10', rest = '00:02', rounds = '2') => {
    const form = doc.getElementById('fpsConfigForm');
    for (const [name, value] of Object.entries({ work, rest, rounds })) form.elements.namedItem(name).value = value;
    form.dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true }));
  };
  return { ...app, w, doc, click, step, configure, ticks };
}

module.exports = { createTimer };
