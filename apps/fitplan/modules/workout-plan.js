(()=>{
"use strict";
const frame=document.getElementById("appFrame");
if(!frame)return;
const LEVELS=Object.freeze({poczatkujacy:"Początkujący",sredniozaawansowany:"Średniozaawansowany",zaawansowany:"Zaawansowany",zawodowiec:"Zawodowiec"});
const TYPES=Object.freeze({kettlebell:"Kettlebell",crossfit:"CrossFit",kalistenika:"Kalistenika",split:"Split",fbw:"FBW","push-pull":"Push–pull","sztuki-walki":"Sztuki walki","100-pompek":"100 pompek i więcej",rozciaganie:"Rozciąganie",joga:"Joga",brzuch:"Brzuch"});
const LEVEL_KEY=id=>"fitplan."+id+".level.v1",PLAN_KEY="fitplan.plan.selected.v1";
const BASE_CALI=new Set(["Pompki","Podciąganie","Podciąganie podchwytem","Dipy","Zwis na drążku","Deska boczna","Side plank","Hollow hold","Bird dog","Dead bug","Przysiady","Wykroki","Wejścia na stopień","Rollouty","Unoszenia nóg","Spięcia","Antyrotacja","Pallof press","Marsz","Skakanka"]);
const BASE_CROSSFIT=new Set(["Przysiady","Wykroki","Martwy ciąg","RDL","Wiosłowanie","Podciąganie","Pompki","Wyciskanie nad głowę","Dipy","Skoki","Skakanka","Deska boczna","Rollouty","Hip thrust","Good morning"]);
const BASE_MOBILITY=new Set(["Ćwiczenia oddechowe","Spokojny oddech przeponowy","Kontrolowana rotacja biodra","Wall slides","Ćwiczenia kontroli barku","Rotacje zewnętrzne gumą","Stabilizacja łopatki","Bird dog"]);
const BASE_MARTIAL=new Set(["Przysiady","Pompki","Pallof press","Martwy ciąg","Hip thrust","Skakanka","Deska boczna","Bird dog"]);
let pendingSport=null,mounted=null;
function install(){
 const w=frame.contentWindow,doc=frame.contentDocument,modules=w?.FitPlanModules;
 if(!modules||!doc||mounted===doc||modules.get("plan-treningowy"))return;
 mounted=doc;
 const registry=w.FitPlanExerciseRegistry,ext=w.FitPlanTrainingExtensions,kb=w.FitPlanKettlebellCatalog;
 // WIEDORA-CHANGE: WD-20261101-WIE-115-CALISTHENICS-01 | TASK: WIE-115 | AUTHOR: ChatGPT / GPT-6
 const caliUI=window.FitPlanCalisthenicsPathsUI?.mount({doc,w,registry,extensions:ext});
 if(!registry||!ext||!kb)throw Error("Brak wspólnego rejestru FitPlan.");
 const navigation=Object.freeze({
   openKettlebell(){pendingSport="kettlebell";return w.FitPlanApp?.open("plan-treningowy");},
   openSport(id){if(!(id in TYPES))return false;pendingSport=id;return w.FitPlanApp?.open("plan-treningowy");}
 });
 Object.defineProperty(w,"FitPlanWorkoutPlan",{value:navigation,configurable:true});
 modules.register("plan-treningowy",{
 kind:"workout-plan",
 activate({host,isCurrent}){
  if(!isCurrent())return;
  const el=id=>host.querySelector("#"+id),make=(tag,text,cls)=>{const x=doc.createElement(tag);if(text!=null)x.textContent=text;if(cls)x.className=cls;return x;};
  const chooser=el("fpkChooser"),flow=el("fpkKettlebellFlow"),goals=el("fpkKbGoals"),browse=el("fpkKbDiscover"),editor=el("fpkKbEditor"),planner=el("fpkPlans");
  const cards=el("fpkKbGoalGrid"),browseMain=el("fpkKbPrimary"),browseHelp=el("fpkKbSecondary"),search=el("fpkKbSearch");
  const levels=el("fpkKbLevels"),skillMount=el("fpkSkills"),skillDetails=el("fpkSkillDetails");
  if(!chooser||!flow||!cards||!browse||!editor||!levels||!skillMount||!skillDetails)throw Error("Brak widoku treningów.");
  let sport="",goal="",level="",selected=[],goalItems=[],forcedItems=null,selectedSkill=null;
  // WIEDORA-CHANGE: WD-20261101-WIE-110-KB-FBW-01 | TASK: WIE-110/WIE-115 | AUTHOR: ChatGPT / GPT-6
  const kbcUi=window.FitPlanKettlebellCircuitUI?.mount({
    host,doc,w,lib:kb,load:w.FitPlanTrainingLoad,engine:w.FitPlanKettlebellCircuit,
    showMain(visible){chooser.hidden=!visible;flow.hidden=visible;el("fpkKbGoals").hidden=true;el("fpkKbDiscover").hidden=true;el("fpkKbEditor").hidden=true;el("fpkSkillDetails").hidden=true;el("fpkPushup100").hidden=true;}
  });
  const read=(key,fallback="")=>{try{return w.localStorage.getItem(key)??fallback}catch{return fallback}};
  const write=(key,val)=>{try{w.localStorage.setItem(key,val);return true}catch{return false}};
  const tier=()=>ext.levels.indexOf(level)+1;
  const levelText=()=>LEVELS[level]||"";
  const feedback=message=>{el("fpkKbFeedback").textContent=message};
  const goalsDef=()=>{
   if(sport==="sztuki-walki")return ext.combat.map(x=>({id:x.id,title:x.title,description:x.description}));
   if(sport==="kettlebell")return kb.areas;
   if(sport==="joga")return [
    {id:"yoga-flow",title:"Sekwencje całego ciała",description:"Spójne przejścia między pozycjami z oddechem"},
    {id:"yoga-breath",title:"Oddech i regeneracja",description:"Spokojna praktyka, rozluźnienie i pozycje odpoczynkowe"},
    {id:"yoga-balance",title:"Równowaga stojąca",description:"Stabilność, kontrola stopy i spokojne utrzymanie pozycji"},
    {id:"yoga-mobility",title:"Mobilność i otwieranie bioder",description:"Kontrolowany zakres bioder, barków, kostek i kręgosłupa"},
    {id:"yoga-core",title:"Stabilizacja tułowia",description:"Pozycje wymagające kontroli miednicy i środka ciała"},
    {id:"yoga-backbend",title:"Wygięcia i otwarcie przodu ciała",description:"Łagodne wyprosty bez forsowania odcinka lędźwiowego"},
    {id:"yoga-inversions",title:"Przygotowanie do pozycji odwróconych",description:"Nadgarstki, barki i bezpieczna progresja od podporu"},
    {id:"custom",title:"Sam dobierz ćwiczenia",description:"Własna kolejność pozycji i sekwencji"}
   ];
   if(sport==="100-pompek")return [
    {id:"pushup-100",title:"100 pompek w jednej serii",description:"Progresja od aktualnego maksimum do jednej ciągłej serii 100 powtórzeń"},
    {id:"custom",title:"Sam dobierz ćwiczenia",description:"Własna kolejność ćwiczeń pomocniczych"}
   ];
   if(sport==="brzuch")return [
    {id:"rectus-upper",title:"Mięsień prosty — akcent górny",description:"Zgięcie tułowia; cały mięsień prosty nadal pracuje jako jedna całość"},
    {id:"rectus-lower",title:"Mięsień prosty — akcent dolny",description:"Tyłopochylenie miednicy i unoszenie nóg bez odrywania lędźwi"},
    {id:"obliques",title:"Mięśnie skośne i rotacja",description:"Kontrolowana rotacja oraz zgięcie boczne tułowia"},
    {id:"anti-extension",title:"Stabilizacja — antywyprost",description:"Opór wobec przeprostu odcinka lędźwiowego"},
    {id:"anti-rotation",title:"Stabilizacja — antyrotacja",description:"Opór wobec rotacji i zgięcia bocznego"},
    {id:"full",title:"Cały brzuch i core",description:"Zrównoważony zestaw z kilku wzorców ruchu"},
    {id:"custom",title:"Sam dobierz ćwiczenia",description:"Własna kolejność ćwiczeń"}
   ];
   const common=[
    {id:"full",title:"Całe ciało",description:"Ruchy angażujące całe ciało"},
    {id:"chest",title:"Klatka piersiowa",description:"Główne i pomocnicze"},
    {id:"back",title:"Plecy",description:"Główne i pomocnicze"},
    {id:"shoulders",title:"Barki",description:"Główne i pomocnicze"},
    {id:"arms",title:"Ramiona",description:"Biceps i triceps"},
    {id:"legs",title:"Nogi",description:"Uda i łydki"},
    {id:"glutes",title:"Pośladki",description:"Praca bioder"},
    {id:"abs",title:"Brzuch i core",description:"Stabilizacja tułowia"},
    {id:"grip",title:"Przedramiona i chwyt",description:"Siła uchwytu"}
   ];
   const extras=(ext.extraGoals[sport]||[]).map(([id,title,description])=>({id,title,description}));
   const unique=new Map([...extras,...common].map(x=>[x.id,x]));
   let visible=[...unique.values()];
   if(sport==="rozciaganie")visible=visible.filter(x=>["full","shoulders","back","legs","grip","glutes"].includes(x.id));
   if(sport==="fbw")return [
     {id:"fbw-home",title:"FBW · w domu",description:"Całe ciało bez maszyn. Do ćwiczeń przyciągających potrzebny bezpieczny drążek lub poręcze."},
     {id:"fbw-gym",title:"FBW · na siłowni",description:"Dwa naprzemienne dni całego ciała ze sztangą, hantlami i przyciąganiem."},
     ...visible,{id:"custom",title:"Sam dobierz ćwiczenia",description:"Ułóż ćwiczenia w dowolnej kolejności"}
   ];
   return [...visible,{id:"custom",title:"Sam dobierz ćwiczenia",description:"Własna kolejność ćwiczeń"}];
  };
  const sportsFilter=()=>{
   if(sport==="kettlebell")return kb.items.map(x=>registry.get(x.id)).filter(Boolean);
   const raw=registry.items.filter(x=>{
     if(x.equipment==="kettlebell")return false;
     if(x.equipment==="extended")return (x.sports||[]).includes(sport);
     if(sport==="kalistenika")return BASE_CALI.has(x.name);
     if(sport==="crossfit")return BASE_CROSSFIT.has(x.name);
     if(sport==="rozciaganie"||sport==="joga")return BASE_MOBILITY.has(x.name);
     if(sport==="sztuki-walki")return BASE_MARTIAL.has(x.name);
     if(sport==="100-pompek")return ["chest","shoulders","arms","abs"].includes(x.category);
     if(sport==="brzuch")return ["abs","back","glutes"].includes(x.category);
     return true;
   });
   return raw;
  };
  const uniq=a=>[...new Map(a.map(x=>[x.id,x])).values()];
  function matchRole(item,area){
    if(area==="full"||area==="custom")return "primary";
    const role=item.muscleProfile;
    if(!role)return "";
    if(role.primary.some(x=>x.area===area))return "primary";
    if(role.secondary.some(x=>x.area===area))return "secondary";
    return "";
  }
  const specialGoals={
   "push":["chest","shoulders","arms"],"pull":["back","arms","grip"],
   "strength":["legs","back","chest","shoulders"],"power":["legs","shoulders","glutes"],"balance":["legs","abs","glutes"],
   "mobility":["shoulders","back","legs"],"aerobic":["legs","full"],"endurance":["abs","legs"]
  };
  function filterGoal(){
   const source=uniq(sportsFilter());
   if(sport==="sztuki-walki"){
     const lesson=ext.combat.find(x=>x.id===goal);
     const target=(lesson?.moves||[]).map(name=>registry.get(name)).filter(Boolean);
     return uniq(target);
   }
   if(sport==="100-pompek"&&goal==="pushup-100")return source.filter(item=>/push-up|pomp/i.test(item.displayName));
   if(sport==="joga"&&goal!=="custom"){
     const patterns={
       "yoga-breath":/breath|child's pose|cat cow/i,
       "yoga-balance":/tree pose|warrior|handstand/i,
       "yoga-mobility":/mobility|stretch|downward dog|cat cow/i,
       "yoga-core":/boat pose|compression lift|bridge pose/i,
       "yoga-backbend":/cobra pose|bridge pose|cat cow/i,
       "yoga-inversions":/handstand|downward dog|wrist preparation/i
     };
     return goal==="yoga-flow"?source:source.filter(item=>patterns[goal]?.test(item.displayName));
   }
   if(sport==="brzuch"){
     const patterns={
       "rectus-upper":/crunch|spięci|sit-up/i,
       "rectus-lower":/leg raise|knee raise|reverse crunch|candlestick|dragon flag|unoszeni.*(nóg|kolan)/i,
       obliques:/side plank|woodchop|rotation|skręt|windmill/i,
       "anti-extension":/rollout|hollow|dead bug|plank|dragon flag/i,
       "anti-rotation":/pallof|anti-rotation|antyrot|suitcase|bird dog|side plank/i
     };
     if(patterns[goal])return source.filter(item=>patterns[goal].test(item.displayName));
   }
   if(goal==="full"||goal==="custom")return source;
   const match=area=>source.filter(item=>matchRole(item,area));
   if(specialGoals[goal]){
     const areas=specialGoals[goal];
     const subset=source.filter(x=>areas.some(a=>matchRole(x,a)));
     // Exercise type must be meaningful for the target, not simply any "leg" exercise.
     if(["aerobic","mobility","power","balance"].includes(goal)){
       const specific={
        aerobic:/aerobic|ergometer|bike|shuttle|running|rope|sprint|walk/i,
        mobility:/mobility|stretch|flow|pose|rotation|slides|preparation/i,
        power:/jump|thruster|press|sprint|snatch/i,
        balance:/balance|stand|tree|warrior|handstand/i
       };
       return subset.filter(x=>specific[goal].test(x.displayName));
     }
     return subset;
   }
   return source.filter(item=>matchRole(item,goal));
  }
  function levelKey(){return "fitplan.training.v2."+sport+"."+level+"."+goal;}
  function legacyKey(){return "fitplan.kettlebell.selection.v1."+level+"."+goal;}
  function roleText(item){
   const p=item.muscleProfile;
   if(!p)return "";
   const show=parts=>parts.map(x=>x.name+(Number.isFinite(x.share)?" "+x.share+"%":"")).join(", ");
   return "Główne: "+(show(p.primary)||"brak szczegółów")+" · Pomocnicze: "+(show(p.secondary)||"brak szczegółów");
  }
  function areaSelected(){
   const a=goalsDef().find(x=>x.id===goal);
   return a?.title||selectedSkill?.title||"Wybrany cel";
  }
  function selectSport(id){
   if(!(id in TYPES))return;
   kbcUi?.hide();
   sport=id;level=read(LEVEL_KEY(id));if(!(level in LEVELS))level="";
   write(PLAN_KEY,id);
   pu.hidden=true;chooser.hidden=true;flow.hidden=false;goals.hidden=false;browse.hidden=true;editor.hidden=true;
   skillDetails.hidden=true;
   el("fpkKbLevel").textContent=id==="100-pompek"?TYPES[id]+" · poziom dobierany automatycznie z testu":TYPES[id]+(level?" · zapisany poziom: "+levelText():"");
   el("fpkSelected").textContent="Wybrano: "+TYPES[id];
   el("fpkGoalHeading").textContent="Co chcesz trenować? · "+TYPES[id];
   el("fpkGoalInfo").textContent=id==="sztuki-walki"?"Technika bez kontaktu, praca nóg, mobilność i kondycja. Nauka uderzeń i kopnięć na partnerze wymaga instruktora.":id==="100-pompek"?"Celem jest wykonanie 100 pompek w jednej serii. Wybierz progresję albo ułóż własny zestaw pomocniczy.":id==="brzuch"?"Wybierz akcent treningowy. Określenia górny i dolny opisują nacisk ćwiczenia, a nie dwa oddzielne mięśnie proste brzucha.":id==="fbw"?"Zacznij od jednego z dwóch gotowych planów A/B. Poniższe pozostałe opcje służą do samodzielnego doboru ćwiczeń.":"Wybierz obszar, zobacz ćwiczenia i dopiero później dostosuj poziom.";
   host.querySelectorAll("[data-fpk-plan]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.fpkPlan===id)));
   renderGoals();
   el("fpkKbcWithinKettlebell").hidden=id!=="kettlebell";
  }
  // WIEDORA-CHANGE: WD-20261031-WIE-110-PUSHUP100-01 | TASK: WIE-110/WIE-115 | AUTHOR: ChatGPT / GPT-6
  const pushup=w.FitPlanPushup100;
  // WIEDORA-CHANGE: WD-20261031-WIE-115-LOAD-CYCLE-02 | TASK: WIE-115 | AUTHOR: ChatGPT / GPT-6
  const load=w.FitPlanTrainingLoad;
  const pu=el("fpkPushup100");
  let puDraft={minutes:20,cycleDays:7};
  function puFeedback(message){el("fpkPuFeedback").textContent=message;}
  function paintPuCycle(prefs){
    const node=el("fpkPuCyclePreview");node.replaceChildren();
    if(!load)return;
    for(const slot of load.cyclePlan(prefs.cycleDays)){
      const cell=make("span",String(slot.day)+" · "+(slot.kind==="workout"?"Trening":"Odpoczynek"),"fpk-pu-day-pill");
      cell.dataset.kind=slot.kind;cell.title=slot.detail;node.append(cell);
    }
  }
  function renderPushup(){
    const active=pu&&pushup,controls=el("fpkPuWorkout"),setList=el("fpkPuSetList"),history=el("fpkPuHistory");
    if(!active){puFeedback("Brak silnika 100 pompek. Zgłoś problem administratorowi.");return;}
    let state;
    try{state=pushup.read(w.localStorage);}
    catch(error){controls.hidden=true;puFeedback(error.message);return;}
    controls.hidden=!state;
    if(!state){
      el("fpkPuGoalControls").hidden=true;el("fpkPuExtensionControls").hidden=true;
      el("fpkPuMinutes").value=String(puDraft.minutes);
      el("fpkPuCycleDays").value=String(puDraft.cycleDays);
      paintPuCycle(puDraft);
      el("fpkPuBudgetInfo").textContent="Najpierw wykonaj test. Możesz wybrać czas i cykl jeszcze przed zapisaniem pierwszego wyniku.";
      el("fpkPuMaxVisual").textContent="0";
      el("fpkPuRing").style.setProperty("--pu-percent","0%");
      el("fpkPuAssess").textContent="Oblicz poziom i zapisz program";
      pu.querySelectorAll(".fpk-pu-level-grid > div").forEach(x=>x.removeAttribute("data-active"));
      return;
    }
    const overview=pushup.summary(state),tier=pushup.tier(state.max);
    const prefs=overview.preferences;
    puDraft={minutes:prefs.minutes,cycleDays:prefs.cycleDays};
    el("fpkPuMinutes").value=String(prefs.minutes);
    el("fpkPuCycleDays").value=String(prefs.cycleDays);
    paintPuCycle(prefs);
    const goalAlreadyChangedAfterThisTest=state.goalUpdates?.at(-1)?.testCount===state.tests.length;
    el("fpkPuCurrentGoal").textContent="Aktualny cel: "+overview.goal+" poprawnych pompek"+
      (goalAlreadyChangedAfterThisTest?" · Aby podnieść go ponownie, wykonaj nowy test maksimum.":"");
    el("fpkPuRaiseGoal").disabled=!!goalAlreadyChangedAfterThisTest;
    el("fpkPuGoalControls").hidden=state.max<overview.goal;
    el("fpkPuExtensionControls").hidden=!state.finishedCycle||state.max>=overview.goal||overview.blockEndWeek>=40;
    el("fpkPuMaxVisual").textContent=String(Math.min(overview.goal,state.max));
    el("fpkPuRing").querySelector("small").textContent="z "+overview.goal;
    el("fpkPuRing").style.setProperty("--pu-percent",String(overview.percent)+"%");
    el("fpkPuRing").setAttribute("aria-label","Test maksimum: "+state.max+" pełnych pompek. Cel: "+overview.goal+".");
    el("fpkPuAssess").textContent="Zapisz nowy wynik testu i przelicz poziom";
    el("fpkPuLevel").textContent=tier.name;
    el("fpkPuBest").textContent=String(state.max);
    el("fpkPuCompleted").textContent=String(overview.completed);
    el("fpkPuVolume").textContent=String(overview.repsAll);
    el("fpkPuWeekReps").textContent=String(overview.repsWeek);
    el("fpkPuTrend").textContent=overview.trend+(overview.lastDifference===null?"":" · "+(overview.lastDifference>0?"+":"")+overview.lastDifference+" względem celu");
    el("fpkPuAdvice").textContent=tier.note;
    pu.querySelectorAll(".fpk-pu-level-grid > div").forEach((x,i)=>{x.dataset.active=String(pushup.TIERS[i].id===tier.id)});
    const workout=pushup.session(state.max,state.week,state.day,state);
    const nominal=load?.durationPreview(overview.blockEndWeek*3,prefs.cycleDays);
    const last=state.attempts.at(-1);
    const recovery=load?.recovery({
      intensity:"hard",fatigue:el("fpkPuFatigue").value,
      lastEnd:last?.at,now:new w.Date()
    });
    el("fpkPuRecoveryInfo").textContent=recovery?
      recovery.reason+(recovery.remainingHours?" Pozostało orientacyjnie "+recovery.remainingHours+" godz.":""):"";
    el("fpkPuBudgetInfo").textContent=workout.achieved?
      "Cel osiągnięty w teście. Możesz ustawić kolejny cel.":workout.feasible?
      "Budżet "+prefs.minutes+" min: orientacyjnie "+Math.ceil(workout.estimatedSeconds/60)+
      " min wykorzystane, "+Math.floor(workout.spareSeconds/60)+
      " min rezerwy (nie oznacza dodatkowych pompek). "+
      (workout.adjusted?"Zmniejszono powtórzenia, nie przerwy. ":"")+
      (nominal?"Blok "+overview.blockEndWeek*3+" jednostek potrwa orientacyjnie "+nominal.nominalDays+" dni w zadanym cyklu.":""):
      workout.reason;
    el("fpkPuPhase").textContent=workout.deload?
      "Lżejszy tydzień: proponowane około 40% mniej objętości. Prawdziwy odpoczynek i zmęczenie oceń indywidualnie.":
      "Zalecany odstęp dla cięższych sesji na te same mięśnie: około 48 godzin. Przy długotrwałym zmęczeniu przerwij progresję.";
    el("fpkPuRoadmap").closest("details").hidden=workout.achieved;
    setList.replaceChildren();history.replaceChildren();
    const roadmap=el("fpkPuRoadmap");roadmap.replaceChildren();
    el("fpkPuRoadmapLabel").textContent="Rozpiska "+overview.blockEndWeek+" tygodni blokowych · "+(overview.blockEndWeek*3)+" jednostek";
    for(let week=1;week<=overview.blockEndWeek;week++){
      const row=make("tr");if(week===state.week)row.className="fpk-pu-current-week";
      const title=make("th","Tydzień "+week);title.scope="row";row.append(title);
      for(let day=1;day<=3;day++){
        const planned=pushup.session(state.max,week,day,state);
        const cell=make("td",planned.achieved?"Cel osiągnięty":
          planned.sets.join(" / ")+" · "+planned.total+" łącznie");
        if(week===state.week&&day===state.day)cell.className="fpk-pu-current-cell";
        row.append(cell);
      }
      roadmap.append(row);
    }
    if(workout.achieved||state.finishedCycle){
      el("fpkPuDayTitle").textContent=workout.achieved?"Cel osiągnięty: "+overview.goal+" pompek w jednej serii":"Ukończono blok "+overview.blockEndWeek+" tygodni";
      el("fpkPuRest").textContent=workout.achieved?"Wynik pochodzi z wpisanego testu. Aby iść dalej, wybierz przyrost celu 1–100.":"Po 3–7 dniach spokojniejszej regeneracji można przedłużyć plan o 4 tygodnie; nie trzeba usuwać historii.";
      el("fpkPuTotal").textContent="—";
      el("fpkPuSave").disabled=true;
      el("fpkPuRetestHint").textContent="Możesz zachować historię i wprowadzić nowy test. Nie usuwamy starych sesji.";
    }else{
      el("fpkPuDayTitle").textContent="Blok treningowy · tydzień "+workout.week+" z "+overview.blockEndWeek+" · jednostka "+workout.day+" z 3";
      el("fpkPuRest").textContent="Tempo orientacyjne: 3 sek./pompka, rozgrzewka "+Math.round(workout.warmupSeconds/60)+" min, przerwy co najmniej "+workout.restSeconds+" s, schłodzenie "+Math.round(workout.cooldownSeconds/60)+" min. "+workout.guidance;
      el("fpkPuTotal").textContent=String(workout.total);
      el("fpkPuSave").disabled=!workout.feasible||(recovery&&!recovery.allowed);
      el("fpkPuRetestHint").textContent=workout.recheck?
        "Po tym treningu zaplanuj po odpoczynku nowy test maksymalnej jednej serii. Nowy wynik automatycznie dobierze poziom i cele kolejnych sesji.":
        "Rytm cyklu: "+prefs.cycleDays+" dni. Po każdych około 6 potwierdzonych sesjach rozważ nowy test po regeneracji. Nie nadrabiaj zaległości kosztem odpoczynku.";
      for(const [i,target] of workout.sets.entries()){
        const li=make("li",null,"fpk-pu-set");
        const caption=make("div",null,"fpk-pu-set-label");
        caption.append(make("strong","Seria "+(i+1)),make("small","Cel: "+target+" powt."));
        const label=make("label",null,"fpk-pu-input-label");
        label.textContent="Wykonano";
        const input=make("input");input.type="number";input.min="0";input.max="300";input.step="1";
        input.inputMode="numeric";input.required=true;input.placeholder=String(target);
        input.setAttribute("aria-label","Rzeczywista liczba powtórzeń w serii "+(i+1));
        label.append(input);li.append(caption,label);setList.append(li);
      }
    }
    for(const item of state.attempts.slice(-6).reverse()){
      const li=make("li");
      const n=item.actual.reduce((a,b)=>a+b,0);
      li.textContent="Tydzień "+item.week+" / trening "+item.day+" · "+n+" powtórzeń · "+
        (item.passed?"zaliczony":"do powtórzenia")+" · "+
        new Date(item.at).toLocaleDateString("pl-PL");
      history.append(li);
    }
  }
  function showPushup(){
    goals.hidden=true;browse.hidden=true;editor.hidden=true;skillDetails.hidden=true;
    pu.hidden=false;
    puFeedback("");
    renderPushup();
    pu.querySelector("#fpkPuTitle")?.focus?.();
  }
  // WIEDORA-CHANGE: WD-20261031-WIE-115-LOAD-CYCLE-02 | TASK: WIE-115 | AUTHOR: ChatGPT / GPT-6
  el("fpkPuConfigSave").addEventListener("click",()=>{
    if(!load||!pushup){puFeedback("Moduł planowania niedostępny.");return;}
    try{
      const choice=load.preferences({
        minutes:Number(el("fpkPuMinutes").value),
        cycleDays:Number(el("fpkPuCycleDays").value)
      });
      const state=pushup.read(w.localStorage);
      if(state){
        if(!w.confirm("Zmienić budżet czasu i cykl? Przyszłe cele serii zostaną przeliczone, zapisane wyniki zostaną zachowane."))return;
        pushup.configure(w.localStorage,choice);
      }
      puDraft=choice;
      renderPushup();
      puFeedback("Zapisano wybór "+choice.minutes+" min oraz cyklu "+choice.cycleDays+" dni. Nie zwiększono automatycznie liczby pompek.");
    }catch(error){puFeedback(error.message);}
  });
  el("fpkPuMinutes").addEventListener("change",()=>{el("fpkPuBudgetInfo").textContent="Zmiana nie została jeszcze zapisana. Wybierz „Zapisz ustawienia”.";});
  el("fpkPuCycleDays").addEventListener("change",()=>{el("fpkPuBudgetInfo").textContent="Zmiana nie została jeszcze zapisana. Wybierz „Zapisz ustawienia”.";});
  el("fpkPuFatigue").addEventListener("change",()=>{
    // Don't erase already typed but unsaved repetitions merely for changing fatigue.
    const fatigue=el("fpkPuFatigue").value;
    const state=pushup?.read(w.localStorage);
    const last=state?.attempts.at(-1);
    const evaluation=load?.recovery({intensity:"hard",fatigue,lastEnd:last?.at,now:new w.Date()});
    el("fpkPuRecoveryInfo").textContent=evaluation?.reason||"";
    if(!state||state.finishedCycle)return;
    const enabled=pushup.session(state.max,state.week,state.day,state).feasible;
    el("fpkPuSave").disabled=!enabled||!evaluation?.allowed;
  });
  el("fpkPuRaiseGoal").addEventListener("click",()=>{
    const value=Number(el("fpkPuGoalIncrease").value);
    if(!pushup||!w.confirm("Wyznaczyć nowy cel? Można zwiększyć go maksymalnie o 100 pompek. Historia pozostanie."))return;
    try{
      pushup.increaseGoal(w.localStorage,value,w.Date);
      renderPushup();puFeedback("Nowy cel zapisany. Rozpoczęto nowy blok treningowy z zachowaniem historii.");
    }catch(error){puFeedback(error.message);}
  });
  el("fpkPuExtend").addEventListener("click",()=>{
    if(!pushup||!w.confirm("Przedłużyć o cztery tygodnie blokowe? Zaplanuj najpierw 3–7 dni spokojniejszej regeneracji."))return;
    try{
      pushup.extend(w.localStorage,w.Date);
      renderPushup();puFeedback("Dodano 4 tygodnie. Zapisane treningi zostały zachowane.");
    }catch(error){puFeedback(error.message);}
  });
  el("fpkPuBack").addEventListener("click",()=>{pu.hidden=true;goals.hidden=false;});
  el("fpkPuTestForm").addEventListener("submit",event=>{
    event.preventDefault();
    const raw=el("fpkPuTest").value.trim(),n=Number(raw);
    if(!raw||!Number.isInteger(n)||n<0||n>1000){puFeedback("Wpisz poprawną liczbę od 0 do 1000.");return;}
    if(!pushup){puFeedback("Moduł testowy niedostępny.");return;}
    try {
      const existing=pushup.read(w.localStorage);
      if(existing && !w.confirm("Zapisać nowy wynik testu? Wcześniejsze sesje pozostaną, ale cele kolejnych treningów mogą się zmienić."))return;
      if(existing)pushup.retest(w.localStorage,n,w.Date);
      else pushup.begin(w.localStorage,n,w.Date,load?.preferences({
        minutes:Number(el("fpkPuMinutes").value),
        cycleDays:Number(el("fpkPuCycleDays").value)
      })||puDraft);
      renderPushup();
      puFeedback("Wynik zapisany. Poziom i kolejne serie obliczono z Twojego rzeczywistego maksimum.");
    }catch(error){puFeedback(error.message);}
  });
  el("fpkPuSetsForm").addEventListener("submit",event=>{
    event.preventDefault();
    if(!pushup)return;
    try{
      const state=pushup.read(w.localStorage);
      const stateRec=load?.recovery({intensity:"hard",fatigue:el("fpkPuFatigue").value,
        lastEnd:state?.attempts.at(-1)?.at,now:new w.Date()});
      if(stateRec&&!stateRec.allowed){puFeedback(stateRec.reason+" Poczekaj przed zapisem nowej sesji.");return;}
    }catch(error){puFeedback(error.message);return;}
    const inputs=[...el("fpkPuSetList").querySelectorAll("input")];
    if(inputs.length!==5||inputs.some(x=>!x.value.trim())){
      puFeedback("Wpisz wynik każdej z pięciu wykonanych serii, nawet jeśli to 0.");return;
    }
    const counts=inputs.map(x=>Number(x.value));
    if(counts.some(x=>!Number.isInteger(x)||x<0||x>300)){
      puFeedback("Wprowadź prawdziwą liczbę powtórzeń od 0 do 300.");return;
    }
    if(!w.confirm("Potwierdź, że wpisane liczby odpowiadają faktycznie wykonanym seriom."))return;
    try{
      const result=pushup.record(w.localStorage,counts,w.Date);
      renderPushup();
      puFeedback(result.passed?
        "Sesja zaliczona. Kolejny trening zaplanowany po odpoczynku.":
        "Zapisano rzeczywisty wynik, ale nie osiągnięto wszystkich celów. Zachowano ten sam trening do powtórzenia po regeneracji.");
    }catch(error){puFeedback(error.message);}
  });
  el("fpkPuMotion").addEventListener("click",()=>{
    try{
      if(w.FitPlanExerciseDetails?.open("Push-Up")!==true)
        puFeedback("Podgląd techniki pompki jest niedostępny.");
    }catch(error){puFeedback("Nie udało się otworzyć animacji. Możesz nadal korzystać z programu.");}
  });
  el("fpkPuTimer").addEventListener("click",()=>{w.FitPlanApp?.open("start");});
  function home(){kbcUi?.hide();pu.hidden=true;chooser.hidden=false;flow.hidden=true;el("fpkSelected").textContent=sport?TYPES[sport]+" – wybierz ścieżkę.":"Wybierz rodzaj treningu.";}
  function renderGoals(){
   cards.replaceChildren();
   goalsDef().forEach(item=>{
    const button=make("button",null,"action-button fpk-kb-goal");button.type="button";button.dataset.fpkKbGoal=item.id;
    button.append(make("strong",item.title),make("small",item.description));cards.append(button);
   });
   skillMount.replaceChildren();skillMount.hidden=sport!=="kalistenika";
   if(sport==="kalistenika"){
     if(caliUI){caliUI.catalog(skillMount);return;}
     skillMount.append(make("h4","Powiązane figury i ścieżki progresji"));
     skillMount.append(make("p","Przed figurą końcową opanuj ćwiczenia przygotowawcze. Każdy etap ma własny zestaw i wymagania.","muted"));
     const grid=make("div",null,"fpk-kb-goal-grid");
     ext.progressions.forEach(track=>{
       const button=make("button",null,"action-button fpk-kb-goal");button.type="button";button.dataset.fpkSkill=track.id;
       button.append(make("strong",track.title),make("small",track.stages.length+" etapy"+(track.coach?" · wymaga asekuracji":"")));
       grid.append(button);
     });skillMount.append(grid);
   }
  }
  function renderSkills(id){
   const track=(caliUI?.paths||ext.progressions).find(x=>x.id===id);if(!track)return;
   selectedSkill=track;goals.hidden=true;skillDetails.hidden=false;
   if(sport==="kalistenika"&&caliUI){
     caliUI.showTrack(skillDetails,track,()=>{skillDetails.hidden=true;goals.hidden=false;});
     return;
   }
   skillDetails.replaceChildren();
   const back=make("button","← Wszystkie partie i figury","action-button");back.type="button";back.addEventListener("click",()=>{skillDetails.hidden=true;goals.hidden=false;});
   skillDetails.append(back,make("h4",track.title),make("p",track.coach?"Elementy zaawansowane wymagają trenera, asekuracji, mat i przystosowanego sprzętu.":"To przykładowa droga uczenia się umiejętności. Przechodź dalej po opanowaniu techniki.","muted"));
   const reference=ext.sources[track.sourceId];
   if(reference){const link=make("a","Materiały źródłowe dotyczące tej progresji");link.href=reference;link.target="_blank";link.rel="noopener noreferrer";skillDetails.append(link);}
   track.stages.forEach((stage,index)=>{
     const section=make("section",null,"fpk-skill-stage");
     section.append(make("h5","Etap "+(index+1)+" · "+stage.title));
     const ul=make("ol");
     stage.moves.forEach(name=>{
       const item=registry.get(name),li=make("li");
       const button=make("button",item?.displayName||name,"action-button fpk-exercise-detail");
       button.type="button";button.disabled=!item;
       button.addEventListener("click",()=>{if(item)w.FitPlanExerciseDetails?.open(item.id);});
       li.append(button);ul.append(li);
     });
     section.append(ul);
     const button=make("button","Dobierz trening tego etapu","action-button");button.type="button";
     button.dataset.fpkStage=track.id+"-"+index;
     button.addEventListener("click",()=>{
       const resolved=stage.moves.map(name=>registry.get(name)).filter(Boolean);
       if(!resolved.length)return;
       goal="skill-"+track.id+"-"+index;forcedItems=uniq(resolved);
       showBrowse(true);
     });
     section.append(button);skillDetails.append(section);
   });
  }
  function showBrowse(skill=false){
   goalItems=skill&&forcedItems?forcedItems:filterGoal();
   if(!skill)forcedItems=null;
   goals.hidden=true;skillDetails.hidden=true;editor.hidden=true;browse.hidden=false;
   el("fpkKbBrowseTitle").textContent=(skill&&selectedSkill?selectedSkill.title:areaSelected())+" – ćwiczenia";
   browseMain.replaceChildren();browseHelp.replaceChildren();
   let main=0,aux=0;
   for(const item of goalItems){
     const secondary=!skill&&goal!=="full"&&goal!=="custom"&&["shoulders","back","chest","legs","abs","arms","glutes","grip"].includes(goal)&&matchRole(item,goal)==="secondary";
     const card=make("article",null,"fpk-kb-role-card");
     card.append(make("strong",item.displayName),make("small","Poziom: "+(LEVELS[ext.levels[Math.min(3,Math.max(0,(item.minLevel||1)-1))]]||"Początkujący")),make("p",roleText(item)));
     const details=make("button","Szczegóły ćwiczenia","action-button fpk-exercise-detail");details.type="button";
     details.addEventListener("click",()=>w.FitPlanExerciseDetails?.open(item.id));
     card.append(details);
     (secondary?browseHelp:browseMain).append(card);
     if(secondary)aux++;else main++;
   }
   if(!main)browseMain.append(make("p","Brak ćwiczeń głównych dla tego wyboru.","muted"));
   if(!aux)browseHelp.append(make("p","Brak dodatkowych ćwiczeń pomocniczych w tym zestawie.","muted"));
   levels.hidden=false;
   levels.querySelectorAll("[data-fpk-kb-level]").forEach(button=>button.setAttribute("aria-pressed",String(button.dataset.fpkKbLevel===level)));
   const amount=el("fpkKbBrowseCount");amount.replaceChildren(make("span",goalItems.length+" ćwiczeń ze wspólnego katalogu. "));
   const lesson=sport==="sztuki-walki"?ext.combat.find(x=>x.id===goal):null;
   const source=lesson&&ext.sources[lesson.sourceId];
   if(source){const link=make("a","Materiały szkoleniowe");link.href=source;link.target="_blank";link.rel="noopener noreferrer";amount.append(link);}
  }
  function allowed(){return goalItems.filter(item=>(item.minLevel||1)<=tier());}
  function savedItems(){
   const raw=read(levelKey(),null)|| (sport==="kettlebell"?read(legacyKey(),null):null);
   let parsed=null;try{parsed=raw===null?null:JSON.parse(raw)}catch{}
   if(!Array.isArray(parsed))return null;
   const valid=new Set(allowed().map(x=>x.id));
   return [...new Set(parsed.map(id=>registry.get(id)?.id).filter(id=>valid.has(id)))].slice(0,20);
  }
  function suggested(){
   if(goal==="custom")return [];
   if(goal.startsWith("skill-"))return allowed().map(x=>x.id).slice(0,20);
   if(sport==="kettlebell"){
     const ids=kb.suggest(level,goal).map(x=>registry.get(x)?.id).filter(Boolean);
     const valid=new Set(allowed().map(x=>x.id));
     return ids.filter(id=>valid.has(id));
   }
   if(sport==="sztuki-walki")return allowed().slice(0,8).map(x=>x.id);
   const result=[];for(const area of ["legs","back","chest","shoulders","abs","glutes","arms"]){
     const item=allowed().find(x=>x.muscleProfile?.primary.some(m=>m.area===area)&&!result.includes(x.id));
     if(item)result.push(item.id);if(result.length===6)break;
   }
   if(!result.length)return allowed().slice(0,6).map(x=>x.id);
   return result;
  }
  function openEditor(){
   if(!level||tier()<1)return;
   browse.hidden=true;editor.hidden=false;
   el("fpkKbGoalTitle").textContent=areaSelected()+" · "+levelText();
   el("fpkKbGoalIntro").textContent="Wybierz i ustaw kolejność ćwiczeń ze wspólnej listy. Poziom odrzuca trudniejsze ruchy, ale nie jest automatycznym testem umiejętności.";
   search.value="";
   selected=savedItems()??suggested();
   const valid=new Set(allowed().map(x=>x.id));
   selected=selected.filter(id=>valid.has(id)).slice(0,20);
   feedback(selected.length?"Możesz zmieniać kolejność i zapisać zestaw.":"Dodaj co najmniej jedno ćwiczenie.");
   paintSelected();
  }
  function paintAvailable(){
   const query=search.value.toLocaleLowerCase("pl-PL").trim(),box=el("fpkKbAvailable");
   box.replaceChildren();
   for(const item of allowed()){
     if(query&&!(item.displayName+" "+item.cue+" "+roleText(item)).toLocaleLowerCase("pl-PL").includes(query))continue;
     const row=make("div",null,"fpk-kb-option"),copy=make("div");
     copy.append(make("strong",item.displayName),make("small",(item.cue||item.description||"")+" · "+roleText(item)));
     const button=make("button",selected.includes(item.id)?"Dodano":"Dodaj","action-button");button.type="button";
     button.dataset.fpkKbAdd=item.id;button.disabled=selected.includes(item.id)||selected.length>=20;
     row.append(copy,button);box.append(row);
   }
   if(!box.childElementCount)box.append(make("p","Brak ćwiczeń spełniających warunki.","muted"));
  }
  function paintSelected(){
   const list=el("fpkKbSelectedList");list.replaceChildren();
   selected.forEach((id,index)=>{
     const item=registry.get(id);if(!item)return;
     const li=make("li"),text=make("div");text.append(make("strong",(index+1)+". "+item.displayName),make("small",roleText(item)));
     const actions=make("div",null,"fpk-kb-move");
     for(const [action,name,disabled] of [["up","↑",index===0],["down","↓",index===selected.length-1],["remove","×",false]]){
       const b=make("button",name,"action-button");b.type="button";b.dataset.fpkKbAction=action;b.dataset.index=String(index);b.disabled=disabled;
       b.setAttribute("aria-label",action+" "+item.displayName);actions.append(b);
     }
     li.append(text,actions);list.append(li);
   });
   el("fpkKbCount").textContent="("+selected.length+"/20)";
   el("fpkKbLaunch").disabled=!selected.length;el("fpkKbSave").disabled=!selected.length;
   paintAvailable();
  }
  function save(){
   if(!selected.length){feedback("Wybierz co najmniej jedno ćwiczenie.");return false}
   if(!write(levelKey(),JSON.stringify(selected))){feedback("Nie udało się zapisać ćwiczeń na urządzeniu.");return false;}
   if(sport==="kettlebell")write(legacyKey(),JSON.stringify(selected));
   feedback("Zapisano "+selected.length+" ćwiczeń dla "+TYPES[sport]+" · "+levelText()+".");
   return true;
  }
  el("fpkKbCircuitLauncher").addEventListener("click",()=>{if(isCurrent())kbcUi?.show()});
  el("fpkKbcWithinKettlebell").addEventListener("click",()=>{if(isCurrent())kbcUi?.show()});
  planner.addEventListener("click",event=>{
   const button=event.target.closest("[data-fpk-plan]");if(button&&planner.contains(button)&&isCurrent())selectSport(button.dataset.fpkPlan);
  });
  el("fpkKbGoalGrid").addEventListener("click",event=>{
   const button=event.target.closest("[data-fpk-kb-goal]");if(!button||!isCurrent())return;
   goal=button.dataset.fpkKbGoal;selectedSkill=null;
   if(sport==="100-pompek"&&goal==="pushup-100"){showPushup();return;}
   if(sport==="fbw"&&(goal==="fbw-home"||goal==="fbw-gym")){
     try{w.sessionStorage.setItem("fitplan.fbw.pending.v1",goal);}
     catch{el("fpkSelected").textContent="Nie można przenieść wyboru FBW. Sprawdź ustawienia przeglądarki.";return;}
     w.FitPlanApp?.open("start");return;
   }
   showBrowse(false);
  });
  skillMount.addEventListener("click",event=>{
   const button=event.target.closest("[data-fpk-skill]");
   if(button&&isCurrent())renderSkills(button.dataset.fpkSkill);
  });
  el("fpkKbLevels").addEventListener("click",event=>{
   const button=event.target.closest("[data-fpk-kb-level]");if(!button||!isCurrent())return;
   level=button.dataset.fpkKbLevel;if(!(level in LEVELS))return;
   levels.querySelectorAll("[data-fpk-kb-level]").forEach(item=>item.setAttribute("aria-pressed",String(item===button)));
   write(LEVEL_KEY(sport),level);openEditor();
  });
  el("fpkKbBackToLevel").addEventListener("click",home);
  el("fpkKbBrowseBack").addEventListener("click",()=>{browse.hidden=true;goals.hidden=false;skillDetails.hidden=true;});
  el("fpkKbBackToGoals").addEventListener("click",()=>{editor.hidden=true;browse.hidden=false;});
  search.addEventListener("input",paintAvailable);
  el("fpkKbAvailable").addEventListener("click",event=>{
   const button=event.target.closest("[data-fpk-kb-add]");if(!button||!isCurrent())return;
   const id=button.dataset.fpkKbAdd;
   if(selected.length>=20||selected.includes(id)||!allowed().some(x=>x.id===id))return;
   selected.push(id);paintSelected();feedback("Zmieniono zestaw. Zapisz przed wyjściem.");
  });
  el("fpkKbSelectedList").addEventListener("click",event=>{
   const b=event.target.closest("[data-fpk-kb-action]");if(!b||!isCurrent())return;
   const i=Number(b.dataset.index),action=b.dataset.fpkKbAction;
   if(!Number.isInteger(i)||i<0||i>=selected.length)return;
   if(action==="remove")selected.splice(i,1);
   if(action==="up"&&i>0)[selected[i-1],selected[i]]=[selected[i],selected[i-1]];
   if(action==="down"&&i<selected.length-1)[selected[i+1],selected[i]]=[selected[i],selected[i+1]];
   paintSelected();feedback("Zmieniono zestaw. Zapisz przed wyjściem.");
  });
  el("fpkKbReset").addEventListener("click",()=>{selected=suggested();paintSelected();feedback("Przywrócono propozycję. Zapisz, aby zachować.");});
  el("fpkKbSave").addEventListener("click",save);
  el("fpkKbLaunch").addEventListener("click",()=>{
   if(!save())return;
   const target=w.FitPlanStartBridge;
   if(!target?.launch||target.launch([...selected],TYPES[sport]+" · "+areaSelected()+" · "+levelText())===false)feedback("Nie udało się otworzyć stopera.");
  });
  // WIEDORA-CHANGE: WD-20261101-FITPLAN-SYSTEMS-UX-01 | TASK: FitPlan systems UX | AUTHOR: ChatGPT / GPT-6
  window.FitPlanTrainingGuide?.mount({host,doc,selectSport});
  const requested=pendingSport;pendingSport=null;
  const restored=requested||(read(PLAN_KEY) in TYPES?read(PLAN_KEY):null);
  if(restored&&requested)selectSport(restored);else home();
 },
 deactivate(){}
 });
}
frame.addEventListener("load",()=>queueMicrotask(install));
try{if(frame.contentDocument?.readyState==="complete")queueMicrotask(install)}catch{}
})();
