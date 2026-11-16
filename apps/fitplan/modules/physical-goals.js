(()=>{
"use strict";
// WIEDORA-CHANGE: WD-20261101-WIE-117-PHYSICAL-GOALS-01 | TASK: WIE-117 | AUTHOR: ChatGPT / GPT-6
// Dated, self-reported physical goals. Stored in the already-synchronized FitPlan profile.
const PROFILE_KEY="fitplan.dashboard.profile.v1";
const PRESETS=Object.freeze({
 weight:["Masa ciała","kg"],waist:["Talia","cm"],chest:["Klatka piersiowa","cm"],
 hips:["Biodra","cm"],arm:["Ramię","cm"],pushups:["Pompki w jednej serii","powt."],
 pullups:["Podciągnięcia w jednej serii","powt."]
});
const UNITS=["kg","cm","powt.","sek.","min","%"];
const FREQ=[7,14,30];
const fmt=n=>Number(n.toFixed(2)).toLocaleString("pl-PL",{maximumFractionDigits:2});
function today(){
 const now=new Date(),pad=n=>String(n).padStart(2,"0");
 return now.getFullYear()+"-"+pad(now.getMonth()+1)+"-"+pad(now.getDate());
}
function validDate(date){
 if(typeof date!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(date))return false;
 const d=new Date(date+"T12:00:00Z");
 return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===date&&date<=today();
}
function num(value){
 if(value===""||value===null||value===undefined)return NaN;
 const n=Number(value);
 return Number.isFinite(n)&&n>=0&&n<=10000?Math.round(n*100)/100:NaN;
}
function readProfile(store){
 const raw=store.getItem(PROFILE_KEY);
 if(raw===null)return {};
 let data;try{data=JSON.parse(raw)}catch{throw Error("Profil ma uszkodzony zapis. Nie nadpisano danych.");}
 if(!data||typeof data!=="object"||Array.isArray(data))throw Error("Niepoprawne dane profilu. Nie nadpisano danych.");
 return data;
}
function read(store){
 const data=readProfile(store),saved=data.physicalGoals;
 if(saved===undefined)return [];
 if(saved?.version!==1||!Array.isArray(saved.items))throw Error("Nieznana wersja celów. Nie nadpisano danych.");
 if(saved.items.length>50)throw Error("Historia celów wymaga sprawdzenia.");
 for(const item of saved.items){
  if(typeof item?.id!=="string"||typeof item.name!=="string"||!UNITS.includes(item.unit)||!Array.isArray(item.checkins)||
    !FREQ.includes(item.frequency)||!Number.isFinite(num(item.target))||!item.checkins.length||item.checkins.length>1000||
    item.checkins.some(x=>!validDate(x.date)||!Number.isFinite(num(x.value))))
   throw Error("Uszkodzony zapis celu. Nie nadpisano danych.");
 }
 return saved.items;
}
function write(store,items,onWrite){
 const profile=readProfile(store);
 store.setItem(PROFILE_KEY,JSON.stringify({...profile,physicalGoals:{version:1,items},updatedAt:new Date().toISOString()}));
 onWrite?.();
 return items;
}
function validateValues({name,unit,start,target,date,frequency}){
 const title=String(name||"").trim(),s=num(start),t=num(target),freq=Number(frequency);
 if(title.length<2||title.length>60)throw Error("Podaj nazwę celu (2–60 znaków).");
 if(!UNITS.includes(unit))throw Error("Wybierz jednostkę pomiaru.");
 if(!Number.isFinite(s)||!Number.isFinite(t)||s===t)throw Error("Wpisz różne, poprawne wartości początkową i docelową.");
 if(!validDate(date))throw Error("Podaj poprawną datę, nie późniejszą niż dzisiaj.");
 if(!FREQ.includes(freq))throw Error("Wybierz częstotliwość pomiarów.");
 return {name:title,unit,start:s,target:t,date,frequency:freq};
}
function add(store,input,onWrite){
 const data=validateValues(input),items=read(store);
 if(items.length>=20)throw Error("Maksymalnie 20 aktywnych celów.");
 const id=(globalThis.crypto?.randomUUID?.()||"goal-"+Date.now()+"-"+Math.random().toString(36).slice(2));
 const item={id,name:data.name,unit:data.unit,target:data.target,frequency:data.frequency,
   checkins:[{date:data.date,value:data.start}]};
 return write(store,[...items,item],onWrite);
}
function record(store,id,date,value,onWrite){
 const items=read(store),current=items.find(x=>x.id===id),v=num(value);
 if(!current)throw Error("Nie znaleziono celu.");
 if(!validDate(date)||date<current.checkins[0].date)throw Error("Data nie może być przyszła ani wcześniejsza od pierwszego pomiaru.");
 if(!Number.isFinite(v))throw Error("Podaj poprawny, nieujemny wynik.");
 if(current.checkins.some(x=>x.date===date))throw Error("Dla tej daty jest już pomiar. Usuń go z historii przed ponownym wpisaniem.");
 if(current.checkins.length>=1000)throw Error("Osiągnięto limit historii tego celu.");
 const updated=items.map(item=>item.id!==id?item:{...item,checkins:[...item.checkins,{date,value:v}].sort((a,b)=>a.date.localeCompare(b.date))});
 return write(store,updated,onWrite);
}
function removeCheckin(store,id,date,onWrite){
 const items=read(store),item=items.find(x=>x.id===id);
 if(!item)throw Error("Nie znaleziono celu.");
 if(date===item.checkins[0].date)throw Error("Pomiar początkowy jest częścią celu. Możesz usunąć cały cel i utworzyć nowy.");
 if(!item.checkins.some(x=>x.date===date))throw Error("Nie znaleziono pomiaru.");
 return write(store,items.map(x=>x.id===id?{...x,checkins:x.checkins.filter(v=>v.date!==date)}:x),onWrite);
}
function removeGoal(store,id,onWrite){
 const items=read(store);
 if(!items.some(x=>x.id===id))throw Error("Nie znaleziono celu.");
 return write(store,items.filter(x=>x.id!==id),onWrite);
}
function stats(item){
 const records=[...item.checkins].sort((a,b)=>a.date.localeCompare(b.date));
 const first=records[0],last=records.at(-1),direction=Math.sign(item.target-first.value);
 const total=Math.abs(item.target-first.value),covered=(last.value-first.value)*direction;
 const percent=total===0?100:Math.max(0,Math.min(100,100*covered/total));
 const remaining=Math.max(0,(item.target-last.value)*direction);
 const previous=records.length>1?last.value-records.at(-2).value:null;
 const due=new Date(last.date+"T12:00:00Z");due.setUTCDate(due.getUTCDate()+item.frequency);
 return {first,last,percent,remaining,previous,achieved:remaining===0,nextDate:due.toISOString().slice(0,10),records};
}
function mount({parent,frameWindow,section}){
 const doc=frameWindow.document,store=frameWindow.localStorage;
 const panel=doc.createElement("section");panel.className="fpd-physical-goals";
 panel.innerHTML=`<div class="fpd-goal-head"><div><h4>Cele fizyczne i pomiary</h4><p class="muted">Zapisz własny wynik docelowy. Przy kolejnych pomiarach zobaczysz, ile brakuje do celu.</p></div></div>
 <details class="fpd-goal-editor"><summary class="action-button">+ Dodaj cel</summary>
 <form id="fpdGoalForm" class="fpd-goal-fields">
 <label>Co chcesz osiągnąć?<select name="preset"><option value="weight">Masa ciała</option><option value="waist">Talia</option><option value="chest">Klatka piersiowa</option><option value="hips">Biodra</option><option value="arm">Ramię</option><option value="pushups">Pompki w jednej serii</option><option value="pullups">Podciągnięcia w jednej serii</option><option value="custom">Inny mierzalny cel</option></select></label>
 <label data-custom-name hidden>Nazwa celu<input name="name" maxlength="60" placeholder="np. Bieg na 5 km"></label>
 <label>Jednostka<select name="unit"><option>kg</option><option>cm</option><option>powt.</option><option>sek.</option><option>min</option><option>%</option></select></label>
 <label>Wartość początkowa<input name="start" type="number" min="0" max="10000" step="0.01" required></label>
 <label>Wartość docelowa<input name="target" type="number" min="0" max="10000" step="0.01" required></label>
 <label>Data pierwszego pomiaru<input name="date" type="date" required></label>
 <label>Jak często sprawdzać?<select name="frequency"><option value="7">Co 7 dni</option><option value="14" selected>Co 14 dni</option><option value="30">Co 30 dni</option></select></label>
 <button type="submit" class="action-button primary">Zapisz cel</button></form></details>
 <p id="fpdGoalNotice" class="muted" role="status" aria-live="polite"></p>
 <div id="fpdGoalsList" class="fpd-goals-list"></div>
 <p class="muted">Pomiary wpisujesz samodzielnie. Wyniki są szacowanym postępem liczbowym, nie oceną zdrowia. Dane wykorzystują zapis profilu FitPlan i jego istniejącą synchronizację konta.</p>`;
 section.append(panel);
 const form=panel.querySelector("#fpdGoalForm"),list=panel.querySelector("#fpdGoalsList"),notice=panel.querySelector("#fpdGoalNotice");
 const preset=form.elements.namedItem("preset"),unit=form.elements.namedItem("unit"),custom=form.querySelector("[data-custom-name]");
 const dateInput=form.elements.namedItem("date");dateInput.value=today();dateInput.max=today();
 function notify(text){notice.textContent=text;}
 function syncPreset(){
  const chosen=PRESETS[preset.value];custom.hidden=!!chosen;
  form.elements.namedItem("name").required=!chosen;
  if(chosen)unit.value=chosen[1];
 }
 preset.addEventListener("change",syncPreset);syncPreset();
 function emit(){parent.dispatchEvent(new parent.CustomEvent("portal-sync-request",{detail:{appId:"fitplan",dirty:true}}));}
 function element(tag,text,cls){
  const el=doc.createElement(tag);if(text!==undefined)el.textContent=String(text);if(cls)el.className=cls;return el;
 }
 function show(){
  list.replaceChildren();
  let items;
  try{items=read(store);}catch(e){notify(e.message);return;}
  if(!items.length){list.append(element("p","Nie masz jeszcze celów. Zacznij od jednego mierzalnego wyniku.","muted"));return;}
  for(const goal of items){
   const s=stats(goal),card=element("article",undefined,"fpd-goal-card");
   const head=element("div",undefined,"fpd-goal-card-head"),title=element("h5",goal.name),deleteButton=element("button","Usuń cel","action-button danger");
   deleteButton.type="button";deleteButton.addEventListener("click",()=>{
    if(!parent.confirm("Usunąć ten cel razem z całą jego historią?"))return;
    try{removeGoal(store,goal.id,emit);notify("Cel usunięty.");show();}catch(e){notify(e.message);}
   });
   head.append(title,deleteButton);
   const main=element("strong",fmt(s.last.value)+" "+goal.unit+" → "+fmt(goal.target)+" "+goal.unit,"fpd-goal-values");
   const progress=element("div",undefined,"fpd-goal-bar");
   progress.setAttribute("role","progressbar");progress.setAttribute("aria-label","Realizacja celu: "+goal.name);
   progress.setAttribute("aria-valuemin","0");progress.setAttribute("aria-valuemax","100");progress.setAttribute("aria-valuenow",String(Math.round(s.percent)));
   const fill=element("span");fill.style.width=s.percent+"%";progress.append(fill);
   const remaining=element("p",s.achieved?"Cel osiągnięty!":("Pozostało: "+fmt(s.remaining)+" "+goal.unit),"fpd-goal-remaining");
   const info=element("p",fmt(s.percent)+"% celu · Początek: "+fmt(s.first.value)+" "+goal.unit+" ("+s.first.date+") · Ostatni pomiar: "+s.last.date,"muted");
   const next=element("p","Następny pomiar około "+s.nextDate+(s.nextDate<=today()?" · termin minął":""),"muted");
   const change=s.previous===null?null:element("p","Zmiana od poprzedniego pomiaru: "+(s.previous>0?"+":"")+fmt(s.previous)+" "+goal.unit,"muted");
   const measure=element("form",undefined,"fpd-goal-checkin");
   measure.innerHTML='<label>Data pomiaru<input name="date" type="date" required></label><label>Aktualny wynik<input name="value" type="number" min="0" max="10000" step="0.01" required></label><button class="action-button primary" type="submit">Zapisz pomiar</button>';
   measure.elements.namedItem("date").value=today();measure.elements.namedItem("date").max=today();
   measure.elements.namedItem("date").min=s.first.date;
   measure.elements.namedItem("value").value=String(s.last.value);
   measure.addEventListener("submit",e=>{
    e.preventDefault();
    try{record(store,goal.id,measure.elements.namedItem("date").value,measure.elements.namedItem("value").value,emit);
      notify("Pomiar zapisany.");show();
    }catch(error){notify(error.message);}
   });
   const history=element("details",undefined,"fpd-goal-history"),summary=element("summary","Historia pomiarów ("+s.records.length+")");
   history.append(summary);
   const historyList=element("ul");
   for(const entry of [...s.records].reverse()){
    const li=element("li"),label=element("span",entry.date+" — "+fmt(entry.value)+" "+goal.unit);
    li.append(label);
    if(entry.date!==s.first.date){
     const remove=element("button","Usuń","action-button");
     remove.type="button";remove.setAttribute("aria-label","Usuń pomiar z "+entry.date);
     remove.addEventListener("click",()=>{
      if(!parent.confirm("Usunąć pomiar z "+entry.date+"?"))return;
      try{removeCheckin(store,goal.id,entry.date,emit);notify("Pomiar usunięty.");show();}catch(error){notify(error.message);}
     });li.append(remove);
    }
    historyList.append(li);
   }
   history.append(historyList);
   card.append(head,main,progress,remaining,info,next);
   if(change)card.append(change);
   card.append(measure,history);list.append(card);
  }
 }
 form.addEventListener("submit",e=>{
  e.preventDefault();
  const name=PRESETS[preset.value]?.[0]||form.elements.namedItem("name").value;
  try{
   add(store,{name,unit:unit.value,start:form.elements.namedItem("start").value,target:form.elements.namedItem("target").value,
    date:dateInput.value,frequency:form.elements.namedItem("frequency").value},emit);
   form.reset();dateInput.value=today();syncPreset();panel.querySelector(".fpd-goal-editor").open=false;
   notify("Cel został zapisany.");show();
  }catch(error){notify(error.message);}
 });
 show();
 return panel;
}
window.FitPlanPhysicalGoals=Object.freeze({read,add,record,removeCheckin,removeGoal,stats,mount});
})();
