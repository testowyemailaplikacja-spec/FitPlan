(() => {
  "use strict";

  const BUCKET = "fitplan-progress";
  const MAX_BYTES = 4 * 1024 * 1024;
  const TYPES = Object.freeze({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" });

  async function context() {
    const auth = window.PortalAuth;
    if (auth?.ready) await auth.ready();
    let user = auth?.current?.() || null;
    const client = auth?.client || window.AppSupabase;
    if (!user && client?.auth?.getUser) {
      const result = await client.auth.getUser();
      user = result?.data?.user || null;
    }
    if (!client || !user?.id) throw new Error("Zaloguj się, aby korzystać z galerii postępów.");
    return { client, user };
  }

  function validate(file) {
    if (!file || typeof file !== "object") throw new Error("Wybierz zdjęcie.");
    if (!Object.hasOwn(TYPES, file.type)) throw new Error("Dozwolone są zdjęcia JPG, PNG lub WebP.");
    if (!Number.isFinite(Number(file.size)) || Number(file.size) <= 0) throw new Error("Wybrany plik jest pusty.");
    if (Number(file.size) > MAX_BYTES) throw new Error("Zdjęcie może mieć maksymalnie 4 MB.");
    return TYPES[file.type];
  }

  function normalizeSnapshot(source) {
    const input = source && typeof source === "object" ? source : {};
    const number = (value, min, max) => value !== "" && value != null && Number.isFinite(Number(value)) && Number(value) >= min && Number(value) <= max ? Number(value) : null;
    const note = (value, length = 350) => String(value || "").trim().slice(0, length);
    const recordedOn = /^\d{4}-\d{2}-\d{2}$/.test(String(input.recordedOn || "")) ? input.recordedOn : new Date().toISOString().slice(0, 10);
    const measurements = input.measurements || {};
    return {
      version: 1, recordedOn,
      view: ["front", "side", "back"].includes(input.view) ? input.view : "front",
      weight: number(input.weight, 20, 400), height: number(input.height, 100, 250),
      bmi: number(input.bmi, 0, 100), bmr: number(input.bmr, 0, 20000), tdee: number(input.tdee, 0, 30000),
      cycle: number(input.cycle, 1, 365), sessions: number(input.sessions, 0, 365),
      training: note(input.training, 120), trainingStart: /^\d{4}-\d{2}-\d{2}$/.test(String(input.trainingStart || "")) ? input.trainingStart : "",
      measurements: {
        waist: number(measurements.waist, 0, 300), chest: number(measurements.chest, 0, 300),
        hips: number(measurements.hips, 0, 300), arm: number(measurements.arm, 0, 200)
      },
      trainingLoad: note(input.trainingLoad, 150),
      supplements: note(input.supplements, 300), highlight: note(input.highlight, 350)
    };
  }

  function ownedPath(userId, path) {
    const value = String(path || "");
    if (!value.startsWith(String(userId) + "/") || value.includes("..")) {
      throw new Error("Możesz zmieniać wyłącznie zdjęcia własnego konta.");
    }
    return value;
  }

  async function list() {
    const { client, user } = await context();
    const storage = client.storage.from(BUCKET);
    const { data, error } = await storage.list(user.id, { limit: 100, sortBy: { column: "created_at", order: "desc" } });
    if (error) throw new Error(error.message || "Nie udało się pobrać zdjęć.");
    const files = (data || []).filter(item => item?.name && item.name !== ".emptyFolderPlaceholder");
    return Promise.all(files.map(async item => {
      const path = ownedPath(user.id, user.id + "/" + item.name);
      const signed = await storage.createSignedUrl(path, 3600);
      if (signed.error || !signed.data?.signedUrl) throw new Error(signed.error?.message || "Nie udało się otworzyć zdjęcia.");
      // Legacy photos have no snapshot: do not display today's data as their historical metrics.
      let snapshot = null;
      try {
        const info = await storage.info(path);
        const encoded = info.data?.user_metadata?.fitplan_progress
          ?? info.data?.metadata?.fitplan_progress
          ?? info.data?.userMetadata?.fitplan_progress;
        if (typeof encoded === "string") snapshot = normalizeSnapshot(JSON.parse(encoded));
      } catch {}
      return Object.freeze({ id: path, path, url: signed.data.signedUrl, createdAt: item.created_at || item.updated_at || null, snapshot });
    }));
  }

  async function upload(file, snapshot = null) {
    const extension = validate(file);
    const { client, user } = await context();
    const random = window.crypto?.randomUUID?.() || Math.random().toString(36).slice(2);
    const path = ownedPath(user.id, user.id + "/" + Date.now() + "-" + random + "." + extension);
    const { error } = await client.storage.from(BUCKET).upload(path, file, {
      upsert: false,
      contentType: file.type,
      cacheControl: "3600",
      metadata: snapshot ? { fitplan_progress: JSON.stringify(normalizeSnapshot(snapshot)) } : undefined
    });
    if (error) throw new Error(error.message || "Nie udało się zapisać zdjęcia.");
    return Object.freeze({ path });
  }

  async function remove(path) {
    const { client, user } = await context();
    const target = ownedPath(user.id, path);
    const { error } = await client.storage.from(BUCKET).remove([target]);
    if (error) throw new Error(error.message || "Nie udało się usunąć zdjęcia.");
    return true;
  }

  async function replace(file, previousPath, snapshot = null) {
    const { user } = await context();
    ownedPath(user.id, previousPath);
    const next = await upload(file, snapshot);
    try {
      await remove(previousPath);
    } catch (error) {
      // Both photos remain recoverable if deleting the old photo fails.
      throw new Error("Nowe zdjęcie zapisano, ale nie można usunąć poprzedniego. Oba zdjęcia pozostały w galerii.");
    }
    return next;
  }

  window.FitPlanAccountMedia = Object.freeze({ bucket: BUCKET, maxBytes: MAX_BYTES, validate, normalizeSnapshot, list, upload, replace, remove });
})();
