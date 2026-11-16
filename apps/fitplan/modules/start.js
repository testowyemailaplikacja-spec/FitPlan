(() => {
"use strict";
const frame = document.getElementById("appFrame");
if (!frame) return;
const SETTINGS_KEY = "fitplan.start.settings.v1";
const PLAN_KEY = "fitplan.start.exercises.v1";
const TIMER_OPTIONS_KEY = "fitplan.start.timer-options.v1";
const DEFAULTS = Object.freeze({ work: 180, rest: 30, rounds: 3, mode: "same", custom: [] });
const LEVELS = {poczatkujacy:"Początkujący",sredniozaawansowany:"Średniozaawansowany",zaawansowany:"Zaawansowany",zawodowiec:"Zawodowiec"};
const TYPES = {kettlebell:"Kettlebell",crossfit:"CrossFit",kalistenika:"Kalistenika",split:"Split",fbw:"FBW","push-pull":"Push–pull","sztuki-walki":"Sztuki walki","100-pompek":"100 pompek i więcej",rozciaganie:"Rozciąganie",joga:"Joga",brzuch:"Brzuch"};
let mountedDocument = null, cleanup = null, pendingSession = null;

function timeText(seconds) {
  const n = Math.max(0, Math.ceil(seconds));
  return String(Math.floor(n / 60)).padStart(2, "0") + ":" + String(n % 60).padStart(2, "0");
}
function readTime(text, maximum, zeroAllowed) {
  const raw = String(text).trim();
  // Plain numbers mean minutes: "1" = 01:00; "1:30" still means 90 seconds.
  const match = /^(\d{1,3})$/.test(raw) ? [raw, raw, "00"] : /^(\d{1,3}):([0-5]\d)$/.exec(raw);
  if (!match) throw new Error("Podaj minuty (np. 1) albo czas mm:ss (np. 01:30).");
  const seconds = Number(match[1]) * 60 + Number(match[2]);
  if (seconds > maximum || (!zeroAllowed && seconds === 0)) throw new Error("Czas ćwiczenia musi mieścić się w zakresie 00:01–60:00, a przerwy 00:00–30:00.");
  return seconds;
}
function validSeconds(n, max, zero = false) {
  return Number.isInteger(n) && n >= (zero ? 0 : 1) && n <= max;
}
function normalized(raw) {
  if (!raw || typeof raw !== "object") return { ...DEFAULTS, custom: [] };
  const rounds = Number(raw.rounds);
  if (!Number.isInteger(rounds) || rounds < 1 || rounds > 30 ||
      !validSeconds(raw.work, 3600) || !validSeconds(raw.rest, 1800, true) ||
      !["same", "custom"].includes(raw.mode)) return { ...DEFAULTS, custom: [] };
  const custom = Array.from({ length: rounds }, (_, i) => {
    const item = Array.isArray(raw.custom) ? raw.custom[i] : null;
    return {
      work: validSeconds(item?.work, 3600) ? item.work : raw.work,
      rest: validSeconds(item?.rest, 1800, true) ? item.rest : raw.rest
    };
  });
  return { work: raw.work, rest: raw.rest, rounds, mode: raw.mode, custom };
}
function schedule(settings, exercises = []) {
  const config = normalized(settings), queue = exercises.length ? exercises : [null], phases = [];
  for (let round = 0; round < config.rounds; round++) {
    const rule = config.mode === "custom" ? config.custom[round] : config;
    for (let index = 0; index < queue.length; index++) {
      phases.push({ type: "work", round: round + 1, rounds: config.rounds, exercise: queue[index], seconds: rule.work, exerciseNumber: index + 1, exerciseCount: queue.length });
      const last = round === config.rounds - 1 && index === queue.length - 1;
      if (!last && rule.rest > 0) phases.push({ type: "rest", round: round + 1, rounds: config.rounds, exercise: null, seconds: rule.rest, exerciseNumber: index + 1, exerciseCount: queue.length });
    }
  }
  return phases;
}
function totalText(seconds) {
  if (seconds >= 3600) return Math.floor(seconds/3600) + " godz. " + Math.floor(seconds%3600/60) + " min";
  return Math.floor(seconds/60) + " min " + seconds%60 + " s";
}
function readStorage(w, key, fallback) {
  try {
    const item = w.localStorage.getItem(key);
    return item === null ? fallback : JSON.parse(item);
  } catch { return fallback; }
}
function saveStorage(w, key, value) {
  try { w.localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch { return false; }
}
function mount(w, host, isCurrent) {
  const doc = w.document, catalog = Array.from(w.FitPlanExerciseRegistry?.items || w.FitPlanExerciseCatalog?.items || []);
  if (!catalog.length) throw new Error("Brak katalogu ćwiczeń FitPlan.");
  const kettlebell = Array.from(w.FitPlanKettlebellCatalog?.items || []);
  const byId = new Map([...catalog, ...kettlebell].map(item => [item.id, item]));
  const el = id => host.querySelector("#" + id);
  const panels = Array.from(host.querySelectorAll("[data-fps-panel]"));
  const tabs = Array.from(host.querySelectorAll("[data-fps-tab]"));
  const form = el("fpsConfigForm");
  if (!form || !el("fpsRemaining")) throw new Error("Niekompletny widok Start.");
  let settings = normalized(readStorage(w, SETTINGS_KEY, DEFAULTS));
  let plan = readStorage(w, PLAN_KEY, []);
  if (!Array.isArray(plan)) plan = [];
  plan = plan.filter(id => byId.has(id)).slice(0, 20);
  let random = [];

  function showTab(id, focus = false) {
    for (const panel of panels) panel.hidden = panel.dataset.fpsPanel !== id;
    for (const tab of tabs) {
      const active = tab.dataset.fpsTab === id;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
      if (active && focus) tab.focus();
    }
    if (id === "plan") showSelectedPlan();
    if (id === "timer") paint();
  }
  host.querySelector(".fps-tabs").addEventListener("click", event => {
    const button = event.target.closest("[data-fps-tab]");
    if (button && tabs.includes(button)) showTab(button.dataset.fpsTab);
  });
  host.querySelector(".fps-tabs").addEventListener("keydown", event => {
    const index = tabs.indexOf(doc.activeElement);
    if (index < 0 || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    showTab(tabs[next].dataset.fpsTab, true);
  });

  const get = name => form.elements.namedItem(name);
  function draftSettings() {
    const work = readTime(get("work").value, 3600, false);
    const rest = readTime(get("rest").value, 1800, true);
    const rounds = Number(get("rounds").value);
    if (!Number.isInteger(rounds) || rounds < 1 || rounds > 30) throw new Error("Liczba rund musi wynosić od 1 do 30.");
    const mode = get("mode").value;
    const custom = Array.from(el("fpsCustomRows").querySelectorAll("[data-fps-round]"), row => mode === "custom" ? ({
      work: readTime(row.querySelector("[data-fps-work]").value, 3600, false),
      rest: readTime(row.querySelector("[data-fps-rest]").value, 1800, true)
    }) : ({ work, rest }));
    return normalized({work,rest,rounds,mode,custom});
  }
  function customRows() {
    const count = Number(get("rounds").value), container = el("fpsCustomRows");
    if (!Number.isInteger(count) || count < 1 || count > 30) return;
    const old = Array.from(container.querySelectorAll("[data-fps-round]"), row => ({
      work: row.querySelector("[data-fps-work]").value,
      rest: row.querySelector("[data-fps-rest]").value
    }));
    container.replaceChildren();
    for (let i = 0; i < count; i++) {
      const row = doc.createElement("div"); row.className = "fps-custom-row"; row.dataset.fpsRound = String(i);
      const label = doc.createElement("strong"); label.textContent = "Runda " + (i + 1);
      const work = doc.createElement("label"); work.textContent = "Ćwiczenie (mm:ss)";
      const workInput = doc.createElement("input");workInput.type = "text";workInput.inputMode = "numeric";workInput.dataset.fpsWork = "";
      workInput.setAttribute("aria-label", "Czas ćwiczenia rundy " + (i + 1));
      workInput.value = old[i]?.work || timeText(settings.custom[i]?.work ?? settings.work);
      const rest = doc.createElement("label"); rest.textContent = "Przerwa (mm:ss)";
      const restInput = doc.createElement("input");restInput.type = "text";restInput.inputMode = "numeric";restInput.dataset.fpsRest = "";
      restInput.setAttribute("aria-label", "Czas przerwy rundy " + (i + 1));
      restInput.value = old[i]?.rest || timeText(settings.custom[i]?.rest ?? settings.rest);
      work.append(workInput); rest.append(restInput);row.append(label,work,rest);container.append(row);
    }
  }
  function preview() {
    try {
      const config = draftSettings(), phases = schedule(config);
      el("fpsPreview").textContent = config.rounds + " rund · " + totalText(phases.reduce((sum, phase) => sum + phase.seconds, 0)) + " łącznie (bez dodatkowych ćwiczeń)";
      el("fpsConfigFeedback").textContent = "";
    } catch (error) {
      el("fpsPreview").textContent = error.message;
    }
  }
  function populateForm() {
    get("work").value = timeText(settings.work);
    get("rest").value = timeText(settings.rest);
    get("rounds").value = settings.rounds;
    get("mode").value = settings.mode;
    el("fpsCustom").hidden = settings.mode !== "custom";
    el("fpsCustomRows").replaceChildren();
    customRows(); preview();
  }
  // Format plain minute entries only after editing, never while the user is typing.
  form.addEventListener("focusout", event => {
    const input=event.target;
    if (!input?.matches?.('input[name="work"],input[name="rest"],[data-fps-work],[data-fps-rest]')) return;
    const maximum=input.name==="rest"||input.hasAttribute("data-fps-rest")?1800:3600;
    try { input.value=timeText(readTime(input.value,maximum,maximum===1800)); } catch {}
    preview();
  });
  form.addEventListener("change", event => {
    if (event.target.name === "rounds") customRows();
    if (event.target.name === "mode") el("fpsCustom").hidden = get("mode").value !== "custom";
    preview();
  });
  form.addEventListener("input", event => {
    if (event.target.name === "rounds") customRows();
    preview();
  });
  el("fpsShortenRest").addEventListener("click", () => {
    const base = readTime(get("rest").value, 1800, true);
    get("mode").value = "custom";
    el("fpsCustom").hidden = false;
    customRows();
    el("fpsCustomRows").querySelectorAll("[data-fps-round]").forEach((row, i) => {
      row.querySelector("[data-fps-rest]").value = timeText(Math.max(0, base - i*10));
    });
    preview();
  });
  form.addEventListener("submit", event => {
    event.preventDefault();
    try {
      const next = draftSettings();
      if (!saveStorage(w, SETTINGS_KEY, next)) throw new Error("Nie można zapisać ustawień na tym urządzeniu.");
      settings = next;
      el("fpsConfigFeedback").textContent = "Ustawienia zapisane. Trwająca sesja zachowa wcześniejsze czasy.";
      if (timer.status === "idle" || timer.status === "done") prepare(timer.exerciseIds, timer.name);
      summary();
    } catch (error) {
      el("fpsConfigFeedback").textContent = error.message;
    }
  });

  function showSelectedPlan() {
    let type = "", level = "";
    try { type = w.localStorage.getItem("fitplan.plan.selected.v1") || ""; if (TYPES[type]) level = w.localStorage.getItem("fitplan." + type + ".level.v1") || ""; } catch {}
    el("fpsSelectedPlan").textContent = TYPES[type] ? "Wybrana ścieżka: " + TYPES[type] + (LEVELS[level] ? " · " + LEVELS[level] : "") + ". Kolejność ćwiczeń poniżej ustawiasz samodzielnie." : "Nie wybrano jeszcze rodzaju planu. Możesz ułożyć własny zestaw poniżej.";
  }
  // WIEDORA-CHANGE: WD-20261031-WIE-110-STARTER-PLANS-01 | TASK: WIE-110 | AUTHOR: ChatGPT / GPT-6
  // Use the existing editable local list and interval engine; never create a
  // second catalog, overwrite a running session silently or touch backend data.
  let loadedPresetName = "";
  // WIEDORA-CHANGE: WD-20261031-WIE-117-TRAINING-HISTORY-03 | TASK: WIE-117 | AUTHOR: ChatGPT / GPT-6
  const progress = w.FitPlanTrainingProgress;
  // WIEDORA-CHANGE: WD-20261031-WIE-115-PLANNING-BASE-01 | TASK: WIE-115 | AUTHOR: ChatGPT / GPT-6
  const planner = w.FitPlanTrainingPlanner;
  // WIEDORA-CHANGE: WD-20261031-WIE-185-SETS-ENGINE-07 | TASK: WIE-185 | AUTHOR: ChatGPT / GPT-6
  const setEngine = w.FitPlanTrainingSets;
  let savedThisTimerRun = false, savedEntryId = null;
  function currentSetSession(){
    if (!timer.pilotIdentity)return null;
    return {...timer.pilotIdentity,ids:[...timer.exerciseIds]};
  }
  function renderSets(){
    const session=currentSetSession(), select=el("fpsSetExercise"), ul=el("fpsSetList");
    const previous=select.value;
    select.replaceChildren();ul.replaceChildren();
    if(session)for(const id of session.ids){
      const option=doc.createElement("option");
      option.value=id;option.textContent=byId.get(id)?.displayName||id;select.append(option);
    }
    if(session?.ids.includes(previous))select.value=previous;
    const available=!!session&&!!setEngine;
    select.disabled=!available;
    el("fpsAddSet").disabled=!available||savedThisTimerRun;
    el("fpsUndoSet").disabled=true;
    el("fpsUseLastSet").disabled=true;
    el("fpsClearSetDraft").disabled=!setEngine||savedThisTimerRun;
    if(!available){
      el("fpsLastSet").textContent="Rejestr serii działa dla niezmienionych jednostek gotowych programów.";
      return;
    }
    try{
      const sets=setEngine.snapshot(w.localStorage,session);
      for(const row of sets){
        const li=doc.createElement("li");
        const name=byId.get(row.exerciseId)?.displayName||row.exerciseId;
        li.textContent=name+" · seria "+row.number+" · "+row.reps+" powt. · "+row.weightKg+
          " kg"+(row.rpe===null?"":" · RPE "+row.rpe)+(row.rir===null?"":" · RIR "+row.rir);
        ul.append(li);
      }
      el("fpsUndoSet").disabled=!sets.length||savedThisTimerRun;
      const history=progress?.read(w.localStorage)||[];
      const last=setEngine.last(history,select.value);
      const trend=planner?.trend(history,select.value);
      el("fpsUseLastSet").disabled=!last;
      el("fpsLastSet").textContent=last
        ? "Ostatni zapis w historii: "+last.reps+" powt. · "+last.weightKg+" kg"+
          (last.rpe===null?"":" · RPE "+last.rpe)+(last.rir===null?"":" · RIR "+last.rir)+
          (trend?" · Zmiana względem poprzedniego treningu: "+
            (trend.deltaReps>=0?"+":"")+trend.deltaReps+" powt., "+
            (trend.deltaKg>=0?"+":"")+trend.deltaKg+" kg.":"")
        : "Brak ostatniego wyniku tego ćwiczenia. Możesz podać rzeczywistą serię.";
      el("fpsSetFeedback").textContent=savedThisTimerRun
        ? "Ten ukończony trening jest zapisany. Aby skorygować jego serie, cofnij ostatni zapis w zakładce Plan."
        : sets.length
          ? "Szkic zawiera "+sets.length+" rzeczywiście wpisanych serii. Zostaną dołączone do treningu dopiero po potwierdzeniu ukończenia."
          : "Brak serii w szkicu. Możesz korzystać z timera bez ich wpisywania.";
    }catch(error){
      el("fpsAddSet").disabled=true;
      el("fpsLastSet").textContent="Nie można odczytać historii lub szkicu.";
      el("fpsSetFeedback").textContent=error.message;
    }
  }
  el("fpsSetExercise").addEventListener("change",renderSets);
  // Only prefills editable fields, never silently logs a previous set.
  el("fpsUseLastSet").addEventListener("click",()=>{
    if(!setEngine)return;
    try{
      const last=setEngine.last(progress.read(w.localStorage),el("fpsSetExercise").value);
      if(!last)return;
      el("fpsSetReps").value=String(last.reps);
      el("fpsSetWeight").value=String(last.weightKg);
      el("fpsSetRpe").value=last.rpe===null?"":String(last.rpe);
      el("fpsSetRir").value=last.rir===null?"":String(last.rir);
      el("fpsSetFeedback").textContent="Uzupełniono formularz ostatnim wynikiem. Zapisz serię dopiero po rzeczywistym wykonaniu.";
    }catch(error){el("fpsSetFeedback").textContent=error.message;}
  });
  el("fpsAddSet").addEventListener("click",()=>{
    const session=currentSetSession();
    if(!session||!setEngine||savedThisTimerRun)return;
    try{
      const row=setEngine.append(w.localStorage,session,{
        exerciseId:el("fpsSetExercise").value,reps:el("fpsSetReps").value,
        weightKg:el("fpsSetWeight").value,rpe:el("fpsSetRpe").value,
        rir:el("fpsSetRir").value
      });
      renderSets();
      el("fpsSetReps").value="";
      el("fpsSetFeedback").textContent="Zapisano rzeczywistą serię "+row.number+" w szkicu tego treningu.";
    }catch(error){el("fpsSetFeedback").textContent=error.message;}
  });
  el("fpsUndoSet").addEventListener("click",()=>{
    const session=currentSetSession();
    if(!session||!setEngine||!w.confirm("Cofnąć ostatnią wpisaną serię?"))return;
    try{setEngine.undo(w.localStorage,session);renderSets();}
    catch(error){el("fpsSetFeedback").textContent=error.message;}
  });
  el("fpsClearSetDraft").addEventListener("click",()=>{
    if(!setEngine||!w.confirm("Usunąć WSZYSTKIE niezapisane serie ze szkicu urządzenia?"))return;
    try{setEngine.clear(w.localStorage);renderSets();}
    catch(error){el("fpsSetFeedback").textContent=error.message;}
  });
  function identifyPreset(ids) {
    if (!presetCatalog?.programs || !Array.isArray(ids) || !ids.length) return null;
    for (const program of presetCatalog.programs) for (const day of program.days) {
      try {
        const session = presetCatalog.prepare(program.id, day.id, w.FitPlanExerciseRegistry);
        if (presetCatalog.compatible?.(program.id,day.id,ids,w.FitPlanExerciseRegistry) || (session.ids.length === ids.length && session.ids.every((id,i) => id === ids[i])))
          return {programId:program.id,dayId:day.id};
      } catch {}
    }
    return null;
  }
  function historyFor(programId) {
    if (!progress) throw Error("Moduł dziennika jest niedostępny.");
    return progress.read(w.localStorage).filter(entry => entry.programId === programId);
  }
  function displayPilotHistory() {
    const node = el("fpsPresetHistory");
    const undo = el("fpsUndoPreset");
    undo.disabled = true;
    if (!progress || !presetCatalog?.programs?.length) {
      node.textContent = "Dziennik pilota jest niedostępny. Wciąż możesz korzystać ze stopera.";
      return;
    }
    try {
      const program = presetCatalog.programs.find(item=>item.id===programSelect.value);
      if (!program) {node.textContent="Wybierz program.";return;}
      const all = historyFor(program.id);
      const nextId = progress.nextDay(program.id, all, presetCatalog.programs);
      const next = program.days.find(d=>d.id===nextId);
      const last = all.at(-1);
      const date = last ? new Date(last.finishedAt).toLocaleDateString("pl-PL") : "";
      undo.disabled = all.length === 0;
      const cycles = progress.completedCycles?.(program.id,all,presetCatalog.programs) || 0;
      node.textContent = all.length
        ? "Wykonano: "+all.length+" sesji tego programu (pełne sekwencje A/B: "+cycles+"). Ostatnia: "+date+
          (last.rpe===null?"":" · RPE "+last.rpe)+
          ". Sugerowana kolejna jednostka: "+next.title+"."
        : "Brak zapisanych sesji tego programu. Zacznij od dnia A. Dane zostają na tym urządzeniu.";
    } catch(error) {
      node.textContent = error.message;
    }
  }
  const presetCatalog = w.FitPlanTrainingPresets;
  const programSelect = el("fpsPresetProgram"), daySelect = el("fpsPresetDay");
  const presetFeedback = el("fpsPresetFeedback"), presetDetails = el("fpsPresetDetails");
  // WIEDORA-CHANGE: WD-20261031-WIE-110-FITPLAN-COMPETITOR-REVIEW-02 | TASK: WIE-110 | AUTHOR: ChatGPT / GPT-6
  function paintQuickPresets(){
    const current=programSelect.value;
    host.querySelectorAll("[data-fps-preset-quick]").forEach(btn=>{
      btn.setAttribute("aria-pressed",String(btn.dataset.fpsPresetQuick===current));
    });
  }
  const quick=el("fpsQuickPrograms");
  quick?.addEventListener("click",event=>{
    const button=event.target.closest("[data-fps-preset-quick]");
    if(!button||!quick.contains(button)||!presetCatalog?.programs.some(x=>x.id===button.dataset.fpsPresetQuick))return;
    programSelect.value=button.dataset.fpsPresetQuick;
    renderPresetDays();
    presetFeedback.textContent="Wybrano "+programSelect.selectedOptions[0].textContent+". Sprawdź dzień i wczytaj plan.";
  });
  el("fpsPresetPreview")?.addEventListener("click",event=>{
    const btn=event.target.closest("[data-fps-preview-detail]");
    if(!btn)return;
    try{
      if(w.FitPlanExerciseDetails?.open(btn.dataset.fpsPreviewDetail)!==true)
        presetFeedback.textContent="Opis techniki niedostępny. Możesz nadal wczytać plan.";
    }catch{presetFeedback.textContent="Nie udało się otworzyć opisu ćwiczenia.";}
  });
  function previewSelectedPreset(){
    const program=presetCatalog?.programs?.find(x=>x.id===programSelect.value);
    const day=program?.days.find(x=>x.id===daySelect.value);
    const list=el("fpsPresetPreview"),duration=el("fpsPresetDuration");
    list.replaceChildren();
    if(!day){duration.textContent="Wybierz jednostkę, aby zobaczyć ćwiczenia.";return;}
    // The last exercise does not have a trailing rest; this is the same
    // scheduling convention used in the existing Start stopwatch.
    const count=day.names.length,sets=count*day.settings.rounds;
    const seconds=sets*day.settings.work+Math.max(0,sets-1)*day.settings.rest;
    duration.textContent=day.settings.rounds+" rundy · "+count+" ćwiczeń · praca "+day.settings.work+
      " s · przerwa "+day.settings.rest+" s · ok. "+Math.ceil(seconds/60)+" min. Czas nie zastępuje rzeczywistych powtórzeń.";
    const guides=presetCatalog?.guidance?.(program.id,day.id,w.FitPlanExerciseRegistry)||[];
    // Read only previously confirmed sets; never manufacture or pre-approve a result.
    let confirmed=[];
    try{confirmed=progress?.read(w.localStorage)||[];}catch{ /* history error is shown in the pilot status */ }
    for(const [index,name] of day.names.entries()) {
      const li=doc.createElement("li");li.className="fps-guide-row";
      const count=doc.createElement("span");count.className="fps-guide-number";count.textContent=String(index+1).padStart(2,"0");
      const copy=doc.createElement("div");copy.className="fps-guide-copy";
      const heading=doc.createElement("strong");heading.textContent=guides[index]?.name||name;
      const tag=doc.createElement("small");tag.textContent=guides[index]?.group||"Ćwiczenie";
      const dose=doc.createElement("span");dose.className="fps-guide-dose";
      dose.textContent=guides[index]?guides[index].sets+" serie · "+guides[index].target:"Czas według stopera";
      const rest=doc.createElement("small");rest.className="fps-guide-rest";
      rest.textContent=guides[index]?.restHint?"Przerwa: "+guides[index].restHint:"";
      copy.append(heading,tag,dose,rest);
      const previous=guides[index]?.id&&setEngine?.last(confirmed,guides[index].id);
      if(previous){
        const last=doc.createElement("small");last.className="fps-guide-previous";
        last.textContent="Ostatnio zapisano: "+previous.reps+" powt. · "+previous.weightKg+" kg";
        copy.append(last);
      }
      li.append(count,copy);
      if(guides[index]?.id){
        const detail=doc.createElement("button");detail.className="action-button fps-guide-detail";
        detail.type="button";detail.dataset.fpsPreviewDetail=guides[index].id;detail.textContent="Technika";
        detail.setAttribute("aria-label","Zobacz technikę: "+heading.textContent);
        li.append(detail);
      }
      list.append(li);
    }
  }
  function renderPlanningPreview(){
    const holder=el("fpsTrainingCalendar"),details=el("fpsTrainingRecovery");
    holder.replaceChildren();
    const program=presetCatalog?.programs?.find(item=>item.id===programSelect.value);
    if(!planner||!program){details.textContent="Harmonogram niedostępny, ale możesz uruchomić trening.";return;}
    try {
      const model=planner.overview(program,progress.read(w.localStorage),new w.Date(),4);
      const first=model.entries.slice(0,6);
      for(const item of first){
        const li=doc.createElement("li"),description=doc.createElement("span");
        description.textContent=item.date+" · "+item.title+
          (item.needs.length?" · Sprzęt: "+item.needs.join(", "):"");
        li.append(description);
        if(item.beforeRestInterval){
          const warning=doc.createElement("strong");warning.className="fps-plan-alert";
          warning.textContent="Sprawdź regenerację przed tym terminem";
          li.append(warning);
        }
        holder.append(li);
      }
      details.textContent=(model.completed?"Zapisano "+model.completed+" ukończonych sesji. ":"Nie zapisano jeszcze sesji. ")+
        "Proponowany odstęp między jednostkami: ok. "+model.gapHours+" godz. "+
        (model.restUntil?"Ostatnia sesja sugeruje odpoczynek do "+new w.Date(model.restUntil).toLocaleString("pl-PL")+". ":"")+
        "Poniżej pierwsze "+first.length+" terminów z czterech tygodni.";
    }catch(error){details.textContent=error.message;}
  }
  function renderPresetDays() {
    const program = presetCatalog?.programs?.find(item => item.id === programSelect.value);
    daySelect.replaceChildren();
    for (const day of program?.days || []) {
      const option = doc.createElement("option");
      option.value = day.id;
      option.textContent = day.title;
      daySelect.append(option);
    }
    presetDetails.textContent = program
      ? program.description + " · " + program.frequency + " · Sprzęt: " + program.equipment + "."
      : "Brak dostępnego programu.";
    if (program && progress) {
      try {daySelect.value = progress.nextDay(program.id, historyFor(program.id), presetCatalog.programs);}
      catch { /* keep day A; displayPilotHistory shows the storage error */ }
    }
    displayPilotHistory();
    paintQuickPresets();
    previewSelectedPreset();
    renderPlanningPreview();
  }
  if (presetCatalog?.programs?.length && typeof presetCatalog.prepare === "function") {
    for (const program of presetCatalog.programs) {
      const option = doc.createElement("option");
      option.value = program.id;
      option.textContent = program.title;
      programSelect.append(option);
    }
    programSelect.addEventListener("change", () => { renderPresetDays();presetFeedback.textContent = ""; });
    daySelect.addEventListener("change", () => { presetFeedback.textContent = "";previewSelectedPreset(); });
    // WIEDORA-CHANGE: WD-20261031-WIE-117-HISTORY-INTEGRITY-08 | TASK: WIE-117 | AUTHOR: ChatGPT / GPT-6
    // A user-initiated local backup; nothing is uploaded to the server.
    el("fpsExportTraining").addEventListener("click",()=>{
      try{
        const history=progress.read(w.localStorage),draft=setEngine?.read(w.localStorage)||null;
        if(!history.length&&!draft){presetFeedback.textContent="Brak danych do eksportu.";return;}
        if(!w.Blob||!w.URL?.createObjectURL)throw Error("Przeglądarka nie obsługuje eksportu plików.");
        const payload={format:"wiedora-fitplan-pilot-backup",version:1,
          exportedAt:new w.Date().toISOString(),history:{version:1,entries:history},setDraft:draft};
        const url=w.URL.createObjectURL(new w.Blob([JSON.stringify(payload,null,2)],{type:"application/json"}));
        try{
          const link=doc.createElement("a");
          link.href=url;link.download="wiedora-fitplan-pilot-"+payload.exportedAt.slice(0,10)+".json";
          doc.body.append(link);link.click();link.remove();
        }finally{w.setTimeout(()=>w.URL.revokeObjectURL(url),30000);}
        presetFeedback.textContent="Przygotowano prywatną kopię danych. Przechowuj ją bezpiecznie; automatyczny import wymaga jeszcze osobnych testów.";
      }catch(error){presetFeedback.textContent=error.message;}
    });
    el("fpsUndoPreset").addEventListener("click", () => {
      const chosen=programSelect.value;
      if (!progress?.undoLast || !w.confirm("Cofnąć ostatni zapis wykonanej jednostki w tym programie?"))return;
      try {
        const undone = progress.undoLast(w.localStorage,chosen);
        let recovery = "";
        if (undone.id === savedEntryId) {
          savedThisTimerRun = false;
          savedEntryId = null;
          if(undone.sets?.length&&setEngine)try{
            setEngine.restore(w.localStorage,currentSetSession(),undone.sets);
          }catch(error){recovery=" Uwaga: nie przywrócono szkicu serii ("+error.message+").";}
          renderSets();paint();
        }
        presetFeedback.textContent = "Cofnięto ostatni zapis wykonania tego programu."+recovery;
        renderPresetDays();
      } catch(error){ presetFeedback.textContent = error.message; }
    });
    // Preserve the chosen FBW environment when entering from Plan treningowy.
    let requestedFBW=null;
    try {
      requestedFBW=w.sessionStorage.getItem("fitplan.fbw.pending.v1");
      w.sessionStorage.removeItem("fitplan.fbw.pending.v1");
    } catch {}
    if(requestedFBW&&presetCatalog.programs.some(x=>x.id===requestedFBW))programSelect.value=requestedFBW;
    renderPresetDays();
    if(requestedFBW)showTab("plan");
    el("fpsLoadPreset").addEventListener("click", () => {
      let picked;
      try { picked = presetCatalog.prepare(programSelect.value, daySelect.value, w.FitPlanExerciseRegistry); }
      catch (error) { presetFeedback.textContent = error.message; return; }
      const hasSavedSettings = readStorage(w, SETTINGS_KEY, null) !== null;
      if ((plan.length || hasSavedSettings || ["running","countdown","paused"].includes(timer.status)) &&
          !w.confirm("Wczytać program i zastąpić obecny zestaw oraz ustawienia interwałów?")) return;
      const nextSettings = normalized(picked.settings);
      // LocalStorage has no multi-key transaction. Roll back both previous
      // values on failure; never update visible state before persistence works.
      let previous;
      try {
        previous = [w.localStorage.getItem(PLAN_KEY),w.localStorage.getItem(SETTINGS_KEY)];
        w.localStorage.setItem(PLAN_KEY,JSON.stringify(picked.ids));
        w.localStorage.setItem(SETTINGS_KEY,JSON.stringify(nextSettings));
      } catch {
        if (previous) for (const [i,key] of [PLAN_KEY,SETTINGS_KEY].entries()) {
          try { if (previous[i] === null) w.localStorage.removeItem(key);
                else w.localStorage.setItem(key,previous[i]); } catch {}
        }
        presetFeedback.textContent = "Nie udało się zapisać programu. Twój wcześniejszy zestaw pozostaje aktywny.";
        return;
      }
      plan = picked.ids;
      settings = nextSettings;
      loadedPresetName = picked.name;
      populateForm();
      renderPlan();
      prepare(plan,loadedPresetName);
      showSelectedPlan();
      presetFeedback.textContent = "Wczytano „" + picked.name + "”. Możesz edytować ćwiczenia albo uruchomić trening.";
      displayPilotHistory();
    });
  } else {
    el("fpsLoadPreset").disabled = true;
    presetFeedback.textContent = "Nie udało się wczytać katalogu programów testowych.";
  }
  const picker = el("fpsExerciseSelect"), search = el("fpsExerciseSearch");
  function populatePicker() {
    const query = search.value.trim().toLocaleLowerCase("pl-PL");
    const previous = picker.value;
    picker.replaceChildren();
    const matches = catalog.filter(item => !query || (item.displayName + " " + item.name + " " + item.categoryLabel).toLocaleLowerCase("pl-PL").includes(query));
    for (const item of matches) {
      const option = doc.createElement("option");option.value = item.id;option.textContent = item.displayName + " · " + item.categoryLabel;picker.append(option);
    }
    if (matches.some(item => item.id === previous)) picker.value = previous;
    el("fpsAddExercise").disabled = matches.length === 0;
  }
  search.addEventListener("input", populatePicker);
  function renderItems(list, mount, editable) {
    mount.replaceChildren();
    for (let index = 0; index < list.length; index++) {
      const item = byId.get(list[index]); if (!item) continue;
      const li = doc.createElement("li"), copy = doc.createElement("span");copy.className = "fps-item-copy";
      const name = doc.createElement("strong");name.textContent = (index+1) + ". " + item.displayName;
      const detail = doc.createElement("small");detail.textContent = item.categoryLabel;
      copy.append(name,detail);li.append(copy);
      if (editable) {
        const actions = doc.createElement("span");actions.className = "fps-item-actions";
        for (const [action, text, disabled] of [["up","↑",index===0],["down","↓",index===list.length-1],["swap","Zamień",false],["remove","×",false]]) {
          const button = doc.createElement("button");button.type = "button";button.className = "action-button";
          button.textContent = text;button.dataset.fpsAction = action;button.dataset.index = String(index);button.disabled = disabled;
          button.setAttribute("aria-label", (action === "up" ? "Przenieś w górę: " : action === "down" ? "Przenieś w dół: " : action === "swap" ? "Zamień ćwiczenie: " : "Usuń: ") + item.displayName);
          actions.append(button);
        } li.append(actions);
      }
      mount.append(li);
    }
  }
  function renderPlan() {
    renderItems(plan, el("fpsPlanList"), true);
    el("fpsLaunchPlan").disabled = !plan.length;
    el("fpsPlanFeedback").textContent = plan.length ? plan.length + " ćwiczeń w Twoim planie. Ustawione rundy powtarzają cały zestaw." : "Dodaj co najmniej jedno ćwiczenie.";
  }
  function persistPlan() {
    loadedPresetName = "";
    const saved = saveStorage(w, PLAN_KEY, plan);
    renderPlan();
    if (!saved) el("fpsPlanFeedback").textContent = "Nie można zapisać planu na tym urządzeniu.";
  }
  el("fpsAddExercise").addEventListener("click", () => {
    if (!byId.has(picker.value) || plan.length >= 20) {
      el("fpsPlanFeedback").textContent = "Możesz dodać maksymalnie 20 ćwiczeń.";return;
    }
    plan.push(picker.value);persistPlan();
  });
  el("fpsPlanList").addEventListener("click", event => {
    const button = event.target.closest("[data-fps-action]");
    if (!button) return;
    const i = Number(button.dataset.index), action = button.dataset.fpsAction;
    if (!Number.isInteger(i) || i < 0 || i >= plan.length) return;
    // WIE-110: replace only this entry; keep the rest and the confirmed history.
    if(action==="swap"){
      const row=button.closest("li");
      const existing=row?.querySelector(".fps-swap-inline");
      if(existing){existing.remove();return;}
      const matched=identifyPreset(plan);
      const environment=matched?.programId==="fbw-home"?"home":matched?.programId==="fbw-gym"?"gym":"all";
      const candidates=presetCatalog?.alternatives?.(plan[i],w.FitPlanExerciseRegistry,{environment,exclude:plan})||[];
      if(!candidates.length){el("fpsPlanFeedback").textContent="Brak zweryfikowanego zamiennika o podobnym wzorcu ruchu. Wybierz ręcznie inne ćwiczenie, jeśli znasz jego technikę.";return;}
      const wrapper=doc.createElement("div");wrapper.className="fps-swap-inline";
      wrapper.setAttribute("role","group");wrapper.setAttribute("aria-label","Zamiana ćwiczenia "+(byId.get(plan[i])?.displayName||""));
      const intro=doc.createElement("p");intro.className="fps-swap-intro";
      intro.textContent="Ta sama grupa ruchu: "+candidates[0].reason+". Wybierz wariant pasujący do sprzętu i umiejętności.";
      const filterLabel=doc.createElement("label");filterLabel.textContent="Dlaczego zamieniasz?";
      const filter=doc.createElement("select");filter.className="fps-swap-preference";
      for(const [value,title] of [["all","Chcę innego wariantu"],["bodyweight","Nie mam sprzętu"],["basic","Potrzebuję podstawowego wariantu"]]){
        const o=doc.createElement("option");o.value=value;o.textContent=title;filter.append(o);
      }
      filterLabel.append(filter);
      const label=doc.createElement("label");label.textContent="Ćwiczenie zastępcze";
      const select=doc.createElement("select");select.className="fps-swap-choice";
      select.setAttribute("aria-label","Alternatywa dla "+(byId.get(plan[i])?.displayName||"ćwiczenia"));
      label.append(select);
      const info=doc.createElement("p");info.className="fps-swap-note";info.setAttribute("role","status");
      const apply=doc.createElement("button");apply.type="button";apply.className="action-button primary";
      apply.dataset.fpsAction="apply-swap";apply.dataset.index=String(i);apply.textContent="Zapisz zmianę";
      const cancel=doc.createElement("button");cancel.type="button";cancel.className="action-button";
      cancel.dataset.fpsAction="cancel-swap";cancel.dataset.index=String(i);cancel.textContent="Anuluj";
      const refresh=()=>{
        const choices=presetCatalog.alternatives(plan[i],w.FitPlanExerciseRegistry,{environment,exclude:plan,preference:filter.value});
        const current=select.value;select.replaceChildren();
        for(const item of choices){const opt=doc.createElement("option");opt.value=item.id;opt.textContent=item.name;select.append(opt);}
        if(choices.some(x=>x.id===current))select.value=current;
        apply.disabled=!choices.length;
        info.textContent=choices.length?choices.length+" pasujących wariantów. Przy bólu lub urazie nie dobieraj zamiennika automatycznie.":"Brak pasującego wariantu. Zmień powód lub wybierz ćwiczenie ręcznie.";
      };
      filter.addEventListener("change",refresh);
      wrapper.append(intro,filterLabel,label,info,apply,cancel);
      row.append(wrapper);refresh();select.focus();
      return;
    }
    if(action==="cancel-swap"){button.closest(".fps-swap-inline")?.remove();return;}
    if(action==="apply-swap"){
      const editor=button.closest(".fps-swap-inline");
      const choice=editor?.querySelector(".fps-swap-choice")?.value;
      const preference=editor?.querySelector(".fps-swap-preference")?.value||"all";
      const matched=identifyPreset(plan),environment=matched?.programId==="fbw-home"?"home":matched?.programId==="fbw-gym"?"gym":"all";
      const candidates=presetCatalog?.alternatives?.(plan[i],w.FitPlanExerciseRegistry,{environment,exclude:plan,preference})||[];
      if(!candidates.some(x=>x.id===choice)){el("fpsPlanFeedback").textContent="Zamiennik nie jest już dostępny. Nie zmieniono planu.";return;}
      const next=plan.slice();next[i]=choice;
      if(!saveStorage(w,PLAN_KEY,next)){el("fpsPlanFeedback").textContent="Brak miejsca na zapis. Zachowano poprzedni plan.";return;}
      plan=next;renderPlan();
      el("fpsPlanFeedback").textContent="Zamieniono tylko jedno ćwiczenie na "+(byId.get(choice)?.displayName||"wybrane")+". Pozostałe ćwiczenia i zapisane treningi są bez zmian.";
      return;
    }
    if (action === "remove") plan.splice(i, 1);
    else if (action === "up" && i>0) [plan[i-1],plan[i]] = [plan[i],plan[i-1]];
    else if (action === "down" && i<plan.length-1) [plan[i+1],plan[i]] = [plan[i],plan[i+1]];
    persistPlan();
  });
  const sportLinks = el("fpsRandomSportLinks");
  if(sportLinks){
    for(const [id,label] of Object.entries(TYPES)){
      if(id==="kettlebell")continue;
      const button=doc.createElement("button");button.type="button";button.className="action-button";
      button.textContent=label;button.dataset.fpsSport=id;sportLinks.append(button);
    }
    sportLinks.addEventListener("click",event=>{
      const button=event.target.closest("[data-fps-sport]");
      if(!button||!sportLinks.contains(button))return;
      const open=w.FitPlanWorkoutPlan?.openSport;
      if(typeof open==="function")open(button.dataset.fpsSport);
      else el("fpsRandomFeedback").textContent="Nie można otworzyć tego treningu.";
    });
  }
  el("fpsOpenKettlebell").addEventListener("click", () => {
    const route = w.FitPlanWorkoutPlan?.openKettlebell;
    if (typeof route === "function") route();
    else el("fpsRandomFeedback").textContent = "Nie można otworzyć wyboru kettlebell. Spróbuj ponownie.";
  });
  const randomCategory = el("fpsRandomCategory");
  const categories = Array.from(new Set(catalog.filter(item=>item.category!=="extended").map(item => item.category))).sort((a,b) => String(a).localeCompare(String(b), "pl"));
  for (const key of categories) {
    const item = catalog.find(x => x.category === key), option = doc.createElement("option");
    option.value = key; option.textContent = item.categoryLabel;randomCategory.append(option);
  }
  randomCategory.addEventListener("change", () => {
    random = [];renderItems(random,el("fpsRandomList"),false);
    el("fpsLaunchRandom").disabled = true;el("fpsRandomFeedback").textContent = "Wylosuj nowy zestaw dla wybranej partii.";
  });
  el("fpsRandomCount").addEventListener("change", () => {
    random = [];renderItems(random,el("fpsRandomList"),false);
    el("fpsLaunchRandom").disabled = true;
  });
  el("fpsGenerateRandom").addEventListener("click", () => {
    // Advanced technical and acrobatic skills must be chosen via their sport and level pathway.
    const candidates = catalog.filter(item => item.category!=="extended" && (!randomCategory.value || item.category === randomCategory.value));
    const count = Math.min(Number(el("fpsRandomCount").value), candidates.length);
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random()*(i+1));
      [candidates[i],candidates[j]] = [candidates[j],candidates[i]];
    }
    random = candidates.slice(0,count).map(item => item.id);
    renderItems(random,el("fpsRandomList"),false);
    el("fpsLaunchRandom").disabled = !random.length;
    el("fpsRandomFeedback").textContent = random.length + " wylosowanych ćwiczeń, bez powtórzeń w zestawie.";
  });

  function needsTechnicalReview(ids){
    return ids.some(id=>{
      const item=byId.get(id);
      return item?.category==="extended" && (item.minLevel>=3||/somersault|handspring|aerial|kick/i.test(item.displayName));
    });
  }
  const timer = {status:"idle", pausedFrom:"running", phases:[], index:0, remaining:0, deadline:0, ticker:null, exerciseIds:[], name:"Trening czasowy", message:"Ustaw czas i naciśnij Start."};
  let disposed = false, wakeLock = null, wakeRequest = 0, audio = null, soundPlayer = null, soundUrl = null, lastCue = "", unlockTimer = null;
  const oscillators = new Set();
  const storedOptions = readStorage(w, TIMER_OPTIONS_KEY, {});
  const options = Object.fromEntries(["keepAwake","sound","vibration"].map(key => [key, typeof storedOptions?.[key] === "boolean" ? storedOptions[key] : true]));
  const active = () => ["running","countdown"].includes(timer.status);
  const unlockPanel = el("fpsTouchLock"), unlockButton = el("fpsUnlock");
  const inertBeforeLock = new Map();
  const initialWall = w.Date.now(), initialMono = w.performance?.now?.() || 0;
  function releaseWake() {
    const current = wakeLock; wakeLock = null;
    if (current) Promise.resolve(current.release()).catch(() => {});
  }
  async function syncWake() {
    const request = ++wakeRequest;
    if (disposed || !active() || !options.keepAwake || doc.hidden) {
      releaseWake();
      if (!disposed) el("fpsWakeStatus").textContent = options.keepAwake ? "Ochrona ekranu włącza się po rozpoczęciu treningu." : "Automatyczne wygaszanie ekranu jest dozwolone.";
      return;
    }
    if (!w.navigator.wakeLock?.request) {
      el("fpsWakeStatus").textContent = "Ta przeglądarka nie obsługuje ochrony przed wygaszaniem ekranu."; return;
    }
    if (wakeLock && !wakeLock.released) return;
    try {
      const granted = await w.navigator.wakeLock.request("screen");
      if (disposed || request !== wakeRequest || !active() || !options.keepAwake || doc.hidden) { await granted.release(); return; }
      wakeLock = granted;
      granted.addEventListener("release", () => {
        if (wakeLock !== granted) return;
        wakeLock = null;
        if (!disposed) el("fpsWakeStatus").textContent = "System zwolnił ochronę ekranu. Po powrocie do strony spróbujemy ją włączyć ponownie.";
      }, { once: true });
      el("fpsWakeStatus").textContent = "Ekran pozostaje włączony podczas treningu.";
    } catch {
      if (!disposed && request === wakeRequest) el("fpsWakeStatus").textContent = "System nie pozwolił utrzymać ekranu włączonego. Sprawdź ustawienia oszczędzania energii.";
    }
  }
  function stopAudio() {
    for (const oscillator of oscillators) { try { oscillator.stop(); oscillator.disconnect(); } catch {} }
    oscillators.clear();
    try { soundPlayer?.pause(); } catch {}
  }
  // A compact, original WAV cue provides an HTMLAudio fallback for browsers
  // without usable Web Audio, including some mobile Safari configurations.
  function fallbackPlayer() {
    if (soundPlayer) return soundPlayer;
    try {
      if (!w.Audio || !w.Blob || !w.URL?.createObjectURL) return null;
      const rate=22050, count=Math.round(rate*.21), bytes=new Uint8Array(44+count*2), view=new DataView(bytes.buffer);
      const write=(offset,text)=>{for(let i=0;i<text.length;i++)bytes[offset+i]=text.charCodeAt(i);};
      write(0,"RIFF");view.setUint32(4,36+count*2,true);write(8,"WAVE");write(12,"fmt ");
      view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);
      view.setUint32(24,rate,true);view.setUint32(28,rate*2,true);view.setUint16(32,2,true);view.setUint16(34,16,true);
      write(36,"data");view.setUint32(40,count*2,true);
      for(let i=0;i<count;i++){
        const fade=Math.min(1,i/(rate*.015),(count-i)/(rate*.035));
        const tone=Math.sin(2*Math.PI*940*i/rate)*.72+Math.sin(2*Math.PI*1175*i/rate)*.22;
        view.setInt16(44+i*2,Math.round(29000*fade*tone),true);
      }
      soundUrl=w.URL.createObjectURL(new w.Blob([bytes],{type:"audio/wav"}));
      soundPlayer=new w.Audio(soundUrl);soundPlayer.preload="auto";
      return soundPlayer;
    }catch{return null;}
  }
  function playFallback(kind) {
    const player=fallbackPlayer();
    if(!player)return;
    try {
      player.pause();player.currentTime=0;
      player.playbackRate=kind==="end"?.85:kind==="start"?1.18:1;
      const played=player.play();played?.catch?.(()=>{});
    }catch{}
  }
  function armAudio() {
    if (!options.sound) return;
    try {
      const Audio = w.AudioContext || w.webkitAudioContext;
      if (!audio && Audio) audio = new Audio();
      if (audio?.state === "suspended") Promise.resolve(audio.resume()).catch(() => {});
    } catch { audio = null; }
  }
  function cue(kind) {
    if (disposed) return;
    const finish = kind === "end";
    if (options.vibration && typeof w.navigator.vibrate === "function") {
      try { w.navigator.vibrate(finish ? [180,80,180] : kind === "start" ? 120 : 45); } catch {}
    }
    if (!options.sound) return;
    if (!audio || audio.state !== "running") {playFallback(kind);return;}
    try {
      const oscillator = audio.createOscillator(), gain = audio.createGain(), now = audio.currentTime;
      oscillator.frequency.value = finish ? 1250 : kind === "start" ? 1050 : 800;
      oscillator.connect(gain); gain.connect(audio.destination);
      gain.gain.setValueAtTime(.16, now);
      gain.gain.exponentialRampToValueAtTime(.001, now + (finish ? .32 : .09));
      oscillator.onended = () => { oscillators.delete(oscillator); oscillator.disconnect(); gain.disconnect(); };
      oscillators.add(oscillator); oscillator.start(); oscillator.stop(now + (finish ? .35 : .12));
    } catch {playFallback(kind);}
  }
  for (const [key, id] of [["keepAwake","fpsKeepAwake"],["sound","fpsSound"],["vibration","fpsVibration"]]) {
    el(id).checked = options[key];
    el(id).addEventListener("change", () => {
      options[key] = el(id).checked; saveStorage(w, TIMER_OPTIONS_KEY, options);
      if (key === "keepAwake") syncWake();
      if (key === "sound") { if (options.sound) armAudio(); else stopAudio(); }
      if (key === "vibration" && !options.vibration) { try { w.navigator.vibrate?.(0); } catch {} }
    });
  }
  el("fpsTestSound")?.addEventListener("click",()=>{armAudio();cue("test");el("fpsTimerStatus").textContent="Odtworzono test sygnału (jeśli przeglądarka zezwala na dźwięk).";});
  function cancelUnlock() { if (unlockTimer !== null) w.clearTimeout(unlockTimer); unlockTimer = null; }
  function lockTouch(locked) {
    cancelUnlock(); unlockPanel.hidden = !locked;
    for (const root of [doc,frame.ownerDocument]) root.documentElement?.toggleAttribute("data-portal-touch-lock-active",locked);
    if (locked) {
      const nodes = [...(unlockPanel.parentElement?.children || []),...(frame.ownerDocument.body?.children || [])];
      for (const child of nodes) if (child !== unlockPanel && child !== frame && !child.contains(unlockPanel) && !child.contains(frame)) {
        if (!inertBeforeLock.has(child)) inertBeforeLock.set(child,child.inert === true);
        child.inert = true;
      }
    } else {
      for (const [child,previous] of inertBeforeLock) child.inert = previous;
      inertBeforeLock.clear();
    }
    if (locked) { paint(); unlockButton.focus(); }
    else if (!disposed) el("fpsTimerLock").focus();
  }
  function beginUnlock(event) {
    if (event.type === "keydown" && (!["Enter"," "].includes(event.key) || event.repeat)) return;
    event.preventDefault(); cancelUnlock(); unlockTimer = w.setTimeout(() => lockTouch(false), 1000);
  }
  el("fpsTimerLock").addEventListener("click", () => lockTouch(true));
  for (const name of ["pointerdown","keydown"]) unlockButton.addEventListener(name, beginUnlock);
  for (const name of ["pointerup","pointercancel","pointerleave","keyup","blur"]) unlockButton.addEventListener(name, cancelUnlock);
  unlockButton.addEventListener("contextmenu", event => event.preventDefault());
  function lockKey(event) {
    if (unlockPanel.hidden) return;
    if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); lockTouch(false); }
    else if (event.key === "Tab") { event.preventDefault(); unlockButton.focus(); }
  }
  doc.addEventListener("keydown", lockKey, true);
  const watch = host.querySelector(".fps-watch"), ticks = el("fpsWatchTicks");
  for (let n = 0; n < 60; n++) {
    const tick = doc.createElement("span");
    tick.className = "fps-watch-tick" + (n % 5 === 0 ? " fps-watch-major" : "");
    tick.style.setProperty("--fps-tick-angle", String(n * 6) + "deg");
    ticks.append(tick);
  }
  function clock() { return Math.max((w.performance?.now?.() || 0) - initialMono, w.Date.now() - initialWall); }
  function clearTicker() { if (timer.ticker !== null) w.clearInterval(timer.ticker);timer.ticker = null; }
  function summary() {
    const phases = schedule(settings, timer.exerciseIds.map(id => byId.get(id)?.displayName).filter(Boolean));
    el("fpsTimerSummary").textContent = "Ćwiczenie: " + timeText(settings.work) + " · przerwa: " + timeText(settings.rest) + " · rundy: " + settings.rounds +
      (settings.mode === "custom" ? " · indywidualne czasy" : "") + " · czas całego zestawu: " + totalText(phases.reduce((sum, phase) => sum + phase.seconds, 0)) + ".";
  }
  function prepare(exerciseIds = [], name = "Trening czasowy") {
    savedThisTimerRun = false;
    savedEntryId = null;
    el("fpsCompleteFeedback").textContent = "";
    clearTicker();
    timer.exerciseIds = exerciseIds.filter(id => byId.has(id));
    // WIEDORA-CHANGE: WD-20261031-WIE-117-TRAINING-HISTORY-03 | TASK: WIE-117 | AUTHOR: ChatGPT / GPT-6
    timer.pilotIdentity = identifyPreset(timer.exerciseIds); // resolved once, not at each timer tick
    timer.name = name;
    timer.phases = schedule(settings, timer.exerciseIds.map(id => byId.get(id).displayName));
    timer.index = 0;timer.remaining = timer.phases[0].seconds * 1000;
    timer.status = "idle";timer.message = needsTechnicalReview(timer.exerciseIds)
      ? "Uwaga: zaawansowana technika. Domyślny interwał 3:00 nie oznacza zalecanego czasu figury. Dostosuj czas i ćwicz z asekuracją / trenerem."
      : "Ustaw czas i naciśnij Start.";
    lastCue = ""; syncWake(); summary();renderSets();paint();
  }
  function advance(now) {
    if (timer.status === "countdown") {
      if (now < timer.deadline) { timer.remaining = timer.deadline - now; return; }
      timer.status = "running";
      timer.deadline += timer.phases[timer.index].seconds * 1000;
      timer.message = "Trening rozpoczęty.";
      if (now - (timer.deadline - timer.phases[timer.index].seconds * 1000) < 1000) cue("start");
    }
    if (timer.status !== "running") return;
    while (timer.status === "running" && now >= timer.deadline) {
      const excess = now - timer.deadline;
      if (excess < 1000) cue("end");
      timer.index++;
      if (timer.index >= timer.phases.length) {
        timer.status = "done";timer.remaining = 0;timer.message = "Trening zakończony!";clearTicker();syncWake();break;
      }
      timer.deadline = now - excess + timer.phases[timer.index].seconds * 1000;
      const phase = timer.phases[timer.index];
      timer.message = phase.type === "rest" ? "Przerwa. Przygotuj się do kolejnego ćwiczenia." : "Ćwicz: " + (phase.exercise || "runda " + phase.round) + ".";
    }
    if (timer.status === "running") timer.remaining = Math.max(0, timer.deadline - now);
  }
  let previousAnnouncement = "";
  function paint() {
    if (!isCurrent()) return;
    advance(clock());
    const phase = timer.phases[timer.index] || timer.phases.at(-1);
    const done = timer.status === "done";
    const countdown = timer.status === "countdown" || (timer.status === "paused" && timer.pausedFrom === "countdown");
    const seconds = Math.ceil(timer.remaining / 1000);
    const cueKey = timer.status + ":" + timer.index + ":" + seconds;
    if (active() && seconds >= 1 && seconds <= 3 && cueKey !== lastCue) cue("tick");
    lastCue = cueKey;
    const elapsed = phase && !countdown ? (phase.seconds * 1000 - timer.remaining) / 1000 : 0;
    const fraction = phase?.seconds ? Math.min(1,Math.max(0,elapsed / phase.seconds)) : 0;
    const handAngle = ((Math.max(0,elapsed) % 60) / 60) * 360;
    el("fpsRemaining").textContent = done ? "00:00" : countdown ? String(seconds) : timeText(seconds);
    el("fpsPhase").textContent = done ? "KONIEC" : timer.status === "paused" ? "PAUZA" : countdown ? "ODLICZANIE" : phase?.type === "rest" ? "PRZERWA" : timer.status === "running" ? "TRENING" : "GOTOWY";
    el("fpsLockedTime").textContent = el("fpsRemaining").textContent;
    el("fpsLockedPhase").textContent = el("fpsPhase").textContent;
    el("fpsRound").textContent = phase ? "Runda " + phase.round + " / " + phase.rounds + (phase.exercise && !done ? " · " + phase.exerciseNumber + "/" + phase.exerciseCount : "") : "";
    watch.style.setProperty("--fps-hand-angle", handAngle.toFixed(2) + "deg");
    watch.style.setProperty("--fps-progress-angle", (fraction * 360).toFixed(2) + "deg");
    watch.dataset.phase = phase?.type || "work";
    watch.dataset.state = timer.status;
    el("fpsSessionName").textContent = timer.name + (phase?.exercise && !done ? " · " + phase.exercise : "");
    el("fpsTimerStart").textContent = timer.status === "paused" ? "Wznów" : timer.status === "done" ? "Od nowa" : "Start";
    el("fpsTimerStart").disabled = ["running","countdown"].includes(timer.status);
    el("fpsTimerPause").disabled = !["running","countdown"].includes(timer.status);
    el("fpsTimerSkip").disabled = countdown || !["running","paused"].includes(timer.status);
    el("fpsCompletePreset").disabled = !done || savedThisTimerRun || !timer.pilotIdentity || !progress;
    if (previousAnnouncement !== timer.message) {
      previousAnnouncement = timer.message;
      el("fpsTimerStatus").textContent = timer.message;
    }
  }
  function run() {
    if (["running","countdown"].includes(timer.status)) return;
    if (timer.status === "done") prepare(timer.exerciseIds, timer.name);
    const resume = timer.status === "paused";
    timer.status = resume ? timer.pausedFrom : "countdown";
    if (!resume) timer.remaining = 3000;
    timer.deadline = clock() + timer.remaining;
    timer.message = timer.status === "countdown" ? "Przygotuj się. Start za 3, 2, 1." : "Trening wznowiony.";
    armAudio();
    if(!resume)cue("start"); // start directly from the user gesture, unlocking mobile audio.
    syncWake();
    clearTicker();timer.ticker = w.setInterval(paint, 125);paint();
  }
  function pause() {
    if (!["running","countdown"].includes(timer.status)) return;
    advance(clock());
    if (!["running","countdown"].includes(timer.status)) { paint();return; }
    timer.remaining = Math.max(0, timer.deadline-clock());
    timer.pausedFrom = timer.status;
    timer.status = "paused";timer.message = "Stoper zatrzymany. Możesz wznowić.";
    clearTicker();syncWake();paint();
  }
  function skip() {
    if (!["running","paused"].includes(timer.status) || (timer.status === "paused" && timer.pausedFrom === "countdown")) return;
    const wasRunning = timer.status === "running";
    timer.index++;
    if (timer.index >= timer.phases.length) {
      timer.index = timer.phases.length - 1;timer.status = "done";timer.remaining = 0;
      timer.message = "Trening zakończony!";clearTicker();syncWake();
    } else {
      timer.remaining = timer.phases[timer.index].seconds * 1000;
      if (wasRunning) timer.deadline = clock()+timer.remaining;
      const phase = timer.phases[timer.index];
      timer.message = phase.type === "rest" ? "Przerwa." : "Kolejne ćwiczenie: " + (phase.exercise || "runda " + phase.round) + ".";
    }
    paint();
  }
  // A timer ending never logs repetitions or proves exercise completion.
  // Users explicitly confirm the physical session before writing local history.
  el("fpsCompletePreset").addEventListener("click", () => {
    if (timer.status !== "done" || savedThisTimerRun || !progress) return;
    const current = timer.pilotIdentity;
    if (!current) {
      el("fpsCompleteFeedback").textContent = "Zestaw nie jest niezmienioną jednostką gotowego programu.";
      return;
    }
    if (!w.confirm("Czy rzeczywiście ukończono wskazaną jednostkę treningową?")) return;
    try {
      const session=currentSetSession();
      const rows=setEngine?.snapshot(w.localStorage,session)||[];
      const saved = progress.record(w.localStorage,{
        ...current,exerciseIds:timer.exerciseIds,rpe:el("fpsPilotRpe").value,
        sets:rows
      },presetCatalog,w.FitPlanExerciseRegistry,w.Date);
      savedThisTimerRun = true;
      savedEntryId = saved.id;
      el("fpsPilotRpe").value = "";
      let warning="";
      if(setEngine)try{setEngine.clear(w.localStorage);}
      catch(error){warning=" Uwaga: szkic nadal jest na urządzeniu ("+error.message+").";}
      el("fpsCompleteFeedback").textContent = "Zapisano ukończoną sesję ("+rows.length+" rzeczywiście wpisanych serii)."+warning;
      renderPresetDays();renderSets();paint();
    } catch(error) {
      el("fpsCompleteFeedback").textContent = error.message;
    }
  });
  el("fpsTimerStart").addEventListener("click", run);
  el("fpsTimerPause").addEventListener("click", pause);
  el("fpsTimerSkip").addEventListener("click", skip);
  el("fpsTimerReset").addEventListener("click", () => prepare(timer.exerciseIds, timer.name));
  el("fpsEditSettings").addEventListener("click", () => showTab("config", true));
  el("fpsLaunchPlan").addEventListener("click", () => {
    if (!plan.length) {el("fpsPlanFeedback").textContent = "Najpierw dodaj ćwiczenia.";return;}
    if (["running","countdown","paused"].includes(timer.status) && !w.confirm("Zastąpić trwającą sesję treningową?")) return;
    prepare(plan, loadedPresetName || "Trening według planu");showTab("timer",true);if(!needsTechnicalReview(plan))run();
  });
  el("fpsLaunchRandom").addEventListener("click", () => {
    if (!random.length) return;
    if (["running","countdown","paused"].includes(timer.status) && !w.confirm("Zastąpić trwającą sesję treningową?")) return;
    prepare(random, "Randomowy trening");showTab("timer",true);run();
  });
  function visibilityUpdate() { cancelUnlock(); if (!doc.hidden) paint(); syncWake(); }
  doc.addEventListener("visibilitychange", visibilityUpdate);
  populateForm();populatePicker();renderPlan();showSelectedPlan();prepare();
  const incoming = w.FitPlanStartBridge?.consume?.();
  if (incoming && Array.isArray(incoming.ids)) {
    const valid = incoming.ids.filter(id => byId.has(id)).slice(0,20);
    if (valid.length) {
      prepare(valid, incoming.name || "Trening kettlebell");
      showTab("timer",true);
    }
  }
  return () => {
    disposed = true; ++wakeRequest; clearTicker(); cancelUnlock(); releaseWake(); stopAudio();
    if (audio) Promise.resolve(audio.close()).catch(() => {});
    if(soundUrl)try{w.URL.revokeObjectURL(soundUrl);}catch{}
    soundPlayer=null;soundUrl=null;
    lockTouch(false);
    doc.removeEventListener("keydown", lockKey, true);
    doc.removeEventListener("visibilitychange", visibilityUpdate);
  };
}
function install() {
  const w = frame.contentWindow,registry = w?.FitPlanModules,doc = frame.contentDocument;
  if (!registry || !doc || mountedDocument === doc || registry.get("start")) return;
  mountedDocument = doc;
  if (!w.FitPlanStartBridge) Object.defineProperty(w,"FitPlanStartBridge",{
    value:Object.freeze({
      launch(ids,name) {
        if (!Array.isArray(ids) || !ids.length || ids.length>20) return false;
        const library=w.FitPlanKettlebellCatalog?.items||[];
        const allowed=new Set((w.FitPlanExerciseRegistry?.items||library).map(item=>item.id));
        if(ids.some(id=>!allowed.has(w.FitPlanExerciseRegistry?.canonicalId(id)||id)))return false;
        pendingSession={ids:ids.map(id=>w.FitPlanExerciseRegistry?.canonicalId(id)||id),name:String(name||"Trening według planu").slice(0,140)};
        const opened=w.FitPlanApp?.open("start");
        if(opened===false)pendingSession=null;
        return opened;
      },
      consume() {const ready=pendingSession;pendingSession=null;return ready;}
    }),configurable:true
  });
  registry.register("start", {
    kind: "start",
    activate({host,isCurrent}) { cleanup?.(); cleanup = mount(w,host,isCurrent); },
    deactivate() { cleanup?.(); cleanup = null; }
  });
}
frame.addEventListener("load", () => queueMicrotask(install));
try { if (frame.contentDocument?.readyState === "complete") queueMicrotask(install); } catch {}
})();
