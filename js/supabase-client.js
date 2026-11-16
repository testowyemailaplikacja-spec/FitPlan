(() => {
  "use strict";

  const SUPABASE_URL = "https://cjvdseficcynxfindqlz.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_NV9SjVKPmBafgFoWt2vLiQ_9zEWedv8";
  const DEVICE_KEY = "portal-auth-device-v1";

  if (!window.supabase?.createClient) {
    console.error("Supabase JS nie został załadowany.");
    return;
  }

  const nativeFetch = window.fetch.bind(window);
  const pending = new Map();
  let client, admittedToken = null, deviceId = null;

  function deviceError(code) {
    const error = new Error(code === "DEVICE_LIMIT"
      ? "Konto jest już zalogowane na 3 urządzeniach. Wyloguj się na jednym z nich i spróbuj ponownie."
      : "Nie udało się potwierdzić sesji urządzenia. Sprawdź połączenie i spróbuj ponownie.");
    error.code = code;
    return error;
  }

  function currentDeviceId() {
    if (deviceId) return deviceId;
    try {
      const stored = localStorage.getItem(DEVICE_KEY);
      if (/^[a-zA-Z0-9-]{16,128}$/.test(stored || "")) return deviceId = stored;
      deviceId = window.crypto.randomUUID();
      localStorage.setItem(DEVICE_KEY, deviceId);
      return deviceId;
    } catch {
      // Do not create a fresh device on every reload when persistence is blocked.
      throw deviceError("DEVICE_STORAGE_UNAVAILABLE");
    }
  }

  async function ensureDeviceSession(session) {
    if (session === undefined) {
      const result = await client.auth.getSession();
      if (result.error) throw deviceError("DEVICE_SESSION_UNAVAILABLE");
      session = result.data?.session;
    }
    if (!session?.user) return null;
    const token = session.access_token;
    if (!token) throw deviceError("DEVICE_SESSION_UNAVAILABLE");
    if (admittedToken === token) return { allowed: true, limit: 3 };
    if (pending.has(token)) return pending.get(token);

    const admission = (async () => {
      let result;
      try {
        result = await client.rpc("register_device_session", { p_device_id: currentDeviceId() });
      } catch (error) {
        throw error?.code === "DEVICE_STORAGE_UNAVAILABLE" ? error : deviceError("DEVICE_SESSION_UNAVAILABLE");
      }
      if (result.error || typeof result.data?.allowed !== "boolean") throw deviceError("DEVICE_SESSION_UNAVAILABLE");
      if (!result.data.allowed) {
        const current = await client.auth.getSession();
        // A delayed rejection must never sign out a newer account/session.
        if (current.data?.session?.access_token === token) await client.auth.signOut({ scope: "local" });
        throw deviceError("DEVICE_LIMIT");
      }
      admittedToken = token;
      return result.data;
    })();
    pending.set(token, admission);
    try { return await admission; }
    finally { pending.delete(token); }
  }

  function protectedRequest(input) {
    const url = new URL(typeof input === "string" ? input : input.url, SUPABASE_URL);
    if (url.origin !== SUPABASE_URL) return false;
    if (/^\/rest\/v1\/rpc\/(register_device_session|has_device_session)$/.test(url.pathname)) return false;
    return url.pathname.startsWith("/rest/v1/") ||
      (url.pathname.startsWith("/storage/v1/") && !url.pathname.startsWith("/storage/v1/object/public/")) ||
      url.pathname === "/functions/v1/platform-ai";
  }

  client = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    global: { fetch: async (input, init) => {
      if (protectedRequest(input)) await ensureDeviceSession();
      return nativeFetch(input, init);
    } }
  });
  window.AppSupabase = client;
  window.PortalDeviceSessions = Object.freeze({ ensure: ensureDeviceSession });

  function report(error) {
    window.dispatchEvent(new CustomEvent("portal-auth-error", { detail: error }));
  }
  client.auth.onAuthStateChange((_event, session) => {
    if (!session?.user) { admittedToken = null; return; }
    // Supabase callbacks hold the Auth lock; RPCs must run after the callback.
    setTimeout(() => ensureDeviceSession(session).catch(report), 0);
  });
  client.auth.getSession().then(({ data, error }) => {
    if (error) throw deviceError("DEVICE_SESSION_UNAVAILABLE");
    return ensureDeviceSession(data?.session || null);
  }).catch(report);
})();
