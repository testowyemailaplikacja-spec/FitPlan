(() => {
  "use strict";
  const actors = new Map(), exercises = new Map(), aliases = new Map();
  const normalize = value => String(value || "").trim().toLocaleLowerCase("pl-PL");
  const freeze = value => {
    if (value && typeof value === "object") { Object.values(value).forEach(freeze); Object.freeze(value); }
    return value;
  };
  function registerActor(actor) {
    if (!actor?.id || actors.has(actor.id)) throw new Error("Motion actor ID must be unique");
    const copy = freeze(JSON.parse(JSON.stringify(actor))); actors.set(copy.id, copy); return copy;
  }
  function registerExercise(definition) {
    if (!definition?.id || exercises.has(definition.id) || !actors.has(definition.actorId)) throw new Error("Invalid motion identity");
    const visual = definition.visual, keys = definition.keyframes;
    const sizeOk=visual?.width > 0 && visual.height > 0;
    const gridOk=Number.isInteger(visual?.columns) && visual.columns > 0 && Number.isInteger(visual?.rows) && visual.rows > 0;
    const localAsset=value=>typeof value==="string" && value.startsWith("./assets/motion/");
    const photographic=visual?.kind==="photographic-sequence" || (!visual?.kind && (visual?.atlas || visual?.frames));
    let frameCount=gridOk ? visual.columns*visual.rows : 0;
    if (!sizeOk) throw new Error("Invalid motion visual");
    if (visual.kind==="full-body-rig") {
      if (!gridOk) throw new Error("Invalid motion visual");
      const joints=["head","neck","shoulderL","shoulderR","elbowL","elbowR","handL","handR","hipL","hipR","kneeL","kneeR","ankleL","ankleR"];
      if (!Array.isArray(visual.poses) || visual.poses.length!==visual.columns*visual.rows ||
          !visual.poses.every(pose=>joints.every(joint=>Array.isArray(pose[joint]) && pose[joint].length===2 &&
            pose[joint].every((coordinate,axis)=>Number.isFinite(coordinate) && coordinate>=0 && coordinate<=(axis===0?visual.width:visual.height)))))
        throw new Error("Invalid full-body mechanical draft");
    } else if (visual.kind==="landmark-rig") {
      if (!gridOk) throw new Error("Invalid motion visual");
      const points=["shoulder","hip","knee","ankle","elbow","hand","neck","head"];
      if (!Array.isArray(visual.poses) || visual.poses.length !== visual.columns*visual.rows ||
          !visual.poses.every(pose => points.every(key => Array.isArray(pose[key]) && pose[key].length===2 &&
            pose[key].every((value,axis) => Number.isFinite(value) && value>=0 && value<=(axis===0?visual.width:visual.height)))))
        throw new Error("Invalid landmark rig positions");
      const origin=visual.poses[0],distance=(pose,a,b)=>Math.hypot(pose[a][0]-pose[b][0],pose[a][1]-pose[b][1]);
      if (!Array.isArray(visual.fixed) || visual.fixed.some(part=>!points.includes(part))) throw new Error("Rig fixed supports are required");
      if (visual.poses.some(pose=>visual.fixed.some(part=>Math.hypot(pose[part][0]-origin[part][0],pose[part][1]-origin[part][1])>1)))
        throw new Error("Rig supports must remain fixed");
      if (visual.poses.some(pose=>[["shoulder","hip"],["hip","knee"],["knee","ankle"]].some(([a,b])=>{
        const baseline=distance(origin,a,b);return baseline<10 || Math.abs(distance(pose,a,b)-baseline)>baseline*.04;
      }))) throw new Error("Rig limbs must preserve length");
    } else if (photographic) {
      const hasAtlas=localAsset(visual.atlas),hasFrames=Array.isArray(visual.frames) && visual.frames.length>=2 && visual.frames.every(localAsset);
      if (hasAtlas===hasFrames || (hasAtlas&&!gridOk)) throw new Error("Invalid photographic assets");
      frameCount=hasFrames ? visual.frames.length : visual.columns*visual.rows;
      if (visual.flow) {
        const flow=visual.flow;
        if (!hasAtlas || !localAsset(flow.url) || !(flow.width>0&&flow.height>0) || !Number.isInteger(flow.columns) || flow.columns!==4 || !Number.isInteger(flow.rows) || flow.rows<1 || !Array.isArray(flow.pairs) || flow.pairs.length!==flow.rows || flow.pairs.some(pair=>!Array.isArray(pair)||pair.length!==2||pair.some(frame=>!Number.isInteger(frame)||frame<0||frame>=frameCount))) throw new Error("Invalid photographic flow");
      }
    } else throw new Error("Invalid motion visual");
    if (!Array.isArray(keys) || keys.length < 2 || keys[0].at !== 0 || keys.at(-1).at !== 1 || keys.some((k, i) => !Number.isFinite(k.at) || k.at < 0 || k.at > 1 || (i && k.at <= keys[i-1].at) || !Number.isInteger(k.frame) || k.frame < 0 || k.frame >= frameCount)) throw new Error("Invalid motion timeline");
    if (!Array.isArray(definition.phases) || !definition.phases.length || definition.phases.some(p => !p.label || !p.cue || !Number.isFinite(p.at))) throw new Error("Motion phases are required");
    const names = new Set([definition.id, ...(definition.aliases || [])].map(normalize));
    if ([...names].some(name => !name || aliases.has(name))) throw new Error("Motion alias already registered");
    const copy = freeze(JSON.parse(JSON.stringify(definition))); exercises.set(copy.id, copy);
    names.forEach(name => aliases.set(name, copy.id)); return copy;
  }
  function resolve(name) { return exercises.get(aliases.get(normalize(name))) || null; }
  function sample(definition, value) {
    const progress = Number.isFinite(Number(value)) ? Math.max(0, Math.min(1, Number(value))) : 0;
    const keys = definition.keyframes;
    if (progress === 1) return { from: keys.at(-1).frame, to: keys.at(-1).frame, mix: 0, progress };
    const next = keys.findIndex(key => key.at > progress), a = keys[Math.max(0, next-1)], b = keys[next];
    return { from: a.frame, to: b.frame, mix: (progress-a.at)/(b.at-a.at), progress };
  }
  Object.defineProperty(window, "FitPlanMotionLibrary", { value: Object.freeze({
    registerActor, registerExercise, resolve, sample, actor: id => actors.get(id) || null
  }) });
})();

