// WIEDORA-CHANGE: WD-20261108-WIE-205-WPL03-INTEGRATION-01 | TASK: WIE-205 | AUTHOR: Codex / GPT-6 (pełna wersja nieustalona)
(() => {
  "use strict";

  const client = window.AppSupabase;
  if (!client) {
    console.error("Brak klienta Supabase.");
    return;
  }

  const SESSION_MARKER_KEY = "portal-auth-session-v1";
  let cachedUser = null;
  let initialized = false;
  let recoveryPending = false;
  let recoveryUserId = null;
  let recoveryNotified = false;
  let profileVersion = 0;
  let lastAuthEventUserId = null;
  // WIEDORA-CHANGE: WD-20261115-WIE-152-WPL013-PASSWORD-BOUNDARY-11 | TASK: WIE-152 / WPL-013,015 | AUTHOR: ChatGPT / GPT-6
  // Password change must not report success after a session boundary switch.
  // USER_UPDATED and TOKEN_REFRESHED from the same session are not switches.
  let passwordSessionBoundary = 0;
  function scheduleRecoveryNotice(version) {
    setTimeout(() => {
      if (version !== profileVersion || !recoveryPending || recoveryNotified) return;
      recoveryNotified = true;
      window.dispatchEvent(new CustomEvent("portal-password-recovery"));
    }, 0);
  }

  function writeSessionMarker(user) {
    try {
      if (user?.id) {
        localStorage.setItem(SESSION_MARKER_KEY, JSON.stringify({ userId: user.id, updatedAt: Date.now() }));
      } else {
        localStorage.removeItem(SESSION_MARKER_KEY);
      }
    } catch {}
  }

  // WIEDORA-CHANGE: WD-20261108-WIE-152-WPL016-AUTH-EVENT-MIN-01 | TASK: WIE-152 / WPL-013,016 | AUTHOR: ChatGPT / GPT-6
  // Listeners need the account boundary, not the entire private profile.
  function dispatch() {
    const detail = cachedUser?.id ? Object.freeze({ id: cachedUser.id }) : null;
    window.dispatchEvent(new CustomEvent("portal-auth-change", { detail }));
  }

  async function loadProfile(user) {
    if (!user) return null;

    let profile = null;
    let role = "user";
    try {
      const [profileResult, roleResult] = await Promise.all([
        client
          .from("profiles")
          .select("id, display_name, nickname, avatar_url, first_name, last_name, phone, created_at, updated_at")
          .eq("id", user.id)
          .maybeSingle(),
        client
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle()
      ]);
      if (!profileResult.error) profile = profileResult.data;
      if (!roleResult.error && roleResult.data?.role) role = roleResult.data.role;
    } catch {}

    const fullName =
      profile?.display_name ||
      [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      (user.email ? user.email.split("@")[0] : "Użytkownik");

    const nickname = String(profile?.nickname || "").trim();

    return {
      id: user.id,
      email: user.email || "",
      name: nickname || fullName,
      fullName,
      nickname,
      firstName: profile?.first_name || user.user_metadata?.first_name || "",
      lastName: profile?.last_name || user.user_metadata?.last_name || "",
      phone: profile?.phone || user.user_metadata?.phone || "",
      avatarUrl: profile?.avatar_url || null,
      role,
      statusLabel: role === "administrator" ? "Administrator" : role === "moderator" ? "Moderator" : "Użytkownik",
      isModerator: role === "moderator" || role === "administrator",
      isAdmin: role === "administrator",
      createdAt: profile?.created_at || user.created_at || null,
      emailConfirmed: Boolean(user.email_confirmed_at)
    };
  }

  async function refreshCurrentUser() {
    const version = ++profileVersion;
    let response;
    try {
      response = await client.auth.getUser();
    } catch {
      response = { data: null, error: true };
    }
    if (version !== profileVersion) return cachedUser;
    const { data, error } = response || {};
    if (error || !data?.user) {
      cachedUser = null;
      writeSessionMarker(null);
      dispatch();
      // WIEDORA-CHANGE: WD-20261115-WIE-152-WPL014-PROFILE-VERIFY-01 | TASK: WIE-152 / WPL-014,015 | AUTHOR: ChatGPT / GPT-6
      // A provider failure is not a successful profile save. Fail closed,
      // but do not leak private upstream errors or overwrite a newer account.
      if (error) throw new Error("Nie udało się potwierdzić sesji. Spróbuj ponownie.");
      return null;
    }
    await window.PortalDeviceSessions?.ensure();
    if (version !== profileVersion) return cachedUser;
    const profile = await loadProfile(data.user);
    if (version !== profileVersion) return cachedUser;
    cachedUser = profile;
    writeSessionMarker(data.user);
    dispatch();
    return cachedUser;
  }

  async function refreshFromSession(session, version = ++profileVersion) {
    if (session?.user) await window.PortalDeviceSessions?.ensure(session);
    if (version !== profileVersion) return cachedUser;
    const profile = await loadProfile(session?.user || null);
    if (version !== profileVersion) return cachedUser;
    cachedUser = profile;
    writeSessionMarker(session?.user || null);
    dispatch();
    return cachedUser;
  }

  const readyPromise = (async () => {
    const version = profileVersion;
    try {
      const response = await client.auth.getSession();
      if (response?.error) throw new Error("INITIAL_SESSION_UNAVAILABLE");
      if (version === profileVersion) {
        await refreshFromSession(response?.data?.session || null);
      }
    } catch {
      // WIEDORA-CHANGE: WD-20261115-WIE-152-WPL013-OFFLINE-INIT-01 | TASK: WIE-152 / WPL-013,015 | AUTHOR: ChatGPT / GPT-6
      // A failed provider read must never leave ready() rejected, nor expose its
      // upstream error details to events. An intervening signed event wins.
      if (version === profileVersion) {
        window.dispatchEvent(new CustomEvent("portal-auth-error", {
          detail: Object.freeze({ code: "AUTH_INITIALIZATION_FAILED" })
        }));
      }
    } finally {
      initialized = true;
    }
    return cachedUser;
  })();

  client.auth.onAuthStateChange((event, session) => {
    // WIEDORA-CHANGE: WD-20261115-WIE-152-WPL013-PASSWORD-BOUNDARY-11 | TASK: WIE-152 / WPL-013,015 | AUTHOR: ChatGPT / GPT-6
    // An unexpected USER_UPDATED/TOKEN_REFRESHED identity change is a boundary
    // too: it must not certify an earlier password update for another account.
    const precedingUserId = lastAuthEventUserId || cachedUser?.id || null;
    const eventUserId = typeof session?.user?.id === "string" ? session.user.id : null;
    if (event === "SIGNED_IN" || event === "SIGNED_OUT" ||
        event === "PASSWORD_RECOVERY" || event === "INITIAL_SESSION" ||
        precedingUserId !== eventUserId)
      passwordSessionBoundary++;
    // WIEDORA-CHANGE: WD-20261114-WIE-152-WPL015-LOGOUT-TOCTOU-05 | TASK: WIE-152 / WPL-015,016 | AUTHOR: ChatGPT / GPT-6
    // The event identity is updated before the deferred profile read.
    lastAuthEventUserId = eventUserId;
    const version = ++profileVersion;
    if (!session?.user || (cachedUser && session.user.id !== cachedUser.id)) {
      cachedUser = null; writeSessionMarker(null); dispatch();
    }
    setTimeout(() => { if (version === profileVersion) refreshFromSession(session, version).catch(console.warn); }, 0);
    // WIEDORA-CHANGE: WD-20261114-WIE-152-WPL013-RECOVERY-RACE-04 | TASK: WIE-152 / WPL-013,015 | AUTHOR: ChatGPT / GPT-6
    // A delayed recovery prompt must never surface in another account.
    const nextUserId = typeof session?.user?.id === "string" ? session.user.id : null;
    if (event === "PASSWORD_RECOVERY" && nextUserId) {
      recoveryPending = true;
      recoveryUserId = nextUserId;
      recoveryNotified = false;
      scheduleRecoveryNotice(version);
    } else if (recoveryPending) {
      if (!nextUserId || nextUserId !== recoveryUserId) {
        recoveryPending = false;
        recoveryUserId = null;
        recoveryNotified = false;
      } else if (!recoveryNotified) {
        // If a token refresh arrives first for the same recovery account,
        // only the latest auth generation may deliver the prompt.
        scheduleRecoveryNotice(version);
      }
    }
  });

  function authRedirectBase() {
    if (window.location.protocol === "https:" || window.location.protocol === "http:") {
      return window.location.origin;
    }
    return "https://constant-app.netlify.app";
  }

  async function register({ firstName, lastName, phone, email, password, captchaToken }) {
    firstName = String(firstName || "").trim();
    lastName = String(lastName || "").trim();
    phone = String(phone || "").trim();
    email = String(email || "").trim().toLowerCase();

    if (firstName.length < 2) throw new Error("Podaj imię.");
    if (lastName.length < 2) throw new Error("Podaj nazwisko.");
    if (!/^\+[1-9][0-9]{6,14}$/.test(phone)) throw new Error("Podaj poprawny numer telefonu.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Podaj poprawny adres e-mail.");
    if (String(password || "").length < 8) throw new Error("Hasło powinno mieć co najmniej 8 znaków.");
    if (!captchaToken) throw new Error("Potwierdź, że nie jesteś botem.");

    const fullName = (firstName + " " + lastName).trim();

    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          phone,
          full_name: fullName
        },
        captchaToken,
        emailRedirectTo: authRedirectBase() + "/"
      }
    });

    if (error) throw new Error(error.message || "Nie udało się utworzyć konta.");

    if (data.session) {
      // WIEDORA-CHANGE: WD-20261114-WIE-152-WPL013-REGISTER-RACE-03 | TASK: WIE-152 / WPL-013,016 | AUTHOR: ChatGPT / GPT-6
      // An immediate sign-up session must still be the current Auth session;
      // a newer login cannot be replaced by an old registration response.
      const expectedId = data.session.user?.id;
      if (typeof expectedId !== "string" || !expectedId.trim())
        throw new Error("Nie udało się potwierdzić sesji po rejestracji. Spróbuj ponownie.");
      let liveSession;
      try {
        const result = await client.auth.getSession();
        if (result?.error) throw new Error("SESSION_UNAVAILABLE");
        liveSession = result?.data?.session;
      } catch {
        throw new Error("Nie udało się potwierdzić sesji po rejestracji. Spróbuj ponownie.");
      }
      if (liveSession?.user?.id !== expectedId)
        throw new Error("Sesja konta została zmieniona podczas rejestracji.");
      const confirmed = await refreshFromSession(liveSession);
      if (confirmed?.id !== expectedId)
        throw new Error("Sesja konta została zmieniona podczas rejestracji.");
    }

    return {
      user: data.user,
      session: data.session,
      needsEmailConfirmation: Boolean(data.user && !data.session)
    };
  }

  function loginConnectionError(error) {
    const message = String(error?.message || "");
    const noHttpResponse = !Number(error?.status);
    if (noHttpResponse && (
      error?.name === "AuthRetryableFetchError" ||
      /^(Failed to fetch|Load failed|NetworkError when attempting to fetch resource\.?)$/i.test(message)
    )) {
      return new Error("Nie udało się połączyć z usługą logowania. Sprawdź połączenie z internetem i spróbuj ponownie.");
    }
    return null;
  }

  async function login({ email, password }) {
    email = String(email || "").trim().toLowerCase();

    let response;
    try {
      response = await client.auth.signInWithPassword({ email, password });
    } catch (error) {
      throw loginConnectionError(error) || error;
    }
    const { data, error } = response;
    if (error) {
      const connectionError = loginConnectionError(error);
      if (connectionError) throw connectionError;
      if (/invalid login credentials/i.test(error.message || "")) {
        throw new Error("Nieprawidłowy e-mail lub hasło.");
      }
      if (/email not confirmed/i.test(error.message || "")) {
        throw new Error("Najpierw potwierdź adres e-mail.");
      }
      throw new Error(error.message || "Nie udało się zalogować.");
    }

    // WIEDORA-CHANGE: WD-20261107-WIE-152-WPL013-SESSION-GUARD-03 | TASK: WIE-152 | AUTHOR: ChatGPT / GPT-6
    // A successful HTTP response without a confirmed session is not a login.
    // WIEDORA-CHANGE: WD-20261114-WIE-152-WPL013-LOGIN-RACE-01 | TASK: WIE-152 / WPL-013,015,016 | AUTHOR: ChatGPT / GPT-6
    // A sign-in response may arrive after a different account became active.
    // Revalidate the Supabase session before displaying its profile or role.
    const requestedId = data?.session?.user?.id;
    if (typeof requestedId !== "string" || !requestedId.trim())
      throw new Error("Nie udało się potwierdzić sesji logowania. Spróbuj ponownie.");
    let confirmedSession;
    try {
      const result = await client.auth.getSession();
      if (result?.error) throw new Error("SESSION_UNAVAILABLE");
      confirmedSession = result?.data?.session;
    } catch {
      throw new Error("Nie udało się potwierdzić sesji logowania. Spróbuj ponownie.");
    }
    if (confirmedSession?.user?.id !== requestedId)
      throw new Error("Sesja logowania została zmieniona. Spróbuj ponownie.");
    // The version guard inside refreshFromSession rejects stale in-flight
    // profile work when a logout or a different account event overtakes it.
    const confirmed = await refreshFromSession(confirmedSession);
    if (confirmed?.id !== requestedId)
      throw new Error("Sesja logowania została zmieniona. Spróbuj ponownie.");
    return confirmed;
  }

  // WIEDORA-CHANGE: WD-20261107-WIE-152-WPL015-GLOBAL-LOGOUT-01 | TASK: WIE-152 | AUTHOR: ChatGPT / GPT-6
  // Keep ordinary sign-out local. Global sign-out is a separate, explicit action.
  async function signOutWithScope(scope) {
    if (scope !== "local" && scope !== "global") throw new Error("Nieprawidłowy zakres wylogowania.");
    const userAtStart = cachedUser?.id || null;
    const versionAtStart = profileVersion;
    const { error } = await client.auth.signOut({ scope });
    if (error) throw new Error(error.message || "Nie udało się wylogować.");
    // WIEDORA-CHANGE: WD-20261114-WIE-152-WPL015-SAMEUSER-RACE-07 | TASK: WIE-152 / WPL-015 | AUTHOR: ChatGPT / GPT-6
    // Retain the generation from the beginning of signOut: even a newer
    // session for the SAME account must not be cleared by the old logout.
    // WIEDORA-CHANGE: WD-20261114-WIE-152-WPL015-LOGOUT-RACE-02 | TASK: WIE-152 / WPL-013,015,016 | AUTHOR: ChatGPT / GPT-6
    // A prior logout may resolve after a new account became active.
    // Never clear its identity, marker or local progress.
    let liveSession;
    try {
      const result = await client.auth.getSession();
      if (result?.error) throw new Error("SESSION_UNAVAILABLE");
      liveSession = result?.data?.session || null;
    } catch {
      throw new Error("Nie udało się potwierdzić wylogowania. Spróbuj ponownie.");
    }
    if (liveSession?.user?.id) {

// WIEDORA-CHANGE: WD-20261114-WIE-152-WPL015-LOGOUT-SUCCESS-06 | TASK: WIE-152 / WPL-015,016 | AUTHOR: ChatGPT / GPT-6
      if (profileVersion !== versionAtStart || liveSession.user.id !== userAtStart)
        throw new Error("Konto zmieniło się podczas wylogowania. Spróbuj ponownie.");
      throw new Error("Nie udało się potwierdzić wylogowania. Spróbuj ponownie.");
    }
    // getSession may return a stale null AFTER another account was signed in.
    // Protect that new account's profile and progress even before it loads.
    if (lastAuthEventUserId &&
        (lastAuthEventUserId !== userAtStart || profileVersion !== versionAtStart))
      throw new Error("Konto zmieniło się podczas wylogowania. Spróbuj ponownie.");
    profileVersion++;
    try {
      window.PortalProgressStorage?.clearAllTracked?.();
      localStorage.removeItem("portal-progress-user-v1");
    } catch {}
    cachedUser = null;
    writeSessionMarker(null);
    dispatch();
  }

  async function logout() { return signOutWithScope("local"); }
  async function logoutEverywhere() { return signOutWithScope("global"); }

  // WIEDORA-CHANGE: WD-20261107-WIE-152-WPL015-OTHERS-02 | TASK: WIE-152 | AUTHOR: ChatGPT / GPT-6
  // "others" preserves the current session and does not fire SIGNED_OUT.
  // WIEDORA-CHANGE: WD-20261114-WIE-152-WPL015-OTHERS-RACE-08 | TASK: WIE-152 / WPL-015 | AUTHOR: ChatGPT / GPT-6
  async function logoutOtherDevices() {
    const ownerId = cachedUser?.id;
    if (!ownerId) throw new Error("Musisz być zalogowany.");
    const ownerGeneration = profileVersion;
    const { error } = await client.auth.signOut({ scope: "others" });
    if (error) throw new Error(error.message || "Nie udało się zakończyć pozostałych sesji.");
    // The previous account's response cannot certify revocation for a newer
    // session, including a second login of the same user.
    if (profileVersion !== ownerGeneration || cachedUser?.id !== ownerId)
      throw new Error("Konto zmieniło się podczas zarządzania sesjami. Spróbuj ponownie.");
    return true;
  }

  async function sendPasswordReset(email) {
    email = String(email || "").trim().toLowerCase();
    if (!email) throw new Error("Podaj adres e-mail.");

    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: authRedirectBase() + "/"
    });
    if (error) throw new Error(error.message || "Nie udało się wysłać wiadomości.");
  }

  async function updatePassword(password) {
    if (String(password || "").length < 8) throw new Error("Hasło powinno mieć co najmniej 8 znaków.");
    const boundaryAtStart = passwordSessionBoundary;
    const ownerAtStart = lastAuthEventUserId || cachedUser?.id || null;
    // WIEDORA-CHANGE: WD-20261115-WIE-152-WPL013-PASSWORD-GUEST-13 | TASK: WIE-152 / WPL-013 | AUTHOR: ChatGPT / GPT-6
    // A guest must not submit a privileged Auth update request at all.
    if (!ownerAtStart) throw new Error("Musisz być zalogowany.");
    const { data, error } = await client.auth.updateUser({ password });
    if (error) throw new Error(error.message || "Nie udało się zmienić hasła.");
    // WIEDORA-CHANGE: WD-20261115-WIE-152-WPL013-PASSWORD-RECEIPT-12 | TASK: WIE-152 / WPL-013 | AUTHOR: ChatGPT / GPT-6
    // A nominally successful provider response without the SAME authenticated
    // user's receipt is not proof of a password change.
    if (!ownerAtStart || typeof data?.user?.id !== "string" || data.user.id !== ownerAtStart)
      throw new Error("Nie udało się potwierdzić zmiany hasła. Spróbuj ponownie.");
    // An already submitted server request cannot be recalled here. Prevent
    // an old response from certifying success for a different/new session.
    // Do not reject USER_UPDATED, which may be emitted by updateUser itself.
    if (boundaryAtStart !== passwordSessionBoundary)
      throw new Error("Sesja konta została zmieniona podczas zmiany hasła. Spróbuj ponownie.");
    return true;
  }

  // WIEDORA-CHANGE: WD-20261114-WIE-152-WPL014-AVATAR-OWNER-RACE-09 | TASK: WIE-152 / WPL-014,015 | AUTHOR: ChatGPT / GPT-6
  // Neither the user ID nor the current auth generation may change while
  // a profile/avatar operation is waiting for a remote response.
  function assertCurrentProfileOwner(ownerId, ownerGeneration) {
    if (cachedUser?.id !== ownerId || profileVersion !== ownerGeneration)
      throw new Error("Konto zostało zmienione podczas edycji profilu. Spróbuj ponownie.");
  }

  // WIEDORA-CHANGE: WD-20261115-WIE-152-WPL014-POSTSAVE-BOUNDARY-01 | TASK: WIE-152 / WPL-014,015 | AUTHOR: ChatGPT / GPT-6
  // A completed profile mutation cannot certify a different account or a
  // new login of the SAME user while getUser() is still in flight.
  async function refreshAfterProfileWrite(ownerId) {
    const boundary = passwordSessionBoundary;
    const updated = await refreshCurrentUser();
    if (!updated || updated.id !== ownerId || passwordSessionBoundary !== boundary)
      throw new Error("Konto zmieniło się podczas potwierdzania profilu. Spróbuj ponownie.");
    return updated;
  }

  async function updateProfile({ nickname }) {
    const ownerId = cachedUser?.id;
    if (!ownerId) throw new Error("Musisz być zalogowany.");
    const ownerGeneration = profileVersion;

    nickname = String(nickname || "").trim();
    if (nickname && (nickname.length < 2 || nickname.length > 30)) {
      throw new Error("Pseudonim powinien mieć od 2 do 30 znaków.");
    }

    const { error } = await client
      .from("profiles")
      .update({ nickname: nickname || null })
      .eq("id", ownerId);

    if (error) throw new Error(error.message || "Nie udało się zapisać profilu.");
    assertCurrentProfileOwner(ownerId, ownerGeneration);
    return await refreshAfterProfileWrite(ownerId);
  }

  async function uploadAvatar(file) {
    const ownerId = cachedUser?.id;
    if (!ownerId) throw new Error("Musisz być zalogowany.");
    const ownerGeneration = profileVersion;
    if (!(file instanceof File)) throw new Error("Wybierz plik ze zdjęciem.");

    const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
    if (!allowed.has(file.type)) throw new Error("Avatar musi być plikiem JPG, PNG lub WEBP.");
    if (file.size > 3 * 1024 * 1024) throw new Error("Avatar może mieć maksymalnie 3 MB.");

    const path = "__USER_ID__/avatar".replace("__USER_ID__", ownerId);
    const { error: uploadError } = await client.storage
      .from("avatars")
      .upload(path, file, {
        upsert: true,
        contentType: file.type,
        cacheControl: "3600"
      });

    if (uploadError) throw new Error(uploadError.message || "Nie udało się wysłać avatara.");
    assertCurrentProfileOwner(ownerId, ownerGeneration);

    const { data } = client.storage.from("avatars").getPublicUrl(path);
    const avatarUrl = data.publicUrl + "?v=" + Date.now();

    const { error: profileError } = await client
      .from("profiles")
      .update({ avatar_url: avatarUrl })
      .eq("id", ownerId);

    if (profileError) throw new Error(profileError.message || "Nie udało się zapisać avatara.");
    assertCurrentProfileOwner(ownerId, ownerGeneration);
    return await refreshAfterProfileWrite(ownerId);
  }

  async function setPresetAvatar(id) {
    if (!cachedUser?.id) throw new Error("Musisz być zalogowany.");
    const ownerId = cachedUser.id, previousAvatar = cachedUser.avatarUrl;
    const ownerGeneration = profileVersion;
    id = String(id || "");
    const available = window.PortalAvatarPresets?.items?.some(item => item.id === id);
    if (!available) throw new Error("Wybierz dostępny avatar.");

    const { error } = await client
      .from("profiles")
      .update({ avatar_url: "preset:" + id })
      .eq("id", ownerId);
    if (error) throw new Error(error.message || "Nie udało się zapisać avatara.");
    assertCurrentProfileOwner(ownerId, ownerGeneration);

    if (previousAvatar && !window.PortalAvatarPresets?.isPreset?.(previousAvatar)) {
      const path = "__USER_ID__/avatar".replace("__USER_ID__", ownerId);
      client.storage.from("avatars").remove([path]).catch(() => {});
    }
    return await refreshAfterProfileWrite(ownerId);
  }

  async function removeAvatar() {
    const ownerId = cachedUser?.id;
    if (!ownerId) throw new Error("Musisz być zalogowany.");
    const ownerGeneration = profileVersion;

    if (!window.PortalAvatarPresets?.isPreset?.(cachedUser.avatarUrl)) {
      const path = "__USER_ID__/avatar".replace("__USER_ID__", ownerId);
      const { error: storageError } = await client.storage.from("avatars").remove([path]);
      if (storageError) throw new Error(storageError.message || "Nie udało się usunąć avatara.");
      assertCurrentProfileOwner(ownerId, ownerGeneration);
    }

    const { error } = await client
      .from("profiles")
      .update({ avatar_url: null })
      .eq("id", ownerId);

    if (error) throw new Error(error.message || "Nie udało się usunąć avatara.");
    assertCurrentProfileOwner(ownerId, ownerGeneration);
    return await refreshAfterProfileWrite(ownerId);
  }

  window.PortalAuth = Object.freeze({
    current: () => cachedUser,
    ready: () => readyPromise,
    initialized: () => initialized,
    recoveryPending: () => recoveryPending,
    consumeRecovery: () => { const value = recoveryPending; recoveryPending = false; return value; },
    register,
    login,
    logout,
    logoutEverywhere,
    logoutOtherDevices,
    sendPasswordReset,
    updatePassword,
    updateProfile,
    uploadAvatar,
    setPresetAvatar,
    removeAvatar,
    refreshCurrentUser,
    client
  });
})();
