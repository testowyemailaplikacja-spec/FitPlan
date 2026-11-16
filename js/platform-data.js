// WIEDORA-CHANGE: WD-20261108-WIE-205-WPL03-INTEGRATION-01 | TASK: WIE-205 | AUTHOR: Codex / GPT-6 (pełna wersja nieustalona)
(() => {
  "use strict";
  // WIEDORA-CHANGE: WD-20261101-WIE-155-PREFERENCES-CAS-03 | TASK: WIE-155 | AUTHOR: Codex / GPT-6 (pełna wersja nieustalona)
  const client = window.AppSupabase;
  if (!client) return;
  const LOCAL_KEY = "portal-user-preferences-v1";
  const OWNER_KEY = "portal-user-preferences-owner-v1";
  const PENDING_KEY = "portal-user-preferences-pending-v1";
  const originalSetItem = Storage.prototype.setItem;
  const forbidden = new Set(["__proto__", "prototype", "constructor"]);
  let userId = null, preferences = {}, readyPromise = null, saveTimer = 0;
  let version = 0, edits = 0, loaded = false, saving = false, pendingSave = false;
  const pendingEdits = new Map();
  let cloudPreferences = {};
  const conflictedPaths = new Set();

  function readLocal() {
    try {
      const value = JSON.parse(localStorage.getItem(LOCAL_KEY) || "{}");
      return value && typeof value === "object" && !Array.isArray(value) ? value : {};
    } catch { return {}; }
  }
  function localOwner() {
    try { return localStorage.getItem(OWNER_KEY) || ""; } catch { return ""; }
  }
  function writeLocal() {
    try {
      originalSetItem.call(localStorage, LOCAL_KEY, JSON.stringify(preferences));
      if (userId) originalSetItem.call(localStorage, OWNER_KEY, userId);
      if(userId&&pendingEdits.size)originalSetItem.call(localStorage,PENDING_KEY,JSON.stringify({userId,changes:Object.fromEntries(pendingEdits)}));
      else if(userId)localStorage.removeItem(PENDING_KEY);
    } catch {}
  }
  function clone(value) { return typeof structuredClone === "function" ? structuredClone(value) : JSON.parse(JSON.stringify(value)); }
  function parts(path) {
    const values = String(path || "").split(".").map(value => value.trim()).filter(Boolean);
    return values.some(value => forbidden.has(value)) ? [] : values;
  }
  function getPath(path, fallback = null) {
    const keys = parts(path);
    if (!keys.length) return fallback;
    let current = preferences;
    for (const key of keys) {
      if (!current || typeof current !== "object" || !Object.prototype.hasOwnProperty.call(current, key)) return fallback;
      current = current[key];
    }
    return typeof current === "undefined" ? fallback : clone(current);
  }
  function mergeDeep(target, source) {
    const result = {};
    for (const [key, value] of Object.entries(target || {})) if (!forbidden.has(key)) result[key] = value;
    for (const [key, value] of Object.entries(source || {})) {
      if (forbidden.has(key)) continue;
      result[key] = value && typeof value === "object" && !Array.isArray(value)
        ? mergeDeep(result[key] && typeof result[key] === "object" ? result[key] : {}, value)
        : value;
    }
    return result;
  }
  function assignPath(target, keys, value) {
    let current = target;
    keys.slice(0, -1).forEach(key => {
      if (!Object.prototype.hasOwnProperty.call(current, key) || !current[key] || typeof current[key] !== "object" || Array.isArray(current[key])) current[key] = {};
      current = current[key];
    });
    current[keys.at(-1)] = clone(value);
  }
  function applyPending(target) {
    for (const [path, edit] of pendingEdits) assignPath(target, parts(path), edit.value);
    return target;
  }
  function pathState(target, path) {
    let value = target;
    for (const key of parts(path)) {
      if (!value || typeof value !== "object" || !Object.prototype.hasOwnProperty.call(value, key)) return { exists: false };
      value = value[key];
    }
    return { exists: true, value: clone(value) };
  }
  function sameValue(a, b) {
    if (a === b) return true;
    if (!a || !b || typeof a !== "object" || typeof b !== "object" || Array.isArray(a) !== Array.isArray(b)) return false;
    const keys = Object.keys(a);
    return keys.length === Object.keys(b).length && keys.every(key => Object.prototype.hasOwnProperty.call(b, key) && sameValue(a[key], b[key]));
  }
  function notifyConflict(paths) {
    for (const path of paths) conflictedPaths.add(path);
    window.dispatchEvent(new CustomEvent("portal-preferences-conflict", { detail: { userId, paths: [...conflictedPaths] } }));
  }
  function setPath(path, value) {
    const keys = parts(path);
    if (!keys.length) return;
    assignPath(preferences, keys, value);
    edits++;
    const name = keys.join("."), previous = pendingEdits.get(name);
    // A new explicit edit of a conflicted field is based on the freshly read
    // cloud value. Merely retrying an old queued write never resolves a conflict.
    const base = previous && !conflictedPaths.has(name) ? previous.base : loaded ? pathState(cloudPreferences, name) : undefined;
    pendingEdits.set(name, { value: clone(value), revision: edits, ...(base ? { base } : { unbased: true }) });
    conflictedPaths.delete(name);
    writeLocal(); scheduleSave();
    window.dispatchEvent(new CustomEvent("portal-preferences-change", { detail: { path, value: clone(value) } }));
  }
  // WIEDORA-CHANGE: WD-20261107-WIE-205-WPL014-ASYNC-ACK-02 | TASK: WIE-205 | AUTHOR: ChatGPT / GPT-6
  // Notify the UI when a background timer finally commits a pending CAS.
  // Do not publish private IDs, values, paths or stale account results.
  function saveResult(outcome, owner, requestVersion) {
    if (owner && owner === userId && requestVersion === version) {
      window.dispatchEvent(new CustomEvent("portal-preferences-save", {
        detail: { outcome }
      }));
    }
    return outcome;
  }
  // WIEDORA-CHANGE: WD-20261107-WIE-205-WPL014-SAVE-ACK-01 | TASK: WIE-205 | AUTHOR: ChatGPT / GPT-6
  // The caller must distinguish a confirmed cloud commit from an offline,
  // conflicting or stale attempt. Existing callers may ignore the result.
  async function saveNow() {
    clearTimeout(saveTimer);
    if (!loaded || !userId || !navigator.onLine) return "deferred";
    if (!pendingEdits.size) return "confirmed";
    if(saving){pendingSave=true;return "deferred";}
    saving=true;pendingSave=false;
    const owner = userId, requestVersion = version, mutation = edits;
    try {
    const changes = new Map([...pendingEdits].map(([path, edit]) => [path, clone(edit)]));
    const { data: row, error: readError } = await client.from("user_preferences").select("preferences,updated_at").eq("user_id", owner).maybeSingle();
    if (requestVersion !== version || owner !== userId) return "deferred";
    if (readError) { console.warn("[platform-data] refresh failed"); return saveResult("error", owner, requestVersion); }
    if (row && (!row.preferences || typeof row.preferences !== "object" || Array.isArray(row.preferences) || typeof row.updated_at !== "string" || !row.updated_at)) {
      console.warn("[platform-data] missing preference version"); return saveResult("error", owner, requestVersion);
    }
    cloudPreferences = clone(row?.preferences || {});
    const conflicts = [];
    const candidate = clone(cloudPreferences);
    for (const [path, edit] of changes) {
      const remote = pathState(cloudPreferences, path);
      if (!sameValue(remote, edit.base || { exists: false }) && !sameValue(remote, { exists: true, value: edit.value })) conflicts.push(path);
      assignPath(candidate, parts(path), edit.value);
    }
    if (conflicts.length) { notifyConflict(conflicts); return saveResult("conflict", owner, requestVersion); }
    // updated_at is produced by the existing database trigger, not the device
    // clock. A racing UPDATE or first INSERT cannot overwrite an unseen row.
    const query = row
      ? client.from("user_preferences").update({ preferences: candidate }).eq("user_id", owner).eq("updated_at", row.updated_at)
      : client.from("user_preferences").insert({ user_id: owner, preferences: candidate });
    const { data: saved, error } = await query.select("updated_at").maybeSingle();
    if (requestVersion !== version || owner !== userId) return "deferred";
    if ((!error && !saved) || error?.code === "23505") { notifyConflict([...changes.keys()]); return saveResult("conflict", owner, requestVersion); }
    if (error) { console.warn("[platform-data] save", error); return saveResult("error", owner, requestVersion); }
    if (requestVersion === version && owner === userId) {
      cloudPreferences = candidate;
      for (const [path, edit] of pendingEdits) {
        if (edit.revision <= mutation) { pendingEdits.delete(path); conflictedPaths.delete(path); }
        else if (changes.has(path)) edit.base = pathState(candidate, path);
      }
      preferences = applyPending(clone(candidate));
      writeLocal();
      if (edits !== mutation) pendingSave=true;
      return saveResult(pendingEdits.size ? "deferred" : "confirmed", owner, requestVersion);
    }
    return "deferred";
    // WIEDORA-CHANGE: WD-20261107-WIE-205-WPL014-REJECTED-PROMISE-03 | TASK: WIE-205 | AUTHOR: ChatGPT / GPT-6
    // Supabase may reject rather than resolve to {error}. Do not claim success.
    } catch {
      if (requestVersion !== version || owner !== userId) return "deferred";
      return saveResult("error", owner, requestVersion);
    } finally { saving=false; if(pendingSave&&loaded&&userId)scheduleSave(); }
  }
  function scheduleSave() {
    if (!loaded || !userId) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => saveNow().catch(console.warn), 700);
  }
  function load() {
    if (readyPromise) return readyPromise;
    const requestVersion = version;
    readyPromise = (async () => {
      const { data, error: sessionError } = await client.auth.getSession();
      if (requestVersion !== version) return preferences;
      if (sessionError) throw sessionError;
      const nextUser = data?.session?.user?.id || null;
      const owner = localOwner();
      if(nextUser){
        try{
          const saved=JSON.parse(localStorage.getItem(PENDING_KEY)||"null");
          if(saved?.userId===nextUser)for(const [path,edit] of Object.entries(saved.changes||{})){
            if(!parts(path).length||!edit||typeof edit!=="object")continue;
            if(!pendingEdits.has(path))pendingEdits.set(path,{value:clone(edit.value),revision:Number(edit.revision)||0,...(edit.base && typeof edit.base.exists === "boolean" ? {base:clone(edit.base)} : {})});
            edits=Math.max(edits,Number(edit.revision)||0);
          }
        }catch{}
      }
      preferences = applyPending(nextUser && owner && owner !== nextUser ? {} : readLocal());
      userId = nextUser;
      if (!userId) {
        if(owner){preferences={};try{localStorage.removeItem(LOCAL_KEY);localStorage.removeItem(OWNER_KEY);localStorage.removeItem(PENDING_KEY);}catch{}}
        return preferences;
      }
      writeLocal();
      const requestedUser = userId;
      const { data: row, error } = await client.from("user_preferences").select("preferences,updated_at").eq("user_id", requestedUser).maybeSingle();
      if (requestVersion !== version || userId !== requestedUser) return preferences;
      if (error) { console.warn("[platform-data] load", error); return preferences; }
      loaded = true;
      cloudPreferences = clone(row?.preferences || {});
      for (const [path, edit] of pendingEdits) if (edit.unbased) {
        edit.base = pathState(cloudPreferences, path); delete edit.unbased;
      }
      if (row?.preferences && typeof row.preferences === "object" && !Array.isArray(row.preferences)) {
        preferences = applyPending(mergeDeep(preferences, row.preferences));
        writeLocal();
        if (pendingEdits.size) scheduleSave();
      } else if (Object.keys(preferences).length) {
        for (const [path, value] of Object.entries(preferences)) if (parts(path).length && !pendingEdits.has(path)) {
          pendingEdits.set(path, { value: clone(value), revision: ++edits, base: { exists: false } });
        }
        scheduleSave();
      }
      writeLocal();
      return preferences;
    })();
    return readyPromise;
  }
  client.auth.onAuthStateChange((event, session) => {
    const next = session?.user?.id || null;
    if (next === userId && event !== "SIGNED_OUT") return;
    version++; userId = null; loaded = false; pendingSave=false; pendingEdits.clear(); clearTimeout(saveTimer); readyPromise = null;
    cloudPreferences = {}; conflictedPaths.clear();
    if (event === "SIGNED_OUT") {
      preferences = {};
      try { localStorage.removeItem(LOCAL_KEY); localStorage.removeItem(OWNER_KEY); localStorage.removeItem(PENDING_KEY); } catch {}
      readyPromise = Promise.resolve(preferences);
      window.dispatchEvent(new CustomEvent("portal-preferences-reset"));
    } else if (next) {
      // Supabase's auth lock is held until this callback returns.
      setTimeout(() => load().then(() => window.dispatchEvent(new CustomEvent("portal-preferences-ready"))).catch(console.warn), 0);
    }
  });
  window.addEventListener("online", () => {
    if (loaded) scheduleSave();
    else { readyPromise = null; load().then(() => window.dispatchEvent(new CustomEvent("portal-preferences-ready"))).catch(console.warn); }
  });
  window.PortalData = Object.freeze({
    ready: load, get: (path, fallback = null) => getPath(path, fallback), set: setPath,
    patch: (path, patch) => setPath(path, mergeDeep(getPath(path, {}), patch || {})),
    all: () => clone(preferences), save: saveNow
  });
  load().then(() => window.dispatchEvent(new CustomEvent("portal-preferences-ready"))).catch(console.warn);
})();
