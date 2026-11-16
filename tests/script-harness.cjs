const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const clone = value => value == null ? value : JSON.parse(JSON.stringify(value));
function deferred() {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
}
function harness({ app = 'ccna', user = 'alice', local = {}, rows = {} } = {}) {
  class Storage {
    constructor(values = {}) { this.data = new Map(Object.entries(values)); }
    getItem(key) { return this.data.has(String(key)) ? this.data.get(String(key)) : null; }
    setItem(key, value) { this.data.set(String(key), String(value)); }
    removeItem(key) { this.data.delete(String(key)); }
    clear() { this.data.clear(); }
  }
  const events = new EventTarget(), frame = new EventTarget();
  frame.contentWindow = null;
  // WIEDORA-CHANGE: WD-20261101-WIE-155-PREFERENCES-CAS-03 | TASK: WIE-155 | AUTHOR: Codex / GPT-6 (pełna wersja nieustalona)
  const database = new Map(Object.entries(rows).map(([key, row]) => [key, key.startsWith('user_preferences:') ? {updated_at: '2026-01-01T00:00:00Z', ...row} : row]));
  const authListeners = [], reads = [], writes = [], lockViolations = [];
  let session = user ? { user: { id: user } } : null;
  let inAuth = false, time = 10000, nextTimer = 1;
  const timers = new Map();
  const readWaits = new Map(), writeWaits = new Map(), readErrors = new Map();
  const client = {
    auth: {
      async getSession() {
        if (inAuth) lockViolations.push('getSession');
        return { data: { session }, error: null };
      },
      async getUser() { return { data: { user: session?.user || null }, error: null }; },
      async signOut() { emitAuth(null); return { error: null }; },
      onAuthStateChange(listener) { authListeners.push(listener); return { data: { subscription: { unsubscribe() {} } } }; }
    },
    from(table) {
      if (inAuth) lockViolations.push(table);
      const filters = {};
      let payload, mode = 'read';
      const key = () => table + ':' + (filters.user_id || filters.id || payload?.user_id || '') + (table === 'user_app_state' ? ':' + (filters.app_id || payload?.app_id || '') : '');
      const writeResult = async () => {
        // WIEDORA-CHANGE: WD-20261101-WIE-155-REVISION-GUARD-01 | TASK: WIE-155 | AUTHOR: ChatGPT / GPT-6
        // Simulate PostgREST's atomic revision filter and unique-key insert.
// WIEDORA-CHANGE: WD-20261101-WIE-005-NATIVE-REGRESSION-10 | TASK: WIE-005 | AUTHOR: Codex / GPT-6 (pełna wersja nieustalona)
        // Only app state has a unique user/app key; diagnostic inserts are independent rows.
        const id = key(), previous = database.get(id);
        if (['user_app_state', 'user_preferences'].includes(table) && mode === 'insert' && previous) return { data: null, error: { code: '23505', message: 'duplicate test row' } };
        if (mode === 'update' && (!previous || (table === 'user_preferences' ? previous.updated_at !== filters.updated_at : Number(previous.revision) !== Number(filters.revision)))) {
          return { data: null, error: null };
        }
        const data = {
          ...(mode === 'update' ? clone(previous) : {}),
          ...clone(payload), revision: (previous?.revision || 0) + 1,
          updated_at: new Date(time).toISOString()
        };
        writes.push(clone(payload));
        database.set(id, data);
        if (writeWaits.has(id)) await writeWaits.get(id).promise;
        return { data, error: null };
      };
      const query = {
        select() { return query; },
        eq(name, value) { filters[name] = value; return query; },
        upsert(value) { payload = clone(value); mode = 'upsert'; return query; },
        insert(value) { payload = clone(value); mode = 'insert'; return query; },
        update(value) { payload = clone(value); mode = 'update'; return query; },
        async maybeSingle() {
          if (mode === 'update' || mode === 'insert') return writeResult();
          const id = key();
          reads.push(id);
          const data = clone(database.get(id) || null);
          if (readWaits.has(id)) await readWaits.get(id).promise;
          return { data, error: readErrors.get(id) || null };
        },
        async single() { return writeResult(); },
        then(resolve, reject) { return query.single().then(resolve, reject); }
      };
      return query;
    }
  };
  const context = {
    console, Storage, localStorage: new Storage(local), sessionStorage: new Storage(),
    AppSupabase: client, navigator: { onLine: true },
    document: { getElementById: id => id === 'appFrame' ? frame : null },
    location: { pathname: '/apps/' + app + '/', reload() { context.reloads++; } },
    reloads: 0, CustomEvent, Event, structuredClone,
    addEventListener: events.addEventListener.bind(events),
    dispatchEvent: events.dispatchEvent.bind(events),
    setTimeout(callback, delay = 0) { const id = nextTimer++; timers.set(id, { callback, at: time + delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
    Date: class extends Date { static now() { return time; } }
  };
  context.window = context;
  vm.createContext(context);
  async function flush() { for (let i = 0; i < 30; i++) await Promise.resolve(); }
  async function advance(delay = 0) {
    const target = time + delay;
    for (let count = 0; count < 100; count++) {
      const entry = [...timers].filter(([, timer]) => timer.at <= target).sort((a, b) => a[1].at - b[1].at)[0];
      if (!entry) break;
      timers.delete(entry[0]); time = entry[1].at; entry[1].callback(); await flush();
    }
    time = target; await flush();
  }
  function emitAuth(id) {
    session = id ? { user: { id } } : null;
    inAuth = true;
    for (const listener of authListeners) listener(id ? 'SIGNED_IN' : 'SIGNED_OUT', session);
    inAuth = false;
  }
  function run(file) { vm.runInContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), context, { filename: file }); }
  return { context, client, database, frame, reads, writes, lockViolations, readWaits, writeWaits, readErrors, emitAuth, run, flush, advance };
}
module.exports = { harness, deferred };
