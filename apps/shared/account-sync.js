(() => {
  "use strict";

  const client = window.AppSupabase;
  const storageApi = window.PortalProgressStorage;
  if (!client || !storageApi) return;

  const appId = storageApi.appIdFromPath();
  if (!appId) return;

  const tracked = new Set(storageApi.keysFor(appId));
  const META_PREFIX = "portal-account-sync-meta:";
  const LAST_USER_KEY = "portal-progress-user-v1";
  const OWNERS_KEY = "portal-progress-owners-v1";
  const RELOAD_PREFIX = "portal-sync-restored:";
  const STATE_SCHEMA = 3;
  const originalSetItem = Storage.prototype.setItem;
  const originalRemoveItem = Storage.prototype.removeItem;

  let applyingRemote = false;
  let uploadTimer = 0;
  let currentUserId = null;
  let syncing = false;
  let pendingUpload = false;
  let restoring = false;
  let ownerReady = false;
  let sessionVersion = 0;
  let dirtyVersion = 0;

  function progressOwners() {
    let owners = {};
    try { owners = JSON.parse(localStorage.getItem(OWNERS_KEY) || "{}"); } catch {}
    if (!owners || typeof owners !== "object" || Array.isArray(owners)) owners = {};
    // Preserve ownership of every app when migrating the old shared marker.
    let legacy = "";
    try { legacy = localStorage.getItem(LAST_USER_KEY) || ""; } catch {}
    if (legacy) Object.keys(storageApi.keys).forEach(id => { if (!owners[id]) owners[id] = legacy; });
    return owners;
  }

  function setOwner(userId) {
    const owners = progressOwners();
    owners[appId] = userId;
    try {
      originalSetItem.call(localStorage, OWNERS_KEY, JSON.stringify(owners));
      originalSetItem.call(localStorage, LAST_USER_KEY, userId);
    } catch {}
  }

  function metaKey(userId) {
    return META_PREFIX + userId + ":" + appId;
  }

  function readMeta(userId) {
    try {
      const parsed = JSON.parse(localStorage.getItem(metaKey(userId)) || "{}");
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }

  function writeMeta(userId, patch) {
    if (!userId) return;
    const next = Object.assign({}, readMeta(userId), patch || {});
    try { originalSetItem.call(localStorage, metaKey(userId), JSON.stringify(next)); } catch {}
  }

  function safeJson(value) {
    try { return JSON.parse(value || "{}"); } catch { return {}; }
  }

  function mergeGuestCalendar(storage, raw) {
    const record=value=>value&&typeof value==="object"&&!Array.isArray(value);
    const guest=safeJson(raw),account=safeJson(storage?.["fitplan.calendar.entries.v2"]);
    if(!record(guest)||!Object.keys(guest).length||!record(account))return {storage,merged:false};
    const entries={...account};
    for(const [date,entry] of Object.entries(guest)){
      if(!record(entry))continue;
      const saved=entries[date];
      if(!record(saved)){entries[date]=entry;continue;}
      if((entry.note||"")===(saved.note||"")&&(entry.time||"")===(saved.time||"")){
        entries[date]={...entry,...saved};continue;
      }
      const guestText=[entry.time?"["+entry.time+"]":"",entry.note||""].filter(Boolean).join(" ");
      entries[date]={...entry,...saved,time:saved.time||entry.time||"",note:[saved.note||"",guestText].filter(Boolean).join("\n\n")};
    }
    const merged=JSON.stringify(entries)!==JSON.stringify(account);
    return {storage:merged?{...storage,"fitplan.calendar.entries.v2":JSON.stringify(entries)}:storage,merged};
  }

  function lawSummary(snapshot) {
    const progress = safeJson(snapshot["aplikacja-prawnicza-progress-v1"]);
    const ids = [];
    try {
      if (typeof SECTIONS !== "undefined" && Array.isArray(SECTIONS)) {
        const walk = items => {
          (items || []).forEach(item => {
            if (item?.type === "learning-section") {
              (item.subsections || []).forEach(sub => {
                if (sub?.type === "learning-subsection" && sub.id) ids.push(sub.id);
              });
            }
            if (item?.type === "part" && Array.isArray(item.sections)) walk(item.sections);
          });
        };
        SECTIONS.forEach(course => walk(course.sections || []));
      }
    } catch {}

    const unique = Array.from(new Set(ids));
    const completed = unique.filter(id => progress[id] === true || progress["passed:" + id] === true).length;
    const total = unique.length;
    return {
      appId,
      completed,
      total,
      percent: total ? Math.round((completed / total) * 100) : null,
      completedSignals: storageApi.countTrueDeep(progress),
      storedKeys: Object.values(snapshot).filter(value => value !== null).length
    };
  }

  function appFrameWindow() {
    try {
      return document.getElementById("appFrame")?.contentWindow || null;
    } catch {
      return null;
    }
  }

  function ccnaSummary(snapshot) {
    const progress = safeJson(snapshot["ccna-learning-progress-v1"]);
    let ids = [];
    try {
      const w = appFrameWindow();
      if (w && typeof w.getProgressGroups === "function") {
        ids = w.getProgressGroups()
          .flatMap(group => group?.items || [])
          .map(item => item?.id)
          .filter(Boolean);
      }
    } catch {}

    const unique = Array.from(new Set(ids));
    const completed = unique.length
      ? unique.filter(id => progress[id] === true || progress["passed:" + id] === true).length
      : Object.entries(progress).filter(([key, value]) => value === true && key.startsWith("passed:")).length;
    const total = unique.length || null;

    return {
      appId,
      completed,
      total,
      percent: total ? Math.round((completed / total) * 100) : null,
      completedSignals: storageApi.countTrueDeep(progress),
      storedKeys: Object.values(snapshot).filter(value => value !== null).length
    };
  }

  function fitPlanSummary(snapshot) {
    const state = safeJson(snapshot["planer-treningowy-progress-v1.6"]);
    const completedMap = state && typeof state.completed === "object" ? state.completed : {};
    const completed = Object.values(completedMap).filter(Boolean).length;
    let total = null;
    try {
      const doc = appFrameWindow()?.document;
      const count = doc?.querySelectorAll?.("#sectionGrid .section-card")?.length || 0;
      if (count > 0) total = count;
    } catch {}

    return {
      appId,
      completed,
      total,
      percent: total ? Math.round((completed / total) * 100) : null,
      completedSignals: completed,
      storedKeys: Object.values(snapshot).filter(value => value !== null).length
    };
  }

  function makeSummary(snapshot) {
    if (appId === "prawo") return lawSummary(snapshot);
    if (appId === "ccna") return ccnaSummary(snapshot);
    if (appId === "fitplan") return fitPlanSummary(snapshot);
    return storageApi.genericSummary(appId, snapshot);
  }

  function markDirty() {
    if (applyingRemote || !currentUserId) return;
    dirtyVersion++;
    writeMeta(currentUserId, { dirtyAt: Math.max(Date.now(), Number(readMeta(currentUserId).lastPulledAt || 0) + 1) });
    scheduleUpload();
  }

  function scheduleUpload(delay = 1400) {
    if (!currentUserId) return;
    clearTimeout(uploadTimer);
    uploadTimer = setTimeout(() => uploadNow().catch(error => console.warn("[account-sync]", error)), delay);
  }

  async function getSessionUser() {
    const { data } = await client.auth.getSession();
    return data?.session?.user || null;
  }

  async function uploadNow() {
    if (syncing || restoring || !ownerReady || !currentUserId || !navigator.onLine) {
      pendingUpload = true;
      return;
    }

    syncing = true;
    pendingUpload = false;
    const userId = currentUserId, version = sessionVersion, mutation = dirtyVersion;
    try {
      const user = await getSessionUser();
      if (!user || user.id !== userId || version !== sessionVersion || currentUserId !== userId) return;

      const snapshot = storageApi.snapshot(appId);
      const summary = makeSummary(snapshot);
      const now = new Date().toISOString();
      const state = {
        schema: STATE_SCHEMA,
        storage: snapshot,
        summary,
        synced_at: now
      };

      // WIEDORA-CHANGE: WD-20261101-WIE-155-REVISION-GUARD-01 | TASK: WIE-155 | AUTHOR: ChatGPT / GPT-6
      // Offline devices must not silently replace a newer remote snapshot.
      // A revision-filtered UPDATE is atomic inside Postgres; the revision
      // trigger increments it. A first-time INSERT instead relies on the
      // existing unique (user_id,app_id) primary key.
      const knownRevision = Number(readMeta(userId).lastRevision || 0);
      const payload = { state, client_updated_at: now };
      let result;
      if (knownRevision > 0 && Number.isSafeInteger(knownRevision)) {
        result = await client.from("user_app_state")
          .update(payload)
          .eq("user_id", userId)
          .eq("app_id", appId)
          .eq("revision", knownRevision)
          .select("revision,updated_at")
          .maybeSingle();
      } else {
        result = await client.from("user_app_state")
          .insert({ user_id: userId, app_id: appId, ...payload })
          .select("revision,updated_at")
          .single();
      }
      const { data, error } = result;
      if (error?.code === "23505" || (!error && !data)) {
        // Keep the local pending progress intact. Retrying the same stale
        // snapshot would overwrite another device's changes, so require a
        // deliberate, version-aware reconciliation rather than looping.
        if (version === sessionVersion && currentUserId === userId) {
          ownerReady = false;
          pendingUpload = false;
          clearTimeout(uploadTimer);
          console.warn("[account-sync] Wykryto nowszą wersję postępu na innym urządzeniu");
          window.dispatchEvent(new CustomEvent("portal-progress-conflict", {
            detail: { appId }
          }));
        }
        return;
      }
      if (error) throw error;
      if (version !== sessionVersion || currentUserId !== userId) return;

      const changed = mutation !== dirtyVersion;
      const meta = readMeta(userId);
      writeMeta(userId, {
        lastRevision: data?.revision || null,
        lastPulledAt: changed ? Number(meta.lastPulledAt || 0) : Date.now(),
        dirtyAt: changed ? Number(meta.dirtyAt || Date.now()) : 0,
        lastServerUpdatedAt: data?.updated_at || now
      });
      setOwner(userId);
      if (changed) pendingUpload = true;
      if (!changed) window.dispatchEvent(new CustomEvent("portal-progress-synced", {
        detail: { appId, userId, summary }
      }));
    } finally {
      syncing = false;
      if (pendingUpload && ownerReady && !restoring) scheduleUpload(600);
    }
  }

  function shouldReloadAfterRestore(userId, revision) {
    const key = RELOAD_PREFIX + userId + ":" + appId + ":" + String(revision || "0");
    try {
      if (sessionStorage.getItem(key) === "1") return false;
      sessionStorage.setItem(key, "1");
      return true;
    } catch {
      return false;
    }
  }

  async function restoreOrSeed(user) {
    if (user?.id === currentUserId && (restoring || ownerReady)) return;
    currentUserId = user?.id || null;
    if (!currentUserId) return;
    const userId = currentUserId, version = ++sessionVersion;
    const mutation = dirtyVersion;
    restoring = true;
    ownerReady = false;
    clearTimeout(uploadTimer);

    const lastProgressUser = progressOwners()[appId] || "";
    const guestCalendar = appId==="fitplan"&&!lastProgressUser ? storageApi.snapshot(appId)["fitplan.calendar.entries.v2"] : null;
    const ownerChanged = Boolean(lastProgressUser && lastProgressUser !== currentUserId);
    if (ownerChanged) {
      applyingRemote = true;
      try { storageApi.clearApp(appId); }
      finally { applyingRemote = false; }
    }
    setOwner(userId);

    const meta = readMeta(userId);
    let result;
    try { result = await client
      .from("user_app_state")
      .select("state,revision,updated_at")
      .eq("user_id", userId)
      .eq("app_id", appId)
      .maybeSingle(); }
    catch (error) { result = { data: null, error }; }
    const { data, error } = result;

    if (version !== sessionVersion || currentUserId !== userId) return;
    restoring = false;

    if (error) {
      console.warn("[account-sync] Nie udało się pobrać postępu", error);
      if (ownerChanged) location.reload();
      return;
    }
    ownerReady = true;

    if (!data) {
      if (ownerChanged) {
        applyingRemote = true;
        try { storageApi.clearApp(appId); } finally { applyingRemote = false; }
      }
      // No server row exists. Forget any stale local revision so the first
      // upload uses an INSERT, never a failed UPDATE against a deleted row.
      writeMeta(userId, { lastRevision: 0 });
      await uploadNow();
      if (!navigator.onLine) {
        writeMeta(currentUserId, { lastRevision: 0, lastPulledAt: Date.now(), dirtyAt: Date.now() });
      }
      try { originalSetItem.call(localStorage, LAST_USER_KEY, currentUserId); } catch {}
      if (ownerChanged) location.reload();
      return;
    }

    const dirtyAt = Number(meta.dirtyAt || 0);
    const lastPulledAt = Number(meta.lastPulledAt || 0);
    if (!ownerChanged && ((dirtyAt && dirtyAt > lastPulledAt) || mutation !== dirtyVersion)) {
      await uploadNow();
      return;
    }

    const guestMerge=mergeGuestCalendar(data.state?.storage,guestCalendar);
    const remoteStorage = guestMerge.storage;
    const calendarNeedsUpload = appId === "fitplan" && remoteStorage &&
      !Object.prototype.hasOwnProperty.call(remoteStorage, "fitplan.calendar.entries.v2") &&
      storageApi.snapshot(appId)["fitplan.calendar.entries.v2"] !== null;
    const remoteRevision = Number(data.revision || 0);
    const localHasData = storageApi.hasData(appId);
    if (remoteStorage && typeof remoteStorage === "object" && (ownerChanged || !localHasData || Number(meta.lastRevision || -1) !== remoteRevision)) {
      applyingRemote = true;
      try {
        storageApi.applySnapshot(appId, remoteStorage);
      } catch (error) {
        // WIEDORA-CHANGE: WD-20261031-WIE-002-SNAPSHOT-TYPE-GUARD-03 | TASK: WIE-002 | AUTHOR: ChatGPT / GPT-6
        // Never mark a malformed cloud snapshot as restored or allow uploads
        // until a valid snapshot can be read for this account.
        ownerReady = false;
        console.warn("[account-sync] Odrzucono nieprawidłową kopię postępu", error);
        return;
      } finally {
        applyingRemote = false;
      }

      writeMeta(currentUserId, {
        lastRevision: remoteRevision,
        lastPulledAt: calendarNeedsUpload||guestMerge.merged ? 0 : Date.now(),
        dirtyAt: calendarNeedsUpload||guestMerge.merged ? Date.now() : 0,
        lastServerUpdatedAt: data.updated_at || data.state?.synced_at || null
      });
      try { originalSetItem.call(localStorage, LAST_USER_KEY, currentUserId); } catch {}

      if (shouldReloadAfterRestore(currentUserId, remoteRevision)) {
        if(guestMerge.merged)await uploadNow();
        location.reload();
        return;
      }
    } else {
      writeMeta(currentUserId, {
        lastRevision: remoteRevision,
        lastPulledAt: calendarNeedsUpload||guestMerge.merged ? 0 : Date.now(),
        dirtyAt: calendarNeedsUpload||guestMerge.merged ? Date.now() : 0,
        lastServerUpdatedAt: data.updated_at || data.state?.synced_at || null
      });
      try { originalSetItem.call(localStorage, LAST_USER_KEY, currentUserId); } catch {}
    }

    if (calendarNeedsUpload || guestMerge.merged || Number(data.state?.schema || 0) < STATE_SCHEMA) {
      scheduleUpload(700);
    }
  }

  Storage.prototype.setItem = function(key, value) {
    const result = originalSetItem.apply(this, arguments);
    if (this === localStorage && tracked.has(String(key))) markDirty();
    return result;
  };

  Storage.prototype.removeItem = function(key) {
    const result = originalRemoveItem.apply(this, arguments);
    if (this === localStorage && tracked.has(String(key))) markDirty();
    return result;
  };

  window.addEventListener("storage", event => {
    if (event.storageArea === localStorage && event.key === "portal-progress-imported:" + appId) {
      const imported = safeJson(event.newValue);
      if (!currentUserId || imported?.userId !== currentUserId) return;
      // The account panel has replaced both cloud and local progress. Cancel
      // queued uploads and reload stale in-memory app state from that snapshot.
      ownerReady = false;
      pendingUpload = false;
      sessionVersion++;
      clearTimeout(uploadTimer);
      try { originalRemoveItem.call(localStorage, metaKey(currentUserId)); } catch {}
      location.reload();
      return;
    }
    if (event.storageArea === localStorage && event.key && tracked.has(String(event.key))) markDirty();
  });

  window.addEventListener("online", () => {
    if (!currentUserId) return;
    if (ownerReady) scheduleUpload(300);
    else getSessionUser().then(restoreOrSeed).catch(error => console.warn("[account-sync]", error));
  });

  const appFrame = document.getElementById("appFrame");
  appFrame?.addEventListener("load", () => {
    if (currentUserId) scheduleUpload(500);
  });

  window.addEventListener("portal-sync-request", event => {
    if (event.detail?.appId === appId && currentUserId) {
      if (event.detail.dirty === true) markDirty();
      scheduleUpload(100);
    }
  });

  client.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_IN" && session?.user) {
      if(session.user.id!==currentUserId){sessionVersion++;currentUserId=null;restoring=false;ownerReady=false;clearTimeout(uploadTimer);}
      const version=sessionVersion;
      setTimeout(() => {if(version===sessionVersion)restoreOrSeed(session.user).catch(error => console.warn("[account-sync]", error));}, 0);
    }
    if (event === "SIGNED_OUT") {
      currentUserId = null;
      sessionVersion++;
      restoring = false;
      ownerReady = false;
      pendingUpload = false;
      clearTimeout(uploadTimer);
      storageApi.clearAllTracked();
      try { originalRemoveItem.call(localStorage, OWNERS_KEY); } catch {}
      try { localStorage.removeItem(LAST_USER_KEY); } catch {}
    }
  });

  const startupVersion=sessionVersion;
  getSessionUser()
    .then(user => {
      if(startupVersion!==sessionVersion)return;
      if (user) {
        return restoreOrSeed(user);
      } else {
        currentUserId = null;
        try {
          const owners=progressOwners();
          if(appId==="fitplan"&&!owners[appId])originalRemoveItem.call(localStorage,"planer-treningowy-progress-v1.6");
          else storageApi.clearApp(appId);
          delete owners[appId];
          originalSetItem.call(localStorage,OWNERS_KEY,JSON.stringify(owners));
          localStorage.removeItem(LAST_USER_KEY);
        } catch {}
      }
    })
    .catch(error => console.warn("[account-sync]", error));
})();
