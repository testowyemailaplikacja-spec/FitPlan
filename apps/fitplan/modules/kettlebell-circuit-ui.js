// WIEDORA-CHANGE: WD-20261101-WIE-110-KB-FBW-01 | TASK: WIE-110/WIE-115 | AUTHOR: ChatGPT / GPT-6
// Isolated view/controller for circuit program. Does not alter existing kettlebell
// exercise builder, shared timer, or canonical exercise catalog.
(()=>{
"use strict";
function mount({host,doc,w,lib,load,engine,showMain}){
 const el=id=>host.querySelector("#"+id),panel=el("fpkKbcPanel"),setup=el("fpkKbcSetup");
 if(!panel||!engine||!load||!lib)return {show:()=>{},hide:()=>{}};
 const newNode=(tag,txt,cls)=>{
  const item=doc.createElement(tag);
  if(txt!==undefined)item.textContent=txt;
  if(cls)item.className=cls;
  return item;
 };
 // WIEDORA-CHANGE: WD-20261101-WIE-110-KB-UX-FIX-02 | TASK: WIE-110 | AUTHOR: ChatGPT / GPT-6
 let active=false,draft=null;
 const draftKey=plan=>plan.rows.map(r=>r.id+":"+r.target).join("|")+"/"+plan.cycle+"/"+plan.slot;
 const feedback=s=>{el("fpkKbcFeedback").textContent=s;};
 function fields(){
  return {level:el("fpkKbcLevel").value,goal:el("fpkKbcGoal").value,
   minutes:Number(el("fpkKbcMinutes").value),cycleDays:Number(el("fpkKbcCycle").value),
   sessionsPerCycle:Number(el("fpkKbcFrequency").value)};
 }
 function refreshFrequency(){
  const day=Number(el("fpkKbcCycle").value),max=({5:2,7:3,10:4})[day]||2;
  const select=el("fpkKbcFrequency"),previous=Math.min(Number(select.value)||max,max);
  select.replaceChildren();
  for(let n=1;n<=max;n++){
   const option=newNode("option",n+" "+(n===1?"trening":"treningi")+" / cykl");
   option.value=String(n);select.append(option);
  }
  select.value=String(previous);
 }
 function placeSettings(c){
  el("fpkKbcLevel").value=c.level;el("fpkKbcGoal").value=c.goal;
  el("fpkKbcMinutes").value=String(c.minutes);
  el("fpkKbcCycle").value=String(c.cycleDays);
  refreshFrequency();el("fpkKbcFrequency").value=String(c.sessionsPerCycle);
 }
 function renderGoal(){
  const g=engine.GOALS.find(g=>g.id===el("fpkKbcGoal").value);
  const row=el("fpkKbcGoalInfo");
  row.textContent=g?g.description+". Orientacyjnie "+g.reps+
    " powtórzeń w serii i "+Math.max(90,g.rest)+" s przerwy (liczba rund zależy od czasu i poziomu).":"";
 }
 function drawHistory(state){
  const list=el("fpkKbcHistory");list.replaceChildren();
  for(const entry of state.history.slice(-6).reverse()){
   const li=newNode("li");
   const reps=entry.rows.reduce((a,r)=>a+r.actual,0);
   const delta=entry.rows.reduce((a,r)=>a+r.actual-r.target,0);
   li.textContent="Cykl "+entry.cycle+", jednostka "+entry.slot+
    " · "+reps+" powt. ("+(delta>0?"+":"")+delta+" względem planu) · "+entry.rows.length+" serii · "+
    new Date(entry.at).toLocaleDateString("pl-PL");
   list.append(li);
  }
  if(!list.childElementCount)list.append(newNode("li","Brak wykonanych jednostek."));
 }
 function updateFilled(){
  const rows=[...el("fpkKbcRows").querySelectorAll("tr")];
  const complete=rows.filter(tr=>[...tr.querySelectorAll("input")].every(input=>input.value.trim()!=="")).length;
  el("fpkKbcFilled").textContent="Wpisano "+complete+" z "+rows.length+" serii. Puste pola nie są zaliczane jako wykonanie.";
 }
 function rememberDraft(){
  const rows=[...el("fpkKbcRows").querySelectorAll("tr")];
  if(!rows.length)return;
  draft={key:rows.map(tr=>tr.dataset.id+":"+tr.dataset.target).join("|")+"/"+rows[0].dataset.cycle+"/"+rows[0].dataset.slot,
   values:rows.map(tr=>[...tr.querySelectorAll("input,select")].map(x=>x.value))};
  updateFilled();
 }
 function render(){
  if(!active)return;
  let state;try{state=engine.read(w.localStorage)}catch(e){
    el("fpkKbcActive").hidden=true;feedback(e.message);return;
  }
  el("fpkKbcActive").hidden=!state;
  el("fpkKbcStart").textContent=state?"Zmień ustawienia przyszłych sesji":"Zapisz i ułóż trening";
  if(!state){renderGoal();return;}
  placeSettings(state.config);renderGoal();
  let p;try{p=engine.proposal(state,lib,load)}catch(e){feedback(e.message);return;}
  const sum=engine.summary(state);
  el("fpkKbcSessions").textContent=String(sum.sessions);
  el("fpkKbcCycleReps").textContent=String(sum.repsCycle);
  el("fpkKbcAllReps").textContent=String(sum.repsAll);
  el("fpkKbcVolume").textContent=sum.tonnageKg.toLocaleString("pl-PL")+" kg";
  el("fpkKbcTrend").textContent="Porównanie ćwiczeń: progres "+sum.progress+
   " · regres "+sum.regress+" · stagnacja "+sum.stagnation+
   " · wszystkie wykonane serie: "+sum.setsAll+
   (sum.lastDifference===null?".":" · ostatni trening: "+(sum.lastDifference>0?"+":"")+sum.lastDifference+" powtórzeń względem planu.");
  el("fpkKbcSessionTitle").textContent=p.feasible?
   "Cykl "+p.cycle+" · jednostka "+p.slot+" z "+p.sessionsPerCycle+" · dzień "+p.plannedDay+" z "+p.cycleDays:"Program wymaga zmiany czasu";
  el("fpkKbcTime").textContent=p.feasible?
    "Szacowany czas: "+Math.ceil(p.seconds/60)+" min / budżet "+p.minutes+
    " min · "+p.rounds+" rundy · "+p.exercises+" ćwiczeń · przerwy ≥"+
    p.restSeconds+" s. "+p.notes:p.reason;
  const last=state.history.at(-1);
  let recovery;try{recovery=load.recovery({intensity:"hard",lastEnd:last?.at,now:new w.Date(),fatigue:"normal"});}
    catch{recovery=null;}
  el("fpkKbcRecovery").textContent=last&&recovery&&!recovery.allowed?
    "Regeneracja: od ostatniej sesji nie upłynęło jeszcze orientacyjne 48 godzin. Rozważ przełożenie treningu.":
    p.review?"Lżejszy piąty cykl — zmniejsz objętość i oceń zmęczenie.":"Przed kolejnym ciężkim obwodem oceń regenerację, technikę i samopoczucie.";
  const box=el("fpkKbcRows");box.replaceChildren();
  if(!p.feasible){el("fpkKbcSave").disabled=true;drawHistory(state);return;}
  el("fpkKbcSave").disabled=false;
  for(const [index,planned] of p.rows.entries()){
   const item=lib.get(planned.id),tr=newNode("tr");
   const desc=newNode("td");
   const name=newNode("strong",(index+1)+". "+(item?.name||planned.id));
   desc.append(name,newNode("small","Runda "+planned.round+" · "+(item?.cue||"")));
   const tip=newNode("small",planned.adjustment==="up"?"Cel +1 po poprawnym wykonaniu":
      planned.adjustment==="down"?"Lżejszy cel po trudniejszej sesji":"Cel utrzymany");
   desc.append(tip);
   const target=newNode("td",String(planned.target));target.dataset.label="Cel";
   const count=newNode("td"),actual=newNode("input");
   actual.type="number";actual.min="0";actual.max="300";actual.step="1";actual.required=true;actual.inputMode="numeric";
   actual.placeholder=String(planned.target);
   actual.setAttribute("aria-label","Wykonane powtórzenia: "+(item?.name||planned.id)+", runda "+planned.round);
   count.dataset.label="Wykonano";count.append(actual);
   const loadCell=newNode("td"),kg=newNode("input");
   kg.type="number";kg.min="0.5";kg.max="200";kg.step="any";kg.required=true;kg.inputMode="decimal";
   kg.placeholder=planned.previousKg===null?"kg":String(planned.previousKg);
   kg.setAttribute("aria-label","Użyty kettlebell w kg: "+(item?.name||planned.id)+", runda "+planned.round);
   loadCell.dataset.label="Ciężar (kg)";loadCell.append(kg);
   if(planned.previousKg!==null){
    const reuse=newNode("button","Ostatnio "+planned.previousKg+" kg · wstaw","fpk-kbc-reuse");
    reuse.type="button";reuse.addEventListener("click",()=>{
     kg.value=String(planned.previousKg);
     kg.dispatchEvent(new w.Event("input",{bubbles:true}));kg.focus();
    });loadCell.append(reuse);
   }
   const rirCell=newNode("td"),rir=newNode("select");
   rir.append(newNode("option","—"));rir.firstChild.value="";
   for(let j=0;j<=6;j++){const opt=newNode("option",String(j));opt.value=String(j);rir.append(opt)}
   rir.setAttribute("aria-label","Powtórzenia w zapasie RIR: "+(item?.name||planned.id));
   rirCell.dataset.label="Zapas RIR";rirCell.append(rir);
   const formCell=newNode("td"),form=newNode("select");
   for(const [value,title] of [["unknown","Nie oceniono"],["good","Poprawna"],["needs-work","Do poprawy"]]){
    const option=newNode("option",title);option.value=value;form.append(option);
   }
   form.setAttribute("aria-label","Technika ćwiczenia: "+(item?.name||planned.id));
   formCell.dataset.label="Technika";formCell.append(form);
   desc.dataset.label="Ćwiczenie";
   tr.dataset.id=planned.id;tr.dataset.target=String(planned.target);
   tr.dataset.cycle=String(p.cycle);tr.dataset.slot=String(p.slot);
   tr.append(desc,target,count,loadCell,rirCell,formCell);box.append(tr);
  }
  if(draft?.key===draftKey(p)){
   [...box.querySelectorAll("tr")].forEach((tr,i)=>{
    [...tr.querySelectorAll("input,select")].forEach((item,j)=>{
     if(draft.values[i]?.[j]!==undefined)item.value=draft.values[i][j];
    });
   });
  }
  updateFilled();drawHistory(state);
 }
 function show(){
  if(!active){active=true}
  showMain(false);panel.hidden=false;feedback("");render();
  el("fpkKbcHeading").focus();
 }
 function hide(){active=false;panel.hidden=true;showMain(true)}
 el("fpkKbcBack").addEventListener("click",hide);
 el("fpkKbcGoal").addEventListener("change",renderGoal);
 el("fpkKbcCycle").addEventListener("change",refreshFrequency);
 el("fpkKbcResults").addEventListener("input",rememberDraft);
 el("fpkKbcResults").addEventListener("change",rememberDraft);
 setup.addEventListener("submit",event=>{
  event.preventDefault();
  try{
   const c=engine.config(fields()),old=engine.read(w.localStorage);
   if(old&&!w.confirm("Zmienić konfigurację przyszłych sesji, zachowując historię?"))return;
   if(old)engine.configure(w.localStorage,c);else engine.begin(w.localStorage,c);
   draft=null;
   feedback("Zapisano konfigurację. Po każdym treningu wpisz rzeczywiste serie i ciężary.");
   render();
  }catch(e){feedback(e.message)}
 });
 el("fpkKbcResults").addEventListener("submit",event=>{
  event.preventDefault();
  let state,plan;
  try{state=engine.read(w.localStorage);plan=engine.proposal(state,lib,load)}
  catch(e){feedback(e.message);return;}
  const entries=[...el("fpkKbcRows").querySelectorAll("tr")];
  if(!plan.feasible||entries.length!==plan.rows.length||entries.some((tr,i)=>
    tr.dataset.id!==plan.rows[i].id||Number(tr.dataset.target)!==plan.rows[i].target||
    Number(tr.dataset.cycle)!==plan.cycle||Number(tr.dataset.slot)!==plan.slot)){
    feedback("Plan zmienił się w innej karcie lub po aktualizacji. Otwórz program ponownie i sprawdź serie przed zapisem.");return;
  }
  let completed=[];
  for(const [i,tr] of entries.entries()){
   const [a,k]=tr.querySelectorAll("input"),[rir,form]=tr.querySelectorAll("select");
   if(!a.value.trim()||!k.value.trim()){
    feedback("Uzupełnij rzeczywiste powtórzenia i ciężar we wszystkich seriach.");return;
   }
   completed.push({id:plan.rows[i].id,actual:Number(a.value),kg:Number(k.value),
    rir:rir.value===""?null:Number(rir.value),form:form.value});
  }
  if(!w.confirm("Potwierdzasz, że wszystkie wpisane powtórzenia i obciążenia zostały rzeczywiście wykonane?"))return;
  try{engine.record(w.localStorage,completed,lib,load,w.Date);
    draft=null;render();feedback("Trening zapisany. Kolejna jednostka została przeliczona na podstawie rzeczywistych wyników.");
  }catch(e){feedback(e.message)}
 });
 el("fpkKbcTimer").addEventListener("click",()=>w.FitPlanApp?.open("start"));
 return {show,hide,render};
}
const api=Object.freeze({mount});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(typeof window!=="undefined")window.FitPlanKettlebellCircuitUI=api;
})();
