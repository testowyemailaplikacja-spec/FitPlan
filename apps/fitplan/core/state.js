(() => {
  'use strict';
  if (window.FitPlanState) return;
  const storage = window.FitPlanStorage;
  if (!storage) throw new Error('FitPlan storage must load before state');
  const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const now = new Date();
  let navigation = { sectionId: null, tab: 'note' };
  let calendarView = { year: now.getFullYear(), month: now.getMonth(), selected: null, moving: null };
  const moduleExists = id => window.FitPlanData?.modules.some(module => module.id === id);
  function freeze(value) {
    if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
    return value;
  }
  function changed(slice) {
    if (window.FitPlanEvents) window.FitPlanEvents.emit(window, 'stateChange', { slice });
    else window.dispatchEvent(new CustomEvent('fitplan:state:change', { detail: { slice } }));
    if (['progress', 'calendar', 'all'].includes(slice) && window.parent !== window) {
      try { window.parent.dispatchEvent(new window.parent.CustomEvent('portal-sync-request', { detail: { appId: 'fitplan', dirty: true } })); } catch {}
    }
  }
  function readProgress(strict = false) {
    const value = storage.read('progress', strict);
    if (strict && Object.hasOwn(value, 'completed') && !record(value.completed)) throw new TypeError('Invalid FitPlan progress');
    return { ...value, completed: record(value.completed) ? value.completed : {} };
  }
  function writeProgress(value) {
    if (!record(value) || (Object.hasOwn(value, 'completed') && !record(value.completed))) throw new TypeError('Invalid FitPlan progress');
    const saved = storage.write('progress', value);
    changed('progress');
    return saved;
  }
  const progress = Object.freeze({
    key: storage.keys.progress,
    read: readProgress, write: writeProgress,
    completed: () => readProgress().completed,
    isCompleted: id => Boolean(readProgress().completed[String(id)]),
    setCompleted(id, value = true) {
      if (!moduleExists(id)) throw new TypeError('Unknown FitPlan module');
      const next = readProgress(true);
      next.completed[id] = Boolean(value);
      return writeProgress(next);
    },
    reset() { storage.remove('progress'); changed('progress'); }
  });
  function validDate(value) {
    return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
      Number.isFinite(Date.parse(value + 'T00:00:00Z')) && new Date(value + 'T00:00:00Z').toISOString().slice(0, 10) === value;
  }
  function requireDate(value) { if (!validDate(value)) throw new TypeError('Invalid calendar date'); }
  function assertUnchanged(entries, date, expected) {
    if (JSON.stringify(entries[date] ?? null) !== JSON.stringify(expected ?? null)) throw new Error('Calendar entry changed during editing');
  }
  function writeCalendar(entries) { validateCalendar(entries); const saved = storage.write('calendar', entries); changed('calendar'); return saved; }
  const calendar = Object.freeze({
    read: () => storage.read('calendar'),
    setView(patch) {
      const next = { ...calendarView, ...patch };
      if (!Number.isInteger(next.year) || next.year < 1 || next.year > 9999 || !Number.isInteger(next.month) || next.month < 0 || next.month > 11 ||
        (next.selected !== null && !validDate(next.selected)) || (next.moving !== null && !validDate(next.moving))) throw new TypeError('Invalid calendar view');
      calendarView = { year: next.year, month: next.month, selected: next.selected, moving: next.moving };
      changed('calendar-view');
    },
    save(date, value, expected) {
      requireDate(date);
      const entries = storage.read('calendar', true);
      if (arguments.length > 2) assertUnchanged(entries, date, expected);
      entries[date] = { ...(record(entries[date]) ? entries[date] : {}), note: String(value?.note || '').trim(), time: String(value?.time || '') };
      return writeCalendar(entries);
    },
    move(from, to, expected) {
      requireDate(from); requireDate(to);
      const entries = storage.read('calendar', true);
      if (arguments.length > 2) assertUnchanged(entries, from, expected);
      if (!entries[from] || from === to || entries[to]) return false;
      entries[to] = entries[from]; delete entries[from]; writeCalendar(entries); return true;
    },
    remove(date, expected) {
      requireDate(date);
      const entries = storage.read('calendar', true);
      if (arguments.length > 1) assertUnchanged(entries, date, expected);
      if (!Object.hasOwn(entries, date)) return false;
      delete entries[date]; writeCalendar(entries); return true;
    }
  });
  function validateCalendar(entries) {
    if (!record(entries)) throw new TypeError('Invalid calendar backup');
    for (const [date, entry] of Object.entries(entries)) {
      requireDate(date);
      if (!record(entry) || (Object.hasOwn(entry, 'note') && typeof entry.note !== 'string') ||
          (Object.hasOwn(entry, 'time') && (typeof entry.time !== 'string' || (entry.time !== '' && !/^([01]\d|2[0-3]):[0-5]\d$/.test(entry.time))))) throw new TypeError('Invalid calendar entry');
    }
  }
  function validateBackup(value) {
    if (!record(value)) throw new TypeError('Invalid FitPlan backup');
    if (value.format === 'fitplan-backup') {
      if (value.version !== 2 || !record(value.progress) || !record(value.progress.completed)) throw new TypeError('Invalid FitPlan backup');
      validateCalendar(value.calendar);
    } else if (Object.hasOwn(value, 'format') || !record(value.completed)) throw new TypeError('Invalid legacy FitPlan backup');
    return value;
  }
  const backup = Object.freeze({
    validate: validateBackup,
    export() {
      const entries = storage.read('calendar', true); validateCalendar(entries);
      return { format: 'fitplan-backup', version: 2, progress: readProgress(true), calendar: entries };
    },
    import(value) {
      validateBackup(value);
      if (value.format === 'fitplan-backup') {
        storage.writeBatch({ progress: value.progress, calendar: value.calendar });
        changed('all');
      } else {
        writeProgress(value);
      }
    }
  });
  const api = Object.freeze({
    progress, calendar, backup,
    snapshot: () => freeze({ navigation: { ...navigation }, progress: readProgress(), calendar: { ...calendarView, entries: calendar.read() } }),
    setNavigation(sectionId, tab = 'note') {
      if ((sectionId !== null && !moduleExists(sectionId)) || !['note', 'questions', 'exam'].includes(tab)) return false;
      // Te moduły nie mają już wewnętrznych zakładek, także na poziomie stanu.
      if (['dieta','plan-treningowy','lista-cwiczen','start','podsumowanie-wynikow'].includes(sectionId) && tab !== 'note') return false;
      navigation = { sectionId, tab: sectionId === null ? 'note' : tab };
      changed('navigation'); return true;
    }
  });
  Object.defineProperty(window, 'FitPlanState', { value: api });
  window.addEventListener('storage', event => {
    if (event.storageArea && event.storageArea !== localStorage) return;
    if (event.key === null) changed('all');
    else if (event.key === storage.keys.progress) changed('progress');
    else if (event.key === storage.keys.calendar) changed('calendar');
  });
})();
