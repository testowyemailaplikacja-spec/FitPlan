(() => {
  "use strict";
  const library = window.FitPlanMotionLibrary;

  function register(manifest) {
    if (!library || manifest?.schemaVersion !== 1 || !Array.isArray(manifest.actors) || !Array.isArray(manifest.exercises)) {
      throw new Error("Invalid photographic motion manifest");
    }
    for (const actor of manifest.actors) library.registerActor(actor);
    const ids = [];
    for (const entry of manifest.exercises) {
      if (!Array.isArray(entry.sequence) || entry.sequence.length < 2) throw new Error("Photographic sequence is required");
      const definition = JSON.parse(JSON.stringify(entry));
      const sequence = definition.sequence;
      delete definition.sequence;
      definition.keyframes = sequence.map((frame, index) => ({ at: index / (sequence.length - 1), frame }));
      library.registerExercise(definition);
      ids.push(definition.id);
    }
    return Object.freeze(ids);
  }

  const api = Object.freeze({ register, manifest: window.FitPlanPhotographicManifest });
  Object.defineProperty(window, "FitPlanPhotographicCatalog", { value: api });
  register(api.manifest);
})();
