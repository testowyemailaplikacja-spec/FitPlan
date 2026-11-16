(() => {
  'use strict';
  if (window.FitPlanStorage) return;
  const keys = Object.freeze({
    progress: 'planer-treningowy-progress-v1.6',
    calendar: 'fitplan.calendar.entries.v2'
  });
  const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  function keyFor(kind) {
    if (!Object.hasOwn(keys, kind)) throw new TypeError('Unknown FitPlan storage resource');
    return keys[kind];
  }
  function read(kind, strict = false) {
    const key = keyFor(kind);
    let raw;
    try { raw = localStorage.getItem(key); }
    catch (error) { if (strict) throw error; return {}; }
    if (raw === null) return {};
    try {
      const value = JSON.parse(raw);
      if (!record(value)) throw new TypeError('Invalid stored FitPlan data');
      return value;
    } catch (error) { if (strict) throw error; return {}; }
  }
  function write(kind, value) {
    const key = keyFor(kind);
    if (!record(value)) throw new TypeError('FitPlan data must be an object');
    const raw = JSON.stringify(value), saved = JSON.parse(raw);
    if (!record(saved)) throw new TypeError('FitPlan data must be an object');
    localStorage.setItem(key, raw);
    return saved;
  }
  function remove(kind) { localStorage.removeItem(keyFor(kind)); }
  function writeBatch(values) {
    const entries = Object.entries(values).map(([kind, value]) => {
      const key = keyFor(kind), raw = JSON.stringify(value);
      if (!record(value) || !record(JSON.parse(raw))) throw new TypeError('Invalid FitPlan backup');
      return { key, raw, previous: localStorage.getItem(key) };
    });
    const written = [];
    try {
      for (const entry of entries) { localStorage.setItem(entry.key, entry.raw); written.push(entry); }
    } catch (error) {
      for (const entry of written.reverse()) {
        if (entry.previous === null) localStorage.removeItem(entry.key);
        else localStorage.setItem(entry.key, entry.previous);
      }
      throw error;
    }
  }
  Object.defineProperty(window, 'FitPlanStorage', { value: Object.freeze({ keys, read, write, writeBatch, remove }) });
})();
