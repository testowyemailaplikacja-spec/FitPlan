(() => {
  "use strict";

  const EXERCISE_NAME = "Wyciskanie sztangi na ławce płaskiej";
  const DISPLAY_NAME = "Barbell Bench Press";
  const PHASES = Object.freeze([
    Object.freeze({
      id: "start",
      label: "Tempo 1",
      title: "Pozycja startowa",
      cue: "Łopatki pozostają ściągnięte i oparte o ławkę. Stopy są stabilne, nadgarstki nad łokciami, a sztanga nad linią barków.",
      barY: 1.24,
      elbowX: 0.48,
      elbowY: 0.82
    }),
    Object.freeze({
      id: "descent",
      label: "Tempo 2",
      title: "Kontrolowane opuszczanie",
      cue: "Opuszczaj sztangę spokojnie ku środkowej części klatki. Łokcie schodzą w dół i lekko na zewnątrz, bez odrywania łopatek.",
      barY: 0.90,
      elbowX: 0.68,
      elbowY: 0.55
    }),
    Object.freeze({
      id: "bottom",
      label: "Tempo 3",
      title: "Dolna pozycja",
      cue: "Sztanga zatrzymuje się lekko nad klatką lub delikatnie jej dotyka. Przedramiona pozostają możliwie pionowe, a barki nie wysuwają się do przodu.",
      barY: 0.58,
      elbowX: 0.82,
      elbowY: 0.34
    }),
    Object.freeze({
      id: "press",
      label: "Tempo 4",
      title: "Wyciskanie i stabilizacja",
      cue: "Odepchnij sztangę po lekko łukowym torze do pozycji nad barkami. Utrzymaj napięty tułów i zakończ ruch bez gwałtownego przeprostu łokci.",
      barY: 1.24,
      elbowX: 0.48,
      elbowY: 0.82
    })
  ]);

  const MODEL = Object.freeze({
    exerciseName: EXERCISE_NAME,
    displayName: DISPLAY_NAME,
    phases: PHASES
  });

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const mix = (a, b, amount) => a + (b - a) * amount;
  const smooth = value => value * value * (3 - 2 * value);
  const normalizeName = value => String(value || "").trim().toLocaleLowerCase("pl-PL");

  function has(name) {
    const normalized = normalizeName(name);
    return normalized === normalizeName(EXERCISE_NAME) || normalized === normalizeName(DISPLAY_NAME);
  }

  function get(name) {
    return has(name) ? MODEL : null;
  }

  function motionState(position) {
    const value = clamp(Number(position) || 0, 0, PHASES.length - 1);
    const fromIndex = Math.floor(value);
    const toIndex = Math.min(PHASES.length - 1, fromIndex + 1);
    const amount = smooth(value - fromIndex);
    const from = PHASES[fromIndex];
    const to = PHASES[toIndex];
    return {
      phaseIndex: Math.round(value),
      barY: mix(from.barY, to.barY, amount),
      elbowX: mix(from.elbowX, to.elbowX, amount),
      elbowY: mix(from.elbowY, to.elbowY, amount)
    };
  }

  function project(point, viewAngle, width, height) {
    const cosYaw = Math.cos(viewAngle);
    const sinYaw = Math.sin(viewAngle);
    const x = point[0] * cosYaw - point[2] * sinYaw;
    const zYaw = point[0] * sinYaw + point[2] * cosYaw;
    const pitch = -0.52;
    const cosPitch = Math.cos(pitch);
    const sinPitch = Math.sin(pitch);
    const y = point[1] * cosPitch - zYaw * sinPitch;
    const depth = point[1] * sinPitch + zYaw * cosPitch;
    const scale = (width * 0.78) / (5.7 - depth);
    return {
      x: width * 0.5 + x * scale,
      y: height * 0.68 - y * scale,
      depth,
      scale
    };
  }

  function polygon(ctx, points, fill, stroke) {
    if (!points.length) return;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let index = 1; index < points.length; index += 1) ctx.lineTo(points[index].x, points[index].y);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = Math.max(1, points[0].scale * 0.012);
      ctx.stroke();
    }
  }

  function capsule(ctx, start, end, radius, colors) {
    const averageScale = (start.scale + end.scale) / 2;
    const gradient = ctx.createLinearGradient(start.x, start.y, end.x, end.y);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(0.5, colors[1]);
    gradient.addColorStop(1, colors[2]);
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineWidth = Math.max(3, radius * averageScale * 2);
    ctx.strokeStyle = gradient;
    ctx.shadowColor = "rgba(0,0,0,.32)";
    ctx.shadowBlur = Math.max(2, averageScale * 0.035);
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    ctx.lineWidth = Math.max(1, radius * averageScale * 0.35);
    ctx.strokeStyle = "rgba(255,255,255,.22)";
    ctx.beginPath();
    ctx.moveTo(start.x - 1, start.y - 1);
    ctx.lineTo(end.x - 1, end.y - 1);
    ctx.stroke();
    ctx.restore();
  }

  function joint(ctx, point, radius, fill) {
    ctx.save();
    const size = Math.max(2, radius * point.scale);
    const gradient = ctx.createRadialGradient(point.x - size * 0.35, point.y - size * 0.35, size * 0.12, point.x, point.y, size);
    gradient.addColorStop(0, "#ffe0ce");
    gradient.addColorStop(0.55, fill);
    gradient.addColorStop(1, "#945a46");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function renderScene(canvas, position, viewAngle) {
    const ctx = canvas && canvas.getContext ? canvas.getContext("2d") : null;
    if (!ctx) return false;
    const width = canvas.width;
    const height = canvas.height;
    const state = motionState(position);
    const p = point => project(point, viewAngle, width, height);
    ctx.clearRect(0, 0, width, height);

    const background = ctx.createLinearGradient(0, 0, width, height);
    background.addColorStop(0, "#14251c");
    background.addColorStop(0.58, "#09130f");
    background.addColorStop(1, "#07100c");
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.strokeStyle = "rgba(117,190,145,.12)";
    ctx.lineWidth = Math.max(1, width / 760);
    for (let z = -2; z <= 2.4; z += 0.45) {
      const left = p([-2.2, -0.32, z]);
      const right = p([2.2, -0.32, z]);
      ctx.beginPath();
      ctx.moveTo(left.x, left.y);
      ctx.lineTo(right.x, right.y);
      ctx.stroke();
    }
    for (let x = -2; x <= 2; x += 0.5) {
      const near = p([x, -0.32, 2.3]);
      const far = p([x, -0.32, -2]);
      ctx.beginPath();
      ctx.moveTo(near.x, near.y);
      ctx.lineTo(far.x, far.y);
      ctx.stroke();
    }
    ctx.restore();

    const benchTop = [
      p([-0.54, 0.03, -1.5]),
      p([0.54, 0.03, -1.5]),
      p([0.54, 0.03, 0.88]),
      p([-0.54, 0.03, 0.88])
    ];
    polygon(ctx, benchTop, "#2b3b34", "#557164");
    const benchSide = [
      p([-0.54, 0.03, -1.5]),
      p([-0.54, -0.16, -1.5]),
      p([-0.54, -0.16, 0.88]),
      p([-0.54, 0.03, 0.88])
    ];
    polygon(ctx, benchSide, "#16241e", "#3e584c");
    for (const z of [-1.12, 0.56]) {
      capsule(ctx, p([-0.42, -0.10, z]), p([-0.42, -0.58, z]), 0.055, ["#64746d", "#303d37", "#17211d"]);
      capsule(ctx, p([0.42, -0.10, z]), p([0.42, -0.58, z]), 0.055, ["#64746d", "#303d37", "#17211d"]);
    }

    const joints = {
      head: [0, 0.24, -1.30],
      neck: [0, 0.25, -1.04],
      shoulderL: [-0.39, 0.27, -0.66],
      shoulderR: [0.39, 0.27, -0.66],
      elbowL: [-state.elbowX, state.elbowY, -0.56],
      elbowR: [state.elbowX, state.elbowY, -0.56],
      handL: [-0.79, state.barY, -0.56],
      handR: [0.79, state.barY, -0.56],
      hipL: [-0.23, 0.16, 0.38],
      hipR: [0.23, 0.16, 0.38],
      kneeL: [-0.44, 0.43, 1.12],
      kneeR: [0.44, 0.43, 1.12],
      ankleL: [-0.49, -0.22, 1.70],
      ankleR: [0.49, -0.22, 1.70],
      footL: [-0.58, -0.28, 1.91],
      footR: [0.58, -0.28, 1.91]
    };
    const projected = {};
    Object.keys(joints).forEach(key => { projected[key] = p(joints[key]); });

    const limbs = [
      ["hipL", "kneeL", 0.15, ["#244b3a", "#17382b", "#0d241a"]],
      ["hipR", "kneeR", 0.15, ["#2b5945", "#1a4030", "#0f281d"]],
      ["kneeL", "ankleL", 0.115, ["#d59775", "#b86f54", "#764735"]],
      ["kneeR", "ankleR", 0.115, ["#e2a182", "#c27b60", "#80503d"]],
      ["ankleL", "footL", 0.09, ["#2d3331", "#171d1b", "#0c100f"]],
      ["ankleR", "footR", 0.09, ["#3c4441", "#202724", "#0f1412"]],
      ["shoulderL", "elbowL", 0.115, ["#efb18f", "#ce8365", "#8e513d"]],
      ["shoulderR", "elbowR", 0.115, ["#f4b999", "#d68b6d", "#945642"]],
      ["elbowL", "handL", 0.095, ["#efb18f", "#ce8365", "#8e513d"]],
      ["elbowR", "handR", 0.095, ["#f4b999", "#d68b6d", "#945642"]]
    ].sort((left, right) => {
      const leftDepth = (projected[left[0]].depth + projected[left[1]].depth) / 2;
      const rightDepth = (projected[right[0]].depth + projected[right[1]].depth) / 2;
      return leftDepth - rightDepth;
    });
    limbs.forEach(item => capsule(ctx, projected[item[0]], projected[item[1]], item[2], item[3]));

    const torso = [
      p([-0.40, 0.19, -0.72]),
      p([0.40, 0.19, -0.72]),
      p([0.28, 0.13, 0.38]),
      p([-0.28, 0.13, 0.38])
    ];
    const torsoGradient = ctx.createLinearGradient(torso[0].x, torso[0].y, torso[2].x, torso[2].y);
    torsoGradient.addColorStop(0, "#315f49");
    torsoGradient.addColorStop(0.48, "#1f4936");
    torsoGradient.addColorStop(1, "#102b20");
    polygon(ctx, torso, torsoGradient, "#6b9b83");

    const chest = p([0, 0.22, -0.48]);
    ctx.save();
    ctx.translate(chest.x, chest.y);
    ctx.rotate(-viewAngle * 0.22);
    ctx.fillStyle = "rgba(232,92,78,.46)";
    ctx.shadowColor = "rgba(241,109,91,.52)";
    ctx.shadowBlur = Math.max(5, chest.scale * 0.08);
    ctx.beginPath();
    ctx.ellipse(0, 0, chest.scale * 0.33, chest.scale * 0.13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    capsule(ctx, projected.neck, projected.head, 0.09, ["#f5b999", "#d88d70", "#955844"]);
    joint(ctx, projected.head, 0.18, "#d68c6d");
    const face = p([0.04, 0.26, -1.45]);
    ctx.fillStyle = "#f7d0bb";
    ctx.beginPath();
    ctx.arc(face.x, face.y, Math.max(1.4, face.scale * 0.022), 0, Math.PI * 2);
    ctx.fill();

    Object.keys(projected).filter(key => /elbow|hand|knee/.test(key)).forEach(key => joint(ctx, projected[key], /hand/.test(key) ? 0.07 : 0.08, "#cb8063"));

    const barLeft = p([-1.39, state.barY, -0.56]);
    const barRight = p([1.39, state.barY, -0.56]);
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineWidth = Math.max(3, (barLeft.scale + barRight.scale) * 0.018);
    const steel = ctx.createLinearGradient(barLeft.x, barLeft.y, barRight.x, barRight.y);
    steel.addColorStop(0, "#879692");
    steel.addColorStop(0.35, "#eef6f3");
    steel.addColorStop(0.65, "#8fa09b");
    steel.addColorStop(1, "#eef6f3");
    ctx.strokeStyle = steel;
    ctx.shadowColor = "rgba(0,0,0,.45)";
    ctx.shadowBlur = Math.max(2, barLeft.scale * 0.04);
    ctx.beginPath();
    ctx.moveTo(barLeft.x, barLeft.y);
    ctx.lineTo(barRight.x, barRight.y);
    ctx.stroke();
    ctx.restore();
    for (const x of [-1.21, -1.12, 1.12, 1.21]) {
      const plate = p([x, state.barY, -0.56]);
      ctx.save();
      ctx.fillStyle = Math.abs(x) > 1.15 ? "#26342e" : "#3d5148";
      ctx.strokeStyle = "#758b81";
      ctx.lineWidth = Math.max(1, plate.scale * 0.012);
      ctx.beginPath();
      ctx.ellipse(plate.x, plate.y, Math.max(3, plate.scale * 0.055), Math.max(8, plate.scale * 0.16), -viewAngle * 0.34, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    const bottomBar = p([1.60, PHASES[2].barY, -0.56]);
    const topBar = p([1.60, PHASES[0].barY, -0.56]);
    ctx.save();
    ctx.strokeStyle = "rgba(82,229,138,.82)";
    ctx.fillStyle = "rgba(82,229,138,.92)";
    ctx.lineWidth = Math.max(2, width / 360);
    ctx.setLineDash([7 * width / 760, 6 * width / 760]);
    ctx.beginPath();
    ctx.moveTo(bottomBar.x, bottomBar.y);
    ctx.lineTo(topBar.x, topBar.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(topBar.x, topBar.y);
    ctx.lineTo(topBar.x - 6 * width / 760, topBar.y + 12 * width / 760);
    ctx.lineTo(topBar.x + 6 * width / 760, topBar.y + 12 * width / 760);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    const active = PHASES[clamp(state.phaseIndex, 0, PHASES.length - 1)];
    ctx.save();
    ctx.fillStyle = "rgba(238,246,240,.94)";
    ctx.font = "700 " + Math.max(11, width * 0.021) + "px system-ui, sans-serif";
    ctx.fillText(active.label.toUpperCase() + " / 4", width * 0.035, height * 0.09);
    ctx.fillStyle = "rgba(159,180,168,.96)";
    ctx.font = "500 " + Math.max(9, width * 0.015) + "px system-ui, sans-serif";
    ctx.fillText(active.title, width * 0.035, height * 0.14);
    ctx.restore();
    return true;
  }

  function mount(root, name) {
    if (!root || !has(name)) return () => {};
    const doc = root.ownerDocument;
    const view = doc.defaultView || window;
    root.className = "fitplan-motion";
    root.innerHTML = "";

    const header = doc.createElement("header");
    header.className = "fitplan-motion-head";
    header.innerHTML = '<span class="fitplan-motion-badge">Model dostępny dla 1 ćwiczenia</span><h4>Animowany model 3D techniki</h4><p>Barbell Bench Press — widok instruktażowy pokazuje pełny tor sztangi i ustawienie kończyn w czterech fazach.</p>';

    const stage = doc.createElement("div");
    stage.className = "fitplan-motion-stage";
    const canvas = doc.createElement("canvas");
    canvas.width = 760;
    canvas.height = 430;
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", "Animowany trójwymiarowy model postaci wykonującej wyciskanie sztangi na ławce płaskiej");
    stage.appendChild(canvas);

    const controls = doc.createElement("div");
    controls.className = "fitplan-motion-controls";
    const play = doc.createElement("button");
    play.type = "button";
    play.className = "fitplan-motion-play";
    const rotateLeft = doc.createElement("button");
    rotateLeft.type = "button";
    rotateLeft.className = "fitplan-motion-view";
    rotateLeft.textContent = "↶ Widok";
    rotateLeft.setAttribute("aria-label", "Obróć model w lewo");
    const rotateRight = doc.createElement("button");
    rotateRight.type = "button";
    rotateRight.className = "fitplan-motion-view";
    rotateRight.textContent = "Widok ↷";
    rotateRight.setAttribute("aria-label", "Obróć model w prawo");
    const rangeLabel = doc.createElement("label");
    rangeLabel.className = "fitplan-motion-range";
    rangeLabel.append("Przebieg ruchu");
    const range = doc.createElement("input");
    range.type = "range";
    range.min = "0";
    range.max = String(PHASES.length - 1);
    range.step = "0.01";
    range.value = "0";
    range.setAttribute("aria-label", "Wybierz moment wykonywania ćwiczenia");
    rangeLabel.appendChild(range);
    const output = doc.createElement("output");
    output.className = "fitplan-motion-output";
    output.setAttribute("aria-live", "polite");
    controls.append(play, rangeLabel, output, rotateLeft, rotateRight);

    const phaseButtons = doc.createElement("div");
    phaseButtons.className = "fitplan-motion-phase-buttons";
    phaseButtons.setAttribute("role", "group");
    phaseButtons.setAttribute("aria-label", "Wybierz dokładną fazę ćwiczenia");
    const cue = doc.createElement("p");
    cue.className = "fitplan-motion-cue";
    cue.setAttribute("aria-live", "polite");

    const phaseGrid = doc.createElement("div");
    phaseGrid.className = "fitplan-motion-phase-grid";
    const phaseButtonNodes = [];
    const phaseCardNodes = [];
    const thumbnailCanvases = [];

    PHASES.forEach((phase, index) => {
      const button = doc.createElement("button");
      button.type = "button";
      button.className = "fitplan-motion-phase-button";
      button.textContent = phase.label;
      button.dataset.motionPhase = String(index);
      phaseButtons.appendChild(button);
      phaseButtonNodes.push(button);

      const card = doc.createElement("button");
      card.type = "button";
      card.className = "fitplan-motion-phase-card";
      card.dataset.motionPhase = String(index);
      card.setAttribute("aria-label", phase.label + ": " + phase.title + ". " + phase.cue);
      const thumbnail = doc.createElement("canvas");
      thumbnail.width = 300;
      thumbnail.height = 176;
      thumbnail.setAttribute("aria-hidden", "true");
      const copy = doc.createElement("span");
      copy.innerHTML = "<strong>" + phase.label + "</strong><span>" + phase.title + "</span><small>" + phase.cue + "</small>";
      card.append(thumbnail, copy);
      phaseGrid.appendChild(card);
      phaseCardNodes.push(card);
      thumbnailCanvases.push(thumbnail);
    });

    const safety = doc.createElement("p");
    safety.className = "fitplan-motion-safety";
    safety.textContent = "Model ma charakter instruktażowy. Dobierz obciążenie do kontroli ruchu; ból barku, łokcia lub klatki jest sygnałem do przerwania ćwiczenia i konsultacji ze specjalistą.";

    root.append(header, stage, controls, phaseButtons, cue, phaseGrid, safety);

    let value = 0;
    let viewAngle = 0.48;
    let playing = false;
    let animationId = 0;
    let animationOrigin = 0;
    const canDraw = renderScene(canvas, value, viewAngle);
    thumbnailCanvases.forEach((item, index) => {
      if (!renderScene(item, index, 0.48)) item.hidden = true;
    });
    if (!canDraw) {
      canvas.hidden = true;
      const unavailable = doc.createElement("p");
      unavailable.className = "fitplan-motion-unavailable";
      unavailable.textContent = "Podgląd graficzny wymaga obsługi Canvas. Opisy i wybór faz pozostają dostępne.";
      stage.appendChild(unavailable);
    }

    function update(nextValue, syncRange) {
      value = clamp(Number(nextValue) || 0, 0, PHASES.length - 1);
      const phaseIndex = clamp(Math.round(value), 0, PHASES.length - 1);
      const phase = PHASES[phaseIndex];
      if (syncRange !== false) range.value = String(value);
      output.value = phase.label + " — " + phase.title;
      output.textContent = output.value;
      cue.textContent = phase.cue;
      phaseButtonNodes.forEach((button, index) => button.setAttribute("aria-pressed", String(index === phaseIndex)));
      phaseCardNodes.forEach((card, index) => {
        if (index === phaseIndex) card.setAttribute("aria-current", "step");
        else card.removeAttribute("aria-current");
      });
      if (canDraw) renderScene(canvas, value, viewAngle);
    }

    function renderPlayState() {
      play.textContent = playing ? "⏸ Pauza" : "▶ Odtwórz";
      play.setAttribute("aria-pressed", String(playing));
    }

    function stopAnimation() {
      playing = false;
      if (animationId && view.cancelAnimationFrame) view.cancelAnimationFrame(animationId);
      animationId = 0;
      renderPlayState();
    }

    function tick(time) {
      if (!playing) return;
      if (!animationOrigin) animationOrigin = time - value * 1150;
      const elapsed = Math.max(0, time - animationOrigin);
      update((elapsed / 1150) % (PHASES.length - 1), true);
      animationId = view.requestAnimationFrame(tick);
    }

    function setPlaying(next) {
      if (!canDraw || !view.requestAnimationFrame) {
        stopAnimation();
        return;
      }
      playing = Boolean(next);
      if (playing) {
        animationOrigin = 0;
        animationId = view.requestAnimationFrame(tick);
      } else {
        stopAnimation();
      }
      renderPlayState();
    }

    play.addEventListener("click", () => setPlaying(!playing));
    range.addEventListener("input", () => {
      stopAnimation();
      update(range.value, false);
    });
    [...phaseButtonNodes, ...phaseCardNodes].forEach(button => {
      button.addEventListener("click", () => {
        stopAnimation();
        update(Number(button.dataset.motionPhase), true);
      });
    });
    rotateLeft.addEventListener("click", () => {
      viewAngle = clamp(viewAngle - 0.18, -0.80, 0.80);
      if (canDraw) renderScene(canvas, value, viewAngle);
    });
    rotateRight.addEventListener("click", () => {
      viewAngle = clamp(viewAngle + 0.18, -0.80, 0.80);
      if (canDraw) renderScene(canvas, value, viewAngle);
    });

    update(0, true);
    renderPlayState();
    const reduceMotion = view.matchMedia && view.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (canDraw && !reduceMotion) setPlaying(true);

    return () => {
      stopAnimation();
      root.replaceChildren();
    };
  }

  Object.defineProperty(window, "FitPlanExerciseMotion", {
    value: Object.freeze({ exerciseName: EXERCISE_NAME, displayName: DISPLAY_NAME, phases: PHASES, has, get, mount, renderScene })
  });
})();
