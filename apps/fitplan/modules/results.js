(()=>{
"use strict";
const frame=document.getElementById("appFrame");if(!frame)return;
const KEY="fitplan.dashboard.profile.v1";
function localDateKey(value=new Date()){
 const pad=n=>String(n).padStart(2,"0");
 return value.getFullYear()+"-"+pad(value.getMonth()+1)+"-"+pad(value.getDate());
}
function install(){
 let activeDisposer=null;
 const w=frame.contentWindow,registry=w?.FitPlanModules;
 if(!w||!registry||registry.get("podsumowanie-wynikow"))return;
 registry.register("podsumowanie-wynikow",{kind:"results",activate({host,isCurrent}){
  if(!isCurrent())return;
  const doc=w.document,mount=host.querySelector("#fitplanDashboardMount");
  if(!mount)return;
  const section=doc.createElement("div");section.className="fitplan-dashboard";
  section.innerHTML="<div class=\"fpd-header\"><div><h3>Panel sterowania</h3><p class=\"muted\">Sylwetka, cel, rytm treningowy i postępy w jednym miejscu.</p></div><button type=\"button\" class=\"action-button\" id=\"fpdEdit\">Konfiguruj profil</button></div>\n<div id=\"fpdSummary\" aria-live=\"polite\"></div>\n<form id=\"fpdForm\" hidden>\n<p id=\"fpdStepTitle\" class=\"muted\"></p>\n<fieldset data-fpd-step=\"0\"><legend>1. Parametry sylwetki</legend>\n<label>Waga (kg)<input name=\"weight\" type=\"number\" step=\"0.1\" min=\"20\" max=\"400\" required></label>\n<label>Wzrost (cm)<input name=\"height\" type=\"number\" step=\"0.1\" min=\"100\" max=\"250\" required></label>\n<label>Wiek<input name=\"age\" type=\"number\" min=\"18\" max=\"100\" required></label>\n<label>Wariant wzoru BMR<select name=\"formula\"><option value=\"male\">Mężczyzna</option><option value=\"female\">Kobieta</option></select></label>\n</fieldset>\n<fieldset data-fpd-step=\"1\" hidden><legend>2. Cel i metabolizm</legend>\n<label>Cel treningowy<select name=\"goal\"><option value=\"mass\">Budowa masy mięśniowej</option><option value=\"recomp\">Rekompozycja</option><option value=\"cut\">Redukcja masy</option><option value=\"fitness\">Wydolność i sprawność</option><option value=\"health\">Utrzymanie kondycji</option></select></label>\n<label>Poziom aktywności<select name=\"activity\"><option value=\"1.2\">Siedzący (1,2)</option><option value=\"1.375\">Lekka aktywność (1,375)</option><option value=\"1.55\">Umiarkowana (1,55)</option><option value=\"1.725\">Duża (1,725)</option><option value=\"1.9\">Bardzo duża (1,9)</option></select></label>\n</fieldset>\n<fieldset data-fpd-step=\"2\" hidden><legend>3. Cykl treningowy</legend>\n<label>Rodzaj treningu<select name=\"discipline\"><option value=\"fbw\">FBW</option><option value=\"split\">Split</option><option value=\"push-pull\">Push–Pull</option><option value=\"kalistenika\">Kalistenika</option><option value=\"kettlebell\">Kettlebell</option><option value=\"crossfit\">CrossFit</option><option value=\"sztuki-walki\">Sztuki walki</option><option value=\"brzuch\">Brzuch</option><option value=\"joga\">Joga</option><option value=\"rozciaganie\">Rozciąganie</option></select></label>\n<label>Długość cyklu<select name=\"cycle\"><option value=\"7\">7 dni</option><option value=\"10\">10 dni</option><option value=\"14\">14 dni</option></select></label>\n<label>Treningi na cykl<input name=\"sessions\" type=\"number\" min=\"1\" max=\"14\" step=\"1\" value=\"3\" required></label>\n<label>Data ostatniego treningu<input name=\"last\" type=\"date\"></label>\n<label>Data następnego treningu<input name=\"next\" type=\"date\"></label>\n<button id=\"fpdBuildSchedule\" type=\"button\" class=\"action-button\">Ułóż dni cyklu</button>\n<div id=\"fpdSchedule\" class=\"fpd-schedule\" aria-live=\"polite\"></div>\n</fieldset>\n<fieldset data-fpd-step=\"3\" hidden><legend>4. Potwierdzenie</legend>\n<p>Zapisywany profil zawiera wzrost, wagę, cel i rytm ćwiczeń. Możesz zmienić go w każdej chwili.</p>\n<p class=\"muted\">Profil jest uwzględniany w synchronizacji postępów zalogowanego konta.</p>\n</fieldset>\n<div class=\"fpd-actions\"><button id=\"fpdBack\" type=\"button\" class=\"action-button\">Wstecz</button><button id=\"fpdNext\" type=\"button\" class=\"action-button primary\">Dalej</button><button id=\"fpdSave\" type=\"submit\" class=\"action-button primary\" hidden>Zapisz profil</button><button id=\"fpdCancel\" type=\"button\" class=\"action-button\">Anuluj</button></div>\n<p id=\"fpdNotice\" class=\"muted\" role=\"status\"></p></form>\n<section class=\"fpd-photos\">\n<h4>Centrum progresu</h4>\n<p class=\"muted\">Prywatna oś czasu zdjęć i pomiarów. Wybierz datę oraz ujęcie sylwetki. Podpisane zdjęcia są dostępne tylko na Twoim koncie.</p>\n<div id=\"fpdViews\" class=\"fpd-views\" aria-label=\"Ujęcia sylwetki: przód, bok i tył\"></div>\n<div class=\"fpd-progress-form\">\n<h5>Dodaj pomiar i zdjęcie</h5>\n<div class=\"fpd-progress-fields\">\n<label>Data pomiaru<input id=\"fpdRecordedOn\" type=\"date\" required></label>\n<label>Ujęcie<select id=\"fpdView\"><option value=\"front\">Przód</option><option value=\"side\">Bok</option><option value=\"back\">Tył</option></select></label>\n<label>Waga (kg)<input id=\"fpdWeight\" type=\"number\" min=\"20\" max=\"400\" step=\"0.1\" placeholder=\"z profilu\"></label>\n<label>Początek treningów<input id=\"fpdTrainingStart\" type=\"date\"></label>\n<label>Talia (cm)<input id=\"fpdWaist\" type=\"number\" min=\"0\" max=\"300\" step=\"0.1\"></label>\n<label>Klatka (cm)<input id=\"fpdChest\" type=\"number\" min=\"0\" max=\"300\" step=\"0.1\"></label>\n<label>Biodra (cm)<input id=\"fpdHips\" type=\"number\" min=\"0\" max=\"300\" step=\"0.1\"></label>\n<label>Ramię (cm)<input id=\"fpdArm\" type=\"number\" min=\"0\" max=\"200\" step=\"0.1\"></label>\n<label>Obciążenia treningowe<input id=\"fpdTrainingLoad\" type=\"text\" maxlength=\"150\" placeholder=\"np. przysiad 60 kg × 8\"></label>\n<label>Suplementacja<input id=\"fpdSupplements\" type=\"text\" maxlength=\"300\" placeholder=\"np. kreatyna 5 g\"></label>\n<label>Ważne wyniki i uwagi<input id=\"fpdHighlight\" type=\"text\" maxlength=\"350\" placeholder=\"np. obwód pasa -2 cm\"></label>\n</div>\n<p class=\"muted\">Waga i obliczenia mogą zostać pobrane z bieżącego profilu. Dla zdjęć archiwalnych uzupełnij dane z danego dnia — aplikacja nie odtwarza dawnych pomiarów automatycznie.</p>\n<label class=\"fpd-photo-upload\">Dodaj zdjęcie (JPG, PNG, WebP do 4 MB)<input id=\"fpdPhoto\" type=\"file\" accept=\"image/png,image/jpeg,image/webp\"></label>\n<p id=\"fpdPhotoNotice\" class=\"muted\" role=\"status\"></p>\n</div>\n<h5>Historia zdjęć</h5><div id=\"fpdGallery\" class=\"fpd-gallery\"></div>\n<div class=\"fpd-comparison\"><h5>Porównaj dwie daty</h5>\n<div class=\"fpd-compare-selects\"><label>Starsze zdjęcie<select id=\"fpdCompareOlder\"></select></label><label>Nowsze zdjęcie<select id=\"fpdCompareNewer\"></select></label></div>\n<div id=\"fpdCompareResult\" class=\"fpd-compare-result\" aria-live=\"polite\"></div>\n</div>\n</section>";
  const byId=id=>section.querySelector("#"+id),form=byId("fpdForm"),field=name=>form.elements.namedItem(name);
  const node=(tag,text,cls)=>{const n=doc.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;return n;};
  const goals={mass:"Budowa masy mięśniowej",recomp:"Rekompozycja",cut:"Redukcja",fitness:"Sprawność",health:"Utrzymanie kondycji"};
  const sportNames={fbw:"FBW",split:"Split","push-pull":"Push–Pull",kalistenika:"Kalistenika",kettlebell:"Kettlebell",crossfit:"CrossFit","sztuki-walki":"Sztuki walki",brzuch:"Brzuch",joga:"Joga",rozciaganie:"Rozciąganie"};
  const header=section.querySelector(".fpd-header"),headerActions=node("div",null,"fpd-header-actions"),account=node("button",null,"fpd-account"),avatar=node("span",null,"fpd-avatar"),avatarName=node("span","Konto");
  account.type="button";account.id="fpdAccountButton";account.setAttribute("aria-label","Zmień avatar");account.setAttribute("aria-expanded","false");account.setAttribute("aria-controls","fpdAvatarPicker");avatar.id="fpdAvatar";avatarName.id="fpdAvatarName";avatar.append(node("span","U"));account.append(avatar,avatarName);headerActions.append(account,byId("fpdEdit"));header.append(headerActions);
  const avatarPicker=node("section",null,"fpd-avatar-picker");avatarPicker.id="fpdAvatarPicker";avatarPicker.hidden=true;
  const avatarPickerHead=node("div",null,"fpd-avatar-picker-head"),avatarPickerCopy=node("div"),avatarPickerTitle=node("h4","Wybierz avatar"),avatarPickerText=node("p","Animowany avatar lub własne zdjęcie zapiszą się na Twoim koncie.","muted");
  avatarPickerCopy.append(avatarPickerTitle,avatarPickerText);avatarPickerHead.append(avatarPickerCopy);
  const presetGrid=node("div",null,"fpd-avatar-grid");presetGrid.id="fpdAvatarGrid";
  const avatarActions=node("div",null,"fpd-avatar-actions"),uploadLabel=node("label","Wgraj własne zdjęcie","action-button"),avatarFile=node("input"),removeAvatar=node("button","Usuń avatar","action-button"),fullAccount=node("a","Otwórz pełne konto","action-button"),avatarNotice=node("p","","muted");
  avatarFile.id="fpdAvatarFile";avatarFile.type="file";avatarFile.accept="image/jpeg,image/png,image/webp";avatarFile.hidden=true;uploadLabel.htmlFor=avatarFile.id;removeAvatar.id="fpdRemoveAvatar";removeAvatar.type="button";fullAccount.href="/konto/";fullAccount.target="_top";avatarNotice.id="fpdAvatarNotice";avatarNotice.setAttribute("role","status");uploadLabel.append(avatarFile);avatarActions.append(uploadLabel,removeAvatar,fullAccount);avatarPicker.append(avatarPickerHead,presetGrid,avatarActions,avatarNotice);header.after(avatarPicker);
  const fmt=new Intl.NumberFormat("pl-PL",{maximumFractionDigits:0});
  let step=0,galleryVersion=0,accountVersion=0,disposed=false,scheduleDraft=[],currentAccountUser=null;
  const valid=(n,min,max)=>Number.isFinite(Number(n))&&Number(n)>=min&&Number(n)<=max;
  function load(){try{const x=JSON.parse(w.localStorage.getItem(KEY));return x&&typeof x==="object"&&!Array.isArray(x)?x:null}catch{return null}}
  function setForm(data){if(!data)return;for(const key of ["weight","height","age","formula","goal","activity","discipline","cycle","sessions","last","next"])if(data[key]!=null&&field(key))field(key).value=String(data[key]);scheduleDraft=Array.isArray(data.schedule)?data.schedule:[];}
  function readSchedule(){
   return [...byId("fpdSchedule").querySelectorAll("[data-fpd-day]")].map(select=>{
    const day=Number(select.dataset.fpdDay),type=select.value,custom=byId("fpdSchedule").querySelector('[data-fpd-custom-day="'+day+'"]');
    return {day,type,label:type==="custom"?String(custom?.value||"").trim():(sportNames[type]||(type==="rest"?"Regeneracja":""))};
   });
  }
  function syncSessionCount(){const schedule=readSchedule();if(schedule.length)field("sessions").value=String(schedule.filter(item=>item.type!=="rest").length);}
  function renderSchedule(source=scheduleDraft){
   const area=byId("fpdSchedule"),cycle=Number(field("cycle").value),sessions=Math.min(cycle,Math.max(1,Number(field("sessions").value)||1));
   area.replaceChildren();scheduleDraft=[];const choices={rest:"Regeneracja",...sportNames,custom:"Własny trening"};
   for(let day=1;day<=cycle;day++){
    const saved=Array.isArray(source)?source.find(item=>Number(item?.day)===day):null,fallback=day<=sessions?field("discipline").value:"rest",type=Object.hasOwn(choices,saved?.type)?saved.type:fallback;
    const row=node("div",null,"fpd-schedule-day"),label=node("label","Dzień "+day),select=node("select");select.dataset.fpdDay=String(day);
    for(const [value,text] of Object.entries(choices)){const option=node("option",text);option.value=value;select.append(option);}
    select.value=type;label.append(select);
    const custom=node("input");custom.type="text";custom.maxLength=80;custom.placeholder="Nazwa własnego treningu";custom.dataset.fpdCustomDay=String(day);custom.value=saved?.label||"";custom.hidden=type!=="custom";
    select.addEventListener("change",()=>{custom.hidden=select.value!=="custom";if(!custom.hidden)custom.focus();syncSessionCount();});
    row.append(label,custom);area.append(row);
   }
   scheduleDraft=readSchedule();
  }
  function values(){const data={};for(const key of ["weight","height","age","activity","cycle","sessions"])data[key]=Number(field(key).value);
    for(const key of ["formula","goal","discipline","last","next"])data[key]=field(key).value;
    data.schedule=readSchedule();
    return data;
  }
  function showStep(){
   form.querySelectorAll("[data-fpd-step]").forEach(x=>x.hidden=Number(x.dataset.fpdStep)!==step);
   byId("fpdStepTitle").textContent="Krok "+(step+1)+" z 4";
   byId("fpdBack").disabled=step===0;byId("fpdNext").hidden=step===3;byId("fpdSave").hidden=step!==3;
   byId("fpdNotice").textContent="";
  }
  function dateFromCalendar(){
   let dates={};try{dates=w.FitPlanStorage?.read("calendar")||{}}catch{}
   const now=localDateKey();
   const days=Object.keys(dates).filter(k=>/^\d{4}-\d\d-\d\d$/.test(k)&&dates[k]&&typeof dates[k]==="object"&&(String(dates[k].note||"").trim()||String(dates[k].time||"").trim())).sort();
   const last=days.filter(k=>k<=now).at(-1)||"",next=days.find(k=>k>now)||"";
   const display=k=>k?(k+(dates[k].note?" — "+String(dates[k].note).trim().slice(0,100):dates[k].time?" · "+String(dates[k].time).slice(0,5):"")):"Brak wpisu";
   return {last,next,lastLabel:display(last),nextLabel:display(next)};
  }
  function summary(){
   const output=byId("fpdSummary");output.replaceChildren();
   const data=load();
   if(!data||!valid(data.weight,20,400)||!valid(data.height,100,250)){output.append(node("p","Wprowadź dane w formularzu, aby wyświetlić panel sterowania.","muted"));return;}
   const calc=window.FitPlanDietTools;
   const bmi=calc?.calculateBMI?.(data.height,data.weight);
   const kcal=calc?.calculateCalorieNeeds?.(data);
   const dates=dateFromCalendar(),last=data.last||"",next=data.next||"";
   const today=localDateKey();
   const cells=[
    ["Cel",goals[data.goal]||"Nie określono"],["Sylwetka",data.weight+" kg / "+data.height+" cm"],
    ["BMI",Number.isFinite(bmi)?bmi.toFixed(1).replace(".",","):"Brak pomiaru"],
    ["BMR i TDEE",kcal?fmt.format(kcal.bmr)+" / "+fmt.format(kcal.tdee)+" kcal":"Brak wyliczenia"],
    ["Trening",Array.isArray(data.schedule)&&data.schedule.length?[...new Set(data.schedule.filter(item=>item.type!=="rest").map(item=>item.label||sportNames[item.type]).filter(Boolean))].join(", ")||"Regeneracja":sportNames[data.discipline]||"Nie wybrano"],
    ["Liczba jednostek",data.sessions+" na "+data.cycle+" dni"],
    ["Ostatni trening",last||"Nie podano"],["Następny trening",next?next+" · "+(sportNames[data.discipline]||"trening"):"Nie zaplanowano"],
    ["Ostatni wpis w kalendarzu",dates.lastLabel],["Następny wpis w kalendarzu",dates.nextLabel],
    ["Dzisiaj",next===today?"Zaplanowany trening":last===today?"Po zapisanym treningu – uwzględnij regenerację":"Sprawdź plan i samopoczucie"]
   ];
   const grid=node("div",null,"fpd-stats");
   for(const [label,value] of cells){const item=node("div",null,"fpd-stat");item.append(node("small",label),node("strong",value));grid.append(item);}
   output.append(grid,node("p","Podpowiedź na dziś wynika tylko z dat w profilu lub kalendarzu; nie ocenia rzeczywistej regeneracji ani stanu zdrowia.","muted"));
  }
  function toggleAvatarPicker(open){avatarPicker.hidden=!open;account.setAttribute("aria-expanded",String(open));if(open)renderAvatarPresets();}
  function renderAvatarPresets(){
   const catalog=window.PortalAvatarPresets;if(!catalog||presetGrid.childElementCount)return;
   for(const preset of catalog.items){
    const button=node("button",null,"fpd-avatar-choice");button.type="button";button.dataset.fpdAvatarPreset=preset.id;button.setAttribute("aria-label",preset.label);
    const preview=node("span",null,"fpd-avatar-preview"),label=node("span",preset.label);catalog.render(preview,"preset:"+preset.id,preset.label);button.append(preview,label);presetGrid.append(button);
   }
  }
  async function renderAccount(provided){
   const requestId=++accountVersion;
   try{
    const auth=window.PortalAuth;
    let user=provided===undefined?await auth?.ready?.():provided;
    // INITIAL_SESSION can race the ready promise; never treat its temporary null as logout.
    if(!user)user=auth?.current?.()||null;
    if(!user&&auth?.refreshCurrentUser){
      const session=await window.AppSupabase?.auth?.getSession?.();
      if(session?.data?.session?.user)user=await auth.refreshCurrentUser();
    }
    if(disposed||!isCurrent()||requestId!==accountVersion)return;
    currentAccountUser=user||null;
    const name=user?.nickname||user?.fullName||user?.name||"Użytkownik";
    window.PortalAvatarPresets?.render(byId("fpdAvatar"),user?.avatarUrl,name);
    byId("fpdAvatarName").textContent=user?name:"Zaloguj się";
    removeAvatar.hidden=!user?.avatarUrl;
   }catch{
    if(!disposed&&isCurrent()&&requestId===accountVersion)byId("fpdAvatarName").textContent="Konto";
   }
  }
  account.addEventListener("click",()=>{
   if(!currentAccountUser){window.top.location.href="/konto/";return;}
   toggleAvatarPicker(avatarPicker.hidden);
  });
  presetGrid.addEventListener("click",async event=>{
   const button=event.target.closest("[data-fpd-avatar-preset]");if(!button||!window.PortalAuth?.setPresetAvatar)return;
   button.disabled=true;avatarNotice.textContent="Zapisywanie…";
   try{const user=await window.PortalAuth.setPresetAvatar(button.dataset.fpdAvatarPreset);await renderAccount(user);avatarNotice.textContent="Avatar zapisano na koncie.";toggleAvatarPicker(false);}
   catch(error){avatarNotice.textContent=String(error?.message||"Nie udało się zapisać avatara.");}
   finally{button.disabled=false;}
  });
  avatarFile.addEventListener("change",async event=>{
   const source=event.target.files?.[0];if(!source)return;
   avatarNotice.textContent="Wysyłanie zdjęcia…";
   try{
    const file=source instanceof window.File?source:new window.File([source],source.name||"avatar",{type:source.type,lastModified:source.lastModified||Date.now()});
    const user=await window.PortalAuth.uploadAvatar(file);await renderAccount(user);avatarNotice.textContent="Własne zdjęcie zapisano na koncie.";toggleAvatarPicker(false);
   }catch(error){avatarNotice.textContent=String(error?.message||"Nie udało się zapisać zdjęcia.");}
   event.target.value="";
  });
  removeAvatar.addEventListener("click",async()=>{
   if(!currentAccountUser?.avatarUrl||!window.PortalAuth?.removeAvatar)return;
   removeAvatar.disabled=true;avatarNotice.textContent="Usuwanie…";
   try{const user=await window.PortalAuth.removeAvatar();await renderAccount(user);avatarNotice.textContent="Avatar usunięto z konta.";}
   catch(error){avatarNotice.textContent=String(error?.message||"Nie udało się usunąć avatara.");}
   finally{removeAvatar.disabled=false;}
  });
  function open(){setForm(load());step=0;showStep();form.hidden=false;byId("fpdSummary").hidden=true;if(scheduleDraft.length)renderSchedule(scheduleDraft);}
  function close(){form.hidden=true;byId("fpdSummary").hidden=false;summary();}
  byId("fpdEdit").addEventListener("click",open);byId("fpdCancel").addEventListener("click",close);
  byId("fpdBuildSchedule").addEventListener("click",()=>renderSchedule(byId("fpdSchedule").childElementCount?readSchedule():scheduleDraft));
  field("cycle").addEventListener("change",()=>{if(byId("fpdSchedule").childElementCount)renderSchedule(readSchedule());});
  byId("fpdBack").addEventListener("click",()=>{step=Math.max(0,step-1);showStep()});
  byId("fpdNext").addEventListener("click",()=>{
   if(step===0&&["weight","height","age"].some(x=>!field(x).checkValidity())){byId("fpdNotice").textContent="Sprawdź parametry sylwetki.";return;}
   if(step===2&&(!field("sessions").checkValidity()||!Number.isInteger(field("sessions").valueAsNumber)||!valid(field("sessions").value,1,Number(field("cycle").value)))){byId("fpdNotice").textContent="Liczba treningów nie może przekraczać długości cyklu.";return;}
   step=Math.min(3,step+1);showStep();
  });
  form.addEventListener("submit",event=>{
   event.preventDefault();const data=values();
   const invalidSchedule=data.schedule.length>0&&(data.schedule.length!==data.cycle||data.schedule.some(item=>!Number.isInteger(item.day)||item.day<1||item.day>data.cycle||!["rest","custom",...Object.keys(sportNames)].includes(item.type)||(item.type==="custom"&&!item.label)));
   if(!valid(data.height,100,250)||!valid(data.weight,20,400)||!Number.isInteger(data.age)||!valid(data.age,18,100)||!Number.isInteger(data.sessions)||!valid(data.sessions,1,data.cycle)||![7,10,14].includes(data.cycle)||![1.2,1.375,1.55,1.725,1.9].includes(data.activity)||!["male","female"].includes(data.formula)||!Object.hasOwn(goals,data.goal)||!Object.hasOwn(sportNames,data.discipline)||invalidSchedule||!!(data.last&&data.next&&data.last>data.next)){
    byId("fpdNotice").textContent="Sprawdź dane, długość cyklu i kolejność dat treningów.";return;
   }
   try{
    w.localStorage.setItem(KEY,JSON.stringify({...load(),...data,updatedAt:new Date().toISOString()}));
    window.dispatchEvent(new CustomEvent("portal-sync-request",{detail:{appId:"fitplan",dirty:true}}));
    close();
   }
   catch{byId("fpdNotice").textContent="Nie udało się zapisać profilu na tym urządzeniu.";}
  });
  let progressPhotos=[],replacementPath="";
  const viewNames={front:"Przód",side:"Bok",back:"Tył"};
  const progressInput=id=>byId("fpd"+id);
  function snapshotDate(photo){
    const saved=photo.snapshot?.recordedOn;
    if(saved)return saved;
    const created=new Date(photo.createdAt||Date.now());
    return Number.isFinite(created.getTime())?localDateKey(created):"Brak daty";
  }
  function snapshotValue(input){return String(input?.value||"").trim();}
  function defaultProgressFields(){
    const profile=load()||{};
    progressInput("RecordedOn").value=localDateKey();
    if(profile.weight!=null)progressInput("Weight").value=String(profile.weight);
  }
  function captureSnapshot(){
    const profile=load()||{};
    const date=snapshotValue(progressInput("RecordedOn"));
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw new Error("Wybierz prawidłową datę zdjęcia.");
    const weight=snapshotValue(progressInput("Weight"));
    const weightValue=weight===""?null:Number(weight);
    if(weight!==""&&(!Number.isFinite(weightValue)||weightValue<20||weightValue>400))throw new Error("Waga musi mieć wartość od 20 do 400 kg.");
    // Replacing a historical photo must not silently rewrite that day's training data.
    const original=replacementPath?progressPhotos.find(photo=>photo.path===replacementPath)?.snapshot:null;
    const sameMeasurement=original?.recordedOn===date&&original.weight===weightValue;
    const params={...profile,weight:weightValue};
    const bmi=weightValue!=null?window.FitPlanDietTools?.calculateBMI?.(profile.height,weightValue):null;
    const energy=weightValue!=null?window.FitPlanDietTools?.calculateCalorieNeeds?.(params):null;
    const currentTraining=Array.isArray(profile.schedule)&&profile.schedule.length?[...new Set(profile.schedule.filter(x=>x.type!=="rest").map(x=>x.label||sportNames[x.type]).filter(Boolean))].join(", "):sportNames[profile.discipline]||"";
    return {
      recordedOn:date,view:snapshotValue(progressInput("View")),weight:weightValue,height:sameMeasurement?original.height:profile.height||null,
      bmi:sameMeasurement?original.bmi:Number.isFinite(bmi)?bmi:null,
      bmr:sameMeasurement?original.bmr:energy?.bmr??null,
      tdee:sameMeasurement?original.tdee:energy?.tdee??null,
      cycle:original?.recordedOn===date?original.cycle:profile.cycle||null,
      sessions:original?.recordedOn===date?original.sessions:profile.sessions??null,
      training:original?.recordedOn===date?original.training:currentTraining,
      trainingStart:snapshotValue(progressInput("TrainingStart")),
      measurements:{waist:snapshotValue(progressInput("Waist")),chest:snapshotValue(progressInput("Chest")),hips:snapshotValue(progressInput("Hips")),arm:snapshotValue(progressInput("Arm"))},
      trainingLoad:snapshotValue(progressInput("TrainingLoad")),supplements:snapshotValue(progressInput("Supplements")),
      highlight:snapshotValue(progressInput("Highlight"))
    };
  }
  function metricLines(photo){
    const s=photo.snapshot;
    if(!s)return ["Brak archiwalnych pomiarów — zdjęcie zapisano wcześniej."];
    const lines=[];
    const metric=(title,value,unit="")=>{if(value!==null&&value!==undefined&&value!=="")lines.push(title+": "+value+unit);};
    metric("Waga",s.weight," kg");metric("BMI",s.bmi==null?null:Number(s.bmi).toFixed(1).replace(".",","));
    metric("BMR",s.bmr==null?null:Math.round(s.bmr)," kcal");
    metric("Zapotrzebowanie",s.tdee==null?null:Math.round(s.tdee)," kcal");
    metric("Cykl",s.cycle==null?null:s.cycle+" dni");
    metric("Treningi na cykl",s.sessions);
    metric("Rodzaje treningu",s.training);
    const start=s.trainingStart?new Date(s.trainingStart+"T12:00:00"):null,day=new Date(s.recordedOn+"T12:00:00");
    if(start&&Number.isFinite(start.getTime())&&day>=start)metric("Czas treningów",Math.floor((day-start)/86400000)+1," dni");
    for(const [key,label] of [["waist","Talia"],["chest","Klatka"],["hips","Biodra"],["arm","Ramię"]])
      metric(label,s.measurements?.[key]," cm");
    metric("Obciążenia",s.trainingLoad);metric("Suplementacja",s.supplements);metric("Ważne wyniki",s.highlight);
    return lines.length?lines:["Brak uzupełnionych pomiarów."];
  }
  function comparisonCard(photo){
    const item=node("article",null,"fpd-compare-card");
    if(!photo){item.append(node("p","Wybierz zdjęcie do porównania.","muted"));return item;}
    const img=node("img");img.src=photo.url;img.loading="lazy";img.alt="Sylwetka: "+(viewNames[photo.snapshot?.view]||"bez przypisanego ujęcia");
    item.append(node("strong",snapshotDate(photo)+" · "+(viewNames[photo.snapshot?.view]||"Ujęcie nieokreślone")),img);
    for(const line of metricLines(photo))item.append(node("p",line));
    return item;
  }
  function compare(){
    const area=byId("fpdCompareResult");area.replaceChildren();
    const older=progressPhotos.find(x=>x.path===byId("fpdCompareOlder").value);
    const newer=progressPhotos.find(x=>x.path===byId("fpdCompareNewer").value);
    if(!older||!newer){area.append(node("p","Dodaj co najmniej dwa zdjęcia, aby porównać terminy.","muted"));return;}
    if(older.path===newer.path){area.append(node("p","Wybierz dwa różne zdjęcia.","muted"));return;}
    const cards=node("div",null,"fpd-compare-cards");cards.append(comparisonCard(older),comparisonCard(newer));area.append(cards);
    const weightA=older.snapshot?.weight,weightB=newer.snapshot?.weight;
    if(weightA!=null&&weightB!=null)area.append(node("p","Zmiana wagi: "+(weightB-weightA>0?"+":"")+(weightB-weightA).toFixed(1).replace(".",",")+" kg","fpd-delta"));
  }
  function populateComparison(){
    const previousA=byId("fpdCompareOlder").value,previousB=byId("fpdCompareNewer").value;
    const ordered=[...progressPhotos].sort((a,b)=>snapshotDate(a).localeCompare(snapshotDate(b)));
    for(const id of ["fpdCompareOlder","fpdCompareNewer"]){
      const select=byId(id);select.replaceChildren();
      for(const photo of ordered){const option=node("option",snapshotDate(photo)+" · "+(viewNames[photo.snapshot?.view]||"zdjęcie"));option.value=photo.path;select.append(option);}
    }
    const old=byId("fpdCompareOlder"),fresh=byId("fpdCompareNewer");
    if(ordered.length){old.value=ordered.some(p=>p.path===previousA)?previousA:ordered[0].path;fresh.value=ordered.some(p=>p.path===previousB)?previousB:ordered.at(-1).path;}
    compare();
  }
  byId("fpdCompareOlder").addEventListener("change",compare);
  byId("fpdCompareNewer").addEventListener("change",compare);
  async function gallery(){
    const requestId=++galleryVersion,area=byId("fpdGallery"),views=byId("fpdViews");
    area.replaceChildren();views.replaceChildren();
    try{
      const media=window.FitPlanAccountMedia;
      if(!media)throw Error("Galeria konta jest chwilowo niedostępna.");
      const photos=await media.list();
      if(disposed||!isCurrent()||requestId!==galleryVersion)return;
      progressPhotos=[...photos].sort((a,b)=>snapshotDate(b).localeCompare(snapshotDate(a)));
      if(!progressPhotos.length)area.append(node("p","Brak zapisanych zdjęć.","muted"));
      for(const [view,label] of Object.entries(viewNames)){
        const slot=node("button",null,"fpd-view-slot"),latest=progressPhotos.find(p=>p.snapshot?.view===view);
        slot.type="button";slot.setAttribute("aria-label","Dodaj zdjęcie sylwetki: "+label);
        slot.addEventListener("click",()=>{progressInput("View").value=view;progressInput("Photo").click();});
        slot.append(node("strong",label));
        if(latest){const img=node("img");img.src=latest.url;img.alt="Ostatnie zdjęcie: "+label;img.loading="lazy";slot.append(img,node("small",snapshotDate(latest)));}
        else slot.append(node("div","Dodaj zdjęcie","fpd-view-empty"));
        views.append(slot);
      }
      for(const photo of progressPhotos){
        const item=node("article",null,"fpd-image"),img=node("img");
        img.src=photo.url;img.loading="lazy";img.alt="Zdjęcie sylwetki zapisane "+snapshotDate(photo);
        const heading=node("strong",snapshotDate(photo)+" · "+(viewNames[photo.snapshot?.view]||"Ujęcie nieokreślone"));
        const replace=node("button","Zastąp zdjęcie","action-button"),del=node("button","Usuń","action-button");
        replace.type="button";del.type="button";
        replace.addEventListener("click",()=>{
          replacementPath=photo.path;
          const saved=photo.snapshot||{};
          progressInput("RecordedOn").value=snapshotDate(photo);
          progressInput("View").value=saved.view||"front";
          for(const [id,value] of [
            ["Weight",saved.weight],["TrainingStart",saved.trainingStart],
            ["Waist",saved.measurements?.waist],["Chest",saved.measurements?.chest],
            ["Hips",saved.measurements?.hips],["Arm",saved.measurements?.arm],
            ["TrainingLoad",saved.trainingLoad],["Supplements",saved.supplements],["Highlight",saved.highlight]
          ])progressInput(id).value=value==null?"":String(value);
          byId("fpdPhotoNotice").textContent="Zachowano pomiary poprzedniego zdjęcia. Możesz je poprawić; wybierz plik, aby zastąpić fotografię.";
          progressInput("Photo").click();
        });
        del.addEventListener("click",async()=>{
          try{await media.remove(photo.path);if(!disposed&&isCurrent()){replacementPath="";await gallery();}}
          catch{byId("fpdPhotoNotice").textContent="Nie udało się usunąć zdjęcia.";}
        });
        item.append(img,heading,replace,del);area.append(item);
      }
      populateComparison();
    }catch(error){if(!disposed&&isCurrent()&&requestId===galleryVersion){progressPhotos=[];byId("fpdPhotoNotice").textContent=String(error.message||error);}}
  }
  defaultProgressFields();
  byId("fpdPhoto").addEventListener("change",async event=>{
    const source=event.target.files?.[0];if(!source)return;
    const media=window.FitPlanAccountMedia;
    try{
      if(!["image/jpeg","image/png","image/webp"].includes(source.type)||source.size>4*1024*1024)throw Error("Dozwolone: JPG, PNG lub WebP do 4 MB.");
      const snapshot=captureSnapshot();
      const photo=source instanceof window.File?source:new window.File([source],source.name||"postep",{type:source.type,lastModified:source.lastModified||Date.now()});
      byId("fpdPhotoNotice").textContent="Zapisywanie zdjęcia i pomiarów…";
      if(replacementPath)await media.replace(photo,replacementPath,snapshot);
      else await media.upload(photo,snapshot);
      replacementPath="";
      if(!disposed&&isCurrent()){await gallery();byId("fpdPhotoNotice").textContent="Zdjęcie i pomiary zapisano na Twoim koncie.";}
    }catch(error){if(!disposed&&isCurrent())byId("fpdPhotoNotice").textContent=String(error?.message||"Nie można zapisać zdjęcia.");}
    event.target.value="";
  });
  const onAuthChange=event=>{renderAccount(event.detail);gallery();};window.addEventListener("portal-auth-change",onAuthChange);
  activeDisposer=()=>{disposed=true;galleryVersion++;accountVersion++;window.removeEventListener("portal-auth-change",onAuthChange);};
  // WIEDORA-CHANGE: WD-20261101-WIE-110-KB-FBW-01 | TASK: WIE-110/WIE-117 | AUTHOR: ChatGPT / GPT-6
  // FitPlan dashboard supplement, local only; no claim of cross-account sync.
  const kbPanel=node("section",null,"fpd-kettlebell-progress");
  const kbHeading=node("h4","Kettlebell Total Body Circuit · postępy");
  kbPanel.append(kbHeading);
  try {
    const kb=w.FitPlanKettlebellCircuit;
    const saved=kb?.read(w.localStorage);
    if(saved){
      const stats=kb.summary(saved);
      const statsList=node("div",null,"fpd-kettlebell-stats");
      const pairs=[
        ["Ukończone jednostki",stats.sessions],
        ["Powtórzenia w cyklu",stats.repsCycle],
        ["Powtórzenia od początku",stats.repsAll],
        ["Serie łącznie",stats.setsAll],
        ["Objętość obciążeń",stats.tonnageKg.toLocaleString("pl-PL")+" kg"],
        ["Porównanie ćwiczeń","↑ "+stats.progress+" · ↓ "+stats.regress+" · = "+stats.stagnation]
      ];
      for(const [name,value] of pairs){
        const cell=node("div",null,"fpd-kettlebell-stat");
        cell.append(node("small",name),node("strong",String(value)));statsList.append(cell);
      }
      kbPanel.append(statsList);
      // WIEDORA-CHANGE: WD-20261101-WIE-110-KB-FBW-01 | TASK: WIE-117 | AUTHOR: ChatGPT / GPT-6
      const totals=new Map();
      for(const entry of saved.history){
        totals.set(entry.cycle,(totals.get(entry.cycle)||0)+
          entry.rows.reduce((sum,set)=>sum+set.actual,0));
      }
      const lastCycles=[...totals.entries()].slice(-5),peak=Math.max(1,...lastCycles.map(x=>x[1]));
      if(lastCycles.length){
        const chart=node("div",null,"fpd-kettlebell-chart");
        chart.append(node("h5","Powtórzenia w ostatnich cyklach"));
        const bars=node("div",null,"fpd-kettlebell-bars");
        for(const [cycle,reps] of lastCycles){
          const bar=node("div",null,"fpd-kettlebell-bar");
          const visual=node("div",null,"fpd-kettlebell-bar-fill");
          visual.style.height=Math.max(4,Math.round(100*reps/peak))+"%";
          const caption=node("small","C"+cycle+": "+reps);
          bar.append(visual,caption);bar.title="Cykl "+cycle+": "+reps+" wykonanych powtórzeń";
          bars.append(bar);
        }
        chart.append(bars);kbPanel.append(chart);
      }
      kbPanel.append(node("p","Dane lokalne w tej przeglądarce; progres jest porównaniem rzeczywiście wpisanych serii, a nie pomiarem zmian sylwetki. Wykres sumuje powtórzenia bez normalizacji liczby sesji w cyklu.","muted"));
    } else {
      kbPanel.append(node("p","Nie ma jeszcze zapisanych sesji programu. Otwórz Plan treningowy, aby rozpocząć.","muted"));
    }
  }catch(error){
    kbPanel.append(node("p","Nie udało się wczytać lokalnej historii kettlebell. Nie nadpisano danych.","muted"));
  }
  section.append(kbPanel);
  // WIEDORA-CHANGE: WD-20261101-WIE-117-PHYSICAL-GOALS-01 | TASK: WIE-117 | AUTHOR: ChatGPT / GPT-6
  // Reuse the synchronized dashboard profile; preserve goals when the wizard saves other fields.
  if(window.FitPlanPhysicalGoals){
    const goalsSlot=node("div");section.querySelector(".fpd-photos").before(goalsSlot);
    window.FitPlanPhysicalGoals.mount({parent:window,frameWindow:w,section:goalsSlot});
  }
  mount.replaceChildren(section);summary();renderAccount();gallery();
  },deactivate(){activeDisposer?.();activeDisposer=null;}});
}
frame.addEventListener("load",()=>queueMicrotask(install));
window.addEventListener("fitplan:modules:ready",install);
try{queueMicrotask(install)}catch{}
})();
